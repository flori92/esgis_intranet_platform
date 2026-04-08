/**
 * Service d'authentification - Gestion de toutes les opérations liées à l'auth
 */
import { supabase } from '../supabase';
import notificationService from '../services/NotificationService';
import { syncAuthenticatedProfile } from './profile';

/**
 * Types exportés en TypeScript, remplacés par des commentaires JSDoc
 * @typedef {Object} Profile Profil utilisateur tel que stocké dans la base de données
 * @typedef {Object} ProfileInsert Structure pour l'insertion d'un nouveau profil
 * @typedef {Object} ProfileUpdate Structure pour la mise à jour d'un profil existant
 */

/**
 * Connexion avec email/mot de passe
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Résultat contenant l'utilisateur et la session
 */
export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erreur de connexion:', error.message);
      return { user: null, session: null, error };
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (err) {
    console.error('Exception lors de la connexion:', err);
    return { user: null, session: null, error: err };
  }
};

/**
 * Inscription avec email/mot de passe
 * @param {string} email - Email de l'utilisateur 
 * @param {string} password - Mot de passe
 * @param {Object} userData - Données additionnelles du profil
 * @returns {Promise<Object>} Résultat contenant l'utilisateur
 */
export const signUpWithEmail = async (email, password, userData = {}) => {
  try {
    const normalizedEmail = `${email || ''}`.trim().toLowerCase();

    // 1. Créer l'utilisateur dans Auth
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: userData.full_name || '',
          role: userData.role || 'student',
        },
      },
    });

    if (error) {
      console.error('Erreur d\'inscription:', error.message);
      return { user: null, error };
    }

    if (!data.user) {
      return {
        user: null,
        error: new Error('Échec de la création du compte: aucun utilisateur retourné'),
      };
    }

    // 2. Synchroniser le profil si une session auth est déjà active.
    // Si la confirmation email retarde la session, la synchro sera rejouée au premier login.
    const activeSession = data.session || (await supabase.auth.getSession()).data.session;

    if (activeSession?.user?.id === data.user.id) {
      const { error: syncError } = await syncAuthenticatedProfile({
        full_name: userData.full_name || 'Nouvel utilisateur',
        role: userData.role || 'student',
        department_id: userData.department_id || null
      });

      if (syncError) {
        console.warn('Utilisateur créé mais synchronisation du profil différée:', syncError.message || syncError);
      }
    }

    // 3. Envoyer un e-mail de bienvenue via le NotificationService
    try {
      await notificationService.sendWelcome(
        data.user.id,
        normalizedEmail,
        userData.full_name
      );
    } catch (notifErr) {
      console.warn('Compte créé mais erreur lors de l\'envoi de la notification de bienvenue:', notifErr);
    }

    return {
      user: data.user,
      error: null,
    };
  } catch (err) {
    console.error('Exception lors de l\'inscription:', err);
    return { user: null, error: err };
  }
};

/**
 * Déconnexion
 * @returns {Promise<Object>} Résultat contenant une erreur éventuelle
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    console.error('Exception lors de la déconnexion:', err);
    return { error: err };
  }
};

/**
 * Envoie une invitation par email (via reset password) pour qu'un utilisateur
 * puisse configurer son accès initial.
 * @param {string} email 
 */
export const sendAccessInvitation = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'invitation:', err);
    return { success: false, error: err };
  }
};

/**
 * Récupération du mot de passe
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise<Object>} Résultat contenant une erreur éventuelle
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    return { error };
  } catch (err) {
    console.error('Exception lors de la réinitialisation du mot de passe:', err);
    return { error: err };
  }
};

/**
 * Mise à jour du mot de passe
 * @param {string} newPassword - Nouveau mot de passe
 * @returns {Promise<Object>} Résultat contenant une erreur éventuelle
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  } catch (err) {
    console.error('Exception lors de la mise à jour du mot de passe:', err);
    return { error: err };
  }
};

/**
 * Récupération de la session actuelle
 * @returns {Promise<Object>} Résultat contenant la session et une erreur éventuelle
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  } catch (err) {
    console.error('Exception lors de la récupération de la session:', err);
    return { session: null, error: err };
  }
};

/**
 * Récupération du profil utilisateur
 * @returns {Promise<Object>} Résultat contenant le profil et une erreur éventuelle
 */
export const getCurrentProfile = async () => {
  try {
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session.session) {
      return { profile: null, error: sessionError || new Error('Aucune session active') };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.session.user.id)
      .single();
      
    if (error) {
      return { profile: null, error };
    }
    
    return { profile: data, error: null };
  } catch (err) {
    console.error('Exception lors de la récupération du profil:', err);
    return { profile: null, error: err };
  }
};

/**
 * Mise à jour du profil utilisateur
 * @param {Object} profileData - Données à mettre à jour
 * @returns {Promise<Object>} Résultat contenant le profil mis à jour et une erreur éventuelle
 */
// ============================================================
// AUTH SDK WRAPPERS
// Permettent aux hooks/pages de ne plus importer supabase directement
// ============================================================

/**
 * Souscrit aux changements d'état d'authentification
 * @param {(event: import('@supabase/supabase-js').AuthChangeEvent, session: import('@supabase/supabase-js').Session | null) => void} callback
 * @returns {{ data: { subscription: Object } }}
 */
export const onAuthStateChange = (callback) =>
  supabase.auth.onAuthStateChange(callback);

/**
 * Récupère la session courante
 * @returns {Promise<{ data: { session: Object|null }, error: Error|null }>}
 */
export const getSession = () => supabase.auth.getSession();

/**
 * Récupère l'utilisateur courant depuis le serveur Auth
 * @returns {Promise<{ data: { user: Object|null }, error: Error|null }>}
 */
export const getUser = () => supabase.auth.getUser();

export const updateProfile = async (profileData) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      return { 
        profile: null, 
        error: new Error('Vous devez être connecté pour mettre à jour votre profil') 
      };
    }
    
    const userId = session.session.user.id;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      return { profile: null, error };
    }
    
    return { profile: data, error: null };
  } catch (err) {
    console.error('Exception lors de la mise à jour du profil:', err);
    return { profile: null, error: err };
  }
};
