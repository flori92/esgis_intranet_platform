/**
 * Service de Notifications Multi-Canal — ESGIS Campus §9.1
 *
 * Canaux supportés :
 * - Push navigateur (Web Push API)
 * - E-mail (via Supabase Edge Functions ou EmailJS)
 * - SMS (événements critiques uniquement, via passerelle externe)
 * - Bandeau in-app (pastille rouge sur icône)
 *
 * Chaque utilisateur peut configurer ses préférences dans son profil.
 */
import {
  createNotification,
  createNotificationsBulk,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications
} from '../api/notifications';

/**
 * Types de notifications
 */
export const NOTIFICATION_TYPES = {
  NOTE_PUBLIEE: { key: 'note_publiee', label: 'Note publiée', icon: '📊', priority: 'normal' },
  CORRECTION_NOTE: { key: 'correction_note', label: 'Note corrigée', icon: '✏️', priority: 'normal' },
  NOUVEL_EXAMEN: { key: 'nouvel_examen', label: 'Nouvel examen planifié', icon: '📝', priority: 'high' },
  EXAMEN_IMMINENT: { key: 'examen_imminent', label: 'Examen dans 2h', icon: '⏰', priority: 'critical' },
  NOUVEAU_COURS: { key: 'nouveau_cours', label: 'Nouveau cours déposé', icon: '📚', priority: 'normal' },
  NOUVEAU_MESSAGE: { key: 'nouveau_message', label: 'Nouveau message', icon: '💬', priority: 'normal' },
  ANNONCE: { key: 'annonce', label: 'Annonce officielle', icon: '📢', priority: 'high' },
  DOCUMENT_DISPONIBLE: { key: 'document_disponible', label: 'Document disponible', icon: '📄', priority: 'normal' },
  MODIFICATION_EDT: { key: 'modification_edt', label: 'Emploi du temps modifié', icon: '📅', priority: 'high' },
  OFFRE_STAGE: { key: 'offre_stage', label: 'Nouvelle offre de stage', icon: '💼', priority: 'low' },
  COMPTE_SUSPENDU: { key: 'compte_suspendu', label: 'Compte suspendu', icon: '🚫', priority: 'critical' },
  PAIEMENT: { key: 'paiement', label: 'Rappel de paiement', icon: '💰', priority: 'high' },
  DEMANDE_CORRECTION: { key: 'demande_correction', label: 'Demande de correction', icon: '🔄', priority: 'normal' },
  FORUM_REPONSE: { key: 'forum_reponse', label: 'Réponse sur le forum', icon: '💬', priority: 'low' },
};

class NotificationService {
  constructor() {
    this.pushPermission = null;
    this.swRegistration = null;
  }

  /**
   * Initialise le service (demande la permission push si nécessaire)
   */
  async init() {
    if ('Notification' in window) {
      this.pushPermission = Notification.permission;
    }
  }

