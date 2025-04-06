import { 
  InsertPlatform, InsertPlatformOffer, InsertCardOffer,
  platforms, platformOffers, cardOffers
} from '@shared/schema';
import { db } from './db';

async function seedDatabase() {
  console.log('Starting database seeding...');

  // Check if we already have data
  const existingPlatforms = await db.select().from(platforms);
  if (existingPlatforms.length > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  try {
    // Bus booking platforms
    const redbus = await db.insert(platforms).values({ 
      name: "RedBus", 
      logoUrl: "https://www.redbus.in/i/59538b35953097248522a65b4b79650e.png", 
      category: "bus" 
    }).returning();

    const abhibus = await db.insert(platforms).values({ 
      name: "AbhiBus", 
      logoUrl: "https://static.abhibus.com/img/abhibus-logo.png", 
      category: "bus" 
    }).returning();

    const paytmBus = await db.insert(platforms).values({ 
      name: "Paytm Bus", 
      logoUrl: "https://logos-download.com/wp-content/uploads/2016/11/Paytm_logo_logotype.png", 
      category: "bus" 
    }).returning();

    const zingBus = await db.insert(platforms).values({ 
      name: "Zing Bus", 
      logoUrl: "https://www.zingbus.com/images/logo.svg", 
      category: "bus" 
    }).returning();

    const intercity = await db.insert(platforms).values({ 
      name: "Intercity", 
      logoUrl: "https://assets.airtel.in/static-assets/intercity-images/ic_logo.png", 
      category: "bus" 
    }).returning();

    // Platform offers
    await db.insert(platformOffers).values({
      platformId: redbus[0].id,
      discountPercentage: 5,
      minimumOrderAmount: 500,
      description: "5% off on minimum order of ₹500",
      lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    });

    await db.insert(platformOffers).values({
      platformId: abhibus[0].id,
      discountPercentage: 7,
      minimumOrderAmount: 800,
      description: "7% off on minimum order of ₹800",
      lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    });

    await db.insert(platformOffers).values({
      platformId: paytmBus[0].id,
      discountPercentage: 4,
      minimumOrderAmount: 0,
      description: "4% off on all bookings",
      lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    });

    await db.insert(platformOffers).values({
      platformId: zingBus[0].id,
      discountPercentage: 5,
      minimumOrderAmount: 0,
      description: "5% off on first booking",
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });

    await db.insert(platformOffers).values({
      platformId: intercity[0].id,
      discountPercentage: 5,
      minimumOrderAmount: 500,
      description: "5% off on minimum order of ₹500",
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    });

    // Card offers
    await db.insert(cardOffers).values({
      platformId: redbus[0].id,
      cardBank: "IDFC First Bank",
      cardName: "IDFC First Millennial",
      discountPercentage: 3,
      minimumOrderAmount: 0,
      description: "+3% with IDFC First Millennial Card"
    });

    await db.insert(cardOffers).values({
      platformId: paytmBus[0].id,
      cardBank: "IDFC First Bank",
      cardName: "IDFC First Millennial",
      discountPercentage: 2,
      minimumOrderAmount: 0,
      description: "+2% with IDFC First Millennial Card"
    });

    await db.insert(cardOffers).values({
      platformId: intercity[0].id,
      cardBank: "IDFC First Bank",
      cardName: "IDFC First Millennial",
      discountPercentage: 5,
      minimumOrderAmount: 0,
      description: "+5% with IDFC First Millennial Card"
    });

    await db.insert(cardOffers).values({
      platformId: redbus[0].id,
      cardBank: "HDFC Bank",
      cardName: "HDFC Freedom",
      discountPercentage: 2,
      minimumOrderAmount: 0,
      description: "+2% with HDFC Freedom Card"
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export { seedDatabase };