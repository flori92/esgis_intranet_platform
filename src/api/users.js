/**
 * Service de gestion des utilisateurs
 * Centralise toutes les opérations liées aux utilisateurs
 */
import { supabase } from '../config/supabase';

/**
 * Types pour les utilisateurs et profils - remplacés par des commentaires JSDoc
 * @typedef {Object} Profile Profil utilisateur tel que stocké dans la base de données
 * @typedef {Object} Student Étudiant tel que stocké dans la base de données
 * @typedef {Object} Professor Professeur tel que stocké dans la base de données
 */

/**
 * Récupère tous les utilisateurs avec pagination et filtre optionnel
 * @param {Object} options Options de filtre et pagination
 * @param {number} [options.page=1] Page à récupérer
 * @param {number} [options.pageSize=10] Nombre d'éléments par page
 * @param {string} [options.role] Rôle à filtrer ('admin', 'professor', 'student')
 * @param {number} [options.departmentId] ID du département à filtrer
 * @param {string} [options.search] Termes de recherche
 * @param {boolean} [options.isActive] État d'activation à filtrer
 * @returns {Promise<Object>} Utilisateurs, nombre total et erreur éventuelle
 */
export const getUsers = async (options = {}) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      role,
      departmentId,
      search,
      isActive
    } = options;

    // Construction de la requête avec les filtres
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Application des filtres
    if (role) {
      query = query.eq('role', role);
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Exécution de la requête avec pagination
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return { users: [], count: 0, error };
    }

    return {
      users: data,
      count: count || 0,
      error: null
    };
  } catch (err) {
    console.error('Exception lors de la récupération des utilisateurs:', err);
    return { users: [], count: 0, error: err };
  }
};

/**
 * Récupère un utilisateur par son ID
 * @param {string} userId ID de l'utilisateur à récupérer
 * @returns {Promise<Object>} Utilisateur et erreur éventuelle
 */
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
      return { user: null, error };
    }

    return { user: data, error: null };
  } catch (err) {
    console.error(`Exception lors de la récupération de l'utilisateur ${userId}:`, err);
    return { user: null, error: err };
  }
};

/**
 * Crée un nouvel utilisateur (admin)
 * @param {Object} userData Données de l'utilisateur à créer
 * @param {string} userData.email Email de l'utilisateur
 * @param {string} userData.password Mot de passe
 * @param {string} userData.fullName Nom complet
 * @param {string} userData.role Rôle ('admin', 'professor', 'student')
 * @param {number} [userData.departmentId] ID du département
 * @param {string} [userData.avatarUrl] URL de l'avatar
 * @returns {Promise<Object>} Utilisateur créé et erreur éventuelle
 */
export const createUser = async (userData) => {
  try {
    // 1. Créer l'utilisateur dans Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
        role: userData.role
      }
    });

    if (authError || !authData.user) {
      console.error('Erreur lors de la création de l\'utilisateur:', authError);
      return { 
        user: null, 
        error: authError || new Error('Échec de la création de l\'utilisateur') 
      };
    }

    // 2. Créer le profil utilisateur
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.fullName,
        role: userData.role,
        department_id: userData.departmentId || null,
        avatar_url: userData.avatarUrl || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Erreur lors de la création du profil:', profileError);
      return { user: null, error: profileError };
    }

    return { user: profileData, error: null };
  } catch (err) {
    console.error('Exception lors de la création de l\'utilisateur:', err);
    return { user: null, error: err };
  }
};

/**
 * Met à jour un utilisateur existant
 * @param {string} userId ID de l'utilisateur à mettre à jour
 * @param {Object} updates Modifications à appliquer
 * @returns {Promise<Object>} Utilisateur mis à jour et erreur éventuelle
 */
export const updateUser = async (userId, updates) => {
  try {
    // Mise à jour du profil
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur ${userId}:`, error);
      return { user: null, error };
    }

    return { user: data, error: null };
  } catch (err) {
    console.error(`Exception lors de la mise à jour de l'utilisateur ${userId}:`, err);
    return { user: null, error: err };
  }
};

/**
 * Active ou désactive un utilisateur
 * @param {string} userId ID de l'utilisateur à modifier
 * @param {boolean} isActive Nouvel état d'activation
 * @returns {Promise<Object>} Succès et erreur éventuelle
 */
export const toggleUserActive = async (userId, isActive) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error(`Erreur lors de la ${isActive ? 'activation' : 'désactivation'} de l'utilisateur ${userId}:`, error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error(`Exception lors de la ${isActive ? 'activation' : 'désactivation'} de l'utilisateur ${userId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Récupère tous les étudiants
 * @param {Object} options Options de filtre
 * @param {number} [options.departmentId] ID du département à filtrer
 * @param {string} [options.search] Termes de recherche
 * @param {boolean} [options.isActive] État d'activation à filtrer
 * @returns {Promise<Object>} Étudiants et erreur éventuelle
 */
export const getStudents = async (options = {}) => {
  try {
    // Construction de la requête avec les filtres
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student');

    // Application des filtres
    if (options.departmentId) {
      query = query.eq('department_id', options.departmentId);
    }

    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    if (options.search) {
      query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
    }

    // Exécution de la requête
    const { data, error } = await query.order('full_name');

    if (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      return { students: [], error };
    }

    return { students: data, error: null };
  } catch (err) {
    console.error('Exception lors de la récupération des étudiants:', err);
    return { students: [], error: err };
  }
};

/**
 * Récupère tous les professeurs
 * @param {Object} options Options de filtre
 * @param {number} [options.departmentId] ID du département à filtrer
 * @param {string} [options.search] Termes de recherche
 * @param {boolean} [options.isActive] État d'activation à filtrer
 * @returns {Promise<Object>} Professeurs et erreur éventuelle
 */
export const getProfessors = async (options = {}) => {
  try {
    // Construction de la requête avec les filtres
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'professor');

    // Application des filtres
    if (options.departmentId) {
      query = query.eq('department_id', options.departmentId);
    }

    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    if (options.search) {
      query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
    }

    // Exécution de la requête
    const { data, error } = await query.order('full_name');

    if (error) {
      console.error('Erreur lors de la récupération des professeurs:', error);
      return { professors: [], error };
    }

    return { professors: data, error: null };
  } catch (err) {
    console.error('Exception lors de la récupération des professeurs:', err);
    return { professors: [], error: err };
  }
};