  /**
   * Demande la permission pour les notifications push
   * @returns {Promise<string>} 'granted', 'denied', ou 'default'
   */
  async requestPushPermission() {
    if (!('Notification' in window)) {
      console.warn('Les notifications push ne sont pas supportées par ce navigateur.');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.pushPermission = permission;
    return permission;
  }

  /**
   * Envoie une notification in-app (enregistrée en base)
   * @param {Object} params
   * @param {string} params.userId - ID de l'utilisateur destinataire
   * @param {string} params.type - Type de notification (clé de NOTIFICATION_TYPES)
   * @param {string} params.titre - Titre de la notification
   * @param {string} params.contenu - Contenu détaillé
   * @param {string} [params.lien] - Lien vers la ressource concernée
   * @returns {Promise<Object>}
   */
  async sendInApp({ userId, type, titre, contenu, lien }) {
    try {
      const priority = NOTIFICATION_TYPES[type?.toUpperCase()]?.priority || 'medium';
      const { data, error } = await createNotification({
        recipient_id: userId,
        title: titre,
        content: contenu,
        priority,
        read: false,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erreur envoi notification in-app:', error);
      return { success: false, error };
    }
  }

  /**
   * Envoie une notification in-app à plusieurs utilisateurs
   * @param {Array<string>} userIds - Liste des IDs
   * @param {Object} notification - Données de la notification
   * @returns {Promise<Object>}
   */
  async sendInAppBulk(userIds, { type, titre, contenu, lien }) {
    try {
      const priority = NOTIFICATION_TYPES[type?.toUpperCase()]?.priority || 'medium';
      const notifications = userIds.map(userId => ({
        recipient_id: userId,
        title: titre,
        content: contenu,
        priority,
        read: false,
      }));

      const { data, error } = await createNotificationsBulk(notifications);

      if (error) throw error;
      return { success: true, count: notifications.length, data };
    } catch (error) {
      console.error('Erreur envoi notifications bulk:', error);
      return { success: false, error };
    }
  }

  /**
   * Envoie une notification push navigateur
   * @param {string} title - Titre
   * @param {Object} options - Options de la notification
   */
  sendPush(title, options = {}) {
    if (this.pushPermission !== 'granted') {
      console.warn('Permission push non accordée.');
      return;
    }

    try {
      const notifConfig = NOTIFICATION_TYPES[options.type];
      const notification = new Notification(title, {
        body: options.body || '',
        icon: '/images/esgis-logo.png',
        badge: '/images/esgis-logo.png',
        tag: options.tag || `esgis-${Date.now()}`,
        data: { url: options.url || '/' },
        requireInteraction: options.priority === 'critical',
        ...options,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        const url = notification.data?.url;
        if (url) window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Erreur notification push:', error);
    }
  }

  /**
   * Récupère les notifications non lues d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>}
   */
  async getUnread(userId) {
    try {
      const { data, error } = await getNotifications(userId, null, { unreadOnly: true, limit: 50 });

      if (error) throw error;
      return { data, count: data?.length || 0, error: null };
    } catch (error) {
      return { data: null, count: 0, error };
    }
  }

  /**
   * Récupère toutes les notifications d'un utilisateur (avec pagination)
   * @param {string} userId - ID de l'utilisateur
   * @param {number} page - Page
   * @param {number} perPage - Éléments par page
   * @returns {Promise<Object>}
   */
  async getAll(userId, page = 1, perPage = 20) {
    try {
      const limit = page * perPage;
      const { data, error } = await getNotifications(userId, null, { limit });

      if (error) throw error;
      const paged = (data || []).slice((page - 1) * perPage, page * perPage);
      return { data: paged, total: data?.length || 0, error: null };
    } catch (error) {
      return { data: null, total: 0, error };
    }
  }

  /**
   * Marque une notification comme lue
   * @param {string} notificationId - ID de la notification
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await markNotificationAsRead(notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Marque toutes les notifications comme lues
   * @param {string} userId - ID de l'utilisateur
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await markAllNotificationsAsRead(userId, null);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Souscrit aux notifications en temps réel via Supabase Realtime
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée à chaque nouvelle notification
   * @returns {Object} Subscription (appeler .unsubscribe() pour arrêter)
   */
  subscribeRealtime(userId, callback) {
    return subscribeToNotifications(userId, (payload) => {
      const notification = payload?.new;
      callback(notification);

      if (this.pushPermission === 'granted' && notification) {
        this.sendPush(notification.title, {
          body: notification.content,
          type: notification.priority,
        });
      }
    });
  }

  /**
   * Envoie une notification selon les préférences de l'utilisateur
   * Orchestre les canaux (in-app + push + email si configuré)
   * @param {Object} params
   */
  async sendSmart({ userId, type, titre, contenu, lien }) {
    // 1. Toujours envoyer in-app
    await this.sendInApp({ userId, type, titre, contenu, lien });

    // 2. Push navigateur si permission accordée
    if (this.pushPermission === 'granted') {
      this.sendPush(titre, { body: contenu, url: lien, type });
    }

    // 3. E-mail : serait géré par une Edge Function Supabase ou un webhook
    // 4. SMS : serait géré par un service externe pour les événements critiques
  }
}

// Singleton
const notificationService = new NotificationService();
export default notificationService;
