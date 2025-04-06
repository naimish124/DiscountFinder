import { google } from 'googleapis';
import { InsertPlatformOffer, Platform, InsertPlatform, InsertCardOffer } from '@shared/schema';
import { db } from "../db";
import { platformOffers, platforms, cardOffers, settings } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Define the structure of a row from the Google Sheet
interface SheetOfferData {
  Type: string;
  Platform: string;
  PromoCode: string;
  Min_Tx: string;
  Min_Discount_Rs: string;
  Max_Discount_Rs: string;
  Discount_Percentage: string;
  Type_of_offer: string;
  Days_specific: string;
  Partner_offer: string;
  Card_Type: string;    // e.g., "Credit" or "Debit"
  Bank_Name: string;    // e.g., "HDFC", "SBI", "ICICI"
  Card_Name: string;    // e.g., "Tata_Neu", "Millenia"
  par_1: string;
  par_2: string;
  par_3: string;
  par_4: string;
  par_5: string;
  par_6: string;
}

/**
 * Extract the Google Sheet ID from a Google Sheets URL
 */
function extractSheetId(url: string): string | null {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Get platform by URL, creating it if it doesn't exist
 */
async function getOrCreatePlatform(platformUrl: string, category: string): Promise<Platform> {
  // Extract the domain name from the URL to use as the platform name
  let platformName;
  try {
    const url = new URL(platformUrl);
    platformName = url.hostname.replace('www.', '');
  } catch (e) {
    // If URL parsing fails, use the raw value
    platformName = platformUrl;
  }
  
  // Try to find an existing platform by name
  const [existingPlatform] = await db.select().from(platforms).where(eq(platforms.name, platformName));
  
  if (existingPlatform) {
    // Update the websiteUrl if needed
    if (existingPlatform.websiteUrl !== platformUrl) {
      await db.update(platforms)
        .set({ websiteUrl: platformUrl })
        .where(eq(platforms.id, existingPlatform.id));
      existingPlatform.websiteUrl = platformUrl;
    }
    return existingPlatform;
  }
  
  // Create a new platform if it doesn't exist
  const logoUrl = `/logos/${platformName.split('.')[0]}.png`;
  const newPlatform: InsertPlatform = {
    name: platformName,
    category,
    logoUrl,
    websiteUrl: platformUrl
  };
  
  const [createdPlatform] = await db.insert(platforms).values(newPlatform).returning();
  return createdPlatform;
}

/**
 * Import offers from a Google Sheet
 * @param sheetUrl - URL of the Google Sheet
 * @param useSheetOnly - If true, clears all existing offers first and only uses sheet data
 */
export async function importOffersFromGoogleSheet(sheetUrl: string, useSheetOnly: boolean = false): Promise<number> {
  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) {
    throw new Error('Invalid Google Sheet URL');
  }
  
  // Initialize Google Sheets API with API key
  const sheets = google.sheets({ 
    version: 'v4',
    auth: process.env.GOOGLE_API_KEY 
  });
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1', // assuming the data is in Sheet1
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in the Google Sheet');
    }
    
    // If useSheetOnly is true, clear all existing platform and card offers first
    if (useSheetOnly) {
      console.log('Sheet Only Mode activated - clearing all existing offers...');
      // First delete all card offers (due to foreign key constraints)
      await db.delete(cardOffers);
      // Then delete all platform offers
      await db.delete(platformOffers);
      console.log('All existing offers cleared, only sheet data will be used.');
      
      // Set the useSheetOnly setting to true
      await db
        .insert(settings)
        .values({ key: 'useSheetOnly', value: 'true', updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key, 
          set: { value: 'true', updatedAt: new Date() }
        });
    } else {
      // Check if previously in sheet only mode, and if so, update the setting
      const [currentSetting] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'useSheetOnly'));
        
      if (currentSetting && currentSetting.value === 'true') {
        console.log('Disabling Sheet Only Mode - scrapers will be enabled again');
        await db
          .update(settings)
          .set({ value: 'false', updatedAt: new Date() })
          .where(eq(settings.key, 'useSheetOnly'));
      }
    }
    
    // Extract headers and data rows
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // Process each row into our schema
    const offerData: SheetOfferData[] = dataRows.map(row => {
      const rowData: any = {};
      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index] || '';
      });
      return rowData as SheetOfferData;
    });
    
    // Import each offer into our database
    let importedCount = 0;
    
    for (const offer of offerData) {
      try {
        // Get or create the platform
        const platform = await getOrCreatePlatform(offer.Platform, offer.Type);
        
        // Prepare the offer data
        const minAmount = parseInt(offer.Min_Tx) || null;
        const maxDiscount = parseInt(offer.Max_Discount_Rs) || null;
        const minDiscount = parseInt(offer.Min_Discount_Rs) || null;
        const discountPercentage = parseInt(offer.Discount_Percentage) || 0;
        
        // Build offer terms
        let terms = '';
        if (minAmount) terms += `Minimum transaction amount: ₹${minAmount}. `;
        if (minDiscount) terms += `Minimum discount: ₹${minDiscount}. `;
        if (maxDiscount) terms += `Maximum discount: ₹${maxDiscount}. `;
        if (offer.Days_specific && offer.Days_specific !== 'NA') terms += `Valid on: ${offer.Days_specific}. `;
        if (offer.Type_of_offer) terms += `Offer type: ${offer.Type_of_offer}. `;
        if (offer.Partner_offer && offer.Partner_offer !== 'NA') terms += `Partner: ${offer.Partner_offer}. `;
        
        // Build title and description
        let title = `${discountPercentage}% off`;
        if (maxDiscount) title += ` up to ₹${maxDiscount}`;
        
        let description = `Use code ${offer.PromoCode} for ${discountPercentage}% discount`;
        if (maxDiscount) description += ` (up to ₹${maxDiscount})`;
        
        // Create the platform offer
        const insertData: InsertPlatformOffer = {
          platformId: platform.id,
          title,
          description,
          code: offer.PromoCode,
          discountPercentage,
          expiryDate: null, // Not available in the sheet
          termsAndConditions: terms,
          minimumOrderAmount: minAmount || 0,
          minAmount,
          maxDiscount,
          lastUpdated: new Date(),
        };
        
        // Check if this offer already exists (by platform and code)
        const existingOffers = await db
          .select()
          .from(platformOffers)
          .where(and(
            eq(platformOffers.platformId, platform.id),
            offer.PromoCode ? eq(platformOffers.code, offer.PromoCode) : undefined
          ));
        
        const existingOffer = existingOffers.length > 0 ? existingOffers[0] : null;
        
        if (existingOffer) {
          // Update existing offer
          await db.update(platformOffers)
            .set(insertData)
            .where(eq(platformOffers.id, existingOffer.id));
        } else {
          // Insert new offer
          await db.insert(platformOffers).values(insertData);
        }
        
        // Handle card-specific offer if card details are provided
        if (offer.Bank_Name && offer.Bank_Name.trim() !== '' && offer.Bank_Name !== 'NA') {
          // Create or update card-specific offer
          const cardOfferData: InsertCardOffer = {
            platformId: platform.id,
            cardBank: offer.Bank_Name.trim(),
            cardName: offer.Card_Name && offer.Card_Name !== 'NA' ? offer.Card_Name.trim() : null,
            cardType: offer.Card_Type && offer.Card_Type !== 'NA' ? offer.Card_Type.toLowerCase() : null, // "credit" or "debit" or null
            discountPercentage: discountPercentage, // Same discount as platform offer
            minimumOrderAmount: minAmount || 0,
            description: `${offer.Bank_Name} ${offer.Card_Type || ''} card offer: ${discountPercentage}% off`,
            termsAndConditions: terms,
            expiryDate: null // Not available in the sheet
          };

          // Check if this card offer already exists
          const existingCardOffers = await db
            .select()
            .from(cardOffers)
            .where(and(
              eq(cardOffers.platformId, platform.id),
              eq(cardOffers.cardBank, cardOfferData.cardBank),
              cardOfferData.cardName ? eq(cardOffers.cardName, cardOfferData.cardName) : undefined
            ));
            
          const existingCardOffer = existingCardOffers.length > 0 ? existingCardOffers[0] : null;
          
          if (existingCardOffer) {
            // Update existing card offer
            await db.update(cardOffers)
              .set(cardOfferData)
              .where(eq(cardOffers.id, existingCardOffer.id));
          } else {
            // Insert new card offer
            await db.insert(cardOffers).values(cardOfferData);
          }
        }
        
        importedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error importing offer for ${offer.Platform}:`, errorMessage);
        // Continue with next offer
      }
    }
    
    return importedCount;
    
  } catch (error) {
    console.error('Error importing from Google Sheet:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to import from Google Sheet: ${errorMessage}`);
  }
}