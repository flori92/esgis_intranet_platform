-- Supprimer toutes les politiques existantes sur la table profiles
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON "public"."profiles";
DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les profils" ON "public"."profiles";
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON "public"."profiles";
DROP POLICY IF EXISTS "Les administrateurs peuvent modifier tous les profils" ON "public"."profiles";

-- Activer RLS sur la table profiles
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Créer des politiques simplifiées sans récursion
-- Politique de lecture : Tout le monde peut voir tous les profils
CREATE POLICY "Lecture des profils pour tous" 
ON "public"."profiles" 
FOR SELECT 
USING (true);

-- Politique d'insertion : Seuls les administrateurs peuvent créer des profils
CREATE POLICY "Insertion des profils pour admin" 
ON "public"."profiles" 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT auth.uid() FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
));

-- Politique de mise à jour : Les utilisateurs peuvent modifier leur propre profil, les admins peuvent tout modifier
CREATE POLICY "Mise à jour des profils" 
ON "public"."profiles" 
FOR UPDATE 
USING (
  auth.uid() = id OR 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR 
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Politique de suppression : Seuls les administrateurs peuvent supprimer des profils
CREATE POLICY "Suppression des profils pour admin" 
ON "public"."profiles" 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT auth.uid() FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  )
);
