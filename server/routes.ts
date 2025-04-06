import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, DatabaseStorage } from "./storage";
import { offerSearchSchema, insertOfferSchema } from "@shared/schema";
import { findBestOffer } from "./services/discountCalculator";
import { setupAuth } from "./auth";
import { GoogleSheetsClient } from "./services/googleSheets";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  const { isAuthenticated } = setupAuth(app);
  
  // API routes for offers
  const apiRouter = express.Router();
  
  // Get all offers
  apiRouter.get("/offers", async (_req: Request, res: Response) => {
    try {
      const offers = await storage.getOffers();
      res.json({ offers });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offers", error: (error as Error).message });
    }
  });
  
  // Get offers by service type
  apiRouter.get("/offers/service/:serviceType", async (req: Request, res: Response) => {
    try {
      const { serviceType } = req.params;
      const offers = await storage.getOffersByService(serviceType);
      res.json({ offers });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offers by service", error: (error as Error).message });
    }
  });
  
  // Search offers with filters
  apiRouter.post("/offers/search", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = offerSearchSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid search parameters",
          errors: result.error.errors
        });
      }
      
      const searchParams = result.data;
      const offers = await storage.searchOffers(searchParams);
      
      // Find the best offer using the discount calculator service
      const bestOffer = findBestOffer(offers);
      
      res.json({ 
        offers,
        bestOffer
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to search offers", error: (error as Error).message });
    }
  });
  
  // Admin routes for managing offers
  // Create a new offer
  apiRouter.post("/admin/offers", isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const result = insertOfferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid offer data",
          errors: result.error.errors
        });
      }
      
      const offer = await storage.createOffer(result.data);
      res.status(201).json(offer);
    } catch (error) {
      next(error);
    }
  });
  
  // Update an existing offer
  apiRouter.put("/admin/offers/:id", isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const offerId = parseInt(id);
      
      // Validate request body (partial validation for update)
      const offer = await storage.updateOffer(offerId, req.body);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      res.json(offer);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete an offer
  apiRouter.delete("/admin/offers/:id", isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const offerId = parseInt(id);
      
      const success = await storage.deleteOffer(offerId);
      if (!success) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Sync offers from Google Sheets
  apiRouter.post("/admin/offers/sync-from-sheets", isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        return res.status(400).json({ message: "Google API key is not configured" });
      }

      // Get update mode from request body (append or overwrite)
      const { mode = 'append' } = req.body as { mode?: 'append' | 'overwrite' };

      // Get offers from Google Sheets
      const sheetsClient = new GoogleSheetsClient();
      const offersFromGoogleSheets = await sheetsClient.getOffers();
      
      if (!offersFromGoogleSheets || offersFromGoogleSheets.length === 0) {
        return res.status(404).json({ message: "No offers found in Google Sheets" });
      }
      
      // Import offers based on the chosen mode
      if (storage instanceof DatabaseStorage) {
        // If mode is overwrite, seed the database (which clears existing offers)
        // If mode is append, add each offer individually
        if (mode === 'overwrite') {
          await (storage as DatabaseStorage).seedOffers(offersFromGoogleSheets);
        } else {
          // In append mode, add each offer individually
          for (const offer of offersFromGoogleSheets) {
            await storage.createOffer(offer);
          }
        }
        
        return res.status(200).json({ 
          message: `Successfully ${mode === 'overwrite' ? 'replaced' : 'added'} offers from Google Sheets`, 
          count: offersFromGoogleSheets.length 
        });
      } else {
        return res.status(500).json({ message: "Database storage not available" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
