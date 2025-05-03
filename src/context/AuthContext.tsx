import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import supabase from '../services/supabase';
import { Database } from '../types/database';

// Types pour le contexte d'authentification
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Professor = Database['public']['Tables']['professors']['Row'];

// État d'authentification
export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  student: Student | null;
  professor: Professor | null;
  isAdmin: boolean;
  isProfessor: boolean;
  isStudent: boolean;
  isLoggedIn: boolean;
  loading: boolean;
}

// Interface pour le contexte d'authentification
export interface AuthContextType {
  authState: AuthState;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: Record<string, never> | null;
  }>;
  updateProfile: (profileData: Partial<Profile>) => Promise<{
    error: Error | null;
    data: Profile | null;
  }>;
  refreshSession: () => Promise<void>;
  createUserAccount: (userData: {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'professor' | 'student';
    department_id?: number | null;
    additional_data?: Record<string, any>;
  }) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
}

// Valeur par défaut du contexte
const initialAuthState: AuthState = {
  session: null,
  user: null,
  profile: null,
  student: null,
  professor: null,
  isAdmin: false,
  isProfessor: false,
  isStudent: false,
  isLoggedIn: false,
  loading: true,
};

// Création du contexte
const AuthContext = createContext<AuthContextType>({
  authState: initialAuthState,
  signIn: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null, data: null }),
  updateProfile: async () => ({ error: null, data: null }),
  refreshSession: async () => {},
  createUserAccount: async () => ({ error: null, data: null }),
});

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte d'authentification
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  // Fonction pour récupérer le profil utilisateur
  const fetchUserProfile = async (userId: string) => {
    try {
      // Récupérer le profil de base
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Déterminer le rôle et récupérer les données supplémentaires
      let student = null;
      let professor = null;
      let isAdmin = false;
      let isProfessor = false;
      let isStudent = false;

      if (profile) {
        // Définir les rôles
        isAdmin = profile.role === 'admin';
        isProfessor = profile.role === 'professor';
        isStudent = profile.role === 'student';

        // Récupérer les données spécifiques au rôle
        if (isStudent) {
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('profile_id', userId)
            .single();
          student = studentData;
        } else if (isProfessor) {
          const { data: professorData } = await supabase
            .from('professors')
            .select('*')
            .eq('profile_id', userId)
            .single();
          professor = professorData;
        }
      }

      // Mettre à jour l'état d'authentification
      setAuthState(prev => ({
        ...prev,
        profile,
        student,
        professor,
        isAdmin,
        isProfessor,
        isStudent,
        isLoggedIn: true,
        loading: false,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  // Fonction pour rafraîchir la session (utilisation de useCallback pour éviter les dépendances circulaires)
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session.user,
          isLoggedIn: true,
        }));
        await fetchUserProfile(session.user.id);
      } else {
        setAuthState({
          ...initialAuthState,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
      setAuthState({
        ...initialAuthState,
        loading: false,
      });
    }
  }, []);

  // Écouter les changements d'authentification
  useEffect(() => {
    // Récupérer la session initiale
    refreshSession();

    // S'abonner aux changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          isLoggedIn: session !== null,
          loading: true,
        }));

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            student: null,
            professor: null,
            isAdmin: false,
            isProfessor: false,
            isStudent: false,
            isLoggedIn: false,
            loading: false,
          }));
        }
      }
    );

    // Nettoyer l'abonnement
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { data: data.session, error };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { data: null, error: error as Error };
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        ...initialAuthState,
        loading: false,
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction de réinitialisation du mot de passe
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { data: {}, error };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return { data: null, error: error as Error };
    }
  };

  // Fonction de mise à jour du profil
  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      if (!authState.user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour l'état local
      setAuthState(prev => ({
        ...prev,
        profile: data,
      }));

      return { data, error: null };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { data: null, error: error as Error };
    }
  };

  // Fonction de création de compte (réservée aux administrateurs)
  const createUserAccount = async (userData: {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'professor' | 'student';
    department_id?: number | null;
    additional_data?: Record<string, any>;
  }) => {
    try {
      // Vérifier que l'utilisateur actuel est un administrateur
      if (!authState.isAdmin) {
        throw new Error('Accès non autorisé. Seuls les administrateurs peuvent créer des comptes.');
      }

      // Créer l'utilisateur dans Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // L'email est automatiquement confirmé
      });

      if (error) throw error;

      if (data.user) {
        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            department_id: userData.department_id || null,
            is_active: true,
          });

        if (profileError) throw profileError;

        // Créer les données spécifiques au rôle
        if (userData.role === 'student') {
          // Générer un numéro d'étudiant unique
          const studentNumber = `STU${Date.now().toString().slice(-6)}`;
          
          // Créer un enregistrement étudiant
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              profile_id: data.user.id,
              student_number: userData.additional_data?.student_number || studentNumber,
              entry_year: userData.additional_data?.entry_year || new Date().getFullYear(),
              level: userData.additional_data?.level || 'L1',
              status: 'active',
            });

          if (studentError) throw studentError;
        } else if (userData.role === 'professor') {
          // Générer un numéro d'employé unique
          const employeeNumber = `PROF${Date.now().toString().slice(-6)}`;
          
          // Créer un enregistrement professeur
          const { error: professorError } = await supabase
            .from('professors')
            .insert({
              profile_id: data.user.id,
              employee_number: userData.additional_data?.employee_number || employeeNumber,
              hire_date: userData.additional_data?.hire_date || new Date().toISOString().split('T')[0],
              specialties: userData.additional_data?.specialties || [],
              status: 'active',
            });

          if (professorError) throw professorError;
        }
      }

      return { data: data.user, error: null };
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      return { data: null, error: error as Error };
    }
  };

  // Valeur du contexte
  const value = {
    authState,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
    createUserAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;