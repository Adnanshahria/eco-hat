-- Run this SECOND: Seed categories
-- Copy and paste this into Supabase SQL Editor after tables are created

INSERT INTO categories (name, slug, description, icon, color) VALUES
  ('Household', 'household', 'Eco-friendly household items', 'TreeDeciduous', 'bg-emerald-100'),
  ('Personal Care', 'personal-care', 'Natural personal care products', 'Droplets', 'bg-teal-100'),
  ('Kitchen', 'kitchen', 'Sustainable kitchen essentials', 'Leaf', 'bg-lime-100'),
  ('Kids and Baby', 'kids-baby', 'Safe products for children', 'Heart', 'bg-green-100'),
  ('Reusables', 'reusables', 'Reusable everyday items', 'Recycle', 'bg-emerald-100'),
  ('Garden', 'garden', 'Garden and outdoor items', 'Sun', 'bg-yellow-100')
ON CONFLICT (slug) DO NOTHING;
