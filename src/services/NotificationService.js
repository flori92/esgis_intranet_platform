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
   * Génère un template HTML commun pour les emails
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
    const html = this._generateEmailHTML(
      "Demande de nouveau mot de passe",
      `<p>Vous avez demandé la réinitialisation de votre mot de passe sur ESGIS Campus.</p>
       <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>`,
      "Réinitialiser mon mot de passe",
      resetLink
    );
    return await this.sendEmail(email, title, html);
  }

  /**
   * Notification de validation d'email
   */
  async sendEmailVerification(email, verificationLink) {
    const title = "Validez votre adresse email";
    const html = this._generateEmailHTML(
      "Validation de votre compte",
      `<p>Merci de vous être inscrit sur ESGIS Campus. Veuillez valider votre adresse email pour activer toutes les fonctionnalités de votre compte.</p>`,
      "Valider mon email",
      verificationLink
    );
    return await this.sendEmail(email, title, html);
  }

  /**
   * Notification de publication de note
   */
  async sendGradePublished(userId, email, examTitle, grade, totalPoints) {
    const title = `Note disponible : ${examTitle}`;
    const content = `Votre note pour l'examen "${examTitle}" est disponible : ${grade}/${totalPoints}.`;
    
    // In-App
    await this.sendInApp({ userId, type: 'NOTE_PUBLIEE', titre: title, contenu: content, lien: '/grades' });
    
    // Email
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

    // Push
    if (userId) {
      await this.sendPushToUser(userId, title, content);
    }
  }

  /**
   * Notification de nouvel examen planifié
   */
  async sendNewExamScheduled(userIds, examTitle, date, profileIds = []) {
    const title = "Nouvel examen planifié";
    const content = `L'examen "${examTitle}" a été planifié pour le ${new Date(date).toLocaleDateString()}.`;
    
    // In-App Bulk
    await this.sendInAppBulk(userIds, {
      type: 'NOUVEL_EXAMEN',
      titre: title,
      contenu: content,
      lien: '/student/exams'
    });

    // Pour les emails et pushs individuels, on itère si nécessaire ou on laisse faire l'API OneSignal segmentée
    // Ici on suppose que profileIds contient les IDs OneSignal
    for (const pid of profileIds) {
      await this.sendPushToUser(pid, title, content);
    }
  }

  /**
   * Notification de nouveau message
   */
  async sendMessageNotification(recipientId, recipientEmail, senderName, subject) {
    const title = "Nouveau message reçu";
    const content = `${senderName} vous a envoyé un message : ${subject}`;
    
    // In-App
    await this.sendInApp({ userId: recipientId, type: 'NOUVEAU_MESSAGE', titre: title, contenu: content, lien: '/messages' });
    
    // Email
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

    // Push
    if (recipientId) {
      await this.sendPushToUser(recipientId, title, content);
    }
  }

  /**
   * Notification de rappel de paiement
   */
  async sendPaymentReminder(userId, email, amount, dueDate) {
    const title = "Rappel de paiement";
    const content = `Un paiement de ${amount} est attendu avant le ${new Date(dueDate).toLocaleDateString()}.`;
    
    await this.sendInApp({ userId, type: 'PAIEMENT', titre: title, contenu: content });
    
    if (email) {
      const html = this._generateEmailHTML(
        "Rappel d'échéance de paiement",
        `<p>Ceci est un rappel concernant vos frais de scolarité.</p>
         <p style="font-size: 18px; color: #ef4444; font-weight: bold;">Montant attendu : ${amount}</p>
         <p>Date d'échéance : ${new Date(dueDate).toLocaleDateString()}</p>
         <p>Merci de régulariser votre situation auprès du service comptabilité.</p>`,
        "Consulter mon compte",
        `${window.location.origin}/profile`
      );
      await this.sendEmail(email, "[ESGIS] Rappel de paiement", html);
    }
  }

  /**
   * Notification de compte suspendu
   */
  async sendAccountSuspension(userId, email, reason) {
    const title = "Votre compte a été suspendu";
    const content = `Motif : ${reason || 'Inconnu'}. Veuillez contacter l'administration.`;
    
    await this.sendInApp({ userId, type: 'COMPTE_SUSPENDU', titre: title, contenu: content });
    
    if (email) {
      const html = this._generateEmailHTML(
        "Notification de suspension de compte",
        `<p>Nous vous informons que votre accès à l'intranet ESGIS Campus a été suspendu.</p>
         <p><strong>Motif de la suspension :</strong> ${reason || 'Non spécifié'}</p>
         <p>Veuillez contacter le secrétariat administratif de votre campus pour plus d'informations.</p>`,
        "Contacter le support",
        "mailto:support@esgis.org"
      );
      await this.sendEmail(email, "[ESGIS] Suspension de votre compte", html);
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
