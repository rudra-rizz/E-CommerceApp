-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Storefront customers (lightweight sign-in, no Supabase Auth)
CREATE TABLE IF NOT EXISTS storefront_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('draft', 'active');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT DEFAULT 'STORE',
  tagline TEXT,
  logo_url TEXT,
  logo_inverted_url TEXT,
  favicon_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  business_address TEXT,
  currency_code TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  tax_rate NUMERIC DEFAULT 0,
  tax_inclusive BOOLEAN DEFAULT false,
  announcement_bar_active BOOLEAN DEFAULT false,
  announcement_bar_text TEXT,
  announcement_bar_link TEXT,
  announcement_bar_color TEXT DEFAULT '#2563EB',
  social_instagram TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  social_tiktok TEXT,
  social_youtube TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. seo_settings
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_title_template TEXT DEFAULT '{Page Title} | {Site Name}',
  default_meta_description TEXT,
  og_default_image_url TEXT,
  ga_tracking_id TEXT,
  fb_pixel_id TEXT,
  search_console_meta TEXT,
  robots_txt TEXT DEFAULT 'User-agent: *\nAllow: /',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. page_seo
CREATE TABLE IF NOT EXISTS page_seo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_slug TEXT UNIQUE NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT
);

-- 5. categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  sale_price NUMERIC,
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  sku TEXT UNIQUE NOT NULL,
  stock_quantity INT DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  allow_backorders BOOLEAN DEFAULT false,
  status product_status DEFAULT 'draft',
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. product_images
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  alt_text TEXT
);

-- 8. product_options
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- 9. product_option_values
CREATE TABLE IF NOT EXISTS product_option_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id UUID REFERENCES product_options(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- 10. product_variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  price NUMERIC,
  stock_quantity INT DEFAULT 0,
  option_values JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  email TEXT NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  shipping_cost NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  coupon_code TEXT,
  payment_status payment_status DEFAULT 'pending',
  fulfillment_status fulfillment_status DEFAULT 'pending',
  razorpay_payment_id TEXT,
  tracking_number TEXT,
  tracking_carrier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  title TEXT NOT NULL,
  variant_info JSONB,
  quantity INT NOT NULL,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL
);

-- 14. order_timeline
CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- 16. coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  type coupon_type NOT NULL,
  value NUMERIC NOT NULL,
  min_order_amount NUMERIC,
  usage_limit INT,
  per_customer_limit INT,
  times_used INT DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  applicable_products UUID[] DEFAULT '{}',
  applicable_categories UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. hero_slides
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  heading TEXT NOT NULL,
  subheading TEXT,
  cta_text TEXT,
  cta_link TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 19. wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 20. media
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  filename TEXT,
  size INT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- TRIGGER: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_seo_settings_updated_at ON seo_settings;
