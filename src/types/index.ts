export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  logo_inverted_url: string | null;
  favicon_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  business_address: string | null;
  currency_code: string;
  currency_symbol: string;
  tax_rate: number;
  tax_inclusive: boolean;
  announcement_bar_active: boolean;
  announcement_bar_text: string | null;
  announcement_bar_link: string | null;
  announcement_bar_color: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  social_youtube: string | null;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  children?: Category[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  sku: string;
  stock_quantity: number;
  track_inventory: boolean;
  allow_backorders: boolean;
  status: 'draft' | 'active';
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  options?: ProductOption[];
  reviews?: Review[];
  review_avg?: number;
  review_count?: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  alt_text: string | null;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  sort_order: number;
  values?: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number | null;
  stock_quantity: number;
  option_values: Record<string, string>;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  email: string;
  shipping_address: Address;
  billing_address: Address;
  shipping_method: string | null;
  shipping_cost: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  coupon_code: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillment_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  razorpay_payment_id: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  timeline?: OrderTimeline[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  title: string;
  variant_info: Record<string, string> | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderTimeline {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  created_at: string;
  profile?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  times_used: number;
  valid_from: string | null;
  valid_to: string | null;
  applicable_products: string[];
  applicable_categories: string[];
  is_active: boolean;
  created_at: string;
}

export interface HeroSlide {
  id: string;
  image_url: string;
  heading: string;
  subheading: string | null;
  cta_text: string | null;
  cta_link: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  image_url: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  is_visible: boolean;
  sort_order: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  title: string;
  price: number;
  quantity: number;
  image: string;
  variant_label: string;
  sku: string;
  max_quantity: number;
}
