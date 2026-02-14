-- Add avatar_url column to allievi table
-- Run this in Supabase SQL Editor

-- Add avatar_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'allievi'
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE allievi
    ADD COLUMN avatar_url TEXT;

    RAISE NOTICE 'Column avatar_url added successfully';
  ELSE
    RAISE NOTICE 'Column avatar_url already exists';
  END IF;
END $$;

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_allievi_avatar_url
ON allievi(avatar_url)
WHERE avatar_url IS NOT NULL;

-- Comment on column
COMMENT ON COLUMN allievi.avatar_url IS 'URL pubblico dell''immagine avatar dell''allievo (Supabase Storage)';
