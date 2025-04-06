import { users, type User, type InsertUser, offers, type Offer, type InsertOffer, type OfferSearch } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, ilike, or, asc } from "drizzle-orm";

// Interface with CRUD methods
export interface IStorage {
  // User methods (keeping from original template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Offer methods
  getOffers(): Promise<Offer[]>;
  getOffersByService(serviceType: string): Promise<Offer[]>;
  searchOffers(search: OfferSearch): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: number, offer: Partial<InsertOffer>): Promise<Offer | undefined>;
  deleteOffer(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private offersMap: Map<number, Offer>;
  userCurrentId: number;
  offerCurrentId: number;

  constructor() {
    this.users = new Map();
    this.offersMap = new Map();
    this.userCurrentId = 1;
    this.offerCurrentId = 1;
    
    // Pre-populate with sample offer data for testing
    this.seedOffers();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Offer methods
  async getOffers(): Promise<Offer[]> {
    return Array.from(this.offersMap.values());
  }

  async getOffersByService(serviceType: string): Promise<Offer[]> {
    return Array.from(this.offersMap.values()).filter(
      (offer) => offer.type === serviceType
    );
  }

  async searchOffers(search: OfferSearch): Promise<Offer[]> {
    let results = await this.getOffersByService(search.serviceType);
    
    // Filter by card name if provided
    if (search.cardName) {
      const cardNameLower = search.cardName.toLowerCase();
      results = results.filter(offer => 
        !offer.cardName || offer.cardName.toLowerCase().includes(cardNameLower)
      );
    }
    
    // Filter by card type if provided
    if (search.cardType) {
      results = results.filter(offer => 
        !offer.cardType || offer.cardType === search.cardType
      );
    }
    
    // Filter by bank name if provided
    if (search.bankName) {
      results = results.filter(offer => 
        !offer.bankName || offer.bankName === search.bankName
      );
    }
    
    return results;
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = this.offerCurrentId++;
    // Create a complete Offer object with all required fields
    const offer: Offer = { 
      id,
      type: insertOffer.type,
      platform: insertOffer.platform,
      platformUrl: insertOffer.platformUrl,
      promoCode: insertOffer.promoCode,
      minTransaction: insertOffer.minTransaction,
      discountPercentage: insertOffer.discountPercentage,
      typeOfOffer: insertOffer.typeOfOffer,
      // Set nullable fields with null as fallback
      description: insertOffer.description !== undefined ? insertOffer.description : null,
      minDiscountRs: insertOffer.minDiscountRs !== undefined ? insertOffer.minDiscountRs : null,
      maxDiscountRs: insertOffer.maxDiscountRs !== undefined ? insertOffer.maxDiscountRs : null,
      cardType: insertOffer.cardType !== undefined ? insertOffer.cardType : null,
      bankName: insertOffer.bankName !== undefined ? insertOffer.bankName : null,
      cardName: insertOffer.cardName !== undefined ? insertOffer.cardName : null,
      isAddon: insertOffer.isAddon !== undefined ? insertOffer.isAddon : null
    };
    this.offersMap.set(id, offer);
    return offer;
  }

  async updateOffer(id: number, offerUpdate: Partial<InsertOffer>): Promise<Offer | undefined> {
    const existingOffer = this.offersMap.get(id);
    if (!existingOffer) return undefined;
    
    const updatedOffer: Offer = { ...existingOffer, ...offerUpdate };
    this.offersMap.set(id, updatedOffer);
    return updatedOffer;
  }

  async deleteOffer(id: number): Promise<boolean> {
    return this.offersMap.delete(id);
  }

  // Seed method to populate some initial offers for testing
  private seedOffers() {
    const sampleOffers: InsertOffer[] = [
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
        description: "Flat ₹750 off on bus bookings above ₹2,000 with HDFC Millennia Credit Card. Valid till 31st Dec 2023."
      },
      {
        type: "bus",
        platform: "RedBus",
        platformUrl: "https://www.redbus.in/",
        promoCode: "HDFCBUS",
        minTransaction: 1500,
        minDiscountRs: 150,
        maxDiscountRs: 650,
        discountPercentage: 12,
        typeOfOffer: "bank_offer",
        cardType: "credit",
        bankName: "hdfc",
        cardName: "",
        isAddon: false,
        description: "Get ₹650 off on bus bookings above ₹1,500 with HDFC Bank. Valid till 15th Nov 2023."
      },
      {
        type: "bus",
        platform: "AbhiBus",
        platformUrl: "https://www.abhibus.com/",
        promoCode: "NEWUSER",
        minTransaction: 1000,
        minDiscountRs: 100,
        maxDiscountRs: 500,
        discountPercentage: 20,
        typeOfOffer: "new_user",
        cardType: "",
        bankName: "",
        cardName: "",
        isAddon: false,
        description: "Get ₹500 off on first bus booking above ₹1,000. Valid for new users only."
      },
      {
        type: "flight",
        platform: "MakeMyTrip",
        platformUrl: "https://www.makemytrip.com/flights/",
        promoCode: "FLYSBI",
        minTransaction: 5000,
        minDiscountRs: 500,
        maxDiscountRs: 2000,
        discountPercentage: 10,
        typeOfOffer: "bank_offer",
        cardType: "credit",
        bankName: "sbi",
        cardName: "SBI SimplyCLICK Credit Card",
        isAddon: false,
        description: "Get up to ₹2,000 off on domestic flight bookings with SBI SimplyCLICK Credit Card."
      },
      {
        type: "movie",
        platform: "BookMyShow",
        platformUrl: "https://in.bookmyshow.com/",
        promoCode: "ICICIFILM",
        minTransaction: 500,
        minDiscountRs: 100,
        maxDiscountRs: 200,
        discountPercentage: 25,
        typeOfOffer: "card_offer",
        cardType: "credit",
        bankName: "icici",
        cardName: "ICICI Coral Credit Card",
        isAddon: false,
        description: "Get 25% off up to ₹200 on movie tickets with ICICI Coral Credit Card."
      },
      {
        type: "bill",
        platform: "Paytm",
        platformUrl: "https://paytm.com/",
        promoCode: "BILLAXIS",
        minTransaction: 1000,
        minDiscountRs: 50,
        maxDiscountRs: 200,
        discountPercentage: 5,
        typeOfOffer: "card_offer",
        cardType: "credit",
        bankName: "axis",
        cardName: "Axis Bank Neo Credit Card",
        isAddon: false,
        description: "Get 5% cashback up to ₹200 on bill payments with Axis Bank Neo Credit Card."
      },
      {
        type: "hotel",
        platform: "Goibibo",
        platformUrl: "https://www.goibibo.com/hotels/",
        promoCode: "KOTAKSTAY",
        minTransaction: 3000,
        minDiscountRs: 300,
        maxDiscountRs: 1500,
        discountPercentage: 15,
        typeOfOffer: "card_offer",
        cardType: "credit",
        bankName: "kotak",
        cardName: "Kotak Urbane Credit Card",
        isAddon: false,
        description: "Get 15% off up to ₹1,500 on hotel bookings with Kotak Urbane Credit Card."
      },
      {
        type: "food",
        platform: "Swiggy",
        platformUrl: "https://www.swiggy.com/",
        promoCode: "YESEAT",
        minTransaction: 800,
        minDiscountRs: 100,
        maxDiscountRs: 300,
        discountPercentage: 20,
        typeOfOffer: "bank_offer",
        cardType: "credit",
        bankName: "yes",
        cardName: "",
        isAddon: true,
        description: "Get 20% off up to ₹300 on food orders with Yes Bank Credit Cards."
      },
      {
        type: "shopping",
        platform: "Amazon",
        platformUrl: "https://www.amazon.in/",
        promoCode: "HDFC1000",
        minTransaction: 5000,
        minDiscountRs: 500,
        maxDiscountRs: 1000,
        discountPercentage: 10,
        typeOfOffer: "card_offer",
        cardType: "credit",
        bankName: "hdfc",
        cardName: "HDFC Regalia Credit Card",
        isAddon: false,
        description: "Get 10% instant discount up to ₹1,000 on shopping with HDFC Regalia Credit Card."
      },
      {
        type: "cab",
        platform: "Ola",
        platformUrl: "https://www.olacabs.com/",
        promoCode: "OLAHDFC",
        minTransaction: 500,
        minDiscountRs: 50,
        maxDiscountRs: 150,
        discountPercentage: 15,
        typeOfOffer: "card_offer",
        cardType: "credit",
        bankName: "hdfc",
        cardName: "HDFC Diners Club Credit Card",
        isAddon: false,
        description: "Get 15% off up to ₹150 on cab rides with HDFC Diners Club Credit Card."
      }
    ];

    // Add sample offers to the storage
    sampleOffers.forEach(offer => {
      this.createOffer(offer);
    });
  }
}

