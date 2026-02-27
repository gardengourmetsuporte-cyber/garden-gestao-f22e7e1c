-- Drop conflicting policy name first
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;

-- Recreate with correct bucket
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Upload
CREATE POLICY "Authenticated users can upload product images to product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Update (upsert)
CREATE POLICY "Authenticated users can update product images in product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Delete
CREATE POLICY "Authenticated users can delete product images in product-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);