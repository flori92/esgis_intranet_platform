-- ============================================================
-- Migration: Fix RLS permissions by removing auth.users access
-- Date: 2026-04-05
-- Description:
--   Removes all direct references to auth.users in RLS policies,
--   as they cause "permission denied for table users" errors for
--   standard users (anon/authenticated).
--   Uses public.profiles for role verification instead.
-- ============================================================

-- ============================================================
-- 1. Helper Function for Admin Check (Security Definer)
-- ============================================================
-- Using a security definer function allows us to bypass RLS for the check itself
-- and avoids any recursion issues.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- ============================================================
-- 2. Fix PROFILES Policies
-- ============================================================

-- Supprimer les politiques problématiques sur profiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- SELECT: tout le monde peut voir tous les profils
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- INSERT: l'utilisateur peut créer son propre profil, ou un admin peut créer pour les autres
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR public.check_is_admin()
  );

-- UPDATE: l'utilisateur peut modifier son propre profil, ou un admin peut tout modifier
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR public.check_is_admin()
  )
  WITH CHECK (
    auth.uid() = id
    OR public.check_is_admin()
  );

-- DELETE: seuls les admins
CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (
    public.check_is_admin()
  );

-- ============================================================
-- 3. Fix ALLOWED_EMAILS Policies
-- ============================================================

DROP POLICY IF EXISTS "allowed_emails_insert_admin" ON public.allowed_emails;
DROP POLICY IF EXISTS "allowed_emails_update_admin" ON public.allowed_emails;
DROP POLICY IF EXISTS "allowed_emails_delete_admin" ON public.allowed_emails;

CREATE POLICY "allowed_emails_insert_admin"
  ON allowed_emails FOR INSERT
  WITH CHECK (public.check_is_admin());

CREATE POLICY "allowed_emails_update_admin"
  ON allowed_emails FOR UPDATE
  USING (public.check_is_admin());

CREATE POLICY "allowed_emails_delete_admin"
  ON allowed_emails FOR DELETE
  USING (public.check_is_admin());

-- ============================================================
-- 4. Fix USER_ROLES Policies
-- ============================================================

DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;

CREATE POLICY "user_roles_admin_insert"
  ON user_roles FOR INSERT
  WITH CHECK (public.check_is_admin());

CREATE POLICY "user_roles_admin_delete"
  ON user_roles FOR DELETE
  USING (public.check_is_admin());

-- ============================================================
-- 5. Fix CUSTOM_ROLES Policies
-- ============================================================

DROP POLICY IF EXISTS "custom_roles_admin_modify" ON public.custom_roles;

CREATE POLICY "custom_roles_admin_modify"
  ON custom_roles FOR ALL
  USING (public.check_is_admin());
