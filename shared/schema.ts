import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Settings table to store application configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Card model
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // credit or debit
  bank: text("bank").notNull(),
});

// Platform model
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url").notNull(),
  category: text("category").notNull(), // e.g., "bus", "flight", "hotel", etc.
  websiteUrl: text("website_url"),  // URL to the platform website
});

// Platform Offers model
export const platformOffers = pgTable("platform_offers", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  title: text("title"),  // Short title for the offer
  discountPercentage: integer("discount_percentage").notNull(),
  minimumOrderAmount: integer("minimum_order_amount"), // Legacy column
  minAmount: integer("min_amount"),  // Minimum amount required for the offer
  maxDiscount: integer("max_discount"),  // Maximum discount cap
  code: text("code"),  // Promo code
  description: text("description").notNull(),
  termsAndConditions: text("terms_and_conditions"), // Legacy column
  expiryDate: timestamp("expiry_date"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Card Offers model
export const cardOffers = pgTable("card_offers", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  cardBank: text("card_bank").notNull(), // The bank that offers this discount
  cardName: text("card_name"), // Specific card name or null for all cards of the bank
  cardType: text("card_type"), // "credit" or "debit" or null for both
  discountPercentage: integer("discount_percentage").notNull(),
  minimumOrderAmount: integer("minimum_order_amount"),
  description: text("description").notNull(),
  termsAndConditions: text("terms_and_conditions"),
  expiryDate: timestamp("expiry_date"),
});

// Define relations
export const platformsRelations = relations(platforms, ({ many }) => ({
  platformOffers: many(platformOffers),
  cardOffers: many(cardOffers),
}));

export const platformOffersRelations = relations(platformOffers, ({ one }) => ({
  platform: one(platforms, {
    fields: [platformOffers.platformId],
    references: [platforms.id],
  }),
}));

export const cardOffersRelations = relations(cardOffers, ({ one }) => ({
  platform: one(platforms, {
    fields: [cardOffers.platformId],
    references: [platforms.id],
  }),
}));

// Schemas for insertion with validation
export const insertCardSchema = createInsertSchema(cards).pick({
  name: true,
  type: true,
  bank: true,
});

export const insertPlatformSchema = createInsertSchema(platforms);
export const insertPlatformOfferSchema = createInsertSchema(platformOffers);
export const insertCardOfferSchema = createInsertSchema(cardOffers);

// Add setting schema
export const insertSettingSchema = createInsertSchema(settings);

// Types for TS
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;

export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;

export type PlatformOffer = typeof platformOffers.$inferSelect;
export type InsertPlatformOffer = z.infer<typeof insertPlatformOfferSchema>;

export type CardOffer = typeof cardOffers.$inferSelect;
export type InsertCardOffer = z.infer<typeof insertCardOfferSchema>;

// Type for combined offer calculation result
export type CombinedOffer = {
  platform: Platform;
  platformOffer: PlatformOffer;
  cardOffer: CardOffer | null;
  totalDiscountPercentage: number;
  applicableCard: Card | null;
  estimatedSavings?: number;
};
