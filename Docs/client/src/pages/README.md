# Pages Documentation

This directory contains all **page components** for the Eco-Haat application, organized by user role.

## Directory Structure

```
pages/
├── admin/                    # Admin-only pages
│   ├── dashboard.tsx         # Main admin dashboard
│   ├── product-verification.tsx  # Product review page
│   └── seller-verification.tsx   # Seller review page
├── customer/                 # Customer pages
│   ├── cart.tsx             # Shopping cart
│   ├── checkout.tsx         # Checkout flow
│   ├── order-confirmation.tsx # Order success
│   ├── orders.tsx           # Order history
│   ├── product-detail.tsx   # Product page
│   ├── profile.tsx          # User profile
│   └── shop.tsx             # Product listing
├── seller/                   # Seller pages
│   ├── add-product.tsx      # Create product
│   ├── dashboard.tsx        # Seller dashboard
│   └── profile.tsx          # Seller profile
├── auth.tsx                 # Login/Register
├── fix-db.tsx               # Database utilities
├── home.tsx                 # Landing page
├── not-found.tsx            # 404 page
├── privacy-policy.tsx       # Privacy policy
├── shop-profile.tsx         # Public shop view
└── terms-of-service.tsx     # Terms of service
```

---

## Page Summaries

### Public Pages

#### `home.tsx` (30KB, 482 lines)
The **landing page** showcasing the EcoHaat platform.

**Features**:
- Hero section with animated elements
- Category grid with product counts
- Featured products carousel
- Customer testimonials
- Newsletter subscription
- Statistics section (impact numbers)

**Key Functions**:
- `handleSubscribe()` - Newsletter signup to Supabase

---

#### `auth.tsx` (16KB, 304 lines)
**Authentication page** for login and registration.

**Features**:
- Login/Register mode toggle
- Role selection (Buyer/Seller/Admin)
- Email/password form
- Password strength indicator
- Animated transitions

**Key Functions**:
- `generateUserId(role)` - Creates formatted user IDs (USR-YYYYMMDD-XXX)
- `handleSubmit()` - Sign up or sign in
- `redirectByRole()` - Navigate after auth

**User ID Format**:
| Role | Prefix | Example |
|------|--------|---------|
| Buyer | USR | USR-20260114-A2F |
| Seller | SLR | SLR-20260114-X9K |
| Admin | ADM | ADM-20260114-M3P |

---

#### `not-found.tsx` (732 bytes)
Simple **404 error page** with back-to-home link.

---

#### `privacy-policy.tsx` / `terms-of-service.tsx`
Static **legal pages** with formatted policy content.

---

### Customer Pages

#### `shop.tsx` (18KB)
**Product browsing page** with filtering and search.

**Features**:
- Category filter sidebar
- Search functionality
- Product grid
- Price filtering
- Sort options

---

#### `product-detail.tsx` (23KB)
**Single product page** with purchase options.

**Features**:
- Image gallery
- Product info (name, price, description)
- Quantity selector
- Add to cart
- Seller info
- Reviews section

---

#### `cart.tsx` (9.5KB)
**Shopping cart page** with item management.

**Features**:
- Cart item list
- Quantity adjustments
- Remove items
- Price summary
- Proceed to checkout

---

#### `checkout.tsx` (23KB)
**Checkout flow** with shipping and payment.

**Features**:
- Shipping address form
- Saved address selection
- Payment method selection
- Order summary
- Place order action

---

#### `order-confirmation.tsx` (7KB)
**Order success page** with order details.

---

#### `orders.tsx` (14KB)
**Order history page** with tracking.

**Features**:
- Order list with status badges
- Order details expansion
- Tracking history
- Cancel order option

---

#### `profile.tsx` (31KB)
**Customer profile page** with settings.

**Features**:
- Profile information
- Avatar upload
- Saved addresses management
- Order history link
- Account settings

---

### Seller Pages

#### `seller/dashboard.tsx` (52KB, 783 lines)
**Main seller dashboard** - the largest and most complex page.

