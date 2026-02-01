# Database Migrations

This folder contains historical database migration scripts and setup SQL files.

## Contents

### Setup Scripts
- `DATABASE-SETUP.sql` - Initial database setup
- `DATABASE-SETUP-AUTOMATED.sql` - Automated database setup

### Fix Scripts
- `QUICK-FIX-SIGNUP.sql` - Signup fix
- `FIX-SIGNUP-500-ERROR.sql` - Signup error fix
- `FIX-USER-ID-MISMATCH-FINAL.sql` - User ID mismatch fix
- `DELETE-AND-RECREATE-PROFILE.sql` - Profile recreation script

### Feature Migrations
- `RUN-LISTINGS-IMAGE-COLUMNS.sql` - Image columns migration
- `RUN-CONTENT-BLOCKS-IN-SUPABASE.sql` - Content blocks setup
- `DISABLE-RLS.sql` - RLS disable script (for development)

### Execution Scripts
- `RUN-THIS-IN-SUPABASE.sql` - General execution script

## Active Migrations

For active, versioned migrations that should be run in order, see:
- `supabase/migrations/` - Active Supabase migrations

## Usage

⚠️ **Warning**: These are historical/reference scripts. Only run them if you understand what they do and why you need them.

For current database setup, refer to:
- `docs/schema.sql` - Current database schema
- `supabase/migrations/` - Active migration files
