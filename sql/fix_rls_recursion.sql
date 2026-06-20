-- Fix infinite RLS recursion caused by admin policies querying profiles table
-- Run this in Supabase SQL Editor

-- Create SECURITY DEFINER function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Recreate all admin policies to use is_admin() instead of recursive subquery
DROP POLICY IF EXISTS "Admin all products" ON products;
CREATE POLICY "Admin all products" ON products FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all categories" ON categories;
CREATE POLICY "Admin all categories" ON categories FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all orders" ON orders;
CREATE POLICY "Admin all orders" ON orders FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all coupons" ON coupons;
CREATE POLICY "Admin all coupons" ON coupons FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all settings" ON site_settings;
CREATE POLICY "Admin all settings" ON site_settings FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all seo" ON seo_settings;
CREATE POLICY "Admin all seo" ON seo_settings FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all hero" ON hero_slides;
CREATE POLICY "Admin all hero" ON hero_slides FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all subscribers" ON subscribers;
CREATE POLICY "Admin all subscribers" ON subscribers FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all media" ON media;
CREATE POLICY "Admin all media" ON media FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all images" ON product_images;
CREATE POLICY "Admin all images" ON product_images FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all options" ON product_options;
CREATE POLICY "Admin all options" ON product_options FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all opt_values" ON product_option_values;
CREATE POLICY "Admin all opt_values" ON product_option_values FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all variants" ON product_variants;
CREATE POLICY "Admin all variants" ON product_variants FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin all reviews" ON reviews;
CREATE POLICY "Admin all reviews" ON reviews FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "Admin all profiles" ON profiles;
CREATE POLICY "Admin all profiles" ON profiles FOR SELECT USING (is_admin());