**Features**:
- Stats overview (products, orders, earnings)
- Product management with CRUD
- Order management (accept/deny/ship)
- Seller verification application
- Appeal system for rejected sellers
- Account settings

**Key Types**:
```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  images: string[] | null;
  status: "approved" | "pending" | "rejected";
}

interface OrderItem {
  id: number;
  quantity: number;
  price_at_purchase: number;
  seller_earning: number;
  item_status: string;
  order: { ... };
  product: { name: string };
}

interface Stats {
  totalProducts: number;
  pendingOrders: number;
  confirmedOrders: number;
  totalEarnings: number;
  pendingEarnings: number;
  productStats: { approved, pending, rejected };
}
```

**Key Functions**:
- `fetchData()` - Load all seller data
- `handleUpdateProfile()` - Update profile info
- `submitVerification()` - Submit for seller verification
- `submitAppeal()` - Appeal rejected status
- `acceptOrder()` / `denyOrder()` - Handle orders
- `updateToShipped()` - Mark order as shipped
- `deleteProduct()` - Remove a product

---

#### `seller/add-product.tsx` (25KB)
**Product creation page** with full form.

**Features**:
- Multi-step form
- Image upload to Supabase Storage
- Category selection
- Price and stock fields
- Tags and features
- Eco-certification selection

---

#### `seller/profile.tsx` (16KB)
**Seller profile management** page.

---

### Admin Pages

#### `admin/dashboard.tsx` (44KB, 663 lines)
**Main admin dashboard** for platform management.

**Features**:
- Platform statistics
- User management (role changes, bans)
- Seller verification queue
- Product verification queue
- Order oversight
- Admin management (super admin only)

**Key Types**:
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_super_admin: boolean;
  verification_status: string;
  shop_type: string;
  identity_documents: string[];
  termination_reason: string;
  appeal_text: string;
}

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalSellers: number;
  totalAdmins: number;
  pendingVerifications: number;
  pendingProductVerifications: number;
}
```

**Key Functions**:
- `fetchData()` - Load all admin data
- `verifyProduct()` - Approve/reject product
- `updateRole()` - Change user role
- `updateOrderStatus()` - Manage order status
- `verifySeller()` - Approve/reject seller
- `terminateSeller()` - Ban seller with reason
- `unbanSeller()` - Restore seller access
- `promoteToAdmin()` / `demoteAdmin()` - Admin management (super admin)
- `inviteAdmin()` - Create new admin (super admin)

---

#### `admin/seller-verification.tsx` (15KB)
**Detailed seller verification page** for individual review.

**Features**:
- Seller details display
- Document viewer
- Shop information
- Approve/Reject with reason

---

#### `admin/product-verification.tsx` (26KB)
**Detailed product verification page** for individual review.

**Features**:
- Product details display
- Image gallery
- Seller information
- Approve/Reject with reason

---

### Utility Pages

#### `fix-db.tsx` (9KB)
**Database debugging page** for admins.

**Features**:
- View database state
- Run diagnostic queries
- Fix common issues

---

#### `shop-profile.tsx` (17KB)
**Public shop page** showing a seller's products.

**Features**:
- Seller info header
- Product grid
- Contact information
- Reviews

---

## Common Patterns

### Data Fetching
All pages use the pattern:
```typescript
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("table").select("*");
    if (data) setState(data);
    setLoading(false);
  };
  fetchData();
}, [dependencies]);
```

### Loading States
```typescript
if (loading) {
  return <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="animate-spin" />
  </div>;
}
```

### Role-Based Access
Admin pages wrap content in `<AdminRoute>`, seller pages check `useAuth().userRole`.

---

## Notes

> [!TIP]
> The seller dashboard is the most complex component. Consider breaking it into smaller subcomponents.

> [!NOTE]
> Most pages fetch data directly from Supabase rather than using the Express API.

> [!IMPORTANT]
> Customer pages require authentication for checkout and profile, but browsing is public.
