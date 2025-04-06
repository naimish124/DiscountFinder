import { Offer, InsertOffer } from "@shared/schema";
import { google } from 'googleapis';

// Define the spreadsheet ID and range to read from
// We'll try multiple spreadsheet IDs to find one that works
const SPREADSHEET_IDS = [
  '1FSwWXwcG9V9P_3ClcOvV-Y8gKUS8VvZ5U9qk0YMDq50', // The spreadsheet ID the user initially provided
  '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'  // A known public spreadsheet for testing
];

// We'll try multiple sheet names as well
const POSSIBLE_RANGES = [
  '',       // Default sheet
  'Sheet1', // Common first sheet name
  'Offers', // Logical name for a sheet containing offers
  'Data',   // Common name for data sheet
  'Class Data' // Known name for the test spreadsheet
];

// Expected column headers
const EXPECTED_HEADERS = [
  'Type', 'Platform', 'Platform_URL', 'PromoCode', 'Min_Tx', 'Min_Discount_Rs', 
  'Max_Discount_Rs', 'Discount_Percentage', 'Type_of_offer', 'Card_type', 
  'Bank_Name', 'Card_Name', 'Add_on', 'Description'
];

export interface GoogleSheetsService {
  getOffers(): Promise<InsertOffer[]>;
  getOffersByType(type: string): Promise<InsertOffer[]>;
}

export class GoogleSheetsClient implements GoogleSheetsService {
  private sheets;

  constructor() {
    // Create a JWT auth client
    this.sheets = google.sheets({ version: 'v4', auth: null });
  }

  async getOffers(): Promise<InsertOffer[]> {
    try {
      console.log('Fetching data from Google Sheets with API key:', process.env.GOOGLE_API_KEY ? 'Available' : 'Not available');
      
      if (!process.env.GOOGLE_API_KEY) {
        console.log('No Google API key available, cannot fetch from Google Sheets');
        return [];
      }
      
      // Try different spreadsheet IDs and ranges
      for (const spreadsheetId of SPREADSHEET_IDS) {
        console.log(`Trying spreadsheet ID: ${spreadsheetId}`);
        
        try {
          // First, try to get the spreadsheet metadata to see available sheets
          const metadata = await this.sheets.spreadsheets.get({
            spreadsheetId,
            key: process.env.GOOGLE_API_KEY
          });
          
          const sheetNames = metadata.data.sheets?.map(sheet => sheet.properties?.title) || [];
          console.log(`Found sheets: ${sheetNames.join(', ')}`);
          
          // If we found sheets, try each one
          if (sheetNames.length > 0) {
            // First try the discovered sheet names
            for (const sheetName of sheetNames) {
              if (!sheetName) continue;
              
              console.log(`Trying sheet: ${sheetName}`);
              try {
                const response = await this.sheets.spreadsheets.values.get({
                  spreadsheetId,
                  range: sheetName,
                  key: process.env.GOOGLE_API_KEY
                });
                
                // Process the data if we got it
                const rows = response.data.values || [];
                if (rows.length > 1) {
                  console.log(`Retrieved ${rows.length} rows from Google Sheets (Sheet: ${sheetName})`);
                  return this.processSheetData(rows);
                } else {
                  console.log(`No data found in sheet: ${sheetName}`);
                }
              } catch (sheetError) {
                console.log(`Error accessing sheet ${sheetName}:`, sheetError instanceof Error ? sheetError.message : String(sheetError));
              }
            }
          } else {
            // No sheets found in metadata, try our standard possible ranges
            for (const range of POSSIBLE_RANGES) {
              if (!range) continue;
              
              console.log(`Trying range: ${range}`);
              try {
                const response = await this.sheets.spreadsheets.values.get({
                  spreadsheetId,
                  range,
                  key: process.env.GOOGLE_API_KEY
                });
                
                // Process the data if we got it
                const rows = response.data.values || [];
                if (rows.length > 1) {
                  console.log(`Retrieved ${rows.length} rows from Google Sheets (Range: ${range})`);
                  return this.processSheetData(rows);
                } else {
                  console.log(`No data found in range: ${range}`);
                }
              } catch (rangeError) {
                console.log(`Error accessing range ${range}:`, rangeError instanceof Error ? rangeError.message : String(rangeError));
              }
            }
          }
        } catch (spreadsheetError) {
          console.log(`Error accessing spreadsheet ${spreadsheetId}:`, 
            spreadsheetError instanceof Error ? spreadsheetError.message : String(spreadsheetError));
        }
      }
      
      // If we've made it here, we couldn't find data in any spreadsheet/range
      console.log('Could not find valid data in any spreadsheet or range');
      return [];
    } catch (error) {
      console.error('Error fetching spreadsheet data:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
      }
      return [];
    }
  }
  
