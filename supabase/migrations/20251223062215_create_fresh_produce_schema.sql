/*
  # Fresh Produce Delivery Platform Schema

  ## Overview
  Complete database schema for a fresh produce delivery service similar to Pluckk.in

  ## New Tables
  
  ### Categories Table
    - `id` (uuid, primary key)
    - `name` (text) - Category name (e.g., "Fruits", "Vegetables")
    - `slug` (text, unique) - URL-friendly identifier
    - `description` (text) - Category description
    - `image_url` (text) - Category image
    - `created_at` (timestamptz)
  
  ### Products Table
    - `id` (uuid, primary key)
    - `category_id` (uuid, foreign key) - Links to categories
    - `name` (text) - Product name
    - `slug` (text, unique) - URL-friendly identifier
    - `description` (text) - Product description
    - `price` (numeric) - Product price
    - `unit` (text) - Unit of measurement (kg, g, piece, etc.)
    - `image_url` (text) - Main product image
    - `stock_quantity` (integer) - Available stock
    - `is_featured` (boolean) - Featured on homepage
    - `is_organic` (boolean) - Organic certification
    - `is_available` (boolean) - Currently available
    - `discount_percentage` (numeric) - Discount if any
    - `nutrition_info` (jsonb) - Nutritional information
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### User Profiles Table
    - `id` (uuid, primary key, references auth.users)
    - `full_name` (text)
    - `phone` (text)
    - `address` (text)
    - `city` (text)
    - `state` (text)
    - `pincode` (text)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### Orders Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key)
    - `order_number` (text, unique) - Human-readable order number
    - `total_amount` (numeric) - Total order amount
    - `status` (text) - Order status (pending, confirmed, delivered, cancelled)
    - `delivery_address` (text)
    - `delivery_city` (text)
    - `delivery_state` (text)
    - `delivery_pincode` (text)
    - `phone` (text)
    - `notes` (text) - Delivery notes
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### Order Items Table
    - `id` (uuid, primary key)
    - `order_id` (uuid, foreign key)
    - `product_id` (uuid, foreign key)
    - `quantity` (integer)
    - `unit_price` (numeric) - Price at time of order
    - `subtotal` (numeric) - quantity * unit_price
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for categories and products
  - Authenticated users can read their own profiles and orders
  - Only authenticated users can create orders
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'kg',
  image_url text,
  stock_quantity integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_organic boolean DEFAULT false,
  is_available boolean DEFAULT true,
  discount_percentage numeric(5, 2) DEFAULT 0,
  nutrition_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  delivery_address text NOT NULL,
  delivery_city text NOT NULL,
  delivery_state text NOT NULL,
  delivery_pincode text NOT NULL,
  phone text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10, 2) NOT NULL,
  subtotal numeric(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

-- Products policies (public read)
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO public
  USING (true);

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Orders policies
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
