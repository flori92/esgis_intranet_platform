-- Table des permissions CMS
-- Stocke les droits d'accès au CMS pour les utilisateurs
CREATE TABLE IF NOT EXISTS "public"."cms_permissions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "permission_type" TEXT NOT NULL DEFAULT 'viewer',
  "target_module" TEXT NOT NULL DEFAULT 'all',
  "granted_by" UUID NOT NULL,
  "granted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "revoked_at" TIMESTAMP WITH TIME ZONE,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("granted_by") REFERENCES "auth"."users" ("id") ON DELETE RESTRICT,
  UNIQUE (user_id, target_module, permission_type)
);

-- Table des logs d'accès CMS
-- Enregistre les actions effectuées dans le CMS pour l'audit
CREATE TABLE IF NOT EXISTS "public"."cms_access_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "target_table" TEXT NOT NULL,
  "target_id" UUID,
  "record_title" TEXT,
  "old_values" JSONB,
  "new_values" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS "idx_cms_permissions_user_id" ON "public"."cms_permissions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_cms_permissions_is_active" ON "public"."cms_permissions" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_cms_permissions_granted_by" ON "public"."cms_permissions" ("granted_by");
CREATE INDEX IF NOT EXISTS "idx_cms_access_logs_user_id" ON "public"."cms_access_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_cms_access_logs_action" ON "public"."cms_access_logs" ("action");
CREATE INDEX IF NOT EXISTS "idx_cms_access_logs_created_at" ON "public"."cms_access_logs" ("created_at");

-- Fonction utilitaire pour vérifier les permissions CMS
CREATE OR REPLACE FUNCTION "public"."has_cms_permission"(
  "p_user_id" UUID,
  "p_permission_type" TEXT,
  "p_target_module" TEXT DEFAULT 'all'
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1
    FROM "public"."cms_permissions"
    WHERE "user_id" = "p_user_id"
      AND "permission_type" >= "p_permission_type"
      AND ("target_module" = 'all' OR "target_module" = "p_target_module")
      AND "is_active" = TRUE
      AND ("revoked_at" IS NULL OR "revoked_at" > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction utilitaire pour enregistrer les actions CMS
CREATE OR REPLACE FUNCTION "public"."log_cms_action"(
  "p_user_id" UUID,
  "p_action" TEXT,
  "p_target_table" TEXT,
  "p_target_id" UUID DEFAULT NULL,
  "p_record_title" TEXT DEFAULT NULL,
  "p_old_values" JSONB DEFAULT NULL,
  "p_new_values" JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO "public"."cms_access_logs" (
    "user_id",
    "action",
    "target_table",
    "target_id",
    "record_title",
    "old_values",
    "new_values"
  ) VALUES (
    "p_user_id",
    "p_action",
    "p_target_table",
    "p_target_id",
    "p_record_title",
    "p_old_values",
    "p_new_values"
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction utilitaire pour récupérer les modules CMS auxquels un utilisateur a accès
CREATE OR REPLACE FUNCTION "public"."get_user_cms_modules"("p_user_id" UUID)
RETURNS SETOF TEXT AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT "target_module"
  FROM "public"."cms_permissions"
  WHERE "user_id" = "p_user_id"
    AND "is_active" = TRUE
    AND ("revoked_at" IS NULL OR "revoked_at" > now())
  UNION
  SELECT 'all' WHERE EXISTS(
    SELECT 1 FROM "public"."cms_permissions"
    WHERE "user_id" = "p_user_id"
      AND "target_module" = 'all'
      AND "is_active" = TRUE
      AND ("revoked_at" IS NULL OR "revoked_at" > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies pour cms_permissions
ALTER TABLE "public"."cms_permissions" ENABLE ROW LEVEL SECURITY;

-- Admin (users avec column is_admin = true) peut voir toutes les permissions
DROP POLICY IF EXISTS "cms_permissions_admin_view" ON "public"."cms_permissions";
CREATE POLICY "cms_permissions_admin_view" ON "public"."cms_permissions"
  FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admin peut créer des permissions
DROP POLICY IF EXISTS "cms_permissions_admin_create" ON "public"."cms_permissions";
CREATE POLICY "cms_permissions_admin_create" ON "public"."cms_permissions"
  FOR INSERT
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admin peut mettre à jour les permissions
DROP POLICY IF EXISTS "cms_permissions_admin_update" ON "public"."cms_permissions";
CREATE POLICY "cms_permissions_admin_update" ON "public"."cms_permissions"
  FOR UPDATE
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admin peut supprimer les permissions
DROP POLICY IF EXISTS "cms_permissions_admin_delete" ON "public"."cms_permissions";
CREATE POLICY "cms_permissions_admin_delete" ON "public"."cms_permissions"
  FOR DELETE
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Utilisateurs peuvent voir leurs propres permissions
DROP POLICY IF EXISTS "cms_permissions_user_view_own" ON "public"."cms_permissions";
CREATE POLICY "cms_permissions_user_view_own" ON "public"."cms_permissions"
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies pour cms_access_logs
ALTER TABLE "public"."cms_access_logs" ENABLE ROW LEVEL SECURITY;

-- Admin peut voir tous les logs
DROP POLICY IF EXISTS "cms_access_logs_admin_view" ON "public"."cms_access_logs";
CREATE POLICY "cms_access_logs_admin_view" ON "public"."cms_access_logs"
  FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Utilisateurs peuvent voir leurs propres logs
DROP POLICY IF EXISTS "cms_access_logs_user_view_own" ON "public"."cms_access_logs";
CREATE POLICY "cms_access_logs_user_view_own" ON "public"."cms_access_logs"
  FOR SELECT
  USING (user_id = auth.uid());

-- Tous les utilisateurs authentifiés peuvent insérer leurs propres logs
DROP POLICY IF EXISTS "cms_access_logs_insert" ON "public"."cms_access_logs";
CREATE POLICY "cms_access_logs_insert" ON "public"."cms_access_logs"
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
