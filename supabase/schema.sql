-- Run this in the Supabase SQL editor (https://app.supabase.com → your project → SQL Editor)

-- 1. Clothing items table
CREATE TABLE clothing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  name TEXT,
  type TEXT,
  color TEXT,
  colors TEXT[],
  style TEXT,
  season TEXT[],
  description TEXT,
  warmth_level INTEGER CHECK (warmth_level BETWEEN 1 AND 5),
  occasion TEXT[],
  material TEXT,
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Row Level Security — users can only see/edit their own items
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items"
  ON clothing_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON clothing_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON clothing_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON clothing_items FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Storage bucket (run AFTER creating the bucket named "clothing-images" in Storage UI)
-- In Supabase dashboard: Storage → New bucket → name: "clothing-images" → Public: ON

INSERT INTO storage.buckets (id, name, public) VALUES ('clothing-images', 'clothing-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public image access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clothing-images');

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Saved outfit collections
CREATE TABLE outfit_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outfits JSONB NOT NULL,
  item_map JSONB NOT NULL,
  wardrobe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE outfit_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outfit collections"
  ON outfit_collections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit collections"
  ON outfit_collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfit collections"
  ON outfit_collections FOR DELETE USING (auth.uid() = user_id);