// DatabaseStorage implementation for PostgreSQL
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Offer methods
  async getOffers(): Promise<Offer[]> {
    return await db.select().from(offers);
  }

  async getOffersByService(serviceType: string): Promise<Offer[]> {
    return await db.select().from(offers).where(eq(offers.type, serviceType));
  }

  async searchOffers(search: OfferSearch): Promise<Offer[]> {
    // Start with service type condition which is mandatory
    const baseCondition = eq(offers.type, search.serviceType);
    
    // We need to build a complex condition that includes all possible matches:
    // 1. Offers that exactly match the card criteria (specific card name/type/bank)
    // 2. Generic offers with empty/null card fields
    // 3. Offers that partially match the card name
    
    // Create conditions based on search params
    const hasCardName = search.cardName && search.cardName.trim() !== '';
    const hasCardType = search.cardType && search.cardType.trim() !== '';
    const hasBankName = search.bankName && search.bankName.trim() !== '';
    
    // Log the search parameters for debugging
    console.log('Search params:', {
      serviceType: search.serviceType,
      cardName: search.cardName,
      cardType: search.cardType,
      bankName: search.bankName
    });
    
    // Get all offers for the service type first
    const allServiceOffers = await db
      .select()
      .from(offers)
      .where(baseCondition);
    
    console.log(`Found ${allServiceOffers.length} offers for service type: ${search.serviceType} before filtering`);
    
    // Now we'll filter these offers in memory to handle case insensitivity and partial matches better
    // This is more flexible than SQL for complex text matching 
    let results = allServiceOffers;
    
    // Card name filtering - match partially, ignoring case and whitespace
    if (hasCardName) {
      const searchCardNameLower = search.cardName.toLowerCase().replace(/\s+/g, ' ').trim();
      results = results.filter(offer => 
        // Include if card name is empty/null (generic offer)
        !offer.cardName || 
        offer.cardName === '' || 
        // Or if card name contains the search term (case insensitive)
        offer.cardName.toLowerCase().includes(searchCardNameLower)
      );
    }
    
    // Card type filtering - match if either exact match or generic
    if (hasCardType) {
      const searchCardTypeLower = search.cardType.toLowerCase().trim();
      results = results.filter(offer => 
        // Include if card type is empty/null (generic offer)
        !offer.cardType || 
        offer.cardType === '' || 
        // Or if card type contains the search term (case insensitive)
        offer.cardType.toLowerCase().includes(searchCardTypeLower)
      );
    }
    
    // Bank name filtering - match if either exact match or generic
    if (hasBankName) {
      const searchBankNameLower = search.bankName.toLowerCase().trim();
      // Map the standard bank codes to their full names
      const bankNameMap: Record<string, string> = {
        'hdfc': 'hdfc bank',
        'sbi': 'sbi',
        'icici': 'icici bank',
        'axis': 'axis bank',
        'kotak': 'kotak mahindra bank',
        'yes': 'yes bank',
      };
      
      const searchBankFullName = bankNameMap[searchBankNameLower] || searchBankNameLower;
      
      results = results.filter(offer => 
        // Include if bank name is empty/null (generic offer)
        !offer.bankName || 
        offer.bankName === '' ||
        offer.bankName.toLowerCase() === 'na' ||
        // Or if bank name contains the search term (case insensitive)
        offer.bankName.toLowerCase().includes(searchBankFullName)
      );
    }
    
    // Sort by discount percentage descending to show best deals first
    results.sort((a, b) => {
      return a.platform.localeCompare(b.platform);
    });
    
    console.log(`Found ${results.length} offers after filtering`);
    
    // Log the results for debugging
    results.forEach(offer => {
      console.log(`Match: ${offer.platform} - ${offer.promoCode} - Card: ${offer.cardName || 'any'} - Type: ${offer.cardType || 'any'} - Bank: ${offer.bankName || 'any'}`);
    });
    
    return results;
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const [offer] = await db.insert(offers).values(insertOffer).returning();
    return offer;
  }

  async updateOffer(id: number, offerUpdate: Partial<InsertOffer>): Promise<Offer | undefined> {
    const [updatedOffer] = await db
      .update(offers)
      .set(offerUpdate)
      .where(eq(offers.id, id))
      .returning();
    
    return updatedOffer || undefined;
  }

  async deleteOffer(id: number): Promise<boolean> {
    const result = await db.delete(offers).where(eq(offers.id, id));
    return !!result;
  }

  // Method to seed offers into the database
  async seedOffers(sampleOffers: InsertOffer[]): Promise<void> {
    // Check if offers already exist to avoid duplicate seeding
    const existingOffers = await this.getOffers();
    if (existingOffers.length === 0) {
      // Insert sample offers in batches
      for (const offer of sampleOffers) {
        await this.createOffer(offer);
      }
    }
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
