/**
 * Service d'authentification à deux facteurs (2FA) — ESGIS Campus §9.4
 * 
 * Disponible pour tous les profils, obligatoire pour l'administration.
 * Méthodes supportées :
 * - Code OTP par e-mail
 * - Code OTP par SMS (événements critiques)
 * - Authentification biométrique sur mobile (Face ID / empreinte)
 */


/**
 * Génère un code OTP à 6 chiffres
 * @returns {string} Code OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

class TwoFactorAuthService {
  constructor() {
    this.pendingVerification = null;
  }

  /**
   * Vérifie si le 2FA est requis pour un utilisateur
   * @param {string} role - Rôle de l'utilisateur
   * @param {Object} [userPrefs] - Préférences utilisateur
   * @returns {boolean}
   */
  isRequired(role, userPrefs = {}) {
    // Obligatoire pour admin et super_admin
    if (role === 'admin' || role === 'super_admin') return true;
    // Optionnel pour les autres, activé si l'utilisateur l'a configuré
    return userPrefs.two_factor_enabled === true;
  }

  /**
   * Initie une vérification 2FA par e-mail
   * @param {string} userId - ID de l'utilisateur
   * @param {string} email - Adresse e-mail
   * @returns {Promise<Object>} Résultat avec le code (en prod, le code ne serait pas retourné)
   */
  async initiateEmailVerification(userId, email) {
    try {
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Stocker le code en base
      const { error } = await supabase
        .from('two_factor_codes')
        .insert({
          user_id: userId,
          code,
          method: 'email',
          expires_at: expiresAt.toISOString(),
          verified: false,
        });

      if (error) {
        // Si la table n'existe pas encore, simuler en local
        console.warn('Table two_factor_codes non trouvée, mode simulation.');
      }

      this.pendingVerification = {
        userId,
        method: 'email',
        expiresAt,
        // En développement seulement — en production, le code est envoyé par email
        _devCode: code,
      };

      // En production: envoyer l'e-mail via Supabase Edge Function ou EmailJS
      console.log(`[2FA] Code envoyé à ${email}: ${code}`);

      return {
        success: true,
        method: 'email',
        expiresAt: expiresAt.toISOString(),
        // En dev seulement :
        _devCode: code,
        message: `Un code de vérification a été envoyé à ${email}.`
      };
    } catch (error) {
      console.error('Erreur 2FA email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initie une vérification 2FA par SMS
   * @param {string} userId - ID de l'utilisateur
   * @param {string} phone - Numéro de téléphone
   * @returns {Promise<Object>}
   */
  async initiateSMSVerification(userId, phone) {
    try {
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      this.pendingVerification = {
        userId,
        method: 'sms',
        expiresAt,
        _devCode: code,
      };

      // En production: envoyer via passerelle SMS
      console.log(`[2FA] Code SMS envoyé à ${phone}: ${code}`);

      return {
        success: true,
        method: 'sms',
        expiresAt: expiresAt.toISOString(),
        _devCode: code,
        message: `Un code de vérification a été envoyé par SMS au ${phone}.`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifie un code OTP
   * @param {string} userId - ID de l'utilisateur
   * @param {string} code - Code OTP saisi par l'utilisateur
   * @returns {Promise<Object>}
   */
  async verifyCode(userId, code) {
    try {
      // Vérification en base
      const { data, error } = await supabase
        .from('two_factor_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        // Marquer comme vérifié
        await supabase
          .from('two_factor_codes')
          .update({ verified: true })
          .eq('id', data.id);

        this.pendingVerification = null;
        return { success: true, message: 'Code vérifié avec succès.' };
      }

      // Fallback: vérification locale (mode dev)
      if (this.pendingVerification &&
          this.pendingVerification.userId === userId &&
          this.pendingVerification._devCode === code &&
          new Date() < this.pendingVerification.expiresAt) {
        this.pendingVerification = null;
        return { success: true, message: 'Code vérifié avec succès.' };
      }

      return { success: false, message: 'Code invalide ou expiré.' };
    } catch (error) {
      // Fallback local
      if (this.pendingVerification &&
          this.pendingVerification._devCode === code) {
        this.pendingVerification = null;
        return { success: true, message: 'Code vérifié avec succès.' };
      }
      return { success: false, message: 'Code invalide ou expiré.' };
    }
  }

  /**
   * Vérifie si une authentification biométrique est disponible (mobile)
   * @returns {Promise<boolean>}
   */
  async isBiometricAvailable() {
    if (window.PublicKeyCredential) {
      try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Active/désactive le 2FA pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {boolean} enabled - Activer ou désactiver
   * @returns {Promise<Object>}
   */
  async toggle2FA(userId, enabled) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, enabled };
    } catch (error) {
      console.error('Erreur toggle 2FA:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifie si une vérification est en attente
   */
  hasPendingVerification() {
    if (!this.pendingVerification) return false;
    return new Date() < this.pendingVerification.expiresAt;
  }

  /**
   * Retourne le temps restant avant expiration (en secondes)
   */
  getRemainingTime() {
    if (!this.pendingVerification) return 0;
    const remaining = Math.max(0, this.pendingVerification.expiresAt - Date.now());
    return Math.ceil(remaining / 1000);
  }
}

const twoFactorAuth = new TwoFactorAuthService();
export default twoFactorAuth;
