-- Add last_visit column to allievi table
-- Run this in Supabase SQL Editor

-- Add last_visit column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'allievi'
    AND column_name = 'last_visit'
  ) THEN
    ALTER TABLE allievi
    ADD COLUMN last_visit TIMESTAMPTZ DEFAULT NOW();

    RAISE NOTICE 'Column last_visit added successfully';
  ELSE
    RAISE NOTICE 'Column last_visit already exists';
  END IF;
END $$;

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_allievi_last_visit
ON allievi(last_visit);

-- Comment on column
COMMENT ON COLUMN allievi.last_visit IS 'Timestamp dell''ultima visita dell''allievo alla homepage (per notifiche nuove lezioni)';