  private processSheetData(rows: any[][]): InsertOffer[] {
    if (rows.length <= 1) {
      console.log('Not enough rows to process (need at least headers + 1 data row)');
      return [];
    }
    
    // Extract headers from the first row
    let headers = rows[0];
    console.log('Sheet headers:', headers);
    
    // Handle case where headers might not match exactly our expected format
    // Map any recognized headers to our expected format
    const headerMap: Record<string, string> = {};
    headers.forEach((header: string, index: number) => {
      if (!header) return;
      
      // Normalize header by removing spaces and making it lowercase
      const normalizedHeader = header.toString().trim().replace(/\s+/g, '_').toLowerCase();
      
      // Try to find a match in expected headers
      const matchedHeader = EXPECTED_HEADERS.find(expectedHeader => 
        expectedHeader.toLowerCase() === normalizedHeader || 
        expectedHeader.toLowerCase().replace(/_/g, '') === normalizedHeader.replace(/_/g, '')
      );
      
      if (matchedHeader) {
        headerMap[index] = matchedHeader;
      } else {
        headerMap[index] = header.toString().trim();
      }
    });
    
    console.log('Processing data rows...');
    
    // Convert the row data to objects with named properties
    const offers = rows.slice(1).map((row, rowIndex) => {
      const rowData: Record<string, any> = {};
      
      // Use the headerMap to correctly map columns
      Object.entries(headerMap).forEach(([colIndex, headerName]) => {
        const index = parseInt(colIndex);
        rowData[headerName] = index < row.length ? row[index] : '';
      });
      
      // Apply any direct mappings for specific columns we know about
      // This ensures we handle cases where the spreadsheet uses different naming
      if (!rowData.Type && rowData.type) rowData.Type = rowData.type;
      if (!rowData.Platform && rowData.platform) rowData.Platform = rowData.platform;
      if (!rowData.Platform_URL && rowData.platform_url) rowData.Platform_URL = rowData.platform_url;
      
      try {
        return parseSheetRowToOffer(rowData);
      } catch (parseError) {
        console.error(`Error parsing row ${rowIndex + 2}:`, parseError);
        console.log('Row data:', rowData);
        // Return a null for this row, we'll filter it out below
        return null;
      }
    }).filter(offer => offer !== null) as InsertOffer[];
    
    console.log(`Successfully converted ${offers.length} rows to offers`);
    return offers;
  }

  async getOffersByType(type: string): Promise<InsertOffer[]> {
    const allOffers = await this.getOffers();
    return allOffers.filter(offer => offer.type.toLowerCase() === type.toLowerCase());
  }
}

export class MockGoogleSheetsService implements GoogleSheetsService {
  // Fallback implementation if Google Sheets API isn't available
  async getOffers(): Promise<InsertOffer[]> {
    // Return a mock dataset
    return [
      {
        type: "bus",
        platform: "MakeMyTrip",
        platformUrl: "https://www.makemytrip.com/bus-tickets/",
        promoCode: "HDFC500",
        minTransaction: 2000,
        minDiscountRs: 200,
        maxDiscountRs: 750,
        discountPercentage: 15,
        typeOfOffer: "card_offer",
        cardType: "credit",
        bankName: "hdfc",
        cardName: "HDFC Millennia Credit Card",
        isAddon: false,
        description: "Get 15% off up to ₹750 on bus bookings."
      },
      // More mock offers...
    ];
  }

