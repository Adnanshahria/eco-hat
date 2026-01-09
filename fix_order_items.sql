-- =====================================================
-- FIX: Add missing columns to order_items table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- Add seller_id column (links order items to sellers)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add item_status column (for seller accept/deny workflow)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS item_status TEXT DEFAULT 'pending';

-- Add seller_earning column (calculated seller revenue per item)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS seller_earning INTEGER;

-- Add denial_reason column (for when seller denies an order)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS denial_reason TEXT;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;
