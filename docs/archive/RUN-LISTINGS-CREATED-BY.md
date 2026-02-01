# Agent-owned listings (created_by_user_id)

Agents can only see, edit, and delete their own listings. Admins see and can manage all.

## 1. Run the migration

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- File: supabase/migrations/listings_created_by_user_id.sql
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
COMMENT ON COLUMN listings.created_by_user_id IS 'User (admin/agent) who created the listing; agents can only manage their own.';
```

## 2. Ensure agents have a user profile

If an agent gets **403 User profile not found** when opening Admin → Listings:

- Re-run test user script (creates/updates profiles):  
  `python tests/scripts/create-test-users.py`
- Or insert a profile manually in SQL (use the user’s auth id and email):

```sql
INSERT INTO user_profiles (id, email, full_name, role)
VALUES ('<AGENT_AUTH_USER_ID>', 'agent@example.com', 'Agent Name', 'agent')
ON CONFLICT (id) DO UPDATE SET role = 'agent', full_name = 'Agent Name';
```

## Behaviour

- **GET /listings/admin/all**  
  Admin: all listings. Agent: only rows where `created_by_user_id` = their user id.
- **POST /listings/**  
  Sets `created_by_user_id` to the current user (admin or agent).
- **PUT /listings/:id**  
  Admin: any listing. Agent: only if `created_by_user_id` = their id.
- **DELETE /listings/:id**  
  Admin: any listing. Agent: only if `created_by_user_id` = their id.

Frontend does not need changes: it keeps calling `/listings/admin/all`; the backend returns all for admin and only the agent’s listings for agent.
