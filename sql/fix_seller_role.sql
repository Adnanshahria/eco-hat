-- Fix seller role for test-seller-1
-- Run this in your Supabase SQL Editor

-- First, check the current state of the user
SELECT email, role, username FROM users WHERE email LIKE '%test-seller%';

-- Update the role to seller
UPDATE users 
SET role = 'seller' 
WHERE username = 'test-seller-1' OR email LIKE '%test-seller%';

-- Verify the fix
SELECT email, role, username FROM users WHERE email LIKE '%test-seller%';
