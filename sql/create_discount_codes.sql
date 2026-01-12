-- ============================================
-- DISCOUNT CODES SYSTEM FOR ECO-HAAT
-- Run this in Supabase SQL Editor
-- ============================================

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
    discount_value NUMERIC DEFAULT 0,
    max_discount NUMERIC,  -- Maximum discount amount for percentage discounts (e.g., 10% off, max ৳500)
    min_order_amount NUMERIC DEFAULT 0,
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product')),
    applies_to_ids INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS public.discount_code_uses (
    id SERIAL PRIMARY KEY,
    code_id INTEGER REFERENCES public.discount_codes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id),
    order_id INTEGER REFERENCES public.orders(id),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for simplicity
ALTER TABLE public.discount_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_code_uses DISABLE ROW LEVEL SECURITY;

-- Create index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_code_uses_code_user ON public.discount_code_uses(code_id, user_id);

-- Insert a sample discount code for testing
INSERT INTO public.discount_codes (code, description, discount_type, discount_value, min_order_amount, max_uses, valid_until, is_active)
VALUES ('ECOFIRST10', 'First order 10% discount', 'percentage', 10, 200, 100, NOW() + INTERVAL '30 days', true)
ON CONFLICT (code) DO NOTHING;
