# Listing photos storage

**Required:** Run the listings image columns migration first (otherwise create/update listing will 500):

1. In **Supabase → SQL Editor**, run the file **`RUN-LISTINGS-IMAGE-COLUMNS.sql`** (adds `image_url` and `extra_image_urls` to `listings`).

Photo uploads use Supabase Storage. The backend will try to create the bucket automatically on first upload.

If you see "Upload failed. Ensure the listing-photos bucket exists and is public", create it manually:

1. **Supabase Dashboard** → **Storage** → **New bucket**
2. Name: `listing-photos`
3. **Public bucket**: ON (so listing images are viewable without auth)
4. Optional: set **Allowed MIME types** to `image/jpeg`, `image/png`, `image/webp` and **File size limit** to 5242880 (5MB).

Then run the migration for the extra URLs column: in **SQL Editor** run `supabase/migrations/listing_extra_image_urls.sql`.
