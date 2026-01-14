# SQL Scripts Documentation

## Overview

This document covers all SQL scripts used for database setup, seeding, and administrative tasks in the Eco-Haat project. These scripts are designed to run in the **Supabase SQL Editor**.

---

## setup_database.sql

### High-Level Summary

The main database setup script that creates all required tables, seeds initial categories, and provides admin setup instructions.

### Tables Created

#### `users`
Primary user table supporting all roles (buyer, seller, admin).

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | TEXT | Custom ID format (USR/SLR/ADM-YYYYMMDD-XXX) |
| `username` | TEXT | Display name or shop name |
| `email` | TEXT | Unique email address |
| `phone` | TEXT | Contact phone number |
| `role` | TEXT | User role: 'buyer', 'seller', 'admin' |
| `is_super_admin` | BOOLEAN | Super admin privileges flag |
| `full_name` | TEXT | User's full name |
| `avatar_url` | TEXT | Profile picture URL |
| `bio` | TEXT | User biography |
| `saved_addresses` | JSONB | Array of saved shipping addresses |
| `shop_location` | TEXT | Seller's shop location |
| `shop_type` | TEXT | Shop type: 'Permanent', 'Overseas', etc. |
| `verification_status` | TEXT | Seller status: 'none', 'pending', 'verified', 'rejected' |
| `identity_documents` | TEXT[] | Array of document URLs |
| `rejection_reason` | TEXT | Reason if verification rejected |
| `termination_reason` | TEXT | Reason if account terminated |
| `appeal_text` | TEXT | Seller's appeal text |
| `created_at` | TIMESTAMP | Account creation timestamp |

#### `notifications`
User notification system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | INTEGER | FK to users.id |
| `title` | TEXT | Notification title |
| `message` | TEXT | Notification body |
| `type` | TEXT | Type: 'info', 'success', 'warning', 'error' |
| `read` | BOOLEAN | Read status |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `categories`
Product categories for the marketplace.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | TEXT | Category name (unique) |
| `slug` | TEXT | URL-friendly slug (unique) |
| `description` | TEXT | Category description |
| `icon` | TEXT | Lucide icon name |
| `color` | TEXT | Tailwind color class |
| `image_url` | TEXT | Category image |

#### `products`
Marketplace products.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | TEXT | Product name |
| `description` | TEXT | Product description |
| `price` | INTEGER | Price in BDT |
| `original_price` | INTEGER | Original price (for discounts) |
| `stock` | INTEGER | Available quantity |
| `category_id` | INTEGER | FK to categories.id |
| `seller_id` | INTEGER | FK to users.id |
| `images` | TEXT[] | Array of image URLs |
| `tags` | TEXT[] | Product tags |
| `is_eco_friendly` | BOOLEAN | Eco-friendly flag |
| `features` | JSONB | Product features JSON |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `orders`
Customer orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `order_number` | TEXT | Format: EH-YYYYMMDD-XXX |
| `buyer_id` | INTEGER | FK to users.id |
| `total_amount` | INTEGER | Total order amount in BDT |
| `subtotal` | INTEGER | Subtotal before charges |
| `delivery_charge` | INTEGER | Delivery fee |
| `cod_charge` | INTEGER | Cash on delivery fee |
| `status` | TEXT | Order status |
| `denial_reason` | TEXT | Reason if order denied |
| `phone` | TEXT | Contact phone |
| `payment_method` | TEXT | Payment type |
| `shipping_address` | JSONB | Shipping address object |
| `tracking_history` | JSONB | Array of tracking events |
| `created_at` | TIMESTAMP | Order timestamp |

#### `order_items`
Individual items within an order.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `order_id` | INTEGER | FK to orders.id |
| `product_id` | INTEGER | FK to products.id |
| `seller_id` | INTEGER | FK to users.id |
| `quantity` | INTEGER | Item quantity |
| `price_at_purchase` | INTEGER | Price when purchased |
| `seller_earning` | INTEGER | Seller's portion |
| `item_status` | TEXT | Item-specific status |
| `denial_reason` | TEXT | Denial reason |
| `options` | JSONB | Selected product options |
| `created_at` | TIMESTAMP | Timestamp |

#### `cart_items`
Shopping cart items.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | INTEGER | FK to users.id |
| `product_id` | INTEGER | FK to products.id |
| `quantity` | INTEGER | Quantity in cart |
| `created_at` | TIMESTAMP | Added timestamp |

---

## create_admin.sql

### Purpose
Creates the first super admin user for the platform.

### Steps
1. Adds `is_super_admin` column if missing
2. Updates a user's role to admin with super admin privileges

### Role Hierarchy

| Role | Capabilities |
|------|--------------|
| `buyer` | Browse & purchase products |
| `seller` | Sell products, manage store |
| `admin` | Manage users, products, orders |
| `super_admin` | All admin powers + manage other admins |

### Usage
```sql
-- Replace with your email after registering
UPDATE users 
SET role = 'admin', is_super_admin = TRUE 
WHERE email = 'your-email@example.com';
```

---

## fix_seller_role.sql

### Purpose
Utility script to fix user role issues, specifically for updating a user to seller role.

### Usage
```sql
-- Update role to seller
UPDATE users 
SET role = 'seller' 
WHERE username = 'test-seller-1' OR email LIKE '%test-seller%';
```

---

## seed_categories.sql

### Purpose
Seeds the initial eco-friendly product categories.

### Categories Seeded

| Name | Slug | Icon | Color |
|------|------|------|-------|
| Household | household | TreeDeciduous | bg-emerald-100 |
| Personal Care | personal-care | Droplets | bg-teal-100 |
| Kitchen | kitchen | Leaf | bg-lime-100 |
| Kids and Baby | kids-baby | Heart | bg-green-100 |
| Reusables | reusables | Recycle | bg-emerald-100 |
| Garden | garden | Sun | bg-yellow-100 |

### Conflict Handling
Uses `ON CONFLICT (slug) DO NOTHING` to safely skip duplicates.

---

## Notes

> [!IMPORTANT]
> Run `setup_database.sql` first before any other scripts. It creates all required tables.

> [!WARNING]
> Always backup your database before running administrative scripts like `create_admin.sql`.

> [!TIP]
> You can run these scripts in the Supabase SQL Editor at `https://supabase.com/dashboard/project/[PROJECT_ID]/sql`.
