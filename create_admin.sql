-- =====================================================
-- ADD SUPER ADMIN COLUMN TO USERS TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add is_super_admin column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- =====================================================
-- CREATE YOUR FIRST SUPER ADMIN
-- =====================================================

-- STEP 1: Register at /auth with your email (as buyer or seller)
-- STEP 2: Run this SQL to make yourself the super admin:

UPDATE users 
SET role = 'admin', is_super_admin = TRUE 
WHERE email = 'your-email@example.com';  -- ← CHANGE THIS TO YOUR EMAIL

-- =====================================================
-- VERIFY SUPER ADMIN EXISTS
-- =====================================================
SELECT id, username, email, role, is_super_admin FROM users WHERE is_super_admin = TRUE;

-- =====================================================
-- ROLE HIERARCHY
-- =====================================================
-- buyer       → Can browse & purchase products
-- seller      → Can sell products, manage their store
-- admin       → Can manage users, products, orders (but NOT add other admins)
-- super_admin → Same as admin + can add/remove other admins
