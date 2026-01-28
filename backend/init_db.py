import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init_db():
    print("Connecting to Supabase Postgres database with SSL...")
    
    try:
        # Get database connection parameters
        host = os.getenv("DB_HOST")
        database = os.getenv("DB_NAME")
        user = os.getenv("DB_USER")
        password = os.getenv("SUPABASE_DB_PASSWORD")
        port = os.getenv("DB_PORT", "5432")
        
        # Get SSL certificate path
        cert_path = os.getenv("DB_SSL_CERT_PATH", "backend/certs/prod-ca-2021.crt")
        ssl_mode = os.getenv("DB_SSL_MODE", "require")
        
        # Resolve absolute path to certificate
        if not os.path.isabs(cert_path):
            # Get the project root directory (parent of backend)
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(backend_dir)
            cert_path = os.path.join(project_root, cert_path)
        
        # Verify certificate file exists
        if not os.path.exists(cert_path):
            raise FileNotFoundError(
                f"SSL certificate not found at: {cert_path}\n"
                "Please ensure prod-ca-2021.crt is in backend/certs/"
            )
        
        print(f"Using SSL certificate: {cert_path}")
        print(f"SSL mode: {ssl_mode} (non-SSL connections will be rejected)")

        # Connect to the database with SSL enforcement
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
        
        # Create a cursor
        cur = conn.cursor()
        
        # Read the schema.sql file
        schema_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'schema.sql')
        print(f"Reading schema from {schema_path}...")
        
        with open(schema_path, 'r') as f:
            sql_script = f.read()
            
        # Execute the SQL script
        print("Executing SQL script to create tables and RLS policies...")
        cur.execute(sql_script)
        
        # Commit the changes
        conn.commit()
        
        print("Database initialized successfully!")
        
        # Close the connection
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    init_db()
