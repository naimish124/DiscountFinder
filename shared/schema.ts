import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping this from original template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Offers schema
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // bus, flight, movie, etc.
  platform: text("platform").notNull(), // booking platform
  platformUrl: text("platform_url").notNull(), // URL to booking platform
  promoCode: text("promo_code").notNull(), // discount code
  minTransaction: integer("min_tx").notNull(), // minimum transaction amount
  minDiscountRs: integer("min_discount_rs"), // minimum discount amount
  maxDiscountRs: integer("max_discount_rs"), // maximum discount amount
  discountPercentage: doublePrecision("discount_percentage").notNull(), // percentage discount
  typeOfOffer: text("type_of_offer").notNull(), // bank offer, card offer, etc.
  cardType: text("card_type"), // credit card, debit card, etc.
  bankName: text("bank_name"), // bank name
  cardName: text("card_name"), // card name
  isAddon: boolean("is_addon").default(false), // can be added to other offers
  description: text("description"), // offer description
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
});

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

// Search schema for service and card details
export const offerSearchSchema = z.object({
  cardName: z.string().optional(),
  cardType: z.string().optional(),
  bankName: z.string().optional(),
  serviceType: z.string(),
});

export type OfferSearch = z.infer<typeof offerSearchSchema>;
