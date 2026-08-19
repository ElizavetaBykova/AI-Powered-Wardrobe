-- Liked outfits (user-curated snapshots of generated outfits)
-- Apply with: supabase db push

CREATE TABLE IF NOT EXISTS liked_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outfit_key TEXT NOT NULL,
  name TEXT,
  occasion TEXT,
  description TEXT,
  season TEXT,
  item_ids JSONB NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, outfit_key)
);

ALTER TABLE liked_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own liked outfits"
  ON liked_outfits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liked outfits"
  ON liked_outfits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own liked outfits"
  ON liked_outfits FOR DELETE USING (auth.uid() = user_id);
