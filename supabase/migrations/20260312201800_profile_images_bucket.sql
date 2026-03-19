-- ============================================================
-- Create the profile-images Storage bucket and set RLS policies
-- Idempotent: safe to run even if bucket and policies already exist
-- ============================================================

-- 1. Create the bucket (public = true so images can be served without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow any authenticated user to upload/update files under their OWN user ID prefix
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow public read for all profile images (bucket is public, but belt-and-suspenders)
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
CREATE POLICY "Anyone can view profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');
