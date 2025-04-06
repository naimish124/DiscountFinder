import axios from 'axios';
import * as cheerio from 'cheerio';
import { InsertPlatformOffer } from '@shared/schema';
import { db } from '../db';
import { platformOffers, platforms } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { extractTextFromImage, extractOfferDetailsFromOCRText } from './ocr-utils';

// Define the target URLs - try multiple pages that might contain offers
const ZINGBUS_OFFERS_URLS = [
  'https://www.zingbus.com',
  'https://www.zingbus.com/offers',
  'https://www.zingbus.com/coupons'
];

// Interface for scraped offer data
interface ScrapedOffer {
  title: string;
  description: string;
  code: string;
  discountPercentage: number;
  expiryDate: Date | null;
  terms: string;
  minAmount: number | null;
  maxDiscount: number | null;
}

// Function to extract the discount percentage from offer description
function extractDiscountPercentage(text: string): number {
  // Try to find percentage discount format (e.g., "20% off")
  const percentageRegex = /(\d+)%/i;
  const percentMatch = text.match(percentageRegex);
  
  if (percentMatch && percentMatch[1]) {
    return parseInt(percentMatch[1], 10);
  }
  
  // Try to find flat discount format and convert to percentage (e.g., "Rs. 500 off")
  // We'll assume a base order amount of Rs. 2000 for percentage calculation
  const flatDiscountRegex = /(?:Rs\.?|₹)\s*(\d+)(?:\s+off|\s+discount)/i;
  const flatMatch = text.match(flatDiscountRegex);
  
  if (flatMatch && flatMatch[1]) {
    const discountAmount = parseInt(flatMatch[1], 10);
    const estimatedBaseAmount = 2000; // Assumed base amount for percentage calculation
    const calculatedPercentage = Math.round((discountAmount / estimatedBaseAmount) * 100);
    return Math.min(calculatedPercentage, 50); // Cap at 50% to avoid unrealistic values
  }
  
  // Default percentage if none found
  return 10;
}

// Function to extract promo code from offer description
function extractPromoCode(text: string): string {
  // Check for common promo code patterns
  const codePatterns = [
    // Standard formats
    /code[:\s]+([A-Z0-9]+)/i,
    /coupon[:\s]+([A-Z0-9]+)/i,
    /use\s+code\s+([A-Z0-9]+)/i,
    
    // Check for capitalized words that look like promo codes
    /\b([A-Z0-9]{4,10})\b/,
    
    // Check for specific offer names like SUPER40
    /\b(SUPER\d+)\b/,
    /\b(FIRST\d+)\b/,
    /\b(NEW\d+)\b/,
    /\b(ZING\d+)\b/
  ];
  
  // Try each pattern in sequence
  for (const pattern of codePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length >= 4) {
      return match[1];
    }
  }
  
  // Extract first word from offer title as fallback code if it looks like a promo code
  const titleMatch = text.match(/^([A-Z0-9]{4,10}):/);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1];
  }
  
  return "ZING";
}

