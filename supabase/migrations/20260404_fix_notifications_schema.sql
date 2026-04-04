-- Migration pour corriger le schéma de la table notifications
-- pour correspondre aux attentes du frontend
-- Date: 2026-04-04

-- ============================================
-- TABLE: notifications
-- ============================================

-- 1. Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_role TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS content TEXT;

-- 2. Copier les données de message vers content si nécessaire
UPDATE notifications SET title = COALESCE(title, 'Notification') WHERE title IS NULL;
UPDATE notifications SET content = message WHERE content IS NULL AND message IS NOT NULL;

-- 3. Supprimer les colonnes non utilisées et renommer si nécessaire
ALTER TABLE notifications DROP COLUMN IF EXISTS type;
ALTER TABLE notifications DROP COLUMN IF EXISTS link;

-- 4. Renommer is_read en read si nécessaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_new BOOLEAN DEFAULT FALSE;
    UPDATE notifications SET read_new = is_read WHERE is_read IS NOT NULL;
    ALTER TABLE notifications DROP COLUMN IF EXISTS is_read;
    ALTER TABLE notifications RENAME COLUMN read_new TO read;
  END IF;
END $$;

-- 5. Ajouter les index nécessaires
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================
-- TABLE: events
-- ============================================

-- 6. Ajouter les colonnes attendues par le frontend
ALTER TABLE events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'other';
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- 7. Migrer les données de start_time/end_time vers start_date/end_date si start_date est NULL
UPDATE events SET start_date = start_time WHERE start_date IS NULL AND start_time IS NOT NULL;
UPDATE events SET end_date = end_time WHERE end_date IS NULL AND end_time IS NOT NULL;

-- 8. Migrer event_type vers type si nécessaire
UPDATE events SET type = event_type WHERE type IS NULL OR type = 'other';

-- 9. Ajouter les index nécessaires pour events
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
