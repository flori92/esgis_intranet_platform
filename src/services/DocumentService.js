import {
  createLegacyDocument,
  deleteLegacyDocumentRecord,
  listLegacyDocuments,
  updateLegacyDocument
} from '@/api/documents';
import {
  uploadFile as uploadStorageFile,
  downloadFile as downloadStorageFile,
  getPublicUrl
} from '@/api/storage';

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
      const { documents, error } = await listLegacyDocuments({
        userId,
        type: options.type,
        courseId: options.courseId,
        groupId: options.groupId
      });
      if (error) {
        throw error;
      }

      return documents || [];
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
      const { documents, error } = await listLegacyDocuments({ courseId });
      if (error) {
        throw error;
      }

      return documents || [];
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
      const { documents, error } = await listLegacyDocuments({ groupId });
      if (error) {
        throw error;
      }

      return documents || [];
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
      const { document: createdDocument, error } = await createLegacyDocument(document);
      if (error) {
        throw error;
      }

      return createdDocument;
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
      const { document, error } = await updateLegacyDocument(documentId, updates);
      if (error) {
        throw error;
      }

      return document;
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
      const { error } = await deleteLegacyDocumentRecord(documentId);
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
      const { data, error } = await downloadStorageFile('documents', path);
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
      const { data, error } = await uploadStorageFile('documents', path, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) {
        throw error;
      }

      const { publicUrl } = getPublicUrl('documents', path);
      return { ...data, publicUrl };
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  }
}

export default new DocumentService();
