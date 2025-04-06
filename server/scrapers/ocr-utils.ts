import { createWorker } from 'tesseract.js';
import fetch from 'node-fetch';

/**
 * Extract text from an image URL using OCR
 * @param imageUrl - URL of the image to process
 * @returns Extracted text from the image
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    console.log(`Performing OCR on image: ${imageUrl}`);
    
    // Create a new worker for each image processing to avoid state issues
    const worker = await createWorker();
    
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const imageBuffer = await response.buffer();
    
    // Recognize text in the image
    const { data } = await worker.recognize(imageBuffer);
    const text = data.text || '';
    
    // Always terminate the worker after use to free resources
    await worker.terminate();
    
    console.log(`OCR text extracted: ${text.substring(0, 100)}...`);
    return text;
  } catch (error) {
    console.error('Error in OCR processing:', error);
    return '';
  }
}

/**
 * Extract offer details from OCR text
 * @param text - Text extracted from OCR
 * @returns Offer details extracted from the text
 */
export function extractOfferDetailsFromOCRText(text: string) {
  // Standardize and clean up the text
  const cleanText = text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  // Extract discount percentage
  const discountMatch = cleanText.match(/(\d+)%\s*(off|discount|cashback)/i) || 
                        cleanText.match(/(flat|upto|up to)\s*(\d+)%/i);
  
  const discountPercentage = discountMatch 
    ? parseInt(discountMatch[1] || discountMatch[2], 10) 
    : 0;
  
  // Extract promo code
  const codeMatch = cleanText.match(/code[:\s]*([a-z0-9]+)/i) || 
                    cleanText.match(/coupon[:\s]*([a-z0-9]+)/i) ||
                    cleanText.match(/use\s+([a-z0-9]{4,10})/i);
  
  const code = codeMatch ? codeMatch[1].toUpperCase() : '';
  
  // Extract minimum amount
  const minAmountMatch = cleanText.match(/min\w*\s*(\w+\s+)?(\d+)/i) || 
                         cleanText.match(/above\s*rs\.*\s*(\d+)/i) ||
                         cleanText.match(/minimum\s*(\w+\s+)?(\d+)/i);
  
  const minAmount = minAmountMatch 
    ? parseInt(minAmountMatch[2] || minAmountMatch[1], 10) 
    : null;
  
  // Extract maximum discount
  const maxDiscountMatch = cleanText.match(/max\w*\s*(\w+\s+)?(\d+)/i) || 
                           cleanText.match(/upto\s*rs\.*\s*(\d+)/i) ||
                           cleanText.match(/up to\s*rs\.*\s*(\d+)/i);
  
  const maxDiscount = maxDiscountMatch 
    ? parseInt(maxDiscountMatch[2] || maxDiscountMatch[1], 10) 
    : null;
  
  // Extract expiry date (if available)
  const expiryMatch = cleanText.match(/valid\s+till\s+(\d{1,2}\s+\w+\s+\d{4})/i) ||
                      cleanText.match(/expir\w+\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  
  let expiryDate: Date | null = null;
  if (expiryMatch) {
    try {
      expiryDate = new Date(expiryMatch[1]);
      if (isNaN(expiryDate.getTime())) {
        expiryDate = null;
      }
    } catch (e) {
      expiryDate = null;
    }
  }
  
  // Extract title/description
  const title = text.split('\n')[0]?.trim() || 'Special Offer';
  const description = text.substring(0, 150).trim();
  
  return {
    title,
    description, 
    code,
    discountPercentage,
    expiryDate,
    minAmount,
    maxDiscount,
    terms: 'Terms and conditions apply. Offer extracted via OCR.'
  };
}

/**
 * Clean up resources when the app is shutting down
 * This is no longer needed since we create and terminate workers for each image
 */
export async function terminateOCR() {
  // No global worker to terminate
  return;
}