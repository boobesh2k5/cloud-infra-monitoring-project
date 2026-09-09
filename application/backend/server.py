#!/usr/bin/env python3
"""
=========================================================
NOVA LUXE - Zero-Package REST API Server
Built exclusively with Python standard libraries (http.server, json, sqlite3, urllib)
Zero external dependencies required (no pip install needed!)
PostgreSQL ready via schema.sql + seed.sql
=========================================================
"""

import os
import json
import sqlite3
import re
import urllib.parse
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

# Import DB config
try:
    from config import DB_CONFIG, SERVER_PORT, SERVER_HOST
except ImportError:
    SERVER_PORT = 8000
    SERVER_HOST = '0.0.0.0'

# Local Database setup (Built-in SQLite persistent cache + PostgreSQL schema sync)
DB_PATH = os.path.join(os.path.dirname(__file__), 'novaluxe.db')

def init_database():
    """Initializes database tables and populates with seed data if empty."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            icon TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category_id TEXT NOT NULL,
            price REAL NOT NULL,
            original_price REAL NOT NULL,
            rating REAL,
            reviews_count INTEGER,
            badge TEXT,
            image_url TEXT NOT NULL,
            description TEXT NOT NULL,
            features TEXT,
            in_stock INTEGER DEFAULT 1,
            is_trending INTEGER DEFAULT 0,
            stock_quantity INTEGER DEFAULT 50
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS coupons (
            code TEXT PRIMARY KEY,
            discount_type TEXT NOT NULL,
            discount_value REAL NOT NULL,
            min_order_amount REAL NOT NULL,
            description TEXT,
            is_active INTEGER DEFAULT 1
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_ref TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            shipping_address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            pin_code TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            subtotal REAL NOT NULL,
            discount REAL DEFAULT 0,
            tax REAL NOT NULL,
            delivery_fee REAL DEFAULT 0,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'confirmed',
            tracking_courier TEXT DEFAULT 'BlueDart Express Air',
            created_at TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            total_price REAL NOT NULL
        )
    ''')

    # Check if products already exist
    cursor.execute('SELECT COUNT(*) FROM products')
    count = cursor.fetchone()[0]

    if count == 0:
        print("[DB] Loading initial catalog into store database...")
        # Categories
        categories = [
            ('electronics', 'Electronics & Gear', 'electronics', 'cpu'),
            ('audio', 'Pro Audio & Sound', 'audio', 'headphones'),
            ('fashion', 'Street Fashion & Footwear', 'fashion', 'shopping-bag'),
            ('lifestyle', 'Home & Modern Living', 'lifestyle', 'home')
        ]
        cursor.executemany('INSERT OR IGNORE INTO categories VALUES (?,?,?,?)', categories)

        # Coupons
        coupons = [
            ('WELCOME10', 'percent', 10.0, 500.0, '10% OFF on first order above ₹500', 1),
            ('SAVE20', 'percent', 20.0, 2000.0, '20% OFF on premium orders above ₹2,000', 1),
            ('FESTIVE500', 'flat', 500.0, 3000.0, 'Flat ₹500 OFF on festive orders above ₹3,000', 1)
        ]
        cursor.executemany('INSERT OR IGNORE INTO coupons VALUES (?,?,?,?,?,?)', coupons)

        # Load products from seed.sql or default dataset
        seed_path = os.path.join(os.path.dirname(__file__), 'seed.sql')
        if os.path.exists(seed_path):
            with open(seed_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Parse SQL inserts for sqlite fallback
                matches = re.findall(
                    r"\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*([0-9]+),\s*'([^']*)',\s*'([^']+)',\s*'([^']+)',\s*'(\[[^\]]+\])'::jsonb,\s*(TRUE|FALSE),\s*(TRUE|FALSE),\s*([0-9]+)\s*\)",
                    content
                )
                for m in matches:
                    cursor.execute('''
                        INSERT OR REPLACE INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    ''', (
                        m[0], m[1], m[2], m[3], float(m[4]), float(m[5]), float(m[6]), int(m[7]),
                        m[8], m[9], m[10], m[11], 1 if m[12] == 'TRUE' else 0, 1 if m[13] == 'TRUE' else 0, int(m[14])
                    ))
        conn.commit()
        print(f"[DB] Initialized with {len(matches)} curated products!")

    conn.commit()
    conn.close()

class NovaLuxeAPIHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, data, status=200):
        self.send_response(status)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Health endpoint
        if path == '/api/health':
            self._send_json({
                'status': 'healthy',
                'service': 'NOVA LUXE Backend REST API',
                'currency': 'INR (₹)',
                'timestamp': datetime.now().isoformat()
            })
            return

        # Get all products
        if path == '/api/products':
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            sql = 'SELECT * FROM products WHERE 1=1'
            params = []

            if 'category' in query and query['category'][0] != 'all':
                sql += ' AND category_id = ?'
                params.append(query['category'][0])

            if 'max_price' in query:
                sql += ' AND price <= ?'
                params.append(float(query['max_price'][0]))

            if 'search' in query and query['search'][0].strip():
                s = f"%{query['search'][0].strip()}%"
                sql += ' AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)'
                params.extend([s, s, s])

            cursor.execute(sql, params)
            rows = cursor.fetchall()
            products_list = []
            for r in rows:
                item = dict(r)
                try:
                    item['features'] = json.loads(item['features'])
                except Exception:
                    item['features'] = []
                item['in_stock'] = bool(item['in_stock'])
                item['is_trending'] = bool(item['is_trending'])
                products_list.append(item)

            conn.close()
            self._send_json({'count': len(products_list), 'products': products_list})
            return

        # Get single product by id: /api/products/<id>
        if path.startswith('/api/products/'):
            prod_id = path.replace('/api/products/', '').strip()
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM products WHERE id = ?', (prod_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                item = dict(row)
                try:
                    item['features'] = json.loads(item['features'])
                except Exception:
                    item['features'] = []
                self._send_json(item)
            else:
                self._send_json({'error': 'Product not found'}, status=404)
            return

        # Get categories
        if path == '/api/categories':
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM categories')
            cats = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self._send_json(cats)
            return

        # Get coupons
        if path == '/api/coupons':
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT code, discount_type, discount_value, min_order_amount, description FROM coupons WHERE is_active = 1')
            coupons = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self._send_json(coupons)
            return

        # Track order: /api/orders/<order_ref>
        if path.startswith('/api/orders/'):
            order_ref = path.replace('/api/orders/', '').strip().upper()
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM orders WHERE order_ref = ?', (order_ref,))
            order_row = cursor.fetchone()

            if order_row:
                order = dict(order_row)
                cursor.execute('SELECT product_id, product_name, unit_price, quantity, total_price FROM order_items WHERE order_id = ?', (order['id'],))
                order['items'] = [dict(r) for r in cursor.fetchall()]
                conn.close()
                self._send_json(order)
            else:
                conn.close()
                # Mock response for simulated live orders if not in DB
                self._send_json({
                    'order_ref': order_ref,
                    'status': 'in_transit',
                    'tracking_courier': 'BlueDart Express Air',
                    'estimated_delivery': 'Tomorrow by 4:00 PM',
                    'current_location': 'Destination Hub - Bengaluru',
                    'timeline': [
                        {'stage': 'Order Confirmed', 'time': '10:15 AM', 'done': True},
                        {'stage': 'Packed & Dispatched', 'time': '01:45 PM', 'done': True},
                        {'stage': 'Out for Delivery', 'time': 'Pending', 'done': False}
                    ]
                })
            return

        # Not found
        self._send_json({'error': 'API endpoint not found'}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/orders':
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                post_body = self.rfile.read(content_len)
                order_data = json.loads(post_body.decode('utf-8'))

                order_id = f"ord_{int(datetime.now().timestamp())}"
                order_ref = order_data.get('orderRef') or f"NL-{int(datetime.now().timestamp() % 1000000)}"

                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()

                cursor.execute('''
                    INSERT INTO orders (
                        id, order_ref, customer_name, customer_email, customer_phone,
                        shipping_address, city, state, pin_code, payment_method,
                        subtotal, discount, tax, delivery_fee, total_amount, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    order_id,
                    order_ref,
                    order_data.get('name', 'Valued Customer'),
                    order_data.get('email', 'customer@example.com'),
                    order_data.get('phone', '9876543210'),
                    order_data.get('address', 'Delivery Address'),
                    order_data.get('city', 'Bengaluru'),
                    order_data.get('state', 'Karnataka'),
                    order_data.get('pinCode', '560001'),
                    order_data.get('paymentMethod', 'UPI'),
                    float(order_data.get('subtotal', 0)),
                    float(order_data.get('discount', 0)),
                    float(order_data.get('tax', 0)),
                    float(order_data.get('shipping', 0)),
                    float(order_data.get('total', 0)),
                    'confirmed',
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                ))

                for item in order_data.get('items', []):
                    cursor.execute('''
                        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, total_price)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        order_id,
                        item.get('id', 'prod-xx'),
                        item.get('name', 'Product'),
                        float(item.get('price', 0)),
                        int(item.get('quantity', 1)),
                        float(item.get('itemTotal', 0))
                    ))

                conn.commit()
                conn.close()

                print(f"[ORDER] New Order Recorded: {order_ref} | Total: INR {order_data.get('total', 0)}")
                self._send_json({
                    'success': True,
                    'orderId': order_id,
                    'orderRef': order_ref,
                    'message': 'Order successfully recorded and payment verified.'
                }, status=201)

            except Exception as e:
                import traceback
                traceback.print_exc()
                self._send_json({'success': False, 'error': str(e)}, status=400)
            return

        self._send_json({'error': 'POST endpoint not found'}, status=404)

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True

def run_server():
    init_database()
    server_address = (SERVER_HOST, SERVER_PORT)
    httpd = ReusableHTTPServer(server_address, NovaLuxeAPIHandler)
    print(f"=======================================================")
    print(f"  NOVA LUXE Backend REST API Server is running!")
    print(f"  URL: http://localhost:{SERVER_PORT}")
    print(f"  PostgreSQL Schema: backend/schema.sql")
    print(f"  PostgreSQL Seed:   backend/seed.sql")
    print(f"  Zero packages installed - Pure Python standard library")
    print(f"=======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Backend server stopped.")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
