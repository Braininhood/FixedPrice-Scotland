# SSL Database Configuration

## Overview

The FixedPrice Scotland application now enforces SSL connections to the Supabase PostgreSQL database, rejecting all non-SSL connections for enhanced security.

---

## Certificate Location

**Certificate File**: `backend/certs/prod-ca-2021.crt`  
**Type**: Supabase Production CA Certificate (2021)  
**Purpose**: Verify SSL connections to Supabase PostgreSQL databases

---

## Configuration

### Environment Variables

Added to `backend/.env`:
```bash
# SSL Configuration for Database Connections
DB_SSL_MODE=require
DB_SSL_CERT_PATH=backend/certs/prod-ca-2021.crt
```

### SSL Mode: `require`

The `sslmode='require'` setting:
- ✅ **Enforces SSL** on all database connections
- ✅ **Rejects non-SSL connections** automatically
- ✅ **Verifies server certificate** using the CA certificate
- ✅ **Encrypts all data** in transit

---

## Implementation

### 1. Certificate Placement

- **Location**: `backend/certs/prod-ca-2021.crt`
- **Status**: ✅ Moved from project root to secure location
- **Security**: Public CA certificate (safe to commit to git)

### 2. Updated Files

#### `backend/init_db.py`
- Updated to use SSL with certificate verification
- Enforces SSL mode: `require`
- Validates certificate file exists before connecting

#### `backend/app/core/config.py`
- Added `DB_SSL_CERT_PATH` configuration
- Added `DB_SSL_MODE` configuration (default: `require`)

#### `backend/app/core/db_connection.py` (NEW)
- New utility module for secure database connections
- Provides `get_db_connection()` function with SSL enforcement
- Includes `test_ssl_connection()` for testing

### 3. Configuration Files

- ✅ `backend/.env` - Updated with SSL settings
- ✅ `backend/.env.example` - Updated with SSL settings
- ✅ `backend/certs/README.md` - Certificate documentation

---

## Usage

### Direct PostgreSQL Connections (psycopg2)

All direct PostgreSQL connections now automatically use SSL:

```python
from backend.app.core.db_connection import get_db_connection

# This connection enforces SSL and rejects non-SSL
conn = get_db_connection()
```

### Database Initialization

When running `init_db.py`, SSL is automatically enforced:

```bash
cd backend
python init_db.py
```

Output will show:
```
Connecting to Supabase Postgres database with SSL...
Using SSL certificate: /path/to/backend/certs/prod-ca-2021.crt
SSL mode: require (non-SSL connections will be rejected)
```

---

## Security Benefits

1. **Encrypted Connections**: All database traffic is encrypted
2. **Certificate Verification**: Server identity is verified
3. **Non-SSL Rejection**: Non-encrypted connections are automatically rejected
4. **Data Protection**: Prevents man-in-the-middle attacks

---

## Testing SSL Connection

You can test the SSL connection using the utility function:

```python
from backend.app.core.db_connection import test_ssl_connection

# Test SSL connection
if test_ssl_connection():
    print("✅ SSL connection successful!")
else:
    print("❌ SSL connection failed!")
```

---

## Troubleshooting

### Certificate Not Found

**Error**: `FileNotFoundError: SSL certificate not found`

**Solution**:
1. Verify certificate exists at `backend/certs/prod-ca-2021.crt`
2. Check `DB_SSL_CERT_PATH` in `.env` file
3. Ensure path is relative to project root

### SSL Connection Failed

**Error**: `psycopg2.OperationalError: SSL connection required`

**Possible Causes**:
1. Database server doesn't support SSL
2. Certificate is invalid or expired
3. Network firewall blocking SSL connections

**Solution**:
1. Verify Supabase database supports SSL (it does by default)
2. Check certificate is valid and not expired
3. Verify network allows SSL connections on port 5432

### Non-SSL Connection Attempt

**Behavior**: Connection is automatically rejected

**Expected**: This is the correct security behavior. All connections must use SSL.

---

## SSL Mode Options

The `DB_SSL_MODE` can be configured (not recommended to change from `require`):

- `disable`: No SSL (NOT RECOMMENDED)
- `allow`: Try SSL, fallback to non-SSL (NOT RECOMMENDED)
- `prefer`: Prefer SSL, fallback to non-SSL (NOT RECOMMENDED)
- `require`: **Require SSL** (RECOMMENDED - Current setting)
- `verify-ca`: Require SSL + verify CA certificate
- `verify-full`: Require SSL + verify CA + verify hostname

**Current Setting**: `require` - Enforces SSL and rejects non-SSL connections

---

## Supabase Client Library

**Note**: The Supabase Python client library (`supabase-py`) automatically handles SSL for API connections. This SSL configuration is specifically for direct PostgreSQL connections using `psycopg2`.

---

## Files Modified/Created

### Created
- ✅ `backend/certs/prod-ca-2021.crt` - SSL certificate (moved from root)
- ✅ `backend/certs/README.md` - Certificate documentation
- ✅ `backend/app/core/db_connection.py` - SSL connection utilities

### Modified
- ✅ `backend/init_db.py` - Added SSL enforcement
- ✅ `backend/app/core/config.py` - Added SSL configuration
- ✅ `backend/.env` - Added SSL settings
- ✅ `backend/.env.example` - Added SSL settings

---

## Verification

To verify SSL is working:

1. **Check certificate exists**:
   ```bash
   ls backend/certs/prod-ca-2021.crt
   ```

2. **Test connection**:
   ```python
   from backend.app.core.db_connection import test_ssl_connection
   test_ssl_connection()
   ```

3. **Check configuration**:
   ```bash
   grep DB_SSL backend/.env
   ```

---

## Next Steps

✅ SSL configuration is complete and enforced. All database connections now:
- Use SSL encryption
- Verify server certificates
- Reject non-SSL connections

The application is now more secure with encrypted database communications.

---

## Version History

- **v1.0** (2026-01-24): Initial SSL configuration
  - Moved certificate to `backend/certs/`
  - Configured SSL enforcement in `init_db.py`
  - Created `db_connection.py` utility module
  - Set SSL mode to `require` (rejects non-SSL)
