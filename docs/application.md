# E-Commerce Application — Full Documentation

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) with Row-Level Security |
| **Auth** | Supabase Auth (admin) + Light Sign-In via localStorage (customers) |
| **Payments** | Razorpay (INR, amounts in paise) |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Editor** | Tiptap (admin CMS pages) |
| **Fonts** | Inter (sans) + Playfair Display (serif) |

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_RAZORPAY_PUBLISHABLE_KEY=your-razorpay-key
RAZORPAY_SECRET_KEY=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

---

## Database Schema

### Enums

- `user_role`: `customer | admin`
- `product_status`: `draft | active`
- `payment_status`: `pending | paid | failed | refunded`
- `fulfillment_status`: `pending | processing | shipped | delivered | cancelled`
- `coupon_type`: `percentage | fixed`

### Tables

| Table | Purpose |
|---|---|
| `profiles` | Supabase Auth user profiles with `role` column |
| `storefront_customers` | Light sign-in customers (no password, email-only) |
| `site_settings` | Site name, logo, contact info, social links, tax rate, announcement bar |
| `seo_settings` | Per-page SEO metadata, Google Analytics, Facebook Pixel |
| `hero_slides` | Homepage hero carousel slides |
| `homepage_sections` | Configurable homepage sections |
| `features` | Homepage feature highlights |
| `testimonials` | Customer testimonials |
| `categories` | Hierarchical product categories (supports `parent_id`) |
| `products` | Products with pricing, inventory tracking, SEO fields |
| `product_options` | Option types (e.g. Size, Color) |
| `product_option_values` | Individual option values |
| `product_variants` | Price/stock per combination of option values |
| `product_images` | Gallery images per product |
| `orders` | Orders with payment and fulfillment tracking |
| `order_items` | Line items per order |
| `order_timeline` | Status change history |
| `addresses` | Saved customer addresses |
| `reviews` | Product reviews with ratings |
| `wishlist` | Customer wishlist items |
| `coupons` | Discount coupons (percentage/fixed, usage limits, scope) |
| `coupon_usage` | Per-customer coupon usage tracking |
| `media` | Media library metadata |
| `pages` | CMS pages with Tiptap HTML content |
| `newsletter_subscribers` | Newsletter signups |
| `shipping_methods` | Shipping options |
| `banners` | Promotional banners |

### Indexes

- `idx_products_status` on `products(status)`
- `idx_products_category` on `products(category_id)`
- `idx_products_slug` on `products(slug)`
- `idx_products_created` on `products(created_at DESC)`
- `idx_orders_user` on `orders(user_id)`
- `idx_orders_number` on `orders(order_number)`
- `idx_orders_created` on `orders(created_at DESC)`
- `idx_order_items_order` on `order_items(order_id)`
- `idx_reviews_product` on `reviews(product_id)`

### Triggers

- `generate_order_number_trigger` — auto-generates `order_number` as `ORD-XXXXXX` before insert
- `decrement_stock` — reduces `stock_quantity` when `order_items` are inserted
- `increment_coupon` — increments `times_used` when an order uses a coupon
- `order_timeline_trigger` — creates a timeline entry when an order is created
- `update_*_updated_at` — sets `updated_at = NOW()` on row update for multiple tables

### Row-Level Security (RLS)

- `is_admin()` is a `SECURITY DEFINER` PostgreSQL function that checks `profiles.role = 'admin'`
- All admin table policies use `is_admin()` to avoid infinite recursion
- Storage buckets (`product-images`, `brand-assets`): public SELECT, authenticated INSERT/UPDATE/DELETE
- `profiles`: users can SELECT/UPDATE own row, admins can SELECT/UPDATE all

### Migration Files (apply in order)

1. `sql/migration.sql` — core schema (tables, enums, triggers, indexes, RLS)
2. `sql/pages_migration.sql` — CMS pages + homepage sections + seed data
3. `sql/fix_rls_recursion.sql` — creates `is_admin()` SECURITY DEFINER function
4. `sql/fix_storage_policies.sql` — storage bucket policies

---

## Directory Structure

