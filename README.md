# STORE — Premium Full-Stack E-Commerce Platform

A production-grade e-commerce platform built with Next.js 16, TypeScript, Tailwind CSS, Framer Motion, Supabase, and Razorpay.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Backend/Database**: Supabase (Auth, PostgreSQL, Storage)
- **Payments**: Razorpay
- **Charts**: Recharts
- **Editor**: TipTap (rich text)
- **Icons**: Lucide React

## Features

### Storefront
- Responsive, premium UI with Apple/Aesop-level design
- Animated page transitions, scroll-triggered reveals, micro-interactions
- Hero carousel with auto-rotation
- Product catalog with categories, filters, sorting, and search
- Product detail pages with image galleries, variant selectors, reviews
- Cart drawer with animations, coupon support
- Multi-step checkout with Razorpay payment integration
- User accounts: auth, orders, addresses, wishlist, settings
- Newsletter signup, contact form, FAQ, policy pages

### Admin Panel
- Dashboard with KPI cards, revenue charts, order/stock alerts
- Product management with rich editor, media upload, variants
- Category management with nested tree view
- Order management with timeline, status updates, tracking
- Customer management with order history
- Coupon/discount management
- Site settings (brand, social, shipping, tax, hero slides)
- SEO management (meta, GA, GSC, sitemap)
- Media library
- Analytics dashboard

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- A Razorpay account (test mode)

### Setup

1. **Clone and install**

```bash
npm install
```

2. **Environment variables**

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_RAZORPAY_PUBLISHABLE_KEY=your-razorpay-key-id
RAZORPAY_SECRET_KEY=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

3. **Database setup**

Run the migration file `sql/migration.sql` in your Supabase SQL editor to create all tables, indexes, RLS policies, and triggers.

4. **Create admin user**

```sql
-- After signing up via the app, run this in Supabase SQL editor:
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

5. **Start development**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the storefront.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (storefront)/    # Public pages (layout, home, products, cart, checkout, account...)
│   ├── (admin)/         # Admin panel (layout, dashboard, products, orders...)
│   └── api/             # API routes (razorpay, orders, products...)
├── components/
│   ├── ui/              # Design system (Button, Input, Modal, Toast, Skeleton)
│   ├── storefront/      # Header, Footer, ProductCard, CartDrawer, etc.
│   └── admin/           # AdminSidebar, DataTable, StatCard, etc.
├── context/             # CartContext, AuthContext
├── hooks/               # useDebounce, etc.
├── lib/                 # supabase client, razorpay, utils
└── types/               # TypeScript interfaces
```

## Deployment

Deploy to Vercel:

```bash
npx vercel --prod
```

Set all environment variables in Vercel's dashboard. No additional configuration needed.
"# E-Commerce" 
