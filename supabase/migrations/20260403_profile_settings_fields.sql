-- Migration: Extension du profil utilisateur pour les paramètres et informations personnelles
-- Date: 2026-04-03

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS secondary_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cv_url TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS language VARCHAR(5) NOT NULL DEFAULT 'fr';

UPDATE profiles
SET
  first_name = COALESCE(
    NULLIF(first_name, ''),
    NULLIF(split_part(full_name, ' ', 1), '')
  ),
  last_name = COALESCE(
    NULLIF(last_name, ''),
    CASE
      WHEN position(' ' in full_name) > 0 THEN NULLIF(btrim(substring(full_name from position(' ' in full_name) + 1)), '')
      ELSE NULL
    END
  )
WHERE full_name IS NOT NULL;
