/**
 * Utilitaires pour faciliter les opérations avec Supabase
 */
import { supabase } from '@/supabase';

/**
 * Récupère des enregistrements avec leurs relations
 * @param {string} table - Nom de la table
 * @param {Object} options - Options de requête
 * @param {string} [options.select] - Colonnes à sélectionner
 * @param {Array<Object>} [options.filters] - Filtres à appliquer
 * @param {Object} [options.orderBy] - Ordre de tri
 * @param {number} [options.limit] - Limite de résultats
 * @returns {Promise<Array>} Données récupérées
 */
export const getRecordsWithRelation = async (table, options = {}) => {
  try {
    let query = supabase.from(table).select(options.select || '*');
    
    if (options.filters) {
      options.filters.forEach(filter => {
        query = query[filter.operator](filter.column, filter.value);
      });
    }
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de ${table}:`, error);
    throw error;
  }
};

/**
 * Insère un nouvel enregistrement
 * @param {string} table - Nom de la table
 * @param {Object|Array} data - Données à insérer
 * @returns {Promise<Object>} Enregistrement inséré
 */
export const insertRecord = async (table, data) => {
  try {
    const { data: result, error } = await supabase.from(table).insert(data).select();
    if (error) {
      throw error;
    }
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error(`Erreur lors de l'insertion dans ${table}:`, error);
    throw error;
  }
};

/**
 * Met à jour un enregistrement
 * @param {string} table - Nom de la table
 * @param {number|string} id - ID de l'enregistrement
 * @param {Object} data - Données à mettre à jour
 * @returns {Promise<Object>} Enregistrement mis à jour
 */
export const updateRecord = async (table, id, data) => {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    if (error) {
      throw error;
    }
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour dans ${table}:`, error);
    throw error;
  }
};

/**
 * Supprime un enregistrement
 * @param {string} table - Nom de la table
 * @param {number|string} id - ID de l'enregistrement
 * @returns {Promise<boolean>} Succès de la suppression
 */
export const deleteRecord = async (table, id) => {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression dans ${table}:`, error);
    throw error;
  }
};

/**
 * Récupère un enregistrement par son ID
 * @param {string} table - Nom de la table
 * @param {number|string} id - ID de l'enregistrement
 * @param {string} [select] - Colonnes à sélectionner
 * @returns {Promise<Object>} Enregistrement récupéré
 */
export const getRecordById = async (table, id, select = '*') => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'enregistrement ${id} dans ${table}:`, error);
    throw error;
  }
};

/**
 * Récupère des enregistrements avec pagination
 * @param {string} table - Nom de la table
 * @param {Object} options - Options de requête
 * @param {string} [options.select] - Colonnes à sélectionner
 * @param {Array<Object>} [options.filters] - Filtres à appliquer
 * @param {Object} [options.orderBy] - Ordre de tri
 * @param {number} options.page - Numéro de page
 * @param {number} options.pageSize - Taille de la page
 * @returns {Promise<Object>} Données paginées et nombre total
 */
export const getPaginatedRecords = async (table, options) => {
  try {
    const { page = 1, pageSize = 10 } = options;
    
    // Calculer le décalage
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Construire la requête
    let query = supabase.from(table).select(options.select || '*', { count: 'exact' });
    
    if (options.filters) {
      options.filters.forEach(filter => {
        query = query[filter.operator](filter.column, filter.value);
      });
    }
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }
    
    // Ajouter la pagination
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return {
      data,
      totalCount: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération des données paginées de ${table}:`, error);
    throw error;
  }
};

export default {
  getRecordsWithRelation,
  insertRecord,
  updateRecord,
  deleteRecord,
  getRecordById,
  getPaginatedRecords
};
