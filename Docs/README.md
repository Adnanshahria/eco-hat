# Eco-Haat Project Documentation

Complete documentation for the Eco-Haat sustainable e-commerce marketplace.

## Project Overview

**Eco-Haat** is a sustainable e-commerce platform connecting eco-conscious consumers with environmentally friendly products in Bangladesh. The platform supports three user roles: **Buyers**, **Sellers**, and **Admins**.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Backend** | Express.js (Node.js) |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **ORM** | Drizzle ORM |
| **Hosting** | Vercel / GitHub Pages |

---

## Documentation Structure

```
Docs/
├── README.md                 ← You are here
├── root/                     # Root configuration files
│   ├── drizzle.config.md
│   ├── vite.config.md
│   ├── tsconfig.md
│   ├── vercel.md
│   ├── vite-plugin-meta-images.md
│   └── sql-scripts.md
├── server/                   # Backend server
│   ├── db.md
│   ├── index.md
│   ├── routes.md
│   ├── static.md
│   ├── storage.md
│   └── vite.md
├── shared/                   # Shared code
│   └── schema.md
└── client/                   # Frontend application
    ├── index.md
    └── src/
        ├── App.md
        ├── main.md
        ├── components/
        │   ├── admin-route.md
        │   ├── app-link.md
        │   ├── auth-provider.md
        │   ├── navbar.md
        │   ├── notifications.md
        │   └── ui/README.md    # 55 UI components
        ├── hooks/
        │   ├── use-mobile.md
        │   └── use-toast.md
        ├── lib/
        │   ├── cart-context.md
        │   ├── queryClient.md
        │   ├── supabase.md
        │   └── utils.md
        └── pages/
            └── README.md       # All page documentation
```

---

## Quick Links

### Configuration
- [Vite Configuration](root/vite.config.md) - Build and dev server setup
- [TypeScript Config](root/tsconfig.md) - Compiler settings
- [Drizzle Config](root/drizzle.config.md) - Database migrations
- [Vercel Config](root/vercel.md) - Deployment settings

### Database
- [Schema](shared/schema.md) - Complete database schema
- [SQL Scripts](root/sql-scripts.md) - Setup and seed scripts

### Server
- [Server Entry](server/index.md) - Express server setup
- [Routes](server/routes.md) - API endpoints
- [Database Connection](server/db.md) - PostgreSQL connection
- [Storage Layer](server/storage.md) - Data access

### Client Core
- [App.tsx](client/src/App.md) - Root React component
- [Auth Provider](client/src/components/auth-provider.md) - Authentication
- [Cart Context](client/src/lib/cart-context.md) - Shopping cart
- [Supabase Client](client/src/lib/supabase.md) - Database client

### UI & Components
- [UI Components](client/src/components/ui/README.md) - shadcn/ui library
- [Navbar](client/src/components/navbar.md) - Navigation
- [Notifications](client/src/components/notifications.md) - Notification system

### Pages
- [All Pages](client/src/pages/README.md) - Complete page documentation

---

## Architecture

### Frontend Architecture

```mermaid
graph TD
    A[main.tsx] --> B[App.tsx]
    B --> C[QueryClientProvider]
    C --> D[AuthProvider]
    D --> E[CartProvider]
    E --> F[WouterRouter]
    F --> G[Pages]
    G --> H[Components]
    H --> I[UI Library]
```

### Data Flow

```mermaid
graph LR
    A[React Components] --> B[Supabase Client]
    B --> C[PostgreSQL]
    
    D[Express Server] --> E[Drizzle ORM]
    E --> C
```

### User Roles

| Role | Access | Dashboard |
|------|--------|-----------|
| **Buyer** | Browse, cart, checkout, orders | `/profile` |
| **Seller** | Products, orders, earnings | `/seller` |
| **Admin** | Users, verifications, orders | `/admin` |
| **Super Admin** | Admin + manage other admins | `/admin` |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Environment Variables

```env
# Supabase (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...

# Database (Backend)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Key Features

### Buyer Features
- 🛒 Browse eco-friendly products
- 🔍 Search and filter by category
- 🛍️ Shopping cart with persistence
- 📦 Order tracking
- 👤 Profile management

### Seller Features
- 📝 Product management (CRUD)
- 📊 Sales analytics
- 📋 Order management
- ✅ Seller verification system
- 💰 Earnings tracking

### Admin Features
- 👥 User management
- ✓ Seller verification
- ✓ Product verification
- 📦 Order oversight
- 🔐 Admin management (super admin)

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | All users (buyers, sellers, admins) |
| `products` | Product listings |
| `categories` | Product categories |
| `orders` | Customer orders |
| `order_items` | Items within orders |
| `cart_items` | Shopping cart |
| `notifications` | User notifications |

See [Schema Documentation](shared/schema.md) for full details.

---

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### GitHub Pages
1. Build with `npm run build`
2. Deploy `/dist` to `gh-pages` branch
3. Enable GitHub Pages in repository settings

---

## Contributing

1. Create feature branch from `main`
2. Make changes with clear commits
3. Update documentation in `/Docs`
4. Submit pull request

---

## License

This project is proprietary. See LICENSE file for details.
