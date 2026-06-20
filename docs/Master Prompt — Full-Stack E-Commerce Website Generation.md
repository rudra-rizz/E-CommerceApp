# Master Prompt — Full-Stack E-Commerce Website Generation

> Copy and paste this entire prompt into your AI IDE. It is structured in sections so the AI treats each area with equal priority. 

\---

## \## THE PROMPT

``` 

You are building a production-grade, fully functional e-commerce platform. The tech stack is strictly: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, Supabase (Auth + Database + Storage), and Razorpay for payments. The project must be deployable to Vercel with zero configuration issues. 

This is NOT a template or mockup. Every feature must be wired to Supabase and fully functional. 

--- 

## ## SECTION 1 — UI DESIGN SYSTEM (HIGHEST PRIORITY) 

The UI must look like it was designed by a top-tier design agency (think: Apple Store, Rapha, Aesop, Mr Porter). Follow these rules with zero exceptions: 

## ### Typography 

- Use Inter for body text and a premium serif font (Playfair Display or DM Serif Display) for hero headings and product titles. 

- Font sizes: Hero headings 56–72px, Section headings 36–44px, Product titles 18–22px, Body text 15–16px, Captions/labels 12–13px in uppercase tracked-out (letter-spacing: 0.1em). 

- Line height: 1.2 for headings, 1.6 for body text. Never use default line heights. 

## ### Color Palette 

- Primary background: #FAFAFA (warm off-white). Secondary background: #F5F5F0 (cream). 

- Primary text: #1A1A1A. Secondary text: #6B6B6B. 

- Accent color: #2563EB (deep blue) — used only for CTAs, links, and active states. 

- Destructive/sale: #DC2626. Success: #16A34A. 

- All cards and containers must use background #FFFFFF with a subtle border (border: 1px solid rgba(0,0,0,0.06)) and a refined shadow (shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)). 

## ### Spacing \& Layout 

- Use an 8px grid system. All padding, margins, and gaps must be multiples of 8 (8, 16, 24, 32, 48, 64, 80, 120). 

- Maximum content width: 1440px, centered. Horizontal page padding: 64px on desktop, 24px on mobile. 

- Section vertical padding: 80–120px. Never less than 64px between major sections. 

- Product grid: 4 columns on desktop, 2 on mobile. Grid gap: 24px. No masonry layouts. 

### Micro-Interactions \& Animations (Framer Motion) Every interaction must feel tactile and premium. Implement all of the following: 

1. \*\*Page transitions\*\*: Wrap the entire app in AnimatePresence. Pages fade in (opacity 0→1) and slide up (y: 20→0) over 0.4s with ease \[0.25, 0.1, 0.25, 1]. 

2. \*\*Product card hover\*\*: On hover, the product image scales to 1.05 over 0.5s with cubic-bezier(0.4, 0, 0.2, 1). A secondary lifestyle image crossfades in (opacity swap). The "Quick Add" button slides up from below the card (y: 20→0, opacity 0→1) with a staggered 0.1s delay. 

3. \*\*Add-to-cart effect\*\*: When a user clicks "Add to Cart", animate a ghost image of the product (position: fixed, cloned from the product image) that flies in a bezier arc toward the cart icon in the header. The ghost image should scale from 1→0.2, rotate slightly (rotate: 10deg), and fade out at the end. Simultaneously, the cart icon should do a spring bounce (scale 1→1.3→1, type: "spring", stiffness: 400). A small "+1" badge should pop in with a scale animation. Use Framer Motion's useAnimation controller for this orchestration. 

4. \*\*Button interactions\*\*: All buttons scale to 0.97 on press (whileTap), have a 0.2s background-color transition on hover. Primary CTA buttons have a subtle shimmer/gradient sweep animation on hover (background-position shift on a linear-gradient). 

5. \*\*Scroll-triggered reveals\*\*: Every section, product card, and text block should animate in on scroll using Framer Motion's whileInView. Use staggerChildren: 0.08 for grid items. Animation: fade up (opacity 0→1, y: 30→0) over 0.6s. 

6. \*\*Cart drawer\*\*: Opens from the right as a slide-over panel (x: 100%→0) with a backdrop blur overlay that fades in. Cart items inside stagger in (staggerChildren: 0.05). Removing an item should animate it out (opacity→0, height→0, x→50) before removal. 

7. \*\*Image gallery on PDP\*\*: Main image crossfades between selections (AnimatePresence mode="wait"). Thumbnail click triggers a subtle scale pulse on the main image. Implement pinch-to-zoom on mobile. 

8. \*\*Skeleton loading states\*\*: Every dynamic content area must show animated skeleton placeholders (shimmer gradient animation using CSS background-position) before data loads. Never show blank space or layout shift. 

9. \*\*Toast notifications\*\*: Slide in from top-right, auto-dismiss after 3s with a shrinking progress bar at the bottom. Entrance: slide from right + fade. Exit: slide to right + fade. 10. \*\*Navigation\*\*: Sticky header that shrinks in height (80px→60px) on scroll with a subtle backdrop-blur and bottom border that fades in. Mobile menu is a full-screen overlay that fades in with staggered nav links animating from the left. 

## ### Component Quality Rules 

- All images must use next/image with proper aspect ratios, priority loading for above-fold, and blur placeholders. 

- Buttons must have visible focus-visible outlines (2px offset ring in accent color) for accessibility. 

- Inputs must have floating labels that animate up on focus (not placeholder text). 

- Every clickable element must have cursor-pointer and a hover/active state. 

- Mobile responsiveness is mandatory. Test every component at 375px, 768px, and 1440px widths. 

- Empty states must have illustrations and helpful CTAs (e.g., empty cart shows illustration + "Continue Shopping" button). 

- Use <motion.div> from Framer Motion, not CSS animations, for all animated UI. CSS transitions are acceptable only for color/background changes. 

--- 

## ## SECTION 2 — STOREFRONT PAGES \& FEATURES 

## ### Homepage 

- \*\*Hero Section\*\*: Full-width lifestyle image with overlay text. Animated headline with word-by-word stagger reveal. CTA button with shimmer effect. Auto-rotating carousel of 3–4 hero slides with progress indicators. 

- \*\*Featured Categories\*\*: Horizontal scrollable row of category cards with hover zoom on images. 

- \*\*New Arrivals\*\*: Product grid (4 columns) with "NEW" badge animation (pulse). Pulled from Supabase, filtered by created\_at descending. 

- \*\*Best Sellers\*\*: Product grid sorted by total orders count from Supabase. 

- \*\*Promotional Banner\*\*: Full-width gradient banner with countdown timer (if sale is active 

- pulled from Supabase admin settings). 

- \*\*Newsletter Signup\*\*: Email input with animated submit button. Store submissions in Supabase "subscribers" table. 

- \*\*Trust Badges / Testimonials\*\*: Animated infinite horizontal scroll of trust icons. Testimonial cards from Supabase. 

- \*\*Instagram/Social Feed Section\*\*: Grid of lifestyle images (uploaded via admin). 

- \*\*Footer\*\*: Multi-column with brand logo (dynamic from admin), navigation links, social icons, payment method icons, and copyright. All links functional. 

## ### Product Listing Page (PLP) 

- \*\*Filters sidebar\*\* (desktop) / bottom sheet (mobile): Filter by category, price range 

(dual-thumb slider), color, size, rating, availability. All filters query Supabase in real-time with URL search params for shareable filtered URLs. 

- \*\*Sort dropdown\*\*: Price low-high, high-low, newest, best-selling, rating. 

- \*\*Product count\*\* and \*\*active filter chips\*\* with remove (×) animation. 

- \*\*Infinite scroll\*\* or "Load More" button with loading spinner. 

- \*\*Quick view modal\*\*: Opens product details in a centered modal (scale 0.95→1 + fade) without page navigation. Includes image, price, size selector, and add-to-cart. 

## ### Product Detail Page (PDP) 

- \*\*Breadcrumb navigation\*\* with links. 

- \*\*Image gallery\*\*: Large main image on left. Thumbnail strip below or to the side. Click to swap with crossfade. Support for 5+ images. Zoom on hover (desktop). 

- \*\*Product info\*\*: Title (serif font), price (with strikethrough for sale), star rating (from Supabase reviews), short description, SKU. 

- \*\*Variant selectors\*\*: Color swatches (circles with checkmark animation on select, bordered), size selector (pill buttons with out-of-stock shown as crossed out and disabled). 

- \*\*Quantity selector\*\*: Styled increment/decrement with min 1 and max = stock count. 

- \*\*Add to Cart button\*\*: Full-width, large, with the flying-image animation described above. Disable and show "Out of Stock" when stock = 0. 

- \*\*Accordion sections\*\* below: Description, Specifications (table), Shipping \& Returns, Reviews. Smooth height animation on open/close. 

- \*\*Customer Reviews section\*\*: Star breakdown bar chart, individual review cards with verified badge, pagination. Submit review form (star rating selector + text area) — store in Supabase "reviews" table. 

- \*\*Related Products\*\*: Horizontal scrollable product cards. 

## ### Cart Page / Cart Drawer 

- Slide-over drawer from the right (primary interaction) + dedicated /cart page. 

- Each item shows: product image, title, selected variant, unit price, quantity adjuster, line total, remove button. 

- \*\*Coupon/promo code input\*\* with "Apply" button. Validate against Supabase "coupons" table. 

- \*\*Order summary\*\*: Subtotal, discount, estimated shipping, tax, total. All calculated properly. 

- \*\*"Proceed to Checkout" CTA\*\* with the shimmer animation. 

- Empty cart state with illustration. 

## ### Checkout Page 

- \*\*Multi-step checkout\*\*: Shipping → Payment → Review. Animated step indicator with progress bar. 

- \*\*Shipping form\*\*: Name, email, phone, address (line 1, line 2, city, state/province, zip, country). Floating label inputs. 

- \*\*Shipping method selector\*\*: Radio cards showing method name, estimated delivery, and price. Pull from Supabase. 

- \*\*Payment\*\*: Integrate Razorpay Elements (CardElement) styled to match the design system. 

- \*\*Order review step\*\*: Full summary of items, shipping, payment method, totals. 

- \*\*Place Order button\*\*: On click, create order in Supabase "orders" table with status 

"pending", process Razorpay payment, on success update to "confirmed" and redirect to confirmation page. 

## ### Order Confirmation Page 

- Animated checkmark (SVG path draw animation). 

- Order number, summary, estimated delivery. 

- "Continue Shopping" and "Track Order" CTAs. 

## ### User Account Pages (Supabase Auth) 

- \*\*Sign Up / Sign In\*\*: Use Supabase Auth with email+password. Implement Google OAuth as well. Styled modal or dedicated page with smooth tab transition between Sign In and Sign Up. 

- \*\*My Account Dashboard\*\*: Welcome message, recent orders, saved addresses. Sidebar navigation (desktop) / tab bar (mobile). 

- \*\*Order History\*\*: Table/card list of past orders with status badges (color-coded: pending=yellow, shipped=blue, delivered=green, cancelled=red). Click to view order detail. 

- \*\*Order Detail\*\*: Full breakdown with items, shipping tracking info, status timeline animation. 

- \*\*Address Book\*\*: CRUD addresses stored in Supabase. Default address selector. 

- \*\*Profile Settings\*\*: Update name, email, password. Avatar upload to Supabase Storage. - \*\*Wishlist\*\*: Add/remove products. Heart icon toggle animation (scale bounce + color fill). Grid display of wishlisted items. 

## ### Search 

- \*\*Search modal\*\*: Opens on click of search icon in header. Full-width overlay with large input. Debounced search querying Supabase products table (title, description, tags). Show instant results below input with product thumbnails and prices. Keyboard navigation (arrow keys + enter). Recent searches stored in localStorage. 

## ### Additional Pages 

- \*\*About Us\*\*, \*\*Contact\*\* (functional form → Supabase), \*\*FAQ\*\* (accordion), \*\*Shipping Policy\*\*, \*\*Returns Policy\*\*, \*\*Privacy Policy\*\*, \*\*Terms of Service\*\*. All styled consistently. 

--- 

## ## SECTION 3 — ADMIN PANEL (/admin) 

The admin panel must be a completely separate layout (no storefront header/footer). Protected by Supabase Auth with role check (role = "admin" in profiles table). Redirect non-admins to storefront. 

## ### Admin UI Design 

- Sidebar navigation (collapsible on mobile) with icons (use Lucide icons). 

- Color scheme: White sidebar (#FFFFFF), light gray content area (#F8F9FA), dark text. 

- All tables must be sortable, searchable, and paginated with 20 items per page. 

- All forms must have validation with inline error messages. 

- Every destructive action requires a confirmation modal. 

- Dashboard charts use Recharts library with the design system colors. 

- Toast notifications for all CRUD operations. 

## ### Admin Dashboard (Home) 

- \*\*KPI Cards\*\* (animated count-up): Total Revenue, Total Orders, Total Customers, Avg Order Value. Show percentage change vs last period. 

- \*\*Revenue Chart\*\*: Line/area chart (last 30 days, toggle to 7d/90d/1y). Using Recharts. 

- \*\*Recent Orders\*\*: Table showing last 10 orders with status, customer, total. 

- \*\*Top Selling Products\*\*: Bar chart of top 5 products by units sold. 

- \*\*Low Stock Alerts\*\*: Products where stock < 10. 

## ### Product Management (/admin/products) 

- \*\*Product List\*\*: Table with columns: Image thumbnail, Name, SKU, Category, Price, Stock, Status (Active/Draft), Actions (Edit/Delete). Bulk actions: delete, change status. 

- \*\*Add/Edit Product Form\*\*: 

- Title, slug (auto-generated from title, editable), description (rich text editor — use a lightweight RTE like TipTap). 

- Category selector (from categories table), tags (multi-select/creatable). 

- Pricing: Regular price, sale price, sale start/end dates. 

- Inventory: SKU, stock quantity, "Track inventory" toggle, "Allow backorders" toggle. 

- Media: Drag-and-drop image upload zone. Upload to Supabase Storage bucket 

"product-images". Reorder images by drag. First image = featured image. Support up to 10 images per product. 

- Variants: Dynamic variant creator. Add option groups (e.g., Size, Color) with values. Auto-generate variant combinations. Each variant has its own price, stock, and SKU. 

- SEO: Meta title, meta description, OG image (auto-filled from product image but overridable). 

- Status: Draft / Active toggle. 

- Save as Draft / Publish buttons. 

## ### Category Management (/admin/categories) 

- CRUD categories: Name, slug, description, image (Supabase Storage), parent category (for nested categories). 

- Tree view for nested categories. 

- Drag-and-drop reorder. 

## ### Order Management (/admin/orders) 

- \*\*Order List\*\*: Table with: Order #, Date, Customer name + email, Items count, Total, Payment status, Fulfillment status. Filterable by: date range (date picker), status, payment status, fulfillment status, min/max total amount. Searchable by order number, customer name, or email. 

- \*\*Order Detail View\*\*: 

- Customer info section (name, email, phone) with link to customer profile. 

- Shipping address and billing address side by side. 

- Items table: product image, name, variant, quantity, unit price, line total. 

- Order summary: subtotal, discount, shipping, tax, total. 

- Payment info: method, Razorpay payment ID, status. 

- \*\*Order Timeline\*\*: Visual timeline showing every status change with timestamp. Admin can add notes. 

- \*\*Status Update\*\*: Dropdown to change fulfillment status (Pending → Processing → Shipped → Delivered → Cancelled/Refunded). Each change logs to the timeline and updates Supabase. 

- \*\*Shipping\*\*: Input field for tracking number and carrier. When added, customer can see tracking on their order page. 

- Print packing slip / invoice (generate clean printable view). 

- \*\*Export\*\*: CSV/Excel export of filtered orders. 

## ### Customer Management (/admin/customers) 

- \*\*Customer List\*\*: Table with: Name, Email, Total Orders, Total Spent, Join Date, Status. Searchable and filterable. 

- \*\*Customer Detail\*\*: Profile info, order history, addresses, lifetime value, notes (admin can add internal notes). 

### Coupon / Discount Management (/admin/coupons) 

- CRUD coupons: Code, type (percentage/fixed amount), value, minimum order amount, usage limit, per-customer limit, valid from/to dates, applicable categories/products, active/inactive status. 

- Usage tracking: show how many times each coupon has been used. 

## ### Brand \& Site Settings (/admin/settings) 

This is critical — the admin must be able to customize the storefront without touching code: 

- \*\*Brand Logo\*\*: Upload logo image (Supabase Storage). This logo dynamically appears in the storefront header, footer, emails, invoices, and favicon. Provide two upload slots: primary logo (for header on light background) and inverted logo (for footer on dark background, if applicable). 

- \*\*Site Name \& Tagline\*\*: Used in header, title tag, and meta. 

- \*\*Contact Information\*\*: Business email, phone, address. Shown in footer and contact page. 

- \*\*Social Media Links\*\*: Instagram, Facebook, Twitter/X, TikTok, YouTube URLs. Shown in footer with icons. 

- \*\*Announcement Bar\*\*: Toggle on/off, text content, link URL, background color. Shows as a thin bar above the header on storefront. 

- \*\*Currency\*\*: Select currency code (USD, EUR, GBP, etc.) and symbol. 

- \*\*Shipping Methods\*\*: CRUD shipping options: name, price, estimated delivery time, free shipping threshold. 

- \*\*Tax Settings\*\*: Tax rate percentage, tax-inclusive or tax-exclusive pricing. 

- \*\*Homepage Hero Slides\*\*: CRUD hero carousel items: image upload, heading, subheading, CTA text, CTA link. Reorder by drag-and-drop. 

- \*\*Banner Promotions\*\*: Create promotional banners with image, text, link, start/end date. 

## ### SEO Management (/admin/seo) 

- \*\*Global SEO\*\*: Default meta title template (e.g., "{Page Title} | {Site Name}"), default meta description, Google Analytics / GA4 tracking ID (injected into <head>), Google Search Console verification meta tag, Facebook Pixel ID, Open Graph default image upload. - \*\*Per-Page SEO\*\*: Edit meta title, description, and OG image for: Homepage, About, Contact, and all policy pages. 

- \*\*Sitemap\*\*: Auto-generate /sitemap.xml including all products, categories, and pages. 

- \*\*Robots.txt\*\*: Editable from admin. 

- \*\*Structured Data\*\*: Auto-inject JSON-LD Product schema on PDPs and Organization schema on homepage. 

## ### Media Library (/admin/media) 

- Grid view of all uploaded images in Supabase Storage. 

- Upload new images (drag-and-drop zone). 

- Delete images (with warning if used in a product). 

- Copy public URL. 

## ### Analytics (/admin/analytics) (basic) 

- Revenue over time (Recharts line chart). 

- Orders over time. 

- Top products by revenue and units. 

- Top categories. 

- Customer acquisition over time. 

- All data pulled from Supabase aggregation queries. 

--- 

## ## SECTION 4 — SUPABASE DATABASE SCHEMA 

Create the following tables with proper relationships, RLS (Row Level Security) policies, and indexes: 

## ### Tables: 

1. \*\*profiles\*\* — id (uuid, FK to auth.users), email, full\_name, phone, avatar\_url, role (enum: 'customer', 'admin'), created\_at, updated\_at. 

2. \*\*site\_settings\*\* — id, site\_name, tagline, logo\_url, logo\_inverted\_url, favicon\_url, contact\_email, contact\_phone, business\_address, currency\_code, currency\_symbol, tax\_rate, tax\_inclusive (bool), announcement\_bar\_active (bool), announcement\_bar\_text, announcement\_bar\_link, announcement\_bar\_color, social\_instagram, social\_facebook, social\_twitter, social\_tiktok, social\_youtube, updated\_at. 

3. \*\*seo\_settings\*\* — id, meta\_title\_template, default\_meta\_description, og\_default\_image\_url, ga\_tracking\_id, fb\_pixel\_id, search\_console\_meta, robots\_txt, updated\_at. 

4. \*\*page\_seo\*\* — id, page\_slug (unique), meta\_title, meta\_description, og\_image\_url. 

5. \*\*categories\*\* — id, name, slug (unique), description, image\_url, parent\_id (self-referencing FK), sort\_order, created\_at. 

6. \*\*products\*\* — id, title, slug (unique), description (text/html), category\_id (FK), price (numeric), sale\_price (numeric, nullable), sale\_start, sale\_end, sku (unique), stock\_quantity (int), track\_inventory (bool), allow\_backorders (bool), status (enum: 'draft', 'active'), meta\_title, meta\_description, og\_image\_url, tags (text\[]), created\_at, updated\_at. 

7. \*\*product\_images\*\* — id, product\_id (FK), image\_url, sort\_order, alt\_text. 

8. \*\*product\_options\*\* — id, product\_id (FK), name (e.g., "Size", "Color"), sort\_order. 

9. \*\*product\_option\_values\*\* — id, option\_id (FK), value (e.g., "XL", "Red"), sort\_order. 

10. \*\*product\_variants\*\* — id, product\_id (FK), sku, price (override, nullable), stock\_quantity, option\_values (jsonb — array of {option\_name, value}), created\_at. 

11. \*\*addresses\*\* — id, user\_id (FK), full\_name, phone, address\_line1, address\_line2, city, state, zip, country, is\_default (bool), created\_at. 

12. \*\*orders\*\* — id, order\_number (unique, auto-generated like "ORD-10001"), user\_id (FK), email, shipping\_address (jsonb), billing\_address (jsonb), shipping\_method, shipping\_cost (numeric), subtotal, discount\_amount, tax\_amount, total, coupon\_code, payment\_status (enum: 'pending', 'paid', 'failed', 'refunded'), fulfillment\_status (enum: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'), Razorpay\_payment\_id, tracking\_number, tracking\_carrier, notes, created\_at, updated\_at. 

13. \*\*order\_items\*\* — id, order\_id (FK), product\_id (FK), variant\_id (FK, nullable), title, variant\_info (jsonb), quantity, unit\_price, line\_total. 

14. \*\*order\_timeline\*\* — id, order\_id (FK), status, note, created\_by (FK to profiles), created\_at. 

15. \*\*reviews\*\* — id, product\_id (FK), user\_id (FK), rating (1-5), title, body, is\_verified (bool), created\_at. 

16. \*\*coupons\*\* — id, code (unique), type (enum: 'percentage', 'fixed'), value (numeric), min\_order\_amount, usage\_limit, per\_customer\_limit, times\_used (int), valid\_from, valid\_to, applicable\_products (uuid\[]), applicable\_categories (uuid\[]), is\_active (bool), created\_at. 

17. \*\*subscribers\*\* — id, email (unique), created\_at. 

18. \*\*hero\_slides\*\* — id, image\_url, heading, subheading, cta\_text, cta\_link, sort\_order, is\_active (bool). 

19. \*\*wishlist\*\* — id, user\_id (FK), product\_id (FK), created\_at. Unique constraint on (user\_id, product\_id). 

20. \*\*media\*\* — id, url, filename, size, mime\_type, uploaded\_by (FK), created\_at. 

## ### RLS Policies: 

- Customers can only read/update their own profile, addresses, orders, reviews, and wishlist. 

- Products, categories, and site settings are publicly readable. 

- Only admins (role = 'admin') can insert/update/delete products, categories, orders, coupons, settings, hero\_slides, and media. 

- Orders: customers can read their own; admins can read all. 

- Reviews: publicly readable; customers can create for products they've ordered; admins can delete. 

## ### Storage Buckets: 

- "product-images" — public read, admin write. 

- "brand-assets" — public read, admin write (logos, favicons). 

- "media-library" — public read, admin write. 

- "avatars" — authenticated read/write own folder. 

## ### Database Functions / Triggers: 

- Auto-generate order\_number on order insert (e.g., 'ORD-' || 10000 + id). 

- Auto-update updated\_at on row changes. 

- Decrement product stock on order creation (if track\_inventory = true). 

- Recalculate coupon times\_used on order creation with coupon. 

--- 

## ## SECTION 5 — TECHNICAL REQUIREMENTS 

### Project Structure (Next.js App Router): 

``` 

