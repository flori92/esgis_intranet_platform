/**
 * Service de Notifications Multi-Canal — ESGIS Campus §9.1
 *
 * Canaux supportés :
 * - Push navigateur (via OneSignal)
 * - E-mail (via OneSignal ou Supabase Edge Functions)
 * - SMS (événements critiques uniquement, via passerelle externe)
 * - Bandeau in-app (pastille rouge sur icône)
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
   * Associe l'utilisateur courant à OneSignal
   */
  async loginUser(profile) {
    if (!this.initialized) await this.init();
    
    try {
      if (profile?.id) {
        await OneSignal.login(profile.id);
      }
      if (profile?.email && OneSignal.User) {
        await OneSignal.User.addEmail(profile.email);
      }
      if (profile?.role && OneSignal.User) {
        await OneSignal.User.addTag('role', profile.role);
      }
    } catch (error) {
      console.error('Erreur login OneSignal:', error);
    }
  }

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
   * Envoie une notification in-app (base de données)
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
   * Envoie des notifications in-app en lot
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
   * Envoie une notification push via Edge Function
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
      console.error('Erreur envoi push:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Génère le template HTML des e-mails
   */
  _generateEmailHTML(title, content, actionLabel = null, actionUrl = null) {
    const primaryColor = '#1a56db';
    const secondaryColor = '#003366';
    
    let actionBtn = '';
    if (actionLabel && actionUrl) {
      actionBtn = `
        <div style="margin: 30px 0; text-align: center;">
          <a href="${actionUrl}" style="background-color: ${primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">${actionLabel}</a>
        </div>
      `;
    }

    return `
      <div style="font-family: 'Montserrat', sans-serif, Arial; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; color: #1f2937;">
        <div style="background-color: ${secondaryColor}; padding: 25px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ESGIS Campus</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: ${secondaryColor}; margin-top: 0; font-size: 20px;">${title}</h2>
          <div style="line-height: 1.6; font-size: 16px;">
            ${content}
          </div>
          ${actionBtn}
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Si le bouton ne fonctionne pas, copiez ce lien :<br/>
            <a href="${actionUrl || window.location.origin}" style="color: ${primaryColor}; word-break: break-all;">${actionUrl || window.location.origin}</a>
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            © ${new Date().getFullYear()} ESGIS - École Supérieure de Gestion d'Informatique et des Sciences<br/>
            Ceci est un message automatique, merci de ne pas y répondre.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Envoie un E-mail via OneSignal
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

  // --- Scénarios spécifiques ---

  async sendWelcome(userId, email, name) {
    const title = "Bienvenue sur ESGIS Campus !";
    const content = `Bonjour ${name || email}, votre compte a été activé avec succès.`;
    
    await this.sendInApp({ userId, type: 'BIENVENUE', titre: title, contenu: content });
    
    if (email) {
      const html = this._generateEmailHTML(
        "Félicitations !",
        `<p>Bonjour <strong>${name || email}</strong>,</p>
         <p>Nous sommes ravis de vous compter parmi nous sur la nouvelle plateforme intranet de l'ESGIS.</p>
         <p>Vous pouvez maintenant accéder à vos cours, notes et actualités en temps réel.</p>`,
        "Accéder à mon espace",
        `${window.location.origin}/login`
      );
      await this.sendEmail(email, title, html);
    }

    if (userId) {
      await this.sendPushToUser(userId, title, content);
    }
  }

  async sendPasswordResetLink(email, resetLink) {
    const title = "Réinitialisation de votre mot de passe";
    const html = this._generateEmailHTML(
      "Demande de nouveau mot de passe",
      `<p>Vous avez demandé la réinitialisation de votre mot de passe sur ESGIS Campus.</p>
       <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>`,
      "Réinitialiser mon mot de passe",
      resetLink
    );
    return await this.sendEmail(email, title, html);
  }

  async sendGradePublished(userId, email, examTitle, grade, totalPoints) {
    const title = `Note disponible : ${examTitle}`;
    const content = `Votre note pour l'examen "${examTitle}" est disponible : ${grade}/${totalPoints}.`;
    
    await this.sendInApp({ userId, type: 'NOTE_PUBLIEE', titre: title, contenu: content, lien: '/grades' });
    
    if (email) {
      const html = this._generateEmailHTML(
        "Une nouvelle note a été publiée",
        `<p>Votre note pour l'examen <strong>${examTitle}</strong> est désormais consultable sur votre espace étudiant.</p>
         <p style="font-size: 20px; font-weight: bold; color: #1a56db;">Note obtenue : ${grade} / ${totalPoints}</p>`,
        "Voir mes notes",
        `${window.location.origin}/grades`
      );
      await this.sendEmail(email, `[ESGIS] Note publiée : ${examTitle}`, html);
    }

    if (userId) {
      await this.sendPushToUser(userId, title, content);
    }
  }

  async sendNewExamScheduled(userIds, examTitle, date, profileIds = []) {
    const title = "Nouvel examen planifié";
    const content = `L'examen "${examTitle}" a été planifié pour le ${new Date(date).toLocaleDateString()}.`;
    
    await this.sendInAppBulk(userIds, {
      type: 'NOUVEL_EXAMEN',
      titre: title,
      contenu: content,
      lien: '/student/exams'
    });

    for (const pid of profileIds) {
      await this.sendPushToUser(pid, title, content);
    }
  }

  async sendMessageNotification(recipientId, recipientEmail, senderName, subject) {
    const title = "Nouveau message reçu";
    const content = `${senderName} vous a envoyé un message : ${subject}`;
    
    await this.sendInApp({ userId: recipientId, type: 'NOUVEAU_MESSAGE', titre: title, contenu: content, lien: '/messages' });
    
    if (recipientEmail) {
      const html = this._generateEmailHTML(
        "Vous avez reçu un nouveau message",
        `<p><strong>${senderName}</strong> vous a envoyé un message sur la messagerie interne.</p>
         <p><strong>Sujet :</strong> ${subject}</p>`,
        "Lire le message",
        `${window.location.origin}/messages`
      );
      await this.sendEmail(recipientEmail, `[ESGIS] Nouveau message : ${subject}`, html);
    }

    if (recipientId) {
      await this.sendPushToUser(recipientId, title, content);
    }
  }

  /**
   * Orchestre l'envoi intelligent sur plusieurs canaux
   */
  async sendSmart({ userId, type, titre, contenu, lien, email }) {
    const notifType = NOTIFICATION_TYPES[type?.toUpperCase()];
    const priority = notifType?.priority || 'normal';

    // 1. In-App
    await this.sendInApp({ userId, type, titre, contenu, lien });

    // 2. E-mail si disponible
    if (email) {
      await this.sendEmail(email, `[ESGIS Campus] ${titre}`, contenu);
    }

    // 3. Push si critique
    if (priority === 'critical' || priority === 'high') {
      await this.sendPushToUser(userId, titre, contenu);
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
