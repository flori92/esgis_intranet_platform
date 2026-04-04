-- ============================================================
-- Migration: RBAC — Assignation de rôles personnalisés aux utilisateurs
-- Date: 2026-04-04
-- ============================================================

-- Table de liaison entre utilisateurs et rôles custom
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_all"
  ON user_roles FOR SELECT USING (true);

CREATE POLICY "user_roles_admin_insert"
  ON user_roles FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "user_roles_admin_delete"
  ON user_roles FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Vue pour compter les assignations par rôle
CREATE OR REPLACE VIEW role_user_counts AS
SELECT
  cr.id AS role_id,
  cr.name,
  cr.label,
  COUNT(ur.user_id) AS user_count
FROM custom_roles cr
LEFT JOIN user_roles ur ON ur.role_id = cr.id
GROUP BY cr.id, cr.name, cr.label;
