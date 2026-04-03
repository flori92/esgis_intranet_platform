import { useState, useEffect } from 'react';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as apiSignOut,
  resetPassword as apiResetPassword,
  onAuthStateChange,
  getSession,
  getUser
} from '../api/auth';
import { getProfileById, updateProfileSettings } from '../api/profile';
import { getRoleEntities } from '../api/users';

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
    admin: null,
    professor: null,
    student: null,
    isAuthenticated: false,
    error: null,
    loading: true,
    fullName: ''
  });

  // Récupérer la session au chargement
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(
      (_event, session) => {
        handleAuthChange(session);
      }
    );

    // Récupérer la session initiale
    getSession().then(({ data: { session } }) => {
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

        // Déterminer le nom complet (full_name)
        let fullName = '';
        if (userProfile) {
          if (userProfile.full_name) {
            fullName = userProfile.full_name;
          } else if (userProfile.first_name || userProfile.last_name) {
            fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
          } else if (userProfile.nom && userProfile.prenom) {
            fullName = `${userProfile.prenom} ${userProfile.nom}`.trim();
          } else if (userProfile.nom_complet) {
            fullName = userProfile.nom_complet;
          }
        }

        const role = userProfile?.role || session.user.user_metadata?.role || null;

        // Déterminer le rôle de l'utilisateur
        const isAdmin = role === 'admin';
        const isProfessor = role === 'professor';
        const isStudent = role === 'student';

        const normalizedUser = {
          ...session.user,
          email: session.user.email || userProfile?.email || '',
          full_name: fullName || userProfile?.full_name || session.user.user_metadata?.full_name || '',
          role,
          department_id: userProfile?.department_id ?? null,
          avatar_url: userProfile?.avatar_url || session.user.user_metadata?.avatar_url || null
        };

        // Charger l'entité métier associée au profil quand elle existe.
        const { studentEntity, professorEntity } = await getRoleEntities(session.user.id);

        let student = null;
        let professor = null;
        let admin = null;

        if (isStudent) {
          student = {
            ...(userProfile || {}),
            ...(studentEntity || {}),
            id: studentEntity?.id ?? userProfile?.id ?? session.user.id,
            profile_id: studentEntity?.profile_id ?? session.user.id,
            email: userProfile?.email || session.user.email || '',
            first_name: userProfile?.first_name || userProfile?.prenom || '',
            last_name: userProfile?.last_name || userProfile?.nom || '',
            level: studentEntity?.level || userProfile?.level || userProfile?.niveau || '',
            student_id: studentEntity?.student_number || userProfile?.student_id || userProfile?.id || session.user.id,
            student_number: studentEntity?.student_number || userProfile?.student_id || null,
            entry_year: studentEntity?.entry_year ?? null,
            status: studentEntity?.status || userProfile?.status || 'active'
          };
        }

        if (isProfessor) {
          professor = {
            ...(userProfile || {}),
            ...(professorEntity || {}),
            id: professorEntity?.id ?? userProfile?.id ?? session.user.id,
            profile_id: professorEntity?.profile_id ?? session.user.id,
            email: userProfile?.email || session.user.email || '',
            full_name: fullName || userProfile?.full_name || '',
            department_id: userProfile?.department_id ?? null,
            employee_number: professorEntity?.employee_number || null,
            specialties: professorEntity?.specialties || [],
            status: professorEntity?.status || userProfile?.status || 'active'
          };
        }

        if (isAdmin) {
          admin = {
            ...(userProfile || {}),
            id: userProfile?.id || session.user.id,
            email: userProfile?.email || session.user.email || '',
            full_name: fullName || userProfile?.full_name || ''
          };
        }

        setAuthState({
          user: normalizedUser,
          profile: userProfile,
          fullName,
          session,
          isAdmin,
          isProfessor,
          isStudent,
          admin,
          professor,
          student,
          isAuthenticated: true,
          error: null,
          loading: false
        });
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        setAuthState({
          user: session.user,
          profile: null,
          fullName: '',
          session,
          isAdmin: false,
          isProfessor: false,
          isStudent: false,
          admin: null,
          professor: null,
          student: null,
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
        fullName: '',
        session: null,
        isAdmin: false,
        isProfessor: false,
        isStudent: false,
        admin: null,
        professor: null,
        student: null,
        isAuthenticated: false,
        error: null,
        loading: false
      });
    }
  };

  /**
   * Construit un profil de secours à partir des métadonnées Auth.
   * @param {string} userId
   * @param {Object} userData - résultat de getUser()
   * @returns {Object|null}
   */
  const buildFallbackProfile = (userId, userData) => {
    if (!userData?.user) {
      return null;
    }

    const userMetadata = userData.user.user_metadata || {};
    const email = userData.user.email || '';

    let role = userMetadata.role || 'user';
    let firstName = userMetadata.first_name || '';
    let lastName = userMetadata.last_name || '';

    // Pour les comptes de test, déduire le rôle à partir de l'email si nécessaire
    if (email.includes('mailinator.com') && !role) {
      if (email.includes('admin')) {
        role = 'admin';
        firstName = 'Admin';
        lastName = 'ESGIS';
      } else if (email.includes('prof')) {
        role = 'professor';
        firstName = 'Floraice';
        lastName = 'FAVI';
      } else if (email.includes('etudiant')) {
        role = 'student';
        firstName = 'Marie';
        lastName = 'Koné';
      }
    }

    let fallback = {
      id: userId,
      email,
      role,
      first_name: firstName,
      last_name: lastName,
      avatar_url: userMetadata.avatar_url || null,
      created_at: new Date().toISOString()
    };

    if (role === 'professor') {
      fallback = { ...fallback, speciality: userMetadata.speciality || 'Cloud Computing' };
    }

    if (role === 'student') {
      fallback = {
        ...fallback,
        student_id: userMetadata.student_id || 'ETU' + Math.floor(10000 + Math.random() * 90000),
        level: userMetadata.level || 'Licence 3'
      };
    }

    return fallback;
  };

  /**
   * Récupère le profil de l'utilisateur connecté
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Profil de l'utilisateur
   */
  const fetchUserProfile = async (userId) => {
    let fallbackProfile = null;

    try {
      const { data: userData, error: userError } = await getUser();

      if (!userError && userData) {
        fallbackProfile = buildFallbackProfile(userId, userData);
      }

      // Si nous sommes sur la page de quiz, utiliser directement le fallback
      const isQuizPage = window.location.href.includes('/quiz/');
      if (isQuizPage && fallbackProfile) {
        return fallbackProfile;
      }

      const { profile, error } = await getProfileById(userId);

      if (error) {
        if (error.message && error.message.includes('infinite recursion')) {
          console.warn('Erreur de récursion infinie détectée dans la politique pour relation "profiles"');
        }

        if (fallbackProfile) {
          return fallbackProfile;
        }

        throw error;
      }

      return profile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);

      if (fallbackProfile) {
        return fallbackProfile;
      }

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
      const isTestAccount = email.includes('mailinator.com');

      const { user: authUser, session: authSession, error } = await signInWithEmail(email, password);

      if (error) {
        if (error.message.includes('Email not confirmed') && isTestAccount) {
          // Deuxième tentative pour les comptes de test
          const retryResult = await signInWithEmail(email, password);

          if (retryResult.error) {
            // Simulation pour comptes de test non confirmés
            let userMetadata = {};

            if (email.includes('admin')) {
              userMetadata = { role: 'admin', first_name: 'Admin', last_name: 'ESGIS' };
            } else if (email.includes('prof')) {
              userMetadata = { role: 'professor', first_name: 'Floraice', last_name: 'FAVI', speciality: 'Cloud Computing' };
            } else if (email.includes('etudiant')) {
              userMetadata = { role: 'student', first_name: 'Marie', last_name: 'Koné' };
            }

            const mockSession = {
              user: {
                id: crypto.randomUUID(),
                email,
                user_metadata: userMetadata
              }
            };

            setAuthState(prev => ({
              ...prev,
              user: mockSession.user,
              session: mockSession,
              isAuthenticated: true
            }));

            handleAuthChange(mockSession);
            return { user: mockSession.user, session: mockSession };
          }

          setAuthState(prev => ({
            ...prev,
            user: retryResult.user,
            session: retryResult.session
          }));

          return retryResult;
        }

        throw error;
      }

      setAuthState(prev => ({ ...prev, user: authUser, session: authSession }));
      return { user: authUser, session: authSession };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error.message);

      let errorMessage = error.message;
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.message.includes('For security purposes')) {
        errorMessage = 'Trop de tentatives. Veuillez réessayer dans quelques instants.';
      }

      setAuthState(prev => ({ ...prev, error: errorMessage }));
      return { error: errorMessage };
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Inscription avec email/mot de passe
   * @param {string} email
   * @param {string} password
   * @param {Object} profileData
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  const signUp = async (email, password, profileData = {}) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { user, error } = await signUpWithEmail(email, password, profileData);

      if (error) {
        throw error;
      }

      return {
        data: user ? { user } : null,
        error: null
      };
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error?.message || 'Une erreur est survenue lors de l\'inscription.'
      }));

      return { data: null, error };
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
      await apiSignOut();
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  /**
   * Réinitialisation du mot de passe
   * @param {string} email
   * @returns {Promise<Object>}
   */
  const resetPassword = async (email) => {
    try {
      const { error } = await apiResetPassword(email);

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
   * Mise à jour du profil utilisateur (via API profile)
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  const updateProfile = async (profileData) => {
    try {
      if (!authState.user) {
        throw new Error('Utilisateur non connecté');
      }

      const { profile, error } = await updateProfileSettings(authState.user.id, profileData);

      if (error) {
        throw error;
      }

      setAuthState(prev => ({
        ...prev,
        profile: { ...prev.profile, ...profileData },
        user: { ...prev.user, ...profileData }
      }));

      return { data: profile, error: null };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { data: null, error };
    }
  };

  /**
   * Création d'un compte utilisateur (délègue à signUpWithEmail)
   * @param {string} email
   * @param {string} password
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  const createUserAccount = async (email, password, profileData) => {
    try {
      const { user, error } = await signUpWithEmail(email, password, {
        full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
        role: profileData.role,
        department_id: profileData.department_id || null,
        avatar_url: profileData.avatar_url || null
      });

      if (error) {
        throw error;
      }

      return { userId: user?.id || null, error: null };
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      return { userId: null, error };
    }
  };

  const login = async (email, password) => {
    const result = await signIn(email, password);

    if (result?.error) {
      throw result.error instanceof Error
        ? result.error
        : new Error(typeof result.error === 'string' ? result.error : 'Une erreur est survenue lors de la connexion.');
    }

    return result;
  };

  return {
    authState,
    user: authState.user,
    profile: authState.profile,
    session: authState.session,
    admin: authState.admin,
    professor: authState.professor,
    student: authState.student,
    isAdmin: authState.isAdmin,
    isProfessor: authState.isProfessor,
    isStudent: authState.isStudent,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
    fullName: authState.fullName,
    signIn,
    login,
    signUp,
    signOut,
    logout: signOut,
    resetPassword,
    updateProfile,
    createUserAccount
  };
};
