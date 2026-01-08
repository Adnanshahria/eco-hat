-- =====================================================
-- 1. DATABASE SETUP (TABLES)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'buyer',
    is_super_admin BOOLEAN DEFAULT FALSE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    saved_addresses JSONB DEFAULT '[]'::jsonb,
    
    -- Seller Verification Fields
    shop_location TEXT,
    shop_type TEXT,
    verification_status TEXT DEFAULT 'none',
    identity_documents TEXT[],
    rejection_reason TEXT,
    termination_reason TEXT,
    appeal_text TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    stock INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    images TEXT[],
    tags TEXT[],
    is_eco_friendly BOOLEAN DEFAULT TRUE,
    features JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT UNIQUE,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount INTEGER NOT NULL,
    subtotal INTEGER,
    delivery_charge INTEGER,
    cod_charge INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    denial_reason TEXT,
    phone TEXT,
    payment_method TEXT DEFAULT 'cod',
    shipping_address JSONB,
    tracking_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase INTEGER NOT NULL,
    seller_earning INTEGER,
    item_status TEXT DEFAULT 'pending',
    denial_reason TEXT,
    options JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. SEED DATA (CATEGORIES)
-- =====================================================

INSERT INTO categories (name, slug, description, icon, color) VALUES
    ('Household', 'household', 'Eco-friendly household items', 'TreeDeciduous', 'bg-emerald-100'),
    ('Personal Care', 'personal-care', 'Natural personal care products', 'Droplets', 'bg-teal-100'),
    ('Kitchen', 'kitchen', 'Sustainable kitchen essentials', 'Leaf', 'bg-lime-100'),
    ('Kids and Baby', 'kids-baby', 'Safe products for children', 'Heart', 'bg-green-100'),
    ('Reusables', 'reusables', 'Reusable everyday items', 'Recycle', 'bg-emerald-100'),
    ('Garden', 'garden', 'Garden and outdoor items', 'Sun', 'bg-yellow-100')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 3. ADMIN SETUP INSTRUCTIONS
-- =====================================================

-- Add is_super_admin column if not exists (redundant with CREATE TABLE but safe to keep for migrations)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

/* 
-- UNCOMMENT AND RUN THIS SECTION TO MAKE YOURSELF ADMIN
-- Replace 'your-email@example.com' with your actual email

UPDATE users 
SET role = 'admin', is_super_admin = TRUE 
WHERE email = 'your-email@example.com';
*/

-- Check admins
-- SELECT id, username, email, role, is_super_admin FROM users WHERE is_super_admin = TRUE;