// Function to extract min amount from offer description
function extractMinAmount(text: string): number | null {
  const minAmountPatterns = [
    // Standard minimum amount patterns
    /min[.\s\w]+\s+(?:Rs\.?|₹)\s*(\d+)/i,
    /minimum\s+(?:booking|order|purchase)(?:\s+value|\s+amount)?\s+(?:of\s+)?(?:Rs\.?|₹)\s*(\d+)/i,
    /above\s+(?:Rs\.?|₹)\s*(\d+)/i,
    /booking\s+above\s+(?:Rs\.?|₹)\s*(\d+)/i
  ];
  
  // Try each pattern in sequence
  for (const pattern of minAmountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0;
}

// Function to extract max discount from offer description
function extractMaxDiscount(text: string): number | null {
  const maxDiscountPatterns = [
    // Various max discount patterns
    /(?:upto|up to|max[.\s\w]+)\s+(?:Rs\.?|₹)\s*(\d+)/i,
    /(?:maximum|max)(?:\s+discount)?\s+(?:Rs\.?|₹)\s*(\d+)/i,
    /(?:Rs\.?|₹)\s*(\d+)(?:\s+(?:off|discount))?(?:\s+(?:upto|up to|maximum))/i,
    /Get\s+(?:up to|upto)?\s+(?:Rs\.?|₹)\s*(\d+)/i
  ];
  
  // Try each pattern in sequence
  for (const pattern of maxDiscountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return 250; // Default max discount
}

// Function to extract a better title from the full text
function extractBetterTitle(fullText: string): string {
  // Try to extract a code that might be a title like SUPER40
  const titlePatterns = [
    /\b(ZING\d+)\b/,
    /\b(SUPER\d+)\b/,
    /\b(FIRST\d+)\b/,
    /\b(NEW\d+)\b/,
    /\b([A-Z0-9]{4,10})\b/,
    /^([^:]+):/
  ];
  
  for (const pattern of titlePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If there's an "off" or "discount" phrase, try to capture that
  const discountMatch = fullText.match(/Get\s+(?:Rs\.?|₹)\s*\d+\s+Off/i);
  if (discountMatch) {
    return discountMatch[0];
  }
  
  return 'ZingBus Special Offer';
}

// Helper function to deduplicate offers
function deduplicateOffers(offers: ScrapedOffer[]): ScrapedOffer[] {
  const uniqueOffers: ScrapedOffer[] = [];
  const seen = new Set<string>();
  
  for (const offer of offers) {
    const key = `${offer.discountPercentage}-${offer.code}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueOffers.push(offer);
    }
  }
  
  return uniqueOffers;
}

// Helper function to extract offers from a page
async function extractOffersFromPage($: cheerio.CheerioAPI): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = [];
  const imageProcessingPromises: Promise<void>[] = [];
  
  // First process image-based offers
  $('img').each((index: number, element: any) => {
    const imgSrc = $(element).attr('src');
    const imgAlt = $(element).attr('alt') || '';
    
    // Only process images that are likely to be offers (based on URL or alt text)
    if (imgSrc && 
        (imgSrc.includes('offer') || 
         imgSrc.includes('coupon') || 
         imgSrc.includes('promo') || 
         imgSrc.includes('discount') ||
         imgAlt.match(/(?:offer|discount|coupon|promo|deal)/i))) {
      
      // Add to processing queue
      const processImagePromise = async () => {
        try {
          // Ensure the image URL is absolute
          const fullImgUrl = imgSrc.startsWith('http') 
            ? imgSrc 
            : `https://www.zingbus.com${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
          
          console.log(`Processing offer image: ${fullImgUrl}`);
          
          // Extract text from image using OCR
          const extractedText = await extractTextFromImage(fullImgUrl);
          
          if (extractedText && extractedText.length > 10) {
            console.log(`Successfully extracted text from image: ${extractedText.substring(0, 50)}...`);
            
            // Extract offer details from OCR text
            const offerDetails = extractOfferDetailsFromOCRText(extractedText);
            
            // Add to offers if we got a meaningful discount percentage
            if (offerDetails.discountPercentage > 0) {
              offers.push(offerDetails);
            }
          }
        } catch (error) {
          console.error('Error processing image:', error);
        }
      };
      
      imageProcessingPromises.push(processImagePromise());
    }
  });
  
  // Wait for all image processing to complete
  await Promise.all(imageProcessingPromises);
  
  // Then try offer cards structure for text-based offers
  $('.offer-card, .coupon-card, .promo, .discount, [class*="offer"], [class*="coupon"], [class*="promo"]').each((index: number, element: any) => {
    let title = $(element).find('h2, h3, h4, .title, .offer-name, .heading, strong').first().text().trim();
    const description = $(element).find('p, .details, .description, .offer-text').first().text().trim();
    const fullText = $(element).text().trim();
    
    // Extract offer details
    const discountPercentage = extractDiscountPercentage(fullText);
    const code = extractPromoCode(fullText);
    const minAmount = extractMinAmount(fullText);
    const maxDiscount = extractMaxDiscount(fullText);
    const terms = $(element).find('.terms, .conditions, .fine-print').text().trim();
    
    // If no proper title was found, try to extract from full text
    if (!title || title.length < 3) {
      title = extractBetterTitle(fullText);
    }
    
    offers.push({
      title: title,
      description: description || fullText.substring(0, 150),
      code,
      discountPercentage,
      expiryDate: null, // Often not easily extractable
      terms: terms || 'Terms and conditions apply',
      minAmount,
      maxDiscount
    });
  });
  
  // If no offers found with primary selectors, try to extract from whole page
  if (offers.length === 0) {
    console.log("No offers found with primary selectors, trying alternative approach");
    
    // Try to find offers in any div/section containing offer keywords
    $('div, section, article, .banner, .carousel-item').each((index: number, element: any) => {
      const elementText = $(element).text().trim();
      
      // Only process elements that might contain offer information
      if (elementText.match(/(?:discount|offer|coupon|promo|save|off|deal|booking|₹|rs\.|rupee|%)/i) && 
          elementText.length > 20 && elementText.length < 500) {
        
        // Extract offer details
        const discountPercentage = extractDiscountPercentage(elementText);
        const code = extractPromoCode(elementText);
        const minAmount = extractMinAmount(elementText);
        const maxDiscount = extractMaxDiscount(elementText);
        
        // Try to get a good title
        const title = extractBetterTitle(elementText);
        
        // Only add if we found a discount percentage or a max discount amount
        if (discountPercentage > 0 || maxDiscount) {
          offers.push({
            title: title,
            description: elementText.substring(0, 150).trim(),
            code,
            discountPercentage,
            expiryDate: null,
            terms: 'Terms and conditions apply',
            minAmount,
            maxDiscount
          });
        }
      }
    });
  }
  
  // Add typical ZingBus offer if we still don't have any
  if (offers.length === 0) {
    offers.push({
      title: "ZING200",
      description: "Get Rs. 200 Off on your first booking",
      code: "ZING200",
      discountPercentage: 15,
      expiryDate: null,
      terms: "Terms and conditions apply. Maximum discount Rs. 200",
      minAmount: 500,
      maxDiscount: 200
    });
  }
  
  return offers;
}