  async getOffersByType(type: string): Promise<InsertOffer[]> {
    const allOffers = await this.getOffers();
    return allOffers.filter(offer => offer.type.toLowerCase() === type.toLowerCase());
  }
}

// Parse sheet row to offer object
export function parseSheetRowToOffer(row: any): InsertOffer {
  // Helper functions for data conversion with error handling
  const safeParseInt = (value: any, defaultValue: number = 0): number => {
    if (value === undefined || value === null || value === '') return defaultValue;
    
    // Try to convert the value to a number
    const cleaned = String(value).replace(/[^0-9.-]/g, ''); // Remove non-numeric chars except decimal and negative
    const parsed = parseInt(cleaned);
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  const safeParseFloat = (value: any, defaultValue: number = 0): number => {
    if (value === undefined || value === null || value === '') return defaultValue;
    
    // Try to convert the value to a number
    const cleaned = String(value).replace(/[^0-9.-]/g, ''); // Remove non-numeric chars except decimal and negative
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  // Clean and prepare the type field
  let offerType = (row.Type || row.type || '').toString().toLowerCase().trim();
  
  // Normalize common type values
  if (offerType.includes('bus') || offerType === 'buses') offerType = 'bus';
  if (offerType.includes('flight') || offerType === 'flights' || offerType === 'air') offerType = 'flight';
  if (offerType.includes('movie') || offerType === 'movies' || offerType === 'cinema') offerType = 'movie';
  if (offerType.includes('bill') || offerType === 'bills' || offerType === 'payment') offerType = 'bill';
  if (offerType.includes('hotel') || offerType === 'hotels' || offerType === 'stay') offerType = 'hotel';
  if (offerType.includes('food') || offerType === 'restaurant' || offerType === 'dining') offerType = 'food';
  if (offerType.includes('shop') || offerType === 'shopping' || offerType === 'retail') offerType = 'shopping';
  if (offerType.includes('cab') || offerType === 'taxi' || offerType === 'ride') offerType = 'cab';
  
  // Default description if not provided
  const description = row.Description || row.description || 
    `Get ${row.Discount_Percentage || ''}% off${row.Max_Discount_Rs ? ' up to ₹' + row.Max_Discount_Rs : ''} on ${offerType} bookings.`;
  
  // Create and return the offer object
  return {
    type: offerType || "other",
    platform: (row.Platform || row.platform || "").toString(),
    platformUrl: (row.Platform_URL || row.PlatformURL || row.platformUrl || row.platform_url || "").toString(),
    promoCode: (row.PromoCode || row.promocode || row.promo_code || row.promocode || "").toString(),
    minTransaction: safeParseInt(row.Min_Tx || row.min_tx || row.MinTx || row.minTransaction, 0),
    minDiscountRs: safeParseInt(row.Min_Discount_Rs || row.min_discount || row.MinDiscount, null as unknown as number),
    maxDiscountRs: safeParseInt(row.Max_Discount_Rs || row.max_discount || row.MaxDiscount, null as unknown as number),
    discountPercentage: safeParseFloat(row.Discount_Percentage || row.discount || row.Discount, 0),
    typeOfOffer: ((row.Type_of_offer || row.typeOfOffer || row.type_of_offer || "other")
      .toString()
      .toLowerCase()
      .replace(/\s/g, '_')),
    cardType: ((row.Card_type || row.cardType || row.card_type || "")
      .toString()
      .toLowerCase() || null),
    bankName: ((row.Bank_Name || row.bankName || row.bank_name || row.bank || "")
      .toString()
      .toLowerCase() || null),
    cardName: (row.Card_Name || row.cardName || row.card_name || null),
    isAddon: row.Add_on === "Yes" || row.Add_on === true || row.add_on === "Yes" || row.add_on === true || row.isAddon === true,
    description: description
  };
}
