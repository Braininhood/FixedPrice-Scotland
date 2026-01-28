"""
Database connection utilities with SSL enforcement.

This module provides secure database connection functions that enforce SSL
and reject non-SSL connections to the Supabase PostgreSQL database.
"""
import os
from typing import Optional
import psycopg2
from psycopg2.extensions import connection
from app.core.config import settings


def get_db_connection() -> connection:
    """
    Create a secure PostgreSQL connection with SSL enforcement.
    
    This function enforces SSL connections and rejects non-SSL connections
    using the Supabase production CA certificate.
    
    Returns:
        psycopg2.connection: A PostgreSQL connection with SSL enabled
        
    Raises:
        FileNotFoundError: If SSL certificate is not found
        psycopg2.OperationalError: If connection fails or SSL is rejected
    """
    # Get database connection parameters
    host = os.getenv("DB_HOST", "")
    database = os.getenv("DB_NAME", "postgres")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("SUPABASE_DB_PASSWORD", "")
    port = os.getenv("DB_PORT", "5432")
    
    # Get SSL configuration
    cert_path = os.getenv("DB_SSL_CERT_PATH", settings.DB_SSL_CERT_PATH)
    ssl_mode = os.getenv("DB_SSL_MODE", settings.DB_SSL_MODE)
    
    # Resolve absolute path to certificate
    if not os.path.isabs(cert_path):
        # Get the project root directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_root = os.path.dirname(backend_dir)
        cert_path = os.path.join(project_root, cert_path)
    
    # Verify certificate file exists
    if not os.path.exists(cert_path):
        raise FileNotFoundError(
            f"SSL certificate not found at: {cert_path}\n"
            "Please ensure prod-ca-2021.crt is in backend/certs/"
        )
    
    # Connect with SSL enforcement
    # sslmode='require' enforces SSL and rejects non-SSL connections
    # sslrootcert specifies the CA certificate for verification
    conn = psycopg2.connect(
        host=host,
        database=database,
        user=user,
        password=password,
        port=port,
        sslmode=ssl_mode,  # 'require' enforces SSL, rejects non-SSL
        sslrootcert=cert_path  # Path to CA certificate
    )
    
    return conn


def test_ssl_connection() -> bool:
    """
    Test database connection with SSL enforcement.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # Test query
        cur.execute("SELECT version();")
        result = cur.fetchone()
        cur.close()
        conn.close()
        print(f"✅ SSL connection successful! PostgreSQL version: {result[0]}")
        return True
    except FileNotFoundError as e:
        print(f"❌ SSL certificate error: {e}")
        return False
    except psycopg2.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        if "SSL" in str(e) or "ssl" in str(e).lower():
            print("⚠️  This error may indicate SSL is required but not provided.")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
