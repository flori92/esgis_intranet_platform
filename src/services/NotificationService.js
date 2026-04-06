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
  BIENVENUE: { key: 'bienvenue', label: 'Bienvenue', icon: '🎉', priority: 'high' },
  PASSWORD_RESET: { key: 'password_reset', label: 'Réinitialisation mot de passe', icon: '🔑', priority: 'critical' },
  EMAIL_VALIDATION: { key: 'email_validation', label: 'Validation email', icon: '📧', priority: 'high' },
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
        welcomeNotification: {
          disable: false,
          title: "ESGIS Campus",
          message: "Merci de vous être abonné aux notifications !"
        }
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
      if (profile?.id) {
        await OneSignal.login(profile.id);
        console.log(`Utilisateur ${profile.id} connecté à OneSignal`);
      }
      
      if (profile?.email) {
        // OneSignal User API for v16+ (react-onesignal 3.x)
        if (OneSignal.User) {
          await OneSignal.User.addEmail(profile.email);
        }
      }
      
      if (profile?.role) {
        if (OneSignal.User) {
          await OneSignal.User.addTag('role', profile.role);
        }
      }
    } catch (error) {
      console.error('Erreur login OneSignal:', error);
    }
  }

  /**
   * Déconnecte l'utilisateur de OneSignal
   */
  async logoutUser() {
    try {
      if (this.initialized) {
        await OneSignal.logout();
      }
    } catch (error) {
      console.error('Erreur logout OneSignal:', error);
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
   * Envoie une notification push à un utilisateur spécifique via l'API OneSignal
   * @param {string} userId - ID de l'utilisateur (UUID profiles)
   * @param {string} heading - Titre de la notification
   * @param {string} content - Message de la notification
   */
  async sendPushToUser(userId, heading, content) {
    try {
      const { supabase } = await import('../supabase');
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: { 
          recipient_id: userId, 
          heading: heading, 
          content: content,
          channel: 'push'
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erreur envoi push ciblée:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie une notification push navigateur locale (pour l'utilisateur courant)
   */
  async sendLocalPush(title, message) {
    if (!this.initialized) await this.init();
    // OneSignal ne permet plus vraiment d'envoyer un push local simple via SDK v16+
    // sans passer par leurs serveurs. On utilise Notification API standard si possible
    if (Notification.permission === "granted") {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }
  }

  /**
   * Envoie un E-mail via OneSignal/Edge Function
   */
  async sendEmail(email, subject, body) {
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
   * Notification de bienvenue
   */
  async sendWelcome(userId, email, name) {
    const title = "Bienvenue sur ESGIS Campus !";
    const content = `Bonjour ${name || email}, votre compte a été activé avec succès.`;
    
    // In-App
    await this.sendInApp({ userId, type: 'BIENVENUE', titre: title, contenu: content });
    
    // Email
    if (email) {
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #1a56db;">Bienvenue sur ESGIS Campus !</h1>
          <p>Bonjour <strong>${name || email}</strong>,</p>
          <p>Nous sommes ravis de vous compter parmi nous sur la nouvelle plateforme intranet de l'ESGIS.</p>
          <p>Vous pouvez maintenant accéder à vos cours, notes et actualités en temps réel.</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${window.location.origin}/login" style="background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Se connecter à l'intranet</a>
          </div>
          <p>Si vous avez des questions, n'hésitez pas à contacter le support administratif.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Ceci est un message automatique, merci de ne pas y répondre.</p>
        </div>
      `;
      await this.sendEmail(email, title, html);
    }

    // Push si déjà connecté OneSignal
    if (userId) {
      await this.sendPushToUser(userId, title, content);
    }
  }

  /**
   * Notification de réinitialisation de mot de passe
   */
  async sendPasswordResetLink(email, resetLink) {
    const title = "Réinitialisation de votre mot de passe";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe sur ESGIS Campus.</p>
        <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
        </div>
        <p>Ce lien expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
      </div>
    `;
    return await this.sendEmail(email, title, html);
  }

  /**
   * Notification de validation d'email
   */
  async sendEmailVerification(email, verificationLink) {
    const title = "Validez votre adresse email";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Vérification de votre compte</h2>
        <p>Merci de vous être inscrit sur ESGIS Campus. Veuillez valider votre adresse email pour activer toutes les fonctionnalités de votre compte.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Valider mon email</a>
        </div>
      </div>
    `;
    return await this.sendEmail(email, title, html);
  }

  /**
   * Notification de publication de note
   */
  async sendGradePublished(userId, email, examTitle, grade, totalPoints) {
    const title = "Nouvelle note publiée";
    const content = `Votre note pour l'examen "${examTitle}" est disponible : ${grade}/${totalPoints}.`;
    
    return await this.sendSmart({
      userId,
      email,
      type: 'NOTE_PUBLIEE',
      titre: title,
      contenu: content,
      lien: '/grades'
    });
  }

  /**
   * Notification de nouvel examen planifié
   */
  async sendNewExamScheduled(userIds, examTitle, date) {
    const title = "Nouvel examen planifié";
    const content = `L'examen "${examTitle}" a été planifié pour le ${new Date(date).toLocaleDateString()}.`;
    
    return await this.sendInAppBulk(userIds, {
      type: 'NOUVEL_EXAMEN',
      titre: title,
      contenu: content,
      lien: '/student/exams'
    });
  }

  /**
   * Notification de nouveau message
   */
  async sendMessageNotification(recipientId, senderName, subject) {
    const title = "Nouveau message";
    const content = `${senderName} vous a envoyé un message : ${subject}`;
    
    return await this.sendSmart({
      userId: recipientId,
      type: 'NOUVEAU_MESSAGE',
      titre: title,
      contenu: content,
      lien: '/messages'
    });
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
