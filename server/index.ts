import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage, DatabaseStorage } from "./storage";
import { type InsertOffer } from "@shared/schema";
import { GoogleSheetsClient } from "./services/googleSheets";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Sample data for seeding the database
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

(async () => {
  // Seed the database with data from Google Sheets or fallback to sample data
  if (storage instanceof DatabaseStorage) {
    try {
      // Try to use Google Sheets if API key is available
      if (process.env.GOOGLE_API_KEY) {
        const sheetsClient = new GoogleSheetsClient();
        log("Fetching offers from Google Sheets...");
        
        try {
          const offersFromGoogleSheets = await sheetsClient.getOffers();
          
          if (offersFromGoogleSheets && offersFromGoogleSheets.length > 0) {
            log(`Retrieved ${offersFromGoogleSheets.length} offers from Google Sheets`);
            await (storage as DatabaseStorage).seedOffers(offersFromGoogleSheets);
            log("Database seeded successfully with offers from Google Sheets");
          } else {
            log("No offers found in Google Sheets, using sample offers instead");
            await (storage as DatabaseStorage).seedOffers(sampleOffers);
            log("Database seeded successfully with sample offers");
          }
        } catch (googleSheetsError) {
          log(`Error fetching from Google Sheets: ${googleSheetsError instanceof Error ? googleSheetsError.message : String(googleSheetsError)}`);
          log("Falling back to sample offers");
          await (storage as DatabaseStorage).seedOffers(sampleOffers);
          log("Database seeded successfully with sample offers");
        }
      } else {
        // No API key, use sample data
        log("No Google API key found, using sample offers");
        await (storage as DatabaseStorage).seedOffers(sampleOffers);
        log("Database seeded successfully with sample offers");
      }
    } catch (error) {
      log(`Error seeding database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
