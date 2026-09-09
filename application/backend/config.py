# =========================================================
# NOVA LUXE Backend Database Configuration
# =========================================================

import os

# PostgreSQL Connection Settings (Defaults to standard local postgres credentials)
DB_CONFIG = {
    'host': os.environ.get('POSTGRES_HOST', 'localhost'),
    'port': int(os.environ.get('POSTGRES_PORT', 5432)),
    'database': os.environ.get('POSTGRES_DB', 'novaluxe_db'),
    'user': os.environ.get('POSTGRES_USER', 'postgres'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'postgres')
}

# API Server Settings
SERVER_PORT = int(os.environ.get('API_PORT', 8000))
SERVER_HOST = os.environ.get('API_HOST', '0.0.0.0')

# Currency Settings
STORE_CURRENCY = 'INR'
STORE_CURRENCY_SYMBOL = '₹'
