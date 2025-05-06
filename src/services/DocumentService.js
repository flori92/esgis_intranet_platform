import { supabase } from '@/supabase';
import { DOCUMENT_TYPES, PERMISSION_TYPES } from '@/types/documents';

/**
 * Service pour la gestion des documents
 */
class DocumentService {
  /**
   * Récupérer tous les documents accessibles à un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage
   * @param {string} [options.type] - Type de document à filtrer
   * @param {string} [options.courseId] - ID du cours pour filtrer
   * @param {string} [options.groupId] - ID du groupe pour filtrer
   * @returns {Promise<Array>} Liste des documents
   */
  async getUserDocuments(userId, options = {}) {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${userId}`);

      // Appliquer les filtres
      if (options.type) {
        query = query.eq('type', options.type);
      }
      
      if (options.courseId) {
        query = query.eq('course_id', options.courseId);
      }
      
      if (options.groupId) {
        query = query.eq('group_id', options.groupId);
      }

      // Exécuter la requête
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }
  }

  /**
   * Récupérer les documents d'un cours
   * @param {string} courseId - ID du cours
   * @returns {Promise<Array>} Liste des documents du cours
   */
  async getCourseDocuments(courseId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des documents du cours:', error);
      throw error;
    }
  }

  /**
   * Récupérer les documents d'un groupe
   * @param {string} groupId - ID du groupe
   * @returns {Promise<Array>} Liste des documents du groupe
   */
  async getGroupDocuments(groupId) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des documents du groupe:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau document
   * @param {Object} document - Données du document
   * @returns {Promise<Object>} Document créé
   */
  async createDocument(document) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([document])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un document
   * @param {string} documentId - ID du document
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} Document mis à jour
   */
  async updateDocument(documentId, updates) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error);
      throw error;
    }
  }

  /**
   * Supprimer un document
   * @param {string} documentId - ID du document
   * @returns {Promise<void>}
   */
  async deleteDocument(documentId) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  }

  /**
   * Télécharger un fichier
   * @param {string} path - Chemin du fichier dans le bucket
   * @returns {Promise<Object>} URL de téléchargement
   */
  async downloadFile(path) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(path);

      if (error) {
        throw error;
      }

      // Créer une URL pour le fichier téléchargé
      const url = URL.createObjectURL(data);
      return { url, data };
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      throw error;
    }
  }

  /**
   * Uploader un fichier
   * @param {File} file - Fichier à uploader
   * @param {string} path - Chemin de destination dans le bucket
   * @returns {Promise<Object>} Résultat de l'upload
   */
  async uploadFile(file, path) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Récupérer l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(path);

      return { ...data, publicUrl: urlData.publicUrl };
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  }
}

export default new DocumentService();
