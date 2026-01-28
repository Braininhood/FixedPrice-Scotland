# SSL Certificates

This directory contains SSL certificates for secure database connections.

## Certificate File

- **`prod-ca-2021.crt`**: Supabase Production CA Certificate (2021)
  - This is the Certificate Authority (CA) certificate for Supabase's production database
  - Used to verify SSL connections to Supabase PostgreSQL databases
  - Required for secure, encrypted database connections

## Usage

The certificate is automatically used by:
- `backend/init_db.py` - Database initialization scripts
- `backend/app/core/db_connection.py` - Secure database connection utilities

## SSL Configuration

SSL is enforced with `sslmode='require'`, which:
- ✅ **Enforces SSL** on all database connections
- ✅ **Rejects non-SSL connections** for security
- ✅ **Verifies the server certificate** using this CA certificate

## Security

- This is a **public CA certificate** (safe to commit to git)
- It does not contain any private keys or secrets
- It's used to verify the identity of Supabase's database servers
- All database connections are encrypted when using this certificate

## Configuration

The certificate path is configured in:
- `backend/app/core/config.py` - `DB_SSL_CERT_PATH`
- `backend/.env` - `DB_SSL_CERT_PATH=backend/certs/prod-ca-2021.crt`

## Updating the Certificate

If Supabase updates their CA certificate:
1. Download the new certificate from Supabase
2. Replace `prod-ca-2021.crt` with the new certificate
3. Update the filename in configuration if needed