/app

* /(storefront)

/layout.tsx          ← storefront layout with header/footer

/page.tsx            ← homepage

* /products/page.tsx   ← PLP /products/\[slug]/page.tsx ← PDP

/cart/page.tsx /checkout/page.tsx /account/...         ← user account pages

/search/page.tsx

/about, /contact, /faq, /policies...

/(admin)

/admin/layout.tsx    ← admin layout with sidebar /admin/page.tsx      ← dashboard /admin/products/... /admin/orders/... /admin/customers/... /admin/categories/... /admin/coupons/... /admin/settings/... /admin/seo/... /admin/media/... /admin/analytics/... /api/...               ← API routes for Razorpay webhooks, etc. /components

/ui                    ← reusable: Button, Input, Modal, Toast, Skeleton, etc. /storefront            ← Header, Footer, ProductCard, CartDrawer, etc.

/admin                 ← AdminSidebar, DataTable, StatCard, etc. /lib /supabase.ts           ← Supabase client init /Razorpay.ts             ← Razorpay config /utils.ts              ← formatCurrency, slugify, etc. /hooks                   ← useCart, useWishlist, useDebounce, etc. /types                   ← TypeScript interfaces /public                  ← static assets ```

## \### State Management:

* Cart state: React Context + localStorage persistence. Cart context provides: items, addItem (with flying animation trigger), removeItem, updateQuantity, clearCart, subtotal, itemCount. - Auth state: Supabase auth listener in a context provider.
* No Redux or Zustand unless absolutely necessary. Keep it simple.

## \### Performance:

* Use Next.js dynamic imports for heavy components (rich text editor, charts).
* Implement ISR (Incremental Static Regeneration) for product pages (revalidate: 60).
* Lazy load below-fold images.
* Bundle size must stay under 200KB first-load JS.

## \### Deployment:

* Include vercel.json only if needed. - All environment variables via .env.local: NEXT\_PUBLIC\_SUPABASE\_URL, NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY, SUPABASE\_SERVICE\_ROLE\_KEY, Razorpay\_SECRET\_KEY, NEXT\_PUBLIC\_Razorpay\_PUBLISHABLE\_KEY, Razorpay\_WEBHOOK\_SECRET.
* Include a .env.example file with all required variables listed.
* Include a README.md with setup instructions.

### Razorpay Integration:

* Create Payment Intent on the server (API route) when user initiates checkout.
* Use Razorpay Elements for card input on the frontend.
* Razorpay Webhook endpoint (/api/webhooks/Razorpay) to handle

payment\_intent.succeeded → update order payment\_status to 'paid'.

* Support for Razorpay Test Mode.

## \---

## \## SECTION 6 — FIRST IMPLEMENTATION STEPS

Generate the project in this order:

1. Initialize Next.js 14 project with TypeScript + Tailwind CSS + Framer Motion.
2. Set up Supabase client and auth provider.
3. Create the complete database schema (provide the SQL migration file).
4. Build the design system components first (Button, Input, Modal, Toast, Skeleton, ProductCard, etc.) with all animations.
5. Build the storefront layout (Header with dynamic logo, Footer, CartDrawer).
6. Build the homepage with all sections.
7. Build PLP with filters and sorting.
8. Build PDP with all features.
9. Build cart + checkout + Razorpay integration.
10. Build user account pages.
11. Build the admin layout + dashboard.
12. Build admin product management.
13. Build admin order management.
14. Build admin settings, SEO, and brand management.
15. Build remaining admin pages.
16. Add search functionality.
17. Final polish: loading states, error states, empty states, 404 page.

Generate all code files with complete implementations. Do not use placeholder comments like "// TODO" or "// implement later". Every function must be fully written. ```

\---

## \## BONUS: UI REFERENCE KEYWORDS

If the AI needs extra nudging on design quality, append this at the end of the prompt:

``` 

## VISUAL REFERENCE KEYWORDS FOR UI QUALITY: 

The website should visually feel like a blend of these brands: Apple Store's minimalism and whitespace, Aesop's typography and elegance, Nike's product page energy, Shopify Dawn theme's clean structure. The admin panel should feel like a mix of Vercel's dashboard clarity and Linear's polished UI. If in doubt about any design choice, choose the more minimal, more spacious, more refined option. White space is a feature, not a bug. ``` 


