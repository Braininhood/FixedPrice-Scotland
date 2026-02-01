# Roles and Dashboards

## Can admin change user roles?

**Yes (after implementation).** Only admins can change other users’ roles. They do this from the **Account** page when logged in as admin: an **Admin – User management** section lists users and allows changing each user’s role (admin, agent, buyer). The API endpoints used are admin-only: `GET /api/v1/users` (list users) and `PATCH /api/v1/users/{user_id}/role` (set role). Users cannot change their own role via **Settings** or **PUT /me**.

---

## Is the admin dashboard different and can it manage everything?

**Yes.** The same **Account** page (`/account`) is used for all roles, but **only admins** see the **Admin – User management** block. There is no separate “/admin” URL; admin capabilities are available on the account page. Admins can:

- Do everything agents and buyers can (profile, subscription, saved searches, listings).
- **Manage users**: list all users and change any user’s role (admin, agent, buyer).

Backend access is role-based: admin-only endpoints (classifications, ingestion stats, postcode stats, Zoopla, and user list/set-role) require the `admin` role; listing create/update allows `admin` and `agent`; buyers use listings (read), saved searches, and subscription.

---

## Are there different dashboards for other roles?

**One account “dashboard” (Account page), with content that varies by role:**

| Role   | Same for everyone                         | Role-specific                                         |
|--------|-------------------------------------------|--------------------------------------------------------|
| **All** | Profile, Settings, Subscription (if any), Saved Searches (if subscribed) | — |
| **Admin** | — | **User management**: list users, change any user’s role. |
| **Agent** | — | Same account view as buyer; backend can create/update listings. |
| **Buyer** | — | Same account view; backend can use saved searches and subscription. |

There is no separate agent-only or buyer-only dashboard page. The difference is:

- **What appears on Account**: only admins see the User management section.
- **What the backend allows**: admin-only, admin+agent, and buyer-specific endpoints (see Test Users Guide).

Redirects after login/signup go to **Account** (`/account`), not a separate dashboard URL.
