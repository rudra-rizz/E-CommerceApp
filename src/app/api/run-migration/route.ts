import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const runtime = 'nodejs'

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || '',
  })

  const sql = `
-- 21. pages
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
CREATE POLICY "Public pages read" ON pages FOR SELECT USING (is_visible = true);

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
CREATE POLICY "Public homepage_sections read" ON homepage_sections FOR SELECT USING (is_visible = true);

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
`

  try {
    await pool.query(sql)
    await pool.end()
    return NextResponse.json({ success: true, message: 'Migration completed' })
  } catch (err: any) {
    try { await pool.end() } catch {}
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
