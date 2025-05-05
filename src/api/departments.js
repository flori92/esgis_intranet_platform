/**
 * Service de gestion des départements
 * Centralise toutes les opérations liées aux départements académiques
 */
import { supabase } from '../config/supabase';

/**
 * Types pour les départements - remplacés par des commentaires JSDoc
 * @typedef {Object} Department Département tel que stocké dans la base de données
 * @typedef {Object} DepartmentInsert Structure pour l'insertion d'un nouveau département
 * @typedef {Object} DepartmentUpdate Structure pour la mise à jour d'un département existant
 */

/**
 * Récupère tous les départements
 * @returns {Promise<Object>} Résultat contenant la liste des départements et une erreur éventuelle
 */
export const getDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erreur lors de la récupération des départements:', error);
      return { departments: [], error };
    }

    return { departments: data, error: null };
  } catch (err) {
    console.error('Exception lors de la récupération des départements:', err);
    return { departments: [], error: err };
  }
};

/**
 * Récupère un département par son ID
 * @param {number} departmentId ID du département à récupérer
 * @returns {Promise<Object>} Résultat contenant le département et une erreur éventuelle
 */
export const getDepartmentById = async (departmentId) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', departmentId)
      .single();

    if (error) {
      console.error(`Erreur lors de la récupération du département ${departmentId}:`, error);
      return { department: null, error };
    }

    return { department: data, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération du département ${departmentId}:`, err);
    return { department: null, error: err };
  }
};

/**
 * Récupère un département avec son responsable et le nombre d'étudiants/professeurs
 * @param {number} departmentId ID du département à récupérer
 * @returns {Promise<Object>} Résultat contenant le département avec des informations détaillées
 */
export const getDepartmentDetails = async (departmentId) => {
  try {
    // 1. Récupérer le département
    const { data: departmentData, error: departmentError } = await supabase
      .from('departments')
      .select(`
        *,
        profiles!head_professor_id(full_name)
      `)
      .eq('id', departmentId)
      .single();

    if (departmentError) {
      console.error(`Erreur lors de la récupération du département ${departmentId}:`, departmentError);
      return { department: null, error: departmentError };
    }

    const department = departmentData;

    // 2. Compter les étudiants du département
    const { count: studentCount, error: studentError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', departmentId)
      .eq('role', 'student');

    if (studentError) {
      console.error(`Erreur lors du comptage des étudiants du département ${departmentId}:`, studentError);
      return { department: null, error: studentError };
    }

    // 3. Compter les professeurs du département
    const { count: professorCount, error: professorError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', departmentId)
      .eq('role', 'professor');

    if (professorError) {
      console.error(`Erreur lors du comptage des professeurs du département ${departmentId}:`, professorError);
      return { department: null, error: professorError };
    }

    return {
      department: {
        ...department,
        head_professor_name: department.profiles?.full_name,
        student_count: studentCount || 0,
        professor_count: professorCount || 0,
      },
      error: null
    };
  } catch (err) {
    console.error(`Exception lors de la récupération des détails du département ${departmentId}:`, err);
    return { department: null, error: err };
  }
};

/**
 * Crée un nouveau département
 * @param {Object} departmentData Données du département à créer
 * @returns {Promise<Object>} Résultat contenant le département créé et une erreur éventuelle
 */
export const createDepartment = async (departmentData) => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('departments')
      .insert({
        ...departmentData,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du département:', error);
      return { department: null, error };
    }

    return { department: data, error: null };
  } catch (err) {
    console.error('Exception lors de la création du département:', err);
    return { department: null, error: err };
  }
};

/**
 * Met à jour un département existant
 * @param {number} departmentId ID du département à mettre à jour
 * @param {Object} updates Modifications à appliquer
 * @returns {Promise<Object>} Résultat contenant le département mis à jour et une erreur éventuelle
 */
export const updateDepartment = async (departmentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', departmentId)
      .select()
      .single();

    if (error) {
      console.error(`Erreur lors de la mise à jour du département ${departmentId}:`, error);
      return { department: null, error };
    }

    return { department: data, error: null };
  } catch (err) {
    console.error(`Exception lors de la mise à jour du département ${departmentId}:`, err);
    return { department: null, error: err };
  }
};

/**
 * Supprime un département
 * Note: Cela ne fonctionnera que si aucun utilisateur n'est associé à ce département
 * @param {number} departmentId ID du département à supprimer
 * @returns {Promise<Object>} Résultat contenant le succès de l'opération et une erreur éventuelle
 */
export const deleteDepartment = async (departmentId) => {
  try {
    // 1. Vérifier si des utilisateurs sont associés à ce département
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', departmentId);

    if (countError) {
      console.error(`Erreur lors de la vérification des utilisateurs du département ${departmentId}:`, countError);
      return { success: false, error: countError };
    }

    if (count && count > 0) {
      const err = new Error(`Impossible de supprimer ce département: ${count} utilisateurs y sont associés`);
      console.error(err.message);
      return { success: false, error: err };
    }

    // 2. Supprimer le département
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', departmentId);

    if (error) {
      console.error(`Erreur lors de la suppression du département ${departmentId}:`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error(`Exception lors de la suppression du département ${departmentId}:`, err);
    return { success: false, error: err };
  }
};
