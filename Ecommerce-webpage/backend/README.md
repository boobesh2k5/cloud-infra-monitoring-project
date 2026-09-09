# ⚡ NOVA LUXE - Backend REST API & PostgreSQL Database

All server-side code, PostgreSQL database schemas, and seed data.

## Structure
- `schema.sql` — PostgreSQL database schema (categories, products, coupons, orders, order_items)
- `seed.sql` — Seed data with 24 products in INR, categories, and active coupons
- `config.py` — Database and server configuration
- `server.py` — Zero-dependency Python standard library REST API server
- `start.bat` — 1-click launcher for backend on http://localhost:8000

## How to Run
Double click `start.bat` or run:
```bash
python server.py
```
Zero packages to install (no pip install needed)!

## PostgreSQL Setup
```bash
psql -U postgres -d novaluxe_db -f schema.sql
psql -U postgres -d novaluxe_db -f seed.sql
```