```
src/
├── app/
│   ├── (storefront)/         # Public-facing pages
│   │   ├── page.tsx          # Homepage
│   │   ├── layout.tsx        # Storefront layout (Header, Footer, CartDrawer, SignInProvider)
│   │   ├── products/         # Product listing + detail
│   │   ├── cart/             # Shopping cart
│   │   ├── checkout/         # Checkout (COD + Razorpay)
│   │   ├── search/           # Product search
│   │   ├── order-confirmation/
│   │   ├── account/          # Orders, addresses, settings, wishlist
│   │   └── about, contact, faq, terms, privacy, shipping, returns
│   │
│   ├── (admin)/              # Admin panel
│   │   ├── layout.tsx        # Sidebar + auth guard
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── products/         # CRUD
│   │   ├── categories/       # Tree view
│   │   ├── orders/           # List + detail with status management
│   │   ├── customers/
│   │   ├── coupons/
│   │   ├── analytics/
│   │   ├── media/            # Supabase Storage browser
│   │   ├── seo/
│   │   ├── settings/
│   │   └── pages/            # CMS pages with Tiptap editor
│   │
│   ├── api/                  # API routes
│   │   ├── orders/           # POST (create), PATCH (payment), DELETE (delete)
│   │   ├── orders/[id]/      # GET (detail), PATCH (fulfillment)
│   │   ├── products/         # GET (public listing)
│   │   ├── create-payment-intent/  # Razorpay order creation
│   │   ├── webhooks/razorpay/      # Payment webhook handler
│   │   ├── auth/login/       # Supabase admin sign-in
│   │   ├── auth/light-signin/      # Email-only customer creation
│   │   ├── settings/         # Public site settings
│   │   └── admin/query/      # Generic admin CRUD gateway
│   │
│   └── providers.tsx         # Root provider wrapper
│
├── components/
│   ├── ui/                   # Reusable primitives
│   │   ├── button.tsx        # Variants, sizes, loading, shimmer
│   │   ├── input.tsx         # Floating label, error state
│   │   ├── modal.tsx         # Animated overlay, multiple sizes
│   │   ├── skeleton.tsx      # Loading shimmer
│   │   ├── toast.tsx         # Success/error/info/warning notifications
│   │   └── LoadingSpinner.tsx
│   │
│   ├── storefront/
│   │   ├── Header.tsx        # Sticky nav, cart badge, user menu, mobile drawer
│   │   ├── Footer.tsx        # Multi-column footer, newsletter
│   │   ├── CartDrawer.tsx    # Slide-in cart with quantity controls
│   │   ├── ProductCard.tsx   # Image, price, badges, quick-add
│   │   ├── SignInModal.tsx   # Email + name + phone + address form
│   │   ├── StarRating.tsx    # Display + interactive rating
│   │   ├── ReviewForm.tsx    # Rating + title + body
│   │   ├── QuantitySelector.tsx
│   │   └── NewsletterForm.tsx, AnnouncementBar.tsx
│   │
│   └── admin/
│       ├── ProductForm.tsx   # Full product editor (shared for new/edit)
│       ├── CategoryTree.tsx  # Hierarchical category manager
│       └── AnalyticsCharts.tsx
│
├── context/
│   ├── AuthContext.tsx       # Dual auth: Supabase + light sign-in
│   ├── CartContext.tsx       # Cart state via useReducer + localStorage
│   └── SignInContext.tsx     # Global sign-in modal trigger
│
├── hooks/
│   ├── useDebounce.ts
│   └── useAdmin.ts          # Admin data fetching via adminApi
│
├── lib/
│   ├── supabase.ts          # Supabase client (anon) + supabaseAdmin()
│   ├── razorpay.ts          # Razorpay singleton + payment intent helper
│   ├── utils.ts             # cn, formatCurrency, slugify, generateOrderNumber, etc.
│   └── admin-fetch.ts       # adminFetch() + adminApi helper
│
└── types/
    └── index.ts             # 15+ TypeScript interfaces
```

---

## Authentication System

### Dual Auth Architecture

**Admin Auth (Supabase Auth):**
- Login at `/admin/login` via `POST /api/auth/login`
- Uses standard Supabase Auth with email/password
- Admin role determined by `profiles.role = 'admin'`
- Session managed by Supabase's built-in cookie-based auth

**Customer Auth (Light Sign-In):**
- No password required — user provides email only
- Customer record upserted in `storefront_customers` table via `POST /api/auth/light-signin`
- Session stored in `localStorage` under key `storefront_session`
- `AuthContext` checks for Supabase session first, falls back to localStorage
- Visible in admin panel under "Quick Sign-In Customers"

### AuthContext API

| Method | Description |
|---|---|
| `signIn(email, password)` | Supabase Auth login |
| `signUp(email, password, fullName)` | Create Supabase account + profile |
| `signOut()` | Clear both Supabase + light sessions |
| `lightSignIn(email, fullName?, phone?, address?)` | Create/update light customer |
| `signInWithGoogle()` | OAuth via Google (if enabled in Supabase) |
| `refreshProfile()` | Re-fetch current user profile |

### State Values

| Value | Type | Description |
|---|---|---|
| `user` | `User \| null` | Supabase Auth user |
| `profile` | `Profile \| null` | Supabase profile with role |
| `lightCustomer` | `StorefrontCustomer \| null` | Light sign-in customer data |
| `loading` | `boolean` | Initial session loading |

---

## Order Flow

### Cash on Delivery (COD)

1. User fills checkout form (name, email, phone, address)
2. User selects **Cash on Delivery** as payment method
3. User clicks **Place Order**
4. If not signed in: account auto-created via `POST /api/auth/light-signin`, toast "Account created!"
5. Order created via `POST /api/orders` — inserts into `orders` + `order_items`
6. `order_number` auto-generated (e.g. `ORD-MT1G2A`)
7. Cart cleared, success toast "Order placed! Pay on delivery."
8. Redirect to `/order-confirmation/[id]`
9. Order appears in **Admin > Orders** with `payment_status: pending`

### Card Payment (Razorpay)

1-5. Same as COD up to order creation
6. `POST /api/create-payment-intent` creates Razorpay order
7. Razorpay checkout modal opens on client side
8. On success: `PATCH /api/orders` updates `payment_status: paid` + `razorpay_payment_id`
9. Cart cleared, redirect to order confirmation
10. On failure: `PATCH /api/orders` updates `payment_status: failed`
11. Webhook at `/api/webhooks/razorpay` handles `payment.captured` / `payment.failed` as backup

### Order Number Generation

Generated in `POST /api/orders` route:
```
ORD-{timestamp_base36}{random_4chars}
```
Example: `ORD-MT1G2A8B`

The database trigger `generate_order_number_trigger` can also auto-generate on direct SQL inserts.

---

## API Routes

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/orders` | `POST` | Create order with items | Service role (server-side) |
| `/api/orders` | `PATCH` | Update payment status | Service role |
| `/api/orders` | `DELETE` | Delete order (cascades items + timeline) | Service role |
| `/api/orders/[id]` | `GET` | Fetch order with items + timeline | Service role |
| `/api/orders/[id]` | `PATCH` | Update fulfillment status + notes | Service role |
| `/api/products` | `GET` | Public product listing (filters, sort, pagination) | Anon |
| `/api/create-payment-intent` | `POST` | Create Razorpay payment order | Service role |
| `/api/webhooks/razorpay` | `POST` | Handle Razorpay payment events | Webhook secret |
| `/api/auth/login` | `POST` | Admin login with role check | Anon |
| `/api/auth/light-signin` | `POST` | Create/update light customer | Service role |
| `/api/settings` | `GET` | Public site settings | Anon |
| `/api/admin/query` | `POST` | Generic admin CRUD (select/insert/update/delete/count) | RLS |

### POST /api/orders — Request Body

```json
{
  "email": "customer@example.com",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid | null",
      "variant_info": { "label": "Size M" } | null,
      "quantity": 2
    }
  ],
  "shipping_address": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "billing_address": { ... },
  "shipping_method": "Standard Shipping",
  "shipping_cost": 0,
  "coupon_code": "SAVE10" | null
}
```

### POST /api/orders — Response (201)

```json
{
  "order": {
    "id": "uuid",
    "order_number": "ORD-MT1G2A",
    "email": "customer@example.com",
    "subtotal": 99.99,
    "total": 107.99,
    "payment_status": "pending",
    "fulfillment_status": "pending",
    "created_at": "2026-06-23T..."
  }
}
```

---

## Cart System

- **Storage**: `localStorage` under key `cart`
- **State**: `useReducer` in `CartContext`
- **Features**: Add, remove, update quantity, clear
- **Persistence**: Auto-saves to localStorage on every state change
- **Max quantity**: Enforced by `max_quantity` field per item
- **Cart drawer**: Slide-in panel accessible from Header

---

## Storefront Pages

| Route | Features |
|---|---|
| `/` | Hero slider, featured products, categories grid, newsletter signup, features/testimonials |
| `/products` | Filter sidebar (categories, price range), sort, grid/list toggle, pagination, quick-add |
| `/products/[slug]` | Image gallery, sale badge, variant selector, quantity selector, description/details/shipping tabs, reviews, wishlist toggle |
| `/cart` | Item list with quantity steppers, remove, subtotal, checkout CTA |
| `/checkout` | Single-page: Contact info, Shipping Address, Payment Method (COD/card), Order Summary, Place Order |
| `/search` | Search input with filters and results grid |
| `/order-confirmation/[id]` | Success checkmark, order number, items summary, totals, address |
| `/account` | Dashboard with recent orders and profile summary |
| `/account/orders` | Order history list with status badges |
| `/account/orders/[id]` | Order detail with items, timeline, shipping info |
| `/account/addresses` | Saved addresses with add/edit |
| `/account/settings` | Profile edit form |
| `/account/wishlist` | Wishlist items with add-to-cart |
| `/about`, `/contact`, `/faq`, etc. | CMS-managed content pages |

---

## Admin Pages

| Route | Features |
|---|---|
| `/admin/dashboard` | KPI cards (revenue, orders, customers, products), revenue chart, recent orders, low-stock alerts |
| `/admin/products` | Data table with search, category/status filters, sort, pagination |
| `/admin/products/new` | Full product form: title, slug, description, pricing, images, options/variants, SEO, status |
| `/admin/products/[id]` | Edit existing product (same form, pre-populated) |
| `/admin/categories` | Tree view with add/edit/delete, parent selection |
| `/admin/orders` | Order list with status/payment filters, search by order# or email, delete with confirmation |
| `/admin/orders/[id]` | Order detail with items, customer info, fulfillment status progression, timeline, notes, tracking |
| `/admin/customers` | Registered customers (profiles) + Quick sign-in customers (storefront_customers) |
| `/admin/customers/[id]` | Customer detail with order history |
| `/admin/coupons` | CRUD: code, type, value, usage limits, min order, valid dates, product/category scope |
| `/admin/analytics` | Revenue/orders charts, top products, top categories, customer growth |
| `/admin/media` | Supabase Storage file browser with upload, delete, copy URL |
| `/admin/seo` | Per-page meta editor, GA/Facebook Pixel IDs, OG image |
| `/admin/settings` | Site name/logo, contact, social links, hero slides, homepage sections, shipping, announcement bar |
| `/admin/pages` | CMS page list with visibility toggles |
| `/admin/pages/[id]` | Tiptap rich-text editor with image upload |

---

## Key Components

### UI Components (`src/components/ui/`)

| Component | Props | Features |
|---|---|---|
| `Button` | `variant`, `size`, `loading`, `shimmer`, `asChild` | 5 variants, 3 sizes, spinner, shimmer animation |
| `Input` | `label`, `id`, `error`, `type` | Floating label, error message, forwarded ref |
| `Modal` | `isOpen`, `onClose`, `size` | Animated spring, backdrop blur, 5 sizes |
| `Toast` | (via `useToast()`) | 4 types, auto-dismiss, slide-in, stack |
| `Skeleton` | — | Shimmer loading placeholder |

### Storefront Components (`src/components/storefront/`)

| Component | Features |
|---|---|
| `Header` | Sticky, logo, nav, search toggle, cart badge, user menu, mobile drawer |
| `Footer` | Multi-column links, newsletter form, copyright |
| `CartDrawer` | Slide-in, item list, quantity stepper, remove, subtotal, checkout |
| `ProductCard` | Image, price, sale badge, rating, wishlist, quick-add |
| `SignInModal` | Email + name + phone + address form, calls `lightSignIn()` |

---

## Contexts Overview

### AuthContext
Manages dual authentication:
- Listens to Supabase `onAuthStateChange` for admin users
- Reads `storefront_session` from localStorage for light customers
- Provides `lightSignIn()` which calls `/api/auth/light-signin` and stores session

### CartContext
- `useReducer` based, persisted to `localStorage('cart')`
- Actions: `ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `CLEAR_CART`, `LOAD_CART`, `TOGGLE_CART`
- Computed: `subtotal`, `itemCount`

### SignInContext
- Renders `SignInModal` globally at the layout level
- `openSignIn()` function to trigger the modal from anywhere

---

## TypeScript Interfaces

Key interfaces defined in `src/types/index.ts`:

| Interface | Key Fields |
|---|---|
| `Profile` | id, email, full_name, role (customer\|admin) |
| `StorefrontCustomer` | id, email, full_name, phone, address |
| `SiteSettings` | site_name, tax_rate, currency, social links, announcement bar |
| `Product` | id, title, slug, price, sale_price, stock, status, tax info |
| `ProductVariant` | id, sku, price, stock, option_values (JSONB) |
| `CartItem` | id, product_id, variant_id, title, price, quantity, image, variant_label |
| `Order` | id, order_number, email, subtotal, total, payment_status, fulfillment_status |
| `OrderItem` | order_id, product_id, variant_id, title, unit_price, line_total |
| `Coupon` | code, type (percentage\|fixed), value, usage limits, scope |
| `Review` | product_id, rating, title, body, is_verified |

---

## Database Migration Files

| File | Contents | Status |
|---|---|---|
| `sql/migration.sql` | Full schema: enums, 25+ tables, triggers, indexes, RLS policies | **Apply to Supabase first** |
| `sql/pages_migration.sql` | CMS pages, homepage sections, seed data | Apply after migration.sql |
| `sql/fix_rls_recursion.sql` | Creates `is_admin()` SECURITY DEFINER function | Apply after migration.sql |
| `sql/fix_storage_policies.sql` | Storage bucket RLS policies | Apply after migration.sql |

To apply migrations, open the **Supabase Dashboard > SQL Editor** and run the files in order.

---

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm start          # Start production server
npm run lint       # Run ESLint
```

---

## Payment Integration Details

### Razorpay

- Order amount sent in **paise** (₹100 = 10000 paise)
- `payment_capture: true` for automatic capture
- Client-side `Razorpay` object opens checkout modal
- Server-side webhook at `/api/webhooks/razorpay` verifies HMAC-SHA256 signature
- Webhook events handled: `payment.captured`, `payment.failed`
- Webhook updates `payment_status` and `razorpay_payment_id` on orders

### Cash on Delivery (COD)

- No Razorpay involvement
- `payment_status` set to `pending`
- Admin can manually mark as paid in order detail page
- No `razorpay_payment_id` stored

---

## Admin CRUD Architecture

All admin data operations go through a single generic endpoint:

```
POST /api/admin/query
```

**Request body:**
```json
{
  "action": "select" | "insert" | "update" | "delete" | "count",
  "table": "table_name",
  "filters": [{ "method": "eq", "column": "id", "value": "uuid" }],
  "data": { ... },
  "options": { "limit": 20, "offset": 0 }
}
```

The `adminApi` helper in `src/lib/admin-fetch.ts` provides typed methods:
- `adminApi.select(table, filters, options)`
- `adminApi.insert(table, data)`
- `adminApi.update(table, data, filters)`
- `adminApi.delete(table, filters)`
- `adminApi.count(table, filters)`

---

## Design Decisions

1. **Dual Auth**: Supabase Auth for admin, localStorage-based light sign-in for customers — no password friction for quick checkout
2. **Single Admin API Gateway**: All admin operations route through `/api/admin/query` secured by RLS's `is_admin()` function
3. **Client-Side Cart**: Cart lives in `localStorage` via `CartContext` — no server-side persistence for anonymous carts
4. **Server-Side Order Creation**: `POST /api/orders` uses the service role key for full access to validate products, check stock, apply coupons, and compute totals server-side
5. **Auto Account Creation**: During checkout, an account is automatically created from the user's email — no separate sign-up step
6. **COD vs Card**: COD bypasses Razorpay entirely; Card goes through full payment flow with webhook callback
7. **Order Deletion**: `DELETE /api/orders` cascades to `order_items` and `order_timeline` via DB foreign key constraints