CREATE TRIGGER update_seo_settings_updated_at BEFORE UPDATE ON seo_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER: auto-generate order_number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || LPAD(nextval('orders_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS orders_seq START 10000;

DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- TRIGGER: decrement stock on order
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id AND track_inventory = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decrement_stock ON order_items;
CREATE TRIGGER decrement_stock AFTER INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order();

-- TRIGGER: increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL THEN
    UPDATE coupons SET times_used = times_used + 1 WHERE code = NEW.coupon_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_coupon ON orders;
CREATE TRIGGER increment_coupon AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();

-- TRIGGER: create order timeline entry
CREATE OR REPLACE FUNCTION create_order_timeline()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_timeline (order_id, status, note, created_by)
  VALUES (NEW.id, NEW.fulfillment_status, 'Order created', NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_timeline_trigger ON orders;
CREATE TRIGGER order_timeline_trigger AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION create_order_timeline();

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Security definer helper to check admin role (avoids infinite RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Public read policies
DROP POLICY IF EXISTS "Public products read" ON products;
DROP POLICY IF EXISTS "Public products read" ON products;
CREATE POLICY "Public products read" ON products FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "Public categories read" ON categories;
DROP POLICY IF EXISTS "Public categories read" ON categories;
CREATE POLICY "Public categories read" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public reviews read" ON reviews;
DROP POLICY IF EXISTS "Public reviews read" ON reviews;
CREATE POLICY "Public reviews read" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public hero_slides read" ON hero_slides;
DROP POLICY IF EXISTS "Public hero_slides read" ON hero_slides;
CREATE POLICY "Public hero_slides read" ON hero_slides FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public site_settings read" ON site_settings;
DROP POLICY IF EXISTS "Public site_settings read" ON site_settings;
CREATE POLICY "Public site_settings read" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public product_images read" ON product_images;
DROP POLICY IF EXISTS "Public product_images read" ON product_images;
CREATE POLICY "Public product_images read" ON product_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public product_options read" ON product_options;
DROP POLICY IF EXISTS "Public product_options read" ON product_options;
CREATE POLICY "Public product_options read" ON product_options FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public product_option_values read" ON product_option_values;
DROP POLICY IF EXISTS "Public product_option_values read" ON product_option_values;
CREATE POLICY "Public product_option_values read" ON product_option_values FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public product_variants read" ON product_variants;
DROP POLICY IF EXISTS "Public product_variants read" ON product_variants;
CREATE POLICY "Public product_variants read" ON product_variants FOR SELECT USING (true);

-- Customer policies
DROP POLICY IF EXISTS "Users own profile" ON profiles;
DROP POLICY IF EXISTS "Users own profile" ON profiles;
CREATE POLICY "Users own profile" ON profiles FOR ALL USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users own orders" ON orders;
DROP POLICY IF EXISTS "Users own orders" ON orders;
CREATE POLICY "Users own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own order_items" ON order_items;
DROP POLICY IF EXISTS "Users own order_items" ON order_items;
CREATE POLICY "Users own order_items" ON order_items FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users own reviews" ON reviews;
DROP POLICY IF EXISTS "Users own reviews" ON reviews;
CREATE POLICY "Users own reviews" ON reviews FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users own wishlist" ON wishlist;
CREATE POLICY "Users own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own addresses" ON addresses;
DROP POLICY IF EXISTS "Users own addresses" ON addresses;
CREATE POLICY "Users own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create reviews" ON reviews;
DROP POLICY IF EXISTS "Users create reviews" ON reviews;
CREATE POLICY "Users create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create orders" ON orders;
DROP POLICY IF EXISTS "Users create orders" ON orders;
CREATE POLICY "Users create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies
DROP POLICY IF EXISTS "Admin all products" ON products;
DROP POLICY IF EXISTS "Admin all products" ON products;
CREATE POLICY "Admin all products" ON products FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all categories" ON categories;
DROP POLICY IF EXISTS "Admin all categories" ON categories;
CREATE POLICY "Admin all categories" ON categories FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all orders" ON orders;
DROP POLICY IF EXISTS "Admin all orders" ON orders;
CREATE POLICY "Admin all orders" ON orders FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all coupons" ON coupons;
DROP POLICY IF EXISTS "Admin all coupons" ON coupons;
CREATE POLICY "Admin all coupons" ON coupons FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all settings" ON site_settings;
DROP POLICY IF EXISTS "Admin all settings" ON site_settings;
CREATE POLICY "Admin all settings" ON site_settings FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all seo" ON seo_settings;
DROP POLICY IF EXISTS "Admin all seo" ON seo_settings;
CREATE POLICY "Admin all seo" ON seo_settings FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all hero" ON hero_slides;
DROP POLICY IF EXISTS "Admin all hero" ON hero_slides;
CREATE POLICY "Admin all hero" ON hero_slides FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all subscribers" ON subscribers;
DROP POLICY IF EXISTS "Admin all subscribers" ON subscribers;
CREATE POLICY "Admin all subscribers" ON subscribers FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all media" ON media;
DROP POLICY IF EXISTS "Admin all media" ON media;
CREATE POLICY "Admin all media" ON media FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all images" ON product_images;
DROP POLICY IF EXISTS "Admin all images" ON product_images;
CREATE POLICY "Admin all images" ON product_images FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all options" ON product_options;
DROP POLICY IF EXISTS "Admin all options" ON product_options;
CREATE POLICY "Admin all options" ON product_options FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all opt_values" ON product_option_values;
DROP POLICY IF EXISTS "Admin all opt_values" ON product_option_values;
CREATE POLICY "Admin all opt_values" ON product_option_values FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all variants" ON product_variants;
DROP POLICY IF EXISTS "Admin all variants" ON product_variants;
CREATE POLICY "Admin all variants" ON product_variants FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admin all reviews" ON reviews;
DROP POLICY IF EXISTS "Admin all reviews" ON reviews;
CREATE POLICY "Admin all reviews" ON reviews FOR DELETE USING (is_admin());
DROP POLICY IF EXISTS "Admin all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin all profiles" ON profiles;
CREATE POLICY "Admin all profiles" ON profiles FOR SELECT USING (is_admin());

-- 21. pages (static page content)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public pages read" ON pages;
DROP POLICY IF EXISTS "Public pages read" ON pages;
CREATE POLICY "Public pages read" ON pages FOR SELECT USING (is_visible = true);
DROP POLICY IF EXISTS "Admin all pages" ON pages;
DROP POLICY IF EXISTS "Admin all pages" ON pages;
CREATE POLICY "Admin all pages" ON pages FOR ALL USING (is_admin());

INSERT INTO pages (slug, title, content) VALUES
('about', 'About Us', '<h2>Our Story</h2><p>We started with a simple idea: create beautiful, sustainable products that people love.</p>'),
('contact', 'Contact', '<h2>Get in Touch</h2><p>We would love to hear from you.</p>'),
('faq', 'FAQ', '<h2>Frequently Asked Questions</h2><p>Find answers to common questions.</p>'),
('privacy-policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Your privacy matters to us.</p>'),
('shipping-policy', 'Shipping Policy', '<h2>Shipping Policy</h2><p>We ship worldwide.</p>'),
('returns-policy', 'Returns Policy', '<h2>Returns & Exchanges</h2><p>Hassle-free returns within 30 days.</p>'),
('terms-of-service', 'Terms of Service', '<h2>Terms of Service</h2><p>Please read these terms carefully.</p>')
ON CONFLICT (slug) DO NOTHING;

-- 22. homepage_sections
CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  content TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public homepage_sections read" ON homepage_sections;
DROP POLICY IF EXISTS "Public homepage_sections read" ON homepage_sections;
CREATE POLICY "Public homepage_sections read" ON homepage_sections FOR SELECT USING (is_visible = true);
DROP POLICY IF EXISTS "Admin all homepage_sections" ON homepage_sections;
DROP POLICY IF EXISTS "Admin all homepage_sections" ON homepage_sections;
CREATE POLICY "Admin all homepage_sections" ON homepage_sections FOR ALL USING (is_admin());

INSERT INTO homepage_sections (section_key, title, subtitle, is_visible, sort_order) VALUES
('hero', 'Hero Banner', 'Main hero carousel', true, 1),
('categories', 'Shop by Category', 'Category grid', true, 2),
('new-arrivals', 'New Arrivals', 'Latest products', true, 3),
('best-sellers', 'Best Sellers', 'Top selling products', true, 4),
('promo-banner', 'Promotional Banner', 'Call to action banner', true, 5),
('testimonials', 'Testimonials', 'Customer reviews', true, 6),
('newsletter', 'Newsletter', 'Email signup', true, 7),
('instagram', 'Instagram Feed', 'Social media showcase', true, 8)
ON CONFLICT (section_key) DO NOTHING;

-- 23. shipping_methods
CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  delivery_time TEXT,
  free_shipping_threshold NUMERIC
);

ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public shipping read" ON shipping_methods;
CREATE POLICY "Public shipping read" ON shipping_methods FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin all shipping" ON shipping_methods;
CREATE POLICY "Admin all shipping" ON shipping_methods FOR ALL USING (is_admin());

-- Insert default site settings
