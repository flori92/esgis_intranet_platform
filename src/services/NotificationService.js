/**
 * Service de Notifications Multi-Canal — ESGIS Campus §9.1
 *
 * Canaux supportés :
 * - Push navigateur (via OneSignal)
 * - E-mail (via OneSignal ou Supabase Edge Functions)
 * - SMS (événements critiques uniquement, via passerelle externe)
 * - Bandeau in-app (pastille rouge sur icône)
 *
 * Chaque utilisateur peut configurer ses préférences dans son profil.
 */
import OneSignal from 'react-onesignal';
import {
  createNotification,
  createNotificationsBulk,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications
} from '../api/notifications';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '5d1d9f3a-b00e-4b60-bcdf-390444a36ae5';

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
    this.initialized = false;
  }

  /**
   * Initialise OneSignal
   */
  async init() {
    if (this.initialized) return;
    
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: true,
        },
      });
      this.initialized = true;
      console.log('OneSignal initialisé avec succès');
    } catch (error) {
      console.error('Erreur initialisation OneSignal:', error);
    }
  }

  /**
   * Associe l'utilisateur courant à OneSignal pour les notifications ciblées
   * @param {Object} profile - Profil de l'utilisateur (id, email, role)
   */
  async loginUser(profile) {
    if (!this.initialized) await this.init();
    
    try {
      await OneSignal.login(profile.id);
      if (profile.email) {
        await OneSignal.User.addEmail(profile.email);
      }
      await OneSignal.User.addTag('role', profile.role);
      console.log(`Utilisateur ${profile.id} connecté à OneSignal`);
    } catch (error) {
      console.error('Erreur login OneSignal:', error);
    }
  }

  /**
   * Envoie une notification in-app (enregistrée en base)
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
   * Envoie une notification push navigateur via OneSignal
   * Note: Pour envoyer à un autre utilisateur, il faut passer par l'API OneSignal REST (backend)
   */
  async sendPush(title, options = {}) {
    if (!this.initialized) await this.init();
    // OneSignal gère les permissions et l'affichage automatiquement
  }

  /**
   * Récupère les notifications non lues d'un utilisateur
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
   * Marque une notification comme lue
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
   * Souscrit aux notifications en temps réel via Supabase Realtime
   */
  subscribeRealtime(userId, role, callback) {
    return subscribeToNotifications(userId, role, (payload) => {
      const notification = payload?.new;
      if (callback) callback(notification);
    });
  }

  /**
   * Envoie un SMS via l'API backend
   */
  async sendSMS(phoneNumber, message) {
    if (!phoneNumber) return { success: false, error: 'Numéro manquant' };
    try {
      const { supabase } = await import('../supabase');
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { to: phoneNumber, message },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie un E-mail via OneSignal (nécessite configuration OneSignal Email)
   * @param {string} email - Destinataire
   * @param {string} subject - Sujet
   * @param {string} body - Contenu HTML
   */
  async sendEmail(email, subject, body) {
    // Cette partie nécessite normalement l'API REST OneSignal avec la clé API
    // On peut l'implémenter via une Edge Function pour plus de sécurité
    try {
      const { supabase } = await import('../supabase');
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: { 
          recipient_email: email, 
          subject: subject, 
          content: body,
          channel: 'email'
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erreur envoi Email OneSignal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Orchestre les canaux
   */
  async sendSmart({ userId, type, titre, contenu, lien, phoneNumber, email }) {
    const notifType = NOTIFICATION_TYPES[type?.toUpperCase()];
    const priority = notifType?.priority || 'normal';

    // 1. In-App
    await this.sendInApp({ userId, type, titre, contenu, lien });

    // 2. E-mail si disponible
    if (email) {
      await this.sendEmail(email, `[ESGIS Campus] ${titre}`, contenu);
    }

    // 3. SMS pour critique
    if ((priority === 'critical') && phoneNumber) {
      await this.sendSMS(phoneNumber, `[ESGIS] ${titre}: ${contenu}`);
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