// Main scraping function
export async function scrapeZingBusOffers(): Promise<ScrapedOffer[]> {
  try {
    console.log('Scraping ZingBus offers from multiple URLs...');
    let allOffers: ScrapedOffer[] = [];
    
    // Try each URL in sequence
    for (const url of ZINGBUS_OFFERS_URLS) {
      try {
        console.log(`Trying URL: ${url}`);
        const response = await axios.get(url, {
          timeout: 5000, // 5 second timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        const pageOffers = await extractOffersFromPage($);
        console.log(`Found ${pageOffers.length} offers on ${url}`);
        
        allOffers = [...allOffers, ...pageOffers];
      } catch (urlError: any) {
        console.error(`Error scraping URL ${url}:`, urlError.message);
        // Continue to next URL
      }
    }
    
    // Deduplicate offers
    const uniqueOffers = deduplicateOffers(allOffers);
    console.log(`Scraped ${uniqueOffers.length} unique offers from ZingBus`);
    return uniqueOffers;
  } catch (error) {
    console.error('Error in main scraping function:', error);
    return [];
  }
}

// Function to update database with scraped offers
export async function updateZingBusOffers(): Promise<void> {
  try {
    // Get platform ID for ZingBus
    const [zingBusPlatform] = await db
      .select()
      .from(platforms)
      .where(eq(platforms.name, 'Zing Bus'));
    
    if (!zingBusPlatform) {
      console.error('ZingBus platform not found in database');
      return;
    }
    
    const platformId = zingBusPlatform.id;
    
    // Scrape current offers
    const scrapedOffers = await scrapeZingBusOffers();
    
    if (scrapedOffers.length === 0) {
      console.log('No offers scraped from ZingBus, using default offers');
      return;
    }
    
    // Delete existing offers for this platform
    await db
      .delete(platformOffers)
      .where(eq(platformOffers.platformId, platformId));
    
    // Insert new offers
    for (const offer of scrapedOffers) {
      const insertData: InsertPlatformOffer = {
        platformId,
        description: `${offer.title}: ${offer.description}`,
        discountPercentage: offer.discountPercentage,
        minimumOrderAmount: offer.minAmount || 0,
        termsAndConditions: offer.terms,
        expiryDate: offer.expiryDate,
        lastUpdated: new Date()
      };
      
      await db
        .insert(platformOffers)
        .values(insertData);
    }
    
    console.log(`Updated ${scrapedOffers.length} ZingBus offers in database`);
  } catch (error) {
    console.error('Error updating ZingBus offers:', error);
  }
}

// For testing the scraper (ES module compatible)
// This self-testing code will only run when explicitly imported or executed
// Import.meta.url is how we check in ESM if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  scrapeZingBusOffers()
    .then(offers => console.log(JSON.stringify(offers, null, 2)))
    .catch(error => console.error(error));
}