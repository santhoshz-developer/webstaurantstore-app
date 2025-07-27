-- Modular Multi-Tenant Shop System Database Schema
-- Supports supermarket, saloon, tea stall, hotel, medical, and other business types

-- Core Tables
CREATE DATABASE IF NOT EXISTS modular_shop_system;
USE modular_shop_system;

-- 1. Shop Types and Configuration
CREATE TABLE shop_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE, -- 'supermarket', 'saloon', 'tea_stall', 'hotel', 'medical'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    default_config JSON, -- Default modules, features, UI theme
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Shops (Tenants)
CREATE TABLE shops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    shop_type_id INT NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL, -- Unique QR code identifier
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    logo_url VARCHAR(500),
    theme_config JSON, -- Custom theme overrides
    module_config JSON, -- Enabled/disabled modules
    business_hours JSON, -- Operating hours
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    subscription_plan ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_type_id) REFERENCES shop_types(id)
);

-- 3. Users (Shop owners, admins, customers)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NULL, -- NULL for super admins
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('super_admin', 'shop_admin', 'shop_staff', 'customer') NOT NULL,
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- 4. Categories (Hierarchical)
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    parent_id INT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE KEY unique_shop_category_slug (shop_id, slug)
);

-- 5. Products/Services (Unified table for all business types)
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    category_id INT NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    type ENUM('product', 'service', 'booking') NOT NULL, -- product for supermarket, service for saloon, booking for hotel
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2) NULL,
    cost_price DECIMAL(10,2) NULL,
    track_inventory BOOLEAN DEFAULT TRUE,
    inventory_quantity INT DEFAULT 0,
    allow_backorder BOOLEAN DEFAULT FALSE,
    weight DECIMAL(8,2) NULL,
    dimensions JSON NULL, -- {length, width, height}
    images JSON NULL, -- Array of image URLs
    variant_options JSON NULL, -- For products with variants (size, color, etc.)
    service_duration INT NULL, -- Duration in minutes for services
    booking_config JSON NULL, -- Booking specific configuration
    seo_title VARCHAR(255),
    seo_description TEXT,
    tags JSON NULL, -- Array of tags
    attributes JSON NULL, -- Custom attributes per shop type
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE KEY unique_shop_sku (shop_id, sku),
    UNIQUE KEY unique_shop_slug (shop_id, slug)
);

-- 6. Product Variants
CREATE TABLE product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    variant_values JSON NOT NULL, -- {size: 'Large', color: 'Red'}
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2) NULL,
    cost_price DECIMAL(10,2) NULL,
    inventory_quantity INT DEFAULT 0,
    weight DECIMAL(8,2) NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_sku (product_id, sku)
);

-- 7. Customers (Shop-specific customers)
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE NULL,
    gender ENUM('male', 'female', 'other') NULL,
    address JSON NULL, -- Full address object
    preferences JSON NULL, -- Customer preferences
    loyalty_points INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_visit TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_shop_customer_email (shop_id, email),
    UNIQUE KEY unique_shop_customer_phone (shop_id, phone)
);

-- 8. Orders/Bookings (Unified table)
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    customer_id INT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('order', 'booking', 'appointment') NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'partial', 'refunded', 'failed') DEFAULT 'pending',
    fulfillment_type ENUM('pickup', 'delivery', 'dine_in', 'service') NOT NULL,
    
    -- Customer details (for guest orders)
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Financial
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Delivery/Service details
    delivery_address JSON NULL,
    delivery_date DATE NULL,
    delivery_time_slot VARCHAR(50) NULL,
    service_date DATE NULL,
    service_time_slot VARCHAR(50) NULL,
    
    -- Booking specific
    booking_date DATE NULL,
    booking_time_start TIME NULL,
    booking_time_end TIME NULL,
    guest_count INT NULL,
    special_requests TEXT,
    
    -- Metadata
    notes TEXT,
    metadata JSON NULL, -- Shop-type specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 9. Order Items
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    metadata JSON NULL, -- Item-specific metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- 10. Bookings/Appointments (Extended details)
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    staff_id INT NULL,
    room_id INT NULL, -- For hotels
    table_id INT NULL, -- For restaurants
    service_duration INT NOT NULL, -- Duration in minutes
    preparation_time INT DEFAULT 0, -- Time needed to prepare
    buffer_time INT DEFAULT 0, -- Buffer time between bookings
    recurring_config JSON NULL, -- For recurring appointments
    reminder_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Resources (Rooms, Tables, Equipment)
CREATE TABLE resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    type ENUM('room', 'table', 'equipment', 'staff', 'vehicle') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT DEFAULT 1,
    attributes JSON NULL, -- Type-specific attributes
    availability_schedule JSON NULL, -- Weekly schedule
    hourly_rate DECIMAL(10,2) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- 12. Inventory Tracking
CREATE TABLE inventory_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    type ENUM('purchase', 'sale', 'adjustment', 'return', 'waste') NOT NULL,
    quantity_change INT NOT NULL, -- Positive or negative
    unit_cost DECIMAL(10,2) NULL,
    reference_type ENUM('order', 'purchase_order', 'adjustment', 'return') NULL,
    reference_id INT NULL,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 13. Payments
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'wallet', 'bank_transfer') NOT NULL,
    payment_provider VARCHAR(100) NULL, -- Stripe, Razorpay, etc.
    transaction_id VARCHAR(255) NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    gateway_response JSON NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 14. Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NULL,
    user_id INT NULL,
    customer_id INT NULL,
    type ENUM('order_update', 'booking_reminder', 'payment', 'system', 'marketing') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channels JSON NOT NULL, -- ['email', 'sms', 'push', 'in_app']
    metadata JSON NULL,
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 15. Analytics Events
CREATE TABLE analytics_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'product_view', 'add_to_cart', etc.
    event_data JSON NOT NULL,
    user_id INT NULL,
    customer_id INT NULL,
    session_id VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 16. Shop Modules (Feature toggles)
CREATE TABLE shop_modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    module_name VARCHAR(100) NOT NULL, -- 'inventory', 'bookings', 'delivery', 'loyalty'
    is_enabled BOOLEAN DEFAULT TRUE,
    configuration JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_shop_module (shop_id, module_name)
);

-- Insert default shop types
INSERT INTO shop_types (name, display_name, description, default_config) VALUES
('supermarket', 'Supermarket', 'Grocery and retail store', JSON_OBJECT(
    'modules', JSON_ARRAY('inventory', 'categories', 'products', 'orders', 'customers', 'analytics'),
    'features', JSON_ARRAY('barcode_scanning', 'bulk_pricing', 'delivery'),
    'ui_theme', 'retail'
)),
('saloon', 'Beauty Salon', 'Hair and beauty services', JSON_OBJECT(
    'modules', JSON_ARRAY('services', 'bookings', 'staff', 'customers', 'analytics'),
    'features', JSON_ARRAY('appointment_booking', 'staff_scheduling', 'service_packages'),
    'ui_theme', 'beauty'
)),
('tea_stall', 'Tea Stall', 'Beverage and snack shop', JSON_OBJECT(
    'modules', JSON_ARRAY('products', 'orders', 'quick_order', 'analytics'),
    'features', JSON_ARRAY('quick_service', 'combo_offers', 'loyalty_points'),
    'ui_theme', 'food_beverage'
)),
('hotel', 'Hotel', 'Accommodation and hospitality', JSON_OBJECT(
    'modules', JSON_ARRAY('rooms', 'bookings', 'guests', 'services', 'analytics'),
    'features', JSON_ARRAY('room_booking', 'guest_management', 'additional_services'),
    'ui_theme', 'hospitality'
)),
('medical', 'Medical Center', 'Healthcare services', JSON_OBJECT(
    'modules', JSON_ARRAY('services', 'appointments', 'patients', 'staff', 'analytics'),
    'features', JSON_ARRAY('appointment_booking', 'patient_records', 'prescription_management'),
    'ui_theme', 'medical'
));

-- Create indexes for performance
CREATE INDEX idx_shops_qr_code ON shops(qr_code);
CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_shops_status ON shops(status);
CREATE INDEX idx_products_shop_type ON products(shop_id, type);
CREATE INDEX idx_products_active ON products(shop_id, is_active);
CREATE INDEX idx_orders_shop_status ON orders(shop_id, status);
CREATE INDEX idx_orders_date ON orders(shop_id, created_at);
CREATE INDEX idx_bookings_date_time ON bookings(order_id, booking_date, booking_time_start);
CREATE INDEX idx_customers_shop_email ON customers(shop_id, email);
CREATE INDEX idx_analytics_shop_type ON analytics_events(shop_id, event_type);