-- Add new columns to platforms table
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Update platform_offers table
ALTER TABLE platform_offers ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE platform_offers ADD COLUMN IF NOT EXISTS min_amount INTEGER;
ALTER TABLE platform_offers ADD COLUMN IF NOT EXISTS max_discount INTEGER;
ALTER TABLE platform_offers ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE platform_offers ADD COLUMN IF NOT EXISTS terms TEXT;

-- Rename columns for compatibility
ALTER TABLE platform_offers RENAME COLUMN terms_and_conditions TO terms;
ALTER TABLE platform_offers RENAME COLUMN minimum_order_amount TO min_amount;