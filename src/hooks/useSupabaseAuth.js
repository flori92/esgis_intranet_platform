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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Déterminer le rôle de l'utilisateur
        const isAdmin = profile?.role === 'admin';
        const isProfessor = profile?.role === 'professor';
        const isStudent = profile?.role === 'student';
        
        setAuthState({
          user: session.user,
          profile,
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
   * Connexion avec email et mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} Résultat de la connexion
   */
  const signIn = async (email, password) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { data: null, error };
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
      
      if (error) throw error;
      
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
        
      if (error) throw error;
      
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
      
      if (authError) throw authError;
      
      const userId = authData.user.id;
      
      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: userId, ...profileData }]);
        
      if (profileError) throw profileError;
      
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
