import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCardSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { runAllScrapers, runPlatformScraper } from "./scrapers";
import { analyzeOffers, generateTravelInsight } from "./ai/offer-analyzer";
import { importOffersFromGoogleSheet } from "./importers";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Get all user cards
  router.get("/cards", async (req, res) => {
    try {
      const cards = await storage.getCards();
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  // Add a new card
  router.post("/cards", async (req, res) => {
    try {
      const validatedData = insertCardSchema.parse(req.body);
      const newCard = await storage.createCard(validatedData);
      res.status(201).json(newCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create card" });
      }
    }
  });

  // Delete a card
  router.delete("/cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid card ID" });
      }

      const success = await storage.deleteCard(id);
      if (success) {
        res.status(200).json({ message: "Card deleted successfully" });
      } else {
        res.status(404).json({ message: "Card not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete card" });
    }
  });

  // Get all platforms for a category
  router.get("/platforms", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const platforms = await storage.getPlatforms(category);
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  // Get combined offers for a category and user cards
  router.post("/offers", async (req, res) => {
    try {
      const category = req.body.category;
      const userCards = req.body.userCards || [];

      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      const combinedOffers = await storage.getCombinedOffers(category, userCards);
      
      // Calculate estimated savings for a sample booking amount
      const sampleBookingAmount = 1200; // ₹1200 as a sample booking amount
      const offersWithSavings = combinedOffers.map(offer => ({
        ...offer,
        estimatedSavings: Math.round((offer.totalDiscountPercentage / 100) * sampleBookingAmount)
      }));

      res.json(offersWithSavings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Scraper route to manually update offers
  router.post("/scrape", async (req, res) => {
    try {
      const platform = req.body.platform as string | undefined;
      
      // Check if we're in Sheet Only Mode
      const sheetOnlyMode = await storage.getSetting('useSheetOnly');
      
      if (sheetOnlyMode === 'true') {
        return res.status(403).json({ 
          message: "Scraping is disabled when Sheet Only Mode is active",
          sheetOnlyMode: true
        });
      }
      
      if (platform) {
        // For platform-specific scraping
        await runPlatformScraper(platform);
        res.status(200).json({ message: `${platform} scraping completed successfully` });
      } else {
        // For all platforms
        await runAllScrapers();
        res.status(200).json({ message: "Scraping completed successfully" });
      }
    } catch (error) {
      console.error("Error during scraping:", error);
      res.status(500).json({ message: "Error during scraping process" });
    }
  });

  // AI-powered offer analysis
  router.post("/analyze-offers", async (req, res) => {
    try {
      const { offers, userCards, destination } = req.body;
      
      if (!offers || !Array.isArray(offers) || !userCards || !Array.isArray(userCards)) {
        return res.status(400).json({ message: "Offers and userCards arrays are required" });
      }

      const analysisResult = await analyzeOffers(offers, userCards, destination);
      
      // Return the analyzed results
      res.json(analysisResult);
    } catch (error) {
      console.error("Error analyzing offers:", error);
      res.status(500).json({ message: "Failed to analyze offers" });
    }
  });

  // Get AI-powered travel insights
  router.post("/travel-insights", async (req, res) => {
    try {
      const { userCards, recentBookings, destination } = req.body;
      
      if (!userCards || !Array.isArray(userCards)) {
        return res.status(400).json({ message: "User cards array is required" });
      }

      const insight = await generateTravelInsight(
        userCards, 
        recentBookings || [], 
        destination
      );
      
      res.json({ insight });
    } catch (error) {
      console.error("Error generating travel insight:", error);
      res.status(500).json({ message: "Failed to generate travel insights" });
    }
  });

  // Import offers from Google Sheet
  router.post("/import-sheet", async (req, res) => {
    try {
      const { sheetUrl, useSheetOnly } = req.body;
      
      if (!sheetUrl) {
        return res.status(400).json({ message: "Google Sheet URL is required" });
      }
      
      // Pass the useSheetOnly flag to the importer
      const importedCount = await importOffersFromGoogleSheet(sheetUrl, useSheetOnly === true);
      
      // If sheet only mode was enabled, update the settings
      if (useSheetOnly === true) {
        await storage.setSetting('useSheetOnly', 'true');
      } else {
        // If previously using sheet only mode but now it's disabled
        const currentSetting = await storage.getSetting('useSheetOnly');
        if (currentSetting === 'true') {
          await storage.setSetting('useSheetOnly', 'false');
        }
      }
      
      res.status(200).json({ 
        message: useSheetOnly 
          ? "Import completed. All existing offers replaced with sheet data."
          : "Import completed successfully",
        count: importedCount 
      });
    } catch (error) {
      console.error("Error importing from Google Sheet:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message: `Error during import: ${errorMessage}` });
    }
  });

  // Get a setting
  router.get("/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      
      if (!key) {
        return res.status(400).json({ message: "Setting key is required" });
      }
      
      const value = await storage.getSetting(key);
      res.json({ key, value });
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });
  
  // Register routes
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
