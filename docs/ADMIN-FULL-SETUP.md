# Admin panel – full setup and capabilities

## 1. Backend (what was added)

### Users (admin)
- **POST /api/v1/users/** – Create user (email, password, full_name, role). Uses Supabase Auth Admin + `user_profiles` insert.
- **PUT /api/v1/users/{user_id}** – Update user (full_name, phone, role).

### Subscriptions (admin)
- **GET /api/v1/subscriptions/all** – List all subscriptions (paginated, optional status filter).
- **POST /api/v1/subscriptions/** – Create subscription for a user (user_id, plan_type, status).
- **PATCH /api/v1/subscriptions/{subscription_id}** – Update status or cancel_at_period_end.

### Listings (admin)
- **GET /api/v1/listings/admin/all** – List all listings (including inactive), with filters.
- **DELETE /api/v1/listings/{listing_id}** – Delete a listing.

### Admin
- **GET /api/v1/admin/stats** – Counts (users, listings, subscriptions, active subscriptions).
- **GET /api/v1/admin/analytics** – Extended stats (by role, by status, active listings).
- **GET /api/v1/admin/content** – List content blocks.
- **GET /api/v1/admin/content/{key}** – Get one block.
- **PUT /api/v1/admin/content/{key}** – Update block (title, body).

---

## 2. Frontend (what was added)

### Admin sidebar
- Dashboard, Users, Listings, Subscriptions, **Analytics**, **Content**.
- **API Docs** – link to `getApiOrigin() + '/docs'` (e.g. http://localhost:8000/docs).
- **Database (Supabase)** – link to Supabase dashboard (from `NEXT_PUBLIC_SUPABASE_URL` project ref).

### Users
- **Add user** – dialog: email, password, full name, role → POST /users/.
- **Edit user** – dialog: full name, phone, role → PUT /users/{id}.
- Table: email, name, phone, role, joined, actions (Edit + role dropdown).

### Listings
- **Add listing** – /admin/listings/new (existing).
- **Edit listing** – /admin/listings/[id]/edit (form, PUT /listings/{id}).
- **Delete** – confirm dialog, DELETE /listings/{id}.
- Table: View (site), Edit (admin edit page), Delete.

### Subscriptions
- **Add subscription** – dialog: select user, plan → POST /subscriptions/.
- **Set status** – dropdown per row (active/canceled/past_due/trialing) → PATCH.
- **Cancel at end** – button → PATCH cancel_at_period_end: true.

### Analytics
- **/admin/analytics** – cards: users total & by role, listings total & active, subscriptions total & by status.

### Content
- **/admin/content** – list blocks; click to edit title/body → PUT /admin/content/{key}.
- Requires `content_blocks` table (see below).

---

## 3. Content blocks (optional)

To use **Content management** in admin:

1. Open **Supabase → SQL Editor**.
2. Run the migration that creates `content_blocks` and seeds default keys:

**File:** `supabase/migrations/content_blocks.sql`

```sql
CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT,
  body TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO content_blocks (key, title, body) VALUES
  ('privacy', 'Privacy Policy', ''),
  ('terms', 'Terms of Service', ''),
  ('about', 'About Us', '')
ON CONFLICT (key) DO NOTHING;
```

3. After that, Admin → Content will list and edit these blocks. Public pages can later read from the same table if you add a public GET endpoint.

---

## 4. API Docs and Database links

- **API Docs** – Uses `getApiOrigin()` from `@/lib/api/client` (strips `/api/v1` from `NEXT_PUBLIC_API_URL`). So with `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`, the link is http://localhost:8000/docs.
- **Database** – Builds Supabase dashboard URL from `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://xxx.supabase.co` → `https://supabase.com/dashboard/project/xxx`). Ensure `NEXT_PUBLIC_SUPABASE_URL` is set in the frontend `.env`.

---

## 5. Step-by-step checklist

1. **Backend**
   - Restart backend so new routes and dependencies are loaded.
   - Confirm admin user exists in `user_profiles` with `role = 'admin'`.

2. **Frontend**
   - Ensure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SUPABASE_URL` are set.
   - Log in as admin and open **/admin**.

3. **Users**
   - Use **Add user** to create users (creates auth user + profile).
   - Use **Edit** to change name, phone, role.

4. **Listings**
   - Use **Add listing** or **Edit** (pencil) to create/update; **Delete** to remove.

5. **Subscriptions**
   - Use **Add subscription** to assign a plan to a user.
   - Use status dropdown and **Cancel at end** to manage subscriptions.

6. **Analytics**
   - Open **/admin/analytics** to see stats (no extra setup).

7. **Content** (optional)
   - Run `content_blocks.sql` in Supabase, then use **/admin/content** to edit blocks.

8. **API Docs / Database**
   - Use sidebar links; they open in a new tab. If Database link is wrong, check `NEXT_PUBLIC_SUPABASE_URL`.

---

## 6. Summary

- **User management** – Add user, edit (name, phone, role), change role from table.
- **Listings** – Full CRUD: list (admin/all), create (new), edit (edit page), delete.
- **Subscriptions** – List all, add for any user, set status, cancel at period end.
- **Analytics** – Visible at /admin/analytics with role and status breakdowns.
- **Content** – Edit blocks after creating `content_blocks` table.
- **API Docs** – Working link from sidebar using backend origin.
- **Database** – Supabase dashboard link from project URL.

Admin has full functionality and access as intended.
