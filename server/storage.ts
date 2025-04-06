import { 
  cards, Card, InsertCard, 
  platforms, Platform, InsertPlatform,
  platformOffers, PlatformOffer, InsertPlatformOffer,
  cardOffers, CardOffer, InsertCardOffer,
  settings, Setting, InsertSetting,
  CombinedOffer
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // Settings methods
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  
  // Card methods
  getCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  deleteCard(id: number): Promise<boolean>;

  // Platform methods
  getPlatforms(category?: string): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  
  // Platform Offer methods
  getPlatformOffers(platformId?: number): Promise<PlatformOffer[]>;
  
  // Card Offer methods
  getCardOffers(platformId?: number, cardBank?: string): Promise<CardOffer[]>;
  
  // Combined methods
  getCombinedOffers(category: string, userCards: Card[]): Promise<CombinedOffer[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result.length > 0 ? result[0].value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    // Use upsert to either insert a new setting or update an existing one
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
  }
  // Card methods
  async getCards(): Promise<Card[]> {
    return await db.select().from(cards);
  }

  async getCard(id: number): Promise<Card | undefined> {
    const result = await db.select().from(cards).where(eq(cards.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const result = await db.insert(cards).values(insertCard).returning();
    return result[0];
  }

  async deleteCard(id: number): Promise<boolean> {
    const result = await db.delete(cards).where(eq(cards.id, id)).returning();
    return result.length > 0;
  }

  // Platform methods
  async getPlatforms(category?: string): Promise<Platform[]> {
    if (category) {
      // Case-insensitive search
      return await db
        .select()
        .from(platforms)
        .where(sql`LOWER(${platforms.category}) = LOWER(${category})`);
    }
    return await db.select().from(platforms);
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const result = await db.select().from(platforms).where(eq(platforms.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  // Platform Offer methods
  async getPlatformOffers(platformId?: number): Promise<PlatformOffer[]> {
    if (platformId) {
      return await db.select().from(platformOffers).where(eq(platformOffers.platformId, platformId));
    }
    return await db.select().from(platformOffers);
  }

  // Card Offer methods
  async getCardOffers(platformId?: number, cardBank?: string): Promise<CardOffer[]> {
    if (platformId && cardBank) {
      return await db.select().from(cardOffers).where(
        and(
          eq(cardOffers.platformId, platformId),
          eq(cardOffers.cardBank, cardBank)
        )
      );
    } else if (platformId) {
      return await db.select().from(cardOffers).where(eq(cardOffers.platformId, platformId));
    } else if (cardBank) {
      return await db.select().from(cardOffers).where(eq(cardOffers.cardBank, cardBank));
    }
    
    return await db.select().from(cardOffers);
  }

  // Combined methods
  async getCombinedOffers(category: string, userCards: Card[]): Promise<CombinedOffer[]> {
    // Get all platforms in the specified category
    const platformsList = await this.getPlatforms(category);
    const combinedOffers: CombinedOffer[] = [];

    // Check if we're in Sheet Only Mode
    const useSheetOnly = await this.getSetting('useSheetOnly') === 'true';

    for (const platform of platformsList) {
      // Get all platform offers for this platform
      const platformOffersList = await db
        .select()
        .from(platformOffers)
        .where(eq(platformOffers.platformId, platform.id))
        .orderBy(desc(platformOffers.lastUpdated));

      if (platformOffersList.length === 0) continue;
      
      // Process all offers instead of just the latest one
      for (const platformOffer of platformOffersList) {
        // Find the best card offer for this platform and offer using the user's cards
        let bestCardOffer: CardOffer | null = null;
        let bestCard: Card | null = null;

        if (userCards.length > 0) {
          for (const card of userCards) {
            // Get card offers for this platform that match the user's card
            const cardOffersList = await db
              .select()
              .from(cardOffers)
              .where(
                and(
                  eq(cardOffers.platformId, platform.id),
                  eq(cardOffers.cardBank, card.bank),
                  // Either cardName is null (applies to all cards from bank) 
                  // or matches the specific card name
                  sql`(${cardOffers.cardName} IS NULL OR ${cardOffers.cardName} = ${card.name})`,
                  // Either cardType is null (applies to all card types) or matches the user's card type
                  sql`(${cardOffers.cardType} IS NULL OR ${cardOffers.cardType} = ${card.type})`
                )
              )
              .orderBy(desc(cardOffers.discountPercentage));

            if (cardOffersList.length > 0) {
              const highestCardOffer = cardOffersList[0];
              
              if (!bestCardOffer || highestCardOffer.discountPercentage > bestCardOffer.discountPercentage) {
                bestCardOffer = highestCardOffer;
                bestCard = card;
              }
            }
          }
        }

        // We need to check if there are any card offers for this platform
        const hasCardOffers = await db
          .select({ count: sql`count(*)` })
          .from(cardOffers)
          .where(eq(cardOffers.platformId, platform.id));
          
        // Only include offers that match user's cards if they have card offers
        if (hasCardOffers[0].count > 0 && bestCardOffer === null && userCards.length > 0) {
          // Skip this offer if it has card offers but no matching card is found
          continue;
        }

        // Calculate total discount
        const totalDiscountPercentage = platformOffer.discountPercentage + (bestCardOffer?.discountPercentage || 0);

        combinedOffers.push({
          platform,
          platformOffer,
          cardOffer: bestCardOffer,
          totalDiscountPercentage,
          applicableCard: bestCard
        });
      }
    }

    // Sort by total discount percentage (highest first)
    return combinedOffers.sort((a, b) => b.totalDiscountPercentage - a.totalDiscountPercentage);
  }
}

// Legacy MemStorage implementation (keeping for reference)
export class MemStorage implements IStorage {
  private cards: Map<number, Card>;
  private platforms: Map<number, Platform>;
  private platformOffers: Map<number, PlatformOffer>;
  private cardOffers: Map<number, CardOffer>;
  private settings: Map<string, string>;

  private cardCurrentId: number;
  private platformCurrentId: number;
  private platformOfferCurrentId: number;
  private cardOfferCurrentId: number;

  constructor() {
    this.cards = new Map();
    this.platforms = new Map();
    this.platformOffers = new Map();
    this.cardOffers = new Map();
    this.settings = new Map();

    this.cardCurrentId = 1;
    this.platformCurrentId = 1;
    this.platformOfferCurrentId = 1;
    this.cardOfferCurrentId = 1;

    // Initialize with sample data
    this.initSampleData();
  }
  
  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    return this.settings.get(key) || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
  }

  private initSampleData() {
    // Bus booking platforms
    const redbus = this.seedPlatform({ 
      name: "RedBus", 
      logoUrl: "https://www.redbus.in/i/59538b35953097248522a65b4b79650e.png", 
      category: "bus" 
    });

    const abhibus = this.seedPlatform({ 
      name: "AbhiBus", 
      logoUrl: "https://static.abhibus.com/img/abhibus-logo.png", 
      category: "bus" 
    });

    const paytmBus = this.seedPlatform({ 
      name: "Paytm Bus", 
      logoUrl: "https://logos-download.com/wp-content/uploads/2016/11/Paytm_logo_logotype.png", 
      category: "bus" 
    });

    const zingBus = this.seedPlatform({ 
      name: "Zing Bus", 
      logoUrl: "https://www.zingbus.com/images/logo.svg", 
      category: "bus" 
    });

    const intercity = this.seedPlatform({ 
      name: "Intercity", 
      logoUrl: "https://assets.airtel.in/static-assets/intercity-images/ic_logo.png", 
      category: "bus" 
    });

    // Platform offers
    this.seedPlatformOffer({
      platformId: redbus.id,
      discountPercentage: 5,
      minimumOrderAmount: 500,
      description: "5% off on minimum order of ₹500",
      lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    });

    this.seedPlatformOffer({
      platformId: abhibus.id,
      discountPercentage: 7,
      minimumOrderAmount: 800,
      description: "7% off on minimum order of ₹800",
      lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    });

    this.seedPlatformOffer({
      platformId: paytmBus.id,
      discountPercentage: 4,
      minimumOrderAmount: 0,
      description: "4% off on all bookings",
      lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    });

    this.seedPlatformOffer({
      platformId: zingBus.id,
      discountPercentage: 5,
      minimumOrderAmount: 0,
      description: "5% off on first booking",
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });

    this.seedPlatformOffer({
      platformId: intercity.id,
      discountPercentage: 5,
      minimumOrderAmount: 500,
      description: "5% off on minimum order of ₹500",
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    });

    // Card offers
    this.seedCardOffer({
      platformId: redbus.id,
      cardBank: "IDFC First Bank",
      cardName: "IDFC First Millennial",
      discountPercentage: 3,
      minimumOrderAmount: 0,
      description: "+3% with IDFC First Millennial Card"
    });

    this.seedCardOffer({
      platformId: paytmBus.id,
      cardBank: "IDFC First Bank",
      cardName: "IDFC First Millennial",
      discountPercentage: 2,
      minimumOrderAmount: 0,
      description: "+2% with IDFC First Millennial Card"
    });

    this.seedCardOffer({
      platformId: intercity.id,
      cardBank: "IDFC First Bank",
      cardName: "IDFC First Millennial",
      discountPercentage: 5,
      minimumOrderAmount: 0,
      description: "+5% with IDFC First Millennial Card"
    });

    this.seedCardOffer({
      platformId: redbus.id,
      cardBank: "HDFC Bank",
      cardName: "HDFC Freedom",
      discountPercentage: 2,
      minimumOrderAmount: 0,
      description: "+2% with HDFC Freedom Card"
    });
  }

  private seedPlatform(platform: Omit<InsertPlatform, "id">): Platform {
    const id = this.platformCurrentId++;
    const newPlatform: Platform = { ...platform, id };
    this.platforms.set(id, newPlatform);
    return newPlatform;
  }

  private seedPlatformOffer(offer: Omit<InsertPlatformOffer, "id">): PlatformOffer {
    const id = this.platformOfferCurrentId++;
    const newOffer: PlatformOffer = {
      ...offer,
      id,
      termsAndConditions: offer.termsAndConditions || null,
      expiryDate: offer.expiryDate || null
    };
    this.platformOffers.set(id, newOffer);
    return newOffer;
  }

  private seedCardOffer(offer: Omit<InsertCardOffer, "id">): CardOffer {
    const id = this.cardOfferCurrentId++;
    const newOffer: CardOffer = {
      ...offer,
      id,
      minimumOrderAmount: offer.minimumOrderAmount || null,
      termsAndConditions: offer.termsAndConditions || null,
      expiryDate: offer.expiryDate || null,
      cardName: offer.cardName || null,
      cardType: offer.cardType || null
    };
    this.cardOffers.set(id, newOffer);
    return newOffer;
  }

  // Card methods
  async getCards(): Promise<Card[]> {
    return Array.from(this.cards.values());
  }

  async getCard(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const id = this.cardCurrentId++;
    const card: Card = { ...insertCard, id };
    this.cards.set(id, card);
    return card;
  }

  async deleteCard(id: number): Promise<boolean> {
    return this.cards.delete(id);
  }

  // Platform methods
  async getPlatforms(category?: string): Promise<Platform[]> {
    let platforms = Array.from(this.platforms.values());
    
    if (category) {
      platforms = platforms.filter(platform => platform.category === category);
    }
    
    return platforms;
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    return this.platforms.get(id);
  }

  // Platform Offer methods
  async getPlatformOffers(platformId?: number): Promise<PlatformOffer[]> {
    let platformOffers = Array.from(this.platformOffers.values());
    
    if (platformId) {
      platformOffers = platformOffers.filter(offer => offer.platformId === platformId);
    }
    
    return platformOffers;
  }

  // Card Offer methods
  async getCardOffers(platformId?: number, cardBank?: string): Promise<CardOffer[]> {
    let cardOffers = Array.from(this.cardOffers.values());
    
    if (platformId) {
      cardOffers = cardOffers.filter(offer => offer.platformId === platformId);
    }
    
    if (cardBank) {
      cardOffers = cardOffers.filter(offer => offer.cardBank === cardBank);
    }
    
    return cardOffers;
  }

  // Combined methods
  async getCombinedOffers(category: string, userCards: Card[]): Promise<CombinedOffer[]> {
    const platforms = await this.getPlatforms(category);
    const combinedOffers: CombinedOffer[] = [];

    for (const platform of platforms) {
      const platformOffers = await this.getPlatformOffers(platform.id);
      
      if (platformOffers.length === 0) continue;
      
      // Use the latest platform offer
      const platformOffer = platformOffers.reduce((latest, current) => {
        return !latest.lastUpdated || (current.lastUpdated && current.lastUpdated > latest.lastUpdated) 
          ? current 
          : latest;
      });

      // Find applicable card offers for this platform
      let bestCardOffer: CardOffer | null = null;
      let bestCard: Card | null = null;

      for (const card of userCards) {
        const cardOffers = await this.getCardOffers(platform.id);
        
        // Find card offers that match the user's card bank, name (if specified), and type (if specified)
        const applicableCardOffers = cardOffers.filter(offer => 
          offer.cardBank === card.bank && 
          (!offer.cardName || offer.cardName === card.name) &&
          (!offer.cardType || offer.cardType === card.type)
        );

        if (applicableCardOffers.length > 0) {
          // Get the card offer with the highest discount
          const highestCardOffer = applicableCardOffers.reduce((highest, current) => 
            current.discountPercentage > highest.discountPercentage ? current : highest
          );

          if (!bestCardOffer || highestCardOffer.discountPercentage > bestCardOffer.discountPercentage) {
            bestCardOffer = highestCardOffer;
            bestCard = card;
          }
        }
      }

      // Calculate total discount
      const totalDiscountPercentage = platformOffer.discountPercentage + (bestCardOffer?.discountPercentage || 0);

      combinedOffers.push({
        platform,
        platformOffer,
        cardOffer: bestCardOffer,
        totalDiscountPercentage,
        applicableCard: bestCard
      });
    }

    // Sort by total discount percentage (highest first)
    return combinedOffers.sort((a, b) => b.totalDiscountPercentage - a.totalDiscountPercentage);
  }
}

export const storage = new DatabaseStorage();
