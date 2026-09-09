-- =========================================================
-- NOVA LUXE PostgreSQL Relational Database Schema
-- Version: 1.0 (Production Ready)
-- Currency: Indian Rupee (INR ₹)
-- =========================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-running
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 1. Categories Table
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) DEFAULT 'grid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2) NOT NULL CHECK (original_price >= price),
    rating NUMERIC(2, 1) DEFAULT 4.5 CHECK (rating >= 1.0 AND rating <= 5.0),
    reviews_count INTEGER DEFAULT 0,
    badge VARCHAR(50),
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    in_stock BOOLEAN DEFAULT TRUE,
    is_trending BOOLEAN DEFAULT FALSE,
    stock_quantity INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_trending ON products(is_trending);

-- 3. Promo Coupons Table
CREATE TABLE coupons (
    code VARCHAR(30) PRIMARY KEY,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'flat')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Orders Table
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    order_ref VARCHAR(30) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(10) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'processing', 'dispatched', 'delivered', 'cancelled')),
    tracking_courier VARCHAR(100) DEFAULT 'BlueDart Express Air',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_ref ON orders(order_ref);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- 5. Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
