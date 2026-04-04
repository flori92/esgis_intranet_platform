-- ============================================================
-- Migration: Système d'emails approuvés + Fix RLS profiles
-- Date: 2026-04-04
-- Description:
--   1. Crée la table allowed_emails pour que l'admin puisse
--      pré-approuver les emails (Gmail, etc.) autorisés à se connecter
--   2. Corrige la récursion infinie dans les politiques RLS de profiles
-- ============================================================

-- ============================================================
-- 1. TABLE allowed_emails
-- ============================================================
CREATE TABLE IF NOT EXISTS allowed_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'professor', 'student')),
  full_name VARCHAR(100),
  department_id INTEGER REFERENCES departments(id),
  level VARCHAR(10) CHECK (level IN ('L1', 'L2', 'L3', 'M1', 'M2')),
  added_by UUID REFERENCES auth.users(id),
  is_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par email
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);
CREATE INDEX IF NOT EXISTS idx_allowed_emails_role ON allowed_emails(role);

-- RLS sur allowed_emails
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire (nécessaire pour la vérification à la connexion)
CREATE POLICY "allowed_emails_select_all"
  ON allowed_emails FOR SELECT
  USING (true);

-- Seuls les admins peuvent insérer/modifier/supprimer
CREATE POLICY "allowed_emails_insert_admin"
  ON allowed_emails FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "allowed_emails_update_admin"
  ON allowed_emails FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "allowed_emails_delete_admin"
  ON allowed_emails FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================
-- 2. FIX RLS PROFILES (supprime récursion infinie)
-- ============================================================
-- Le problème: les anciennes politiques faisaient
--   SELECT ... FROM profiles WHERE role = 'admin'
-- ce qui re-déclenchait la même politique RLS → récursion infinie.
--
-- Solution: utiliser auth.users.raw_user_meta_data au lieu de
-- re-querier la table profiles.
-- ============================================================

-- Supprimer TOUTES les politiques existantes sur profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- S'assurer que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: tout le monde peut voir tous les profils (nécessaire pour annuaire, etc.)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- INSERT: l'utilisateur peut créer son propre profil, ou un admin peut créer pour les autres
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- UPDATE: l'utilisateur peut modifier son propre profil, ou un admin peut tout modifier
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- DELETE: seuls les admins
CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
