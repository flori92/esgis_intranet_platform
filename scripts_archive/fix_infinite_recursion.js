/**
 * Script pour corriger les problèmes de récursion infinie dans les politiques Supabase
 * Ce script modifie les politiques RLS pour éviter les erreurs de récursion infinie
 * dans les relations entre les tables profiles, courses, et documents
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Création du client Supabase avec la clé de service (service_role)
const supabaseUrl = process.env.SUPABASE_URL || 'https://epnhnjkbxgciojevrwfq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("Erreur: SUPABASE_SERVICE_ROLE_KEY n'est pas définie dans le fichier .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Fonction principale pour corriger les problèmes de récursion infinie
 */
async function fixInfiniteRecursion() {
  console.log("=== DÉBUT DE LA CORRECTION DES PROBLÈMES DE RÉCURSION INFINIE ===");

  try {
    // 1. Vérifier les politiques existantes
    console.log("\nVérification des politiques existantes...");
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', ['profiles', 'documents', 'courses']);

    if (policiesError) {
      console.error("Erreur lors de la récupération des politiques:", policiesError);
      console.log("Tentative de récupération des politiques via une autre méthode...");
      
      // Méthode alternative pour récupérer les politiques
      const { error: rpcError } = await supabase.rpc('list_policies');
      if (rpcError) {
        console.error("Erreur lors de la récupération des politiques via RPC:", rpcError);
      }
    } else {
      console.log("Politiques existantes:", policies);
    }

    // 2. Corriger les politiques pour la table profiles
    console.log("\nCorrection des politiques pour la table profiles...");
    
    // Supprimer les politiques problématiques
    const dropProfilesPoliciesQuery = `
      DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.profiles;
      DROP POLICY IF EXISTS "Profiles can be updated by users who created them." ON public.profiles;
    `;
    
    try {
      await supabase.rpc('run_sql', { sql: dropProfilesPoliciesQuery });
      console.log("Politiques problématiques supprimées avec succès");
    } catch (dropError) {
      console.error("Erreur lors de la suppression des politiques:", dropError);
    }
    
    // Créer des politiques simplifiées
    const createProfilesPoliciesQuery = `
      CREATE POLICY "profiles_select_policy" 
      ON public.profiles FOR SELECT 
      USING (true);
      
      CREATE POLICY "profiles_update_policy" 
      ON public.profiles FOR UPDATE 
      USING (auth.uid() = id);
    `;
    
    try {
      await supabase.rpc('run_sql', { sql: createProfilesPoliciesQuery });
      console.log("Nouvelles politiques pour profiles créées avec succès");
    } catch (createError) {
      console.error("Erreur lors de la création des nouvelles politiques:", createError);
    }

    // 3. Corriger les politiques pour la table documents
    console.log("\nCorrection des politiques pour la table documents...");
    
    // Supprimer les politiques problématiques
    const dropDocumentsPoliciesQuery = `
      DROP POLICY IF EXISTS "Documents are viewable by authenticated users." ON public.documents;
    `;
    
    try {
      await supabase.rpc('run_sql', { sql: dropDocumentsPoliciesQuery });
      console.log("Politiques problématiques supprimées avec succès");
    } catch (dropError) {
      console.error("Erreur lors de la suppression des politiques:", dropError);
    }
    
    // Créer des politiques simplifiées
    const createDocumentsPoliciesQuery = `
      CREATE POLICY "documents_select_policy" 
      ON public.documents FOR SELECT 
      USING (
        is_public = true OR 
        uploaded_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.student_courses sc
          WHERE sc.student_id = auth.uid() AND sc.course_id = documents.course_id
        ) OR
        EXISTS (
          SELECT 1 FROM public.professor_courses pc
          WHERE pc.professor_id = auth.uid() AND pc.course_id = documents.course_id
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
    `;
    
    try {
      await supabase.rpc('run_sql', { sql: createDocumentsPoliciesQuery });
      console.log("Nouvelles politiques pour documents créées avec succès");
    } catch (createError) {
      console.error("Erreur lors de la création des nouvelles politiques:", createError);
    }

    // 4. Corriger les politiques pour la table courses
    console.log("\nCorrection des politiques pour la table courses...");
    
    // Supprimer les politiques problématiques
    const dropCoursesPoliciesQuery = `
      DROP POLICY IF EXISTS "Courses are viewable by authenticated users." ON public.courses;
    `;
    
    try {
      await supabase.rpc('run_sql', { sql: dropCoursesPoliciesQuery });
      console.log("Politiques problématiques supprimées avec succès");
    } catch (dropError) {
      console.error("Erreur lors de la suppression des politiques:", dropError);
    }
    
    // Créer des politiques simplifiées
    const createCoursesPoliciesQuery = `
      CREATE POLICY "courses_select_policy" 
      ON public.courses FOR SELECT 
      USING (true);
    `;
    
    try {
      await supabase.rpc('run_sql', { sql: createCoursesPoliciesQuery });
      console.log("Nouvelles politiques pour courses créées avec succès");
    } catch (createError) {
      console.error("Erreur lors de la création des nouvelles politiques:", createError);
    }

    console.log("\n=== CORRECTION DES PROBLÈMES DE RÉCURSION INFINIE TERMINÉE ===");
  } catch (error) {
    console.error("Erreur lors de la correction des problèmes de récursion infinie:", error);
  }
}

// Exécuter la fonction principale
fixInfiniteRecursion()
  .then(() => {
    console.log("Script terminé avec succès");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur lors de l'exécution du script:", error);
    process.exit(1);
  });
