/**
 * Service de gestion des examens
 * Centralise toutes les opérations liées aux examens
 */
import { supabase } from '../config/supabase';

/**
 * Types pour les examens - remplacés par des commentaires JSDoc
 * @typedef {Object} Exam Examen tel que stocké dans la base de données
 * @typedef {Object} ExamInsert Structure pour l'insertion d'un nouvel examen
 * @typedef {Object} ExamUpdate Structure pour la mise à jour d'un examen existant
 * 
 * Types pour les résultats d'examen
 * @typedef {Object} ExamResult Résultat d'examen tel que stocké dans la base de données
 * @typedef {Object} ExamResultInsert Structure pour l'insertion d'un nouveau résultat d'examen
 */

/**
 * Récupère tous les examens avec pagination et filtres
 * @param {Object} options Options de filtrage et pagination
 * @param {number} [options.page=1] Numéro de page
 * @param {number} [options.pageSize=10] Nombre d'éléments par page
 * @param {number} [options.departmentId] Filtre par ID de département
 * @param {string} [options.professorId] Filtre par ID de professeur
 * @param {string} [options.status] Statut de l'examen (draft, published, completed, archived)
 * @param {string} [options.search] Recherche textuelle sur le titre
 * @returns {Promise<Object>} Résultat contenant les examens, le nombre total et une erreur éventuelle
 */
export const getExams = async (options = {}) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      departmentId,
      professorId,
      status,
      search
    } = options;

    // Construction de la requête avec les filtres
    let query = supabase
      .from('exams')
      .select('*, profiles!professor_id(full_name, avatar_url)', { count: 'exact' });

    // Application des filtres
    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (professorId) {
      query = query.eq('professor_id', professorId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Exécution de la requête avec pagination
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des examens:', error);
      return { exams: [], count: 0, error };
    }

    return {
      exams: data,
      count: count || 0,
      error: null
    };
  } catch (err) {
    console.error('Exception lors de la récupération des examens:', err);
    return { exams: [], count: 0, error: err };
  }
};

/**
 * Récupère un examen par son ID
 * @param {number} examId ID de l'examen à récupérer
 * @returns {Promise<Object>} Résultat contenant l'examen enrichi et une erreur éventuelle
 */
export const getExamById = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        profiles!professor_id(full_name),
        departments!department_id(name)
      `)
      .eq('id', examId)
      .single();

    if (error) {
      console.error(`Erreur lors de la récupération de l'examen ${examId}:`, error);
      return { exam: null, error };
    }

    const examData = data;

    return {
      exam: {
        ...examData,
        professor_name: examData.profiles?.full_name,
        department_name: examData.departments?.name,
      },
      error: null
    };
  } catch (err) {
    console.error(`Exception lors de la récupération de l'examen ${examId}:`, err);
    return { exam: null, error: err };
  }
};

/**
 * Crée un nouvel examen
 * @param {Object} examData Données de l'examen à créer
 * @returns {Promise<Object>} Résultat contenant l'examen créé et une erreur éventuelle
 */
export const createExam = async (examData) => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('exams')
      .insert({
        ...examData,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'examen:', error);
      return { exam: null, error };
    }

    return { exam: data, error: null };
  } catch (err) {
    console.error('Exception lors de la création de l\'examen:', err);
    return { exam: null, error: err };
  }
};

/**
 * Met à jour un examen existant
 * @param {number} examId ID de l'examen à mettre à jour
 * @param {Object} updates Modifications à appliquer
 * @returns {Promise<Object>} Résultat contenant l'examen mis à jour et une erreur éventuelle
 */
export const updateExam = async (examId, updates) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', examId)
      .select()
      .single();

    if (error) {
      console.error(`Erreur lors de la mise à jour de l'examen ${examId}:`, error);
      return { exam: null, error };
    }

    return { exam: data, error: null };
  } catch (err) {
    console.error(`Exception lors de la mise à jour de l'examen ${examId}:`, err);
    return { exam: null, error: err };
  }
};

/**
 * Change le statut d'un examen
 * @param {number} examId ID de l'examen
 * @param {string} status Nouveau statut (draft, published, completed, archived)
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const updateExamStatus = async (examId, status) => {
  try {
    const { error } = await supabase
      .from('exams')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', examId);

    if (error) {
      console.error(`Erreur lors de la mise à jour du statut de l'examen ${examId}:`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error(`Exception lors de la mise à jour du statut de l'examen ${examId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Supprime un examen
 * Note: Cela ne fonctionnera que si aucun résultat n'est associé à cet examen
 * @param {number} examId ID de l'examen à supprimer
 * @returns {Promise<Object>} Résultat indiquant le succès de l'opération et une erreur éventuelle
 */
export const deleteExam = async (examId) => {
  try {
    // 1. Vérifier si des résultats sont associés à cet examen
    const { count, error: countError } = await supabase
      .from('exam_results')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId);

    if (countError) {
      console.error(`Erreur lors de la vérification des résultats de l'examen ${examId}:`, countError);
      return { success: false, error: countError };
    }

    if (count && count > 0) {
      const err = new Error(`Impossible de supprimer cet examen: ${count} résultats y sont associés`);
      console.error(err.message);
      return { success: false, error: err };
    }

    // 2. Supprimer l'examen
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) {
      console.error(`Erreur lors de la suppression de l'examen ${examId}:`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error(`Exception lors de la suppression de l'examen ${examId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Enregistre un résultat d'examen
 * @param {Object} resultData Données du résultat à enregistrer
 * @returns {Promise<Object>} Résultat contenant le résultat enregistré et une erreur éventuelle
 */
export const saveExamResult = async (resultData) => {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .insert({
        ...resultData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement du résultat d\'examen:', error);
      return { result: null, error };
    }

    return { result: data, error: null };
  } catch (err) {
    console.error('Exception lors de l\'enregistrement du résultat d\'examen:', err);
    return { result: null, error: err };
  }
};

/**
 * Récupère les résultats d'un examen
 * @param {number} examId ID de l'examen
 * @returns {Promise<Object>} Résultat contenant les résultats et une erreur éventuelle
 */
export const getExamResults = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        profiles!student_id(full_name, email, avatar_url)
      `)
      .eq('exam_id', examId)
      .order('score', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des résultats de l'examen ${examId}:`, error);
      return { results: [], error };
    }

    return { results: data, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération des résultats de l'examen ${examId}:`, err);
    return { results: [], error: err };
  }
};

/**
 * Récupère les résultats d'examens d'un étudiant
 * @param {string} studentId ID de l'étudiant
 * @returns {Promise<Object>} Résultat contenant les résultats enrichis et une erreur éventuelle
 */
export const getStudentExamResults = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        exams!exam_id(title, total_points)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erreur lors de la récupération des résultats de l'étudiant ${studentId}:`, error);
      return { results: [], error };
    }

    const results = data;

    return {
      results: results.map(result => ({
        ...result,
        exam_title: result.exams?.title,
      })),
      error: null
    };
  } catch (err) {
    console.error(`Exception lors de la récupération des résultats de l'étudiant ${studentId}:`, err);
    return { results: [], error: err };
  }
};
