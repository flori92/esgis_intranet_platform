import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * Hook personnalisé pour gérer l'authentification avec Supabase
 * @returns {Object} Fonctions et état d'authentification
 */
export const useSupabaseAuth = () => {
  // État initial
  const [authState, setAuthState] = useState({
    user: null,
    profile: null,
    session: null,
    isAdmin: false,
    isProfessor: false,
    isStudent: false,
    isAuthenticated: false,
    error: null,
    loading: true
  });

  // Récupérer la session au chargement
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleAuthChange(session);
      }
    );

    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Nettoyer l'abonnement
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Gérer les changements d'authentification
  const handleAuthChange = async (session) => {
    if (session) {
      try {
        setAuthState(prev => ({ ...prev, loading: true }));
        
        // Récupérer le profil utilisateur
        const userProfile = await fetchUserProfile(session.user.id);
        
        // Déterminer le rôle de l'utilisateur
        const isAdmin = userProfile?.role === 'admin';
        const isProfessor = userProfile?.role === 'professor';
        const isStudent = userProfile?.role === 'student';
        
        setAuthState({
          user: session.user,
          profile: userProfile,
          session,
          isAdmin,
          isProfessor,
          isStudent,
          isAuthenticated: true,
          error: null,
          loading: false
        });
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        setAuthState({
          user: session.user,
          profile: null,
          session,
          isAdmin: false,
          isProfessor: false,
          isStudent: false,
          isAuthenticated: true,
          error,
          loading: false
        });
      }
    } else {
      // Pas de session, utilisateur non authentifié
      setAuthState({
        user: null,
        profile: null,
        session: null,
        isAdmin: false,
        isProfessor: false,
        isStudent: false,
        isAuthenticated: false,
        error: null,
        loading: false
      });
    }
  };

  /**
   * Récupère le profil de l'utilisateur connecté
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Profil de l'utilisateur
   */
  const fetchUserProfile = async (userId) => {
    try {
      // Tenter d'abord de récupérer les métadonnées utilisateur directement
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      // Créer un profil de secours basé sur les métadonnées
      let fallbackProfile = null;
      
      if (!userError && userData && userData.user) {
        const userMetadata = userData.user.user_metadata || {};
        fallbackProfile = {
          id: userId,
          email: userData.user.email,
          role: userMetadata.role || 'user',
          first_name: userMetadata.first_name || '',
          last_name: userMetadata.last_name || '',
          avatar_url: userMetadata.avatar_url || null
        };
      }
      
      // Tentative de récupération du profil complet
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        
        // Si nous avons un profil de secours, utilisons-le
        if (fallbackProfile) {
          console.log('Utilisation d\'un profil de secours basé sur les métadonnées:', fallbackProfile);
          return fallbackProfile;
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  };

  /**
   * Connecte un utilisateur avec son email et son mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} Résultat de la connexion
   */
  const signIn = async (email, password) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    setAuthState(prev => ({ ...prev, error: null }));

    try {
      // Tentative de connexion standard
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Si l'erreur est due à un email non confirmé, essayons une approche alternative
        if (error.message.includes('Email not confirmed')) {
          console.log('Email non confirmé, tentative de connexion alternative...');
          
          // Pour les comptes de test, nous permettons la connexion même si l'email n'est pas confirmé
          // Vérifier si c'est un compte de test
          const isTestAccount = email.includes('mailinator.com');
          
          if (isTestAccount) {
            console.log('Compte de test détecté, tentative de connexion sans confirmation d\'email...');
            
            // Récupérer l'utilisateur par email (sans vérifier la confirmation)
            const { data: userData, error: userError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: window.location.origin,
              }
            });
            
            if (userError && !userError.message.includes('User already registered')) {
              throw userError;
            }
            
            // Essayer de se connecter à nouveau
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (signInError) {
              throw signInError;
            }
            
            setAuthState(prev => ({ ...prev, user: signInData.user, session: signInData.session }));
            return { user: signInData.user, session: signInData.session };
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      setAuthState(prev => ({ ...prev, user: data.user, session: data.session }));
      return data;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error.message);
      setAuthState(prev => ({ ...prev, error: error.message }));
      return { error };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Déconnexion
   * @returns {Promise<void>}
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  /**
   * Réinitialisation du mot de passe
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} Résultat de la demande
   */
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return { error };
    }
  };

  /**
   * Mise à jour du profil utilisateur
   * @param {Object} profileData - Données du profil à mettre à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  const updateProfile = async (profileData) => {
    try {
      if (!authState.user) {
        throw new Error('Utilisateur non connecté');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authState.user.id)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Mettre à jour l'état
      setAuthState(prev => ({
        ...prev,
        profile: { ...prev.profile, ...profileData }
      }));
      
      return { data, error: null };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { data: null, error };
    }
  };

  /**
   * Création d'un compte utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @param {Object} profileData - Données du profil
   * @returns {Promise<Object>} Résultat de la création
   */
  const createUserAccount = async (email, password, profileData) => {
    try {
      // Créer l'utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (authError) {
        throw authError;
      }

      const userId = authData.user.id;

      const accountProfileData = {
        id: userId,
        email: email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url
      };
      
      if (profileData.role === 'professor' && profileData.speciality) {
        accountProfileData.speciality = profileData.speciality;
      }
      
      if (profileData.role === 'student') {
        if (profileData.student_id) {
          accountProfileData.student_id = profileData.student_id;
        }
        if (profileData.level) {
          accountProfileData.level = profileData.level;
        }
      }
      
      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ ...accountProfileData }]);
        
      if (profileError) {
        throw profileError;
      }

      return { userId, error: null };
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      return { userId: null, error };
    }
  };

  return {
    authState,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    createUserAccount
  };
};
