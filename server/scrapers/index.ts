import { updateAbhiBusOffers } from './abhibus-scraper';
import { updateZingBusOffers } from './zingbus-scraper';
import { terminateOCR } from './ocr-utils';
import { storage } from '../storage';

/**
 * Run a platform-specific scraper
 * @param platform - The name of the platform to scrape
 * @param forceRun - Force scraping even if in "Sheet Only Mode"
 */
export async function runPlatformScraper(platform: string, forceRun: boolean = false): Promise<void> {
  // Check if we're in Sheet Only Mode
  const sheetOnlyMode = await storage.getSetting('useSheetOnly');
  
  if (sheetOnlyMode === 'true' && !forceRun) {
    console.log(`Skipping ${platform} scraper - currently in Sheet Only Mode`);
    return;
  }
  
  console.log(`Starting scraper for ${platform}...`);
  
  try {
    switch (platform) {
      case 'AbhiBus':
        await updateAbhiBusOffers();
        break;
      case 'ZingBus':
        await updateZingBusOffers();
        break;
      default:
        console.log(`No scraper available for ${platform}`);
    }
    
    console.log(`${platform} scraper completed successfully`);
  } catch (error) {
    console.error(`Error running ${platform} scraper:`, error);
    throw error;
  }
}

/**
 * Run all available scrapers to update offer data
 * @param forceRun - Force scraping even if in "Sheet Only Mode"
 */
export async function runAllScrapers(forceRun: boolean = false): Promise<void> {
  // Check if we're in Sheet Only Mode
  const sheetOnlyMode = await storage.getSetting('useSheetOnly');
  
  if (sheetOnlyMode === 'true' && !forceRun) {
    console.log('Skipping all scrapers - currently in Sheet Only Mode');
    return;
  }
  
  console.log('Starting scraper runs for all platforms...');
  
  try {
    // AbhiBus scraper
    await updateAbhiBusOffers();
    
    // ZingBus scraper
    await updateZingBusOffers();
    
    // Add more platform scrapers here as they are implemented
    // await updateRedBusOffers();
    // await updateMakeMyTripOffers();
    
    console.log('All scrapers completed successfully');
  } catch (error) {
    console.error('Error running scrapers:', error);
    throw error;
  }
}

/**
 * Schedule scrapers to run periodically
 * @param intervalHours - How often to run scrapers (in hours)
 */
export function scheduleScrapers(intervalHours = 24): void {
  // Run once immediately
  runAllScrapers();
  
  // Then schedule to run at the specified interval
  const intervalMs = intervalHours * 60 * 60 * 1000;
  setInterval(runAllScrapers, intervalMs);
  
  console.log(`Scrapers scheduled to run every ${intervalHours} hours`);
}