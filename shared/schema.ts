import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: text("user_id").unique(), // USR/SLR/ADM-YYYYMMDD-XXX format
  username: text("username").notNull(), // User's display name or Shop Name
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull().default("buyer"),
  isSuperAdmin: boolean("is_super_admin").default(false),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  savedAddresses: jsonb("saved_addresses").default([]),

  // Seller Verification Fields
  shopLocation: text("shop_location"),
  shopType: text("shop_type"), // 'Permanent', 'Overseas', etc.
  verificationStatus: text("verification_status").default("none"), // 'none', 'pending', 'verified', 'rejected'
  identityDocuments: text("identity_documents").array(), // URLs of uploaded IDs
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"), // info, success, warning, error
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // Lucide icon name or image URL
  color: text("color"), // Tailwind class or hex
  imageUrl: text("image_url"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In BDT
  originalPrice: integer("original_price"),
  stock: integer("stock").notNull().default(0),
  categoryId: integer("category_id").references(() => categories.id),
  sellerId: integer("seller_id").references(() => users.id),
  images: text("images").array(), // Array of image URLs
  tags: text("tags").array(),
  isEcoFriendly: boolean("is_eco_friendly").default(true),
  features: jsonb("features"), // Flexible JSON for specific eco-features
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique(), // EH-YYYYMMDD-XXX format
  buyerId: integer("buyer_id").references(() => users.id),
  totalAmount: integer("total_amount").notNull(),
  subtotal: integer("subtotal"),
  deliveryCharge: integer("delivery_charge"),
  codCharge: integer("cod_charge"),
  status: text("status").notNull().default("pending"),
  denialReason: text("denial_reason"),
  phone: text("phone").notNull(),
  paymentMethod: text("payment_method").notNull().default("cod"),
  shippingAddress: jsonb("shipping_address").notNull(),
  trackingHistory: jsonb("tracking_history").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  productId: integer("product_id").references(() => products.id),
  sellerId: integer("seller_id").references(() => users.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),
  sellerEarning: integer("seller_earning"),
  itemStatus: text("item_status").default("pending"),
  denialReason: text("denial_reason"),
  options: jsonb("options"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
