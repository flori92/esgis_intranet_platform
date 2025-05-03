import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Profile, Student, Professor, Role } from '../types/supabase.types';

// Types pour le contexte d'authentification
export interface AuthState {
  user: User | null;
  profile: Profile | null;
  student: Student | null;
  professor: Professor | null;
  session: Session | null;
  isAdmin: boolean;
  isProfessor: boolean;
  isStudent: boolean;
  error: Error | null;
  loading: boolean;
}

export interface AuthContextType {
  authState: AuthState;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias pour signOut pour compatibilité
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (profileData: Partial<Profile>) => Promise<{
    error: Error | null;
    data: Profile | null;
  }>;
  createUserAccount: (
    email: string,
    password: string,
    profileData: {
      full_name: string;
      role: Role;
      department_id?: number;
    }
  ) => Promise<{ error: Error | null; userId: string | null }>;
}

// Valeur par défaut du contexte
const defaultAuthState: AuthState = {
  user: null,
  profile: null,
  student: null,
  professor: null,
  session: null,
  isAdmin: false,
  isProfessor: false,
  isStudent: false,
  error: null,
  loading: true
};

// Création du contexte
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

// Provider pour le contexte d'authentification
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  // Récupérer le profil de l'utilisateur
  const fetchUserProfile = async (user: User) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Vérifier et convertir le rôle en type Role valide
      let userRole: Role = 'student'; // Valeur par défaut
      if (profile.role === 'admin' || profile.role === 'professor' || profile.role === 'student') {
        userRole = profile.role as Role; // Conversion explicite
      } else {
        console.warn(`Rôle non reconnu: ${profile.role}, utilisation de 'student' par défaut`);
      }

      // Mettre à jour le profil avec le rôle validé
      const validatedProfile = {
        ...profile,
        role: userRole
      };

      let studentData = null;
      let professorData = null;

      if (userRole === 'student') {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('profile_id', user.id)
          .single();

        if (studentError && studentError.code !== 'PGRST116') {
          throw studentError;
        }

        // Si l'étudiant existe, ajouter les propriétés manquantes si nécessaires
        if (student) {
          studentData = {
            ...student,
            graduation_year: student.graduation_year || null,
            specialization: student.specialization || null,
            status: student.status as "active" | "suspended" | "graduated" | "expelled"
          };
        }
      } else if (userRole === 'professor') {
        const { data: professor, error: professorError } = await supabase
          .from('professors')
          .select('*')
          .eq('profile_id', user.id)
          .single();

        if (professorError && professorError.code !== 'PGRST116') {
          throw professorError;
        }

        professorData = professor;
      }

      setAuthState(prev => ({
        ...prev,
        user,
        profile: validatedProfile,
        student: studentData,
        professor: professorData,
        session: { ...prev.session, user },
        isAdmin: userRole === 'admin',
        isProfessor: userRole === 'professor',
        isStudent: userRole === 'student',
        loading: false
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      setAuthState(prev => ({
        ...prev,
        error: error as Error,
        loading: false
      }));
    }
  };

  // Fonction pour rafraîchir la session (avec useCallback pour éviter les recréations à chaque rendu)
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { user } = session;
        if (user) {
          await fetchUserProfile(user);
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          profile: null,
          student: null,
          professor: null,
          session: null,
          isAdmin: false,
          isProfessor: false,
          isStudent: false,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
      setAuthState(prev => ({ ...prev, error: error as Error, loading: false }));
    }
  }, []);

  // Effet pour s'abonner aux changements d'authentification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { user } = session;
          await fetchUserProfile(user);
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            ...defaultAuthState,
            loading: false
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user
          }));
        }
      }
    );

    // Rafraîchir la session lors du montage du composant
    refreshSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]); // Ajout de refreshSession comme dépendance

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { error: error as Error };
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        ...defaultAuthState,
        loading: false
      });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      setAuthState(prev => ({
        ...prev,
        error: error as Error
      }));
    }
  };

  // Fonction pour réinitialiser le mot de passe
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Erreur de réinitialisation de mot de passe:', error);
      return { error: error as Error };
    }
  };

  // Fonction pour mettre à jour le profil
  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      // Vérifier et convertir le rôle si présent
      const updatedProfileData = { ...profileData };
      if (profileData.role && 
          (profileData.role === 'admin' || 
           profileData.role === 'professor' || 
           profileData.role === 'student')) {
        updatedProfileData.role = profileData.role as Role;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', authState.user?.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Mise à jour de l'état
      if (data) {
        // Valider et assigner le rôle
        const validatedRole: Role = 
          data.role === 'admin' || 
          data.role === 'professor' || 
          data.role === 'student' 
            ? data.role as Role 
            : 'student'; // Valeur par défaut
            
        setAuthState(prev => ({
          ...prev,
          profile: { ...data, role: validatedRole },
          isAdmin: validatedRole === 'admin',
          isProfessor: validatedRole === 'professor',
          isStudent: validatedRole === 'student'
        }));
      }
      
      return { error: null, data: data as Profile };
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error);
      return { error: error as Error, data: null };
    }
  };

  // Fonction pour créer un compte utilisateur
  const createUserAccount = async (
    email: string,
    password: string,
    profileData: {
      full_name: string;
      role: Role;
      department_id?: number;
    }
  ) => {
    try {
      // Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur: Utilisateur non créé');
      
      const userId = authData.user.id;
      
      // Créer le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: profileData.full_name,
          role: profileData.role,
          department_id: profileData.department_id || null,
          is_active: true
        });
      
      if (profileError) throw profileError;
      
      // Créer l'entrée spécifique au rôle (étudiant ou professeur)
      if (profileData.role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert([{
            profile_id: userId,
            student_number: `STD-${Date.now().toString().slice(-6)}`,
            entry_year: new Date().getFullYear(),
            graduation_year: null,
            level: 'Licence 1', // Niveau par défaut
            specialization: null,
            status: 'active'
          }]);
        
        if (studentError) throw studentError;
      } else if (profileData.role === 'professor') {
        const { error: professorError } = await supabase
          .from('professors')
          .insert([{
            profile_id: userId,
            title: 'Dr.',
            specialization: '',
            status: 'active'
          }]);
        
        if (professorError) throw professorError;
      }
      
      return { error: null, userId };
    } catch (error) {
      console.error('Erreur de création de compte:', error);
      return { error: error as Error, userId: null };
    }
  };

  // Alias pour signOut
  const logout = signOut;

  // Valeur du contexte
  const contextValue: AuthContextType = {
    authState,
    signIn,
    signOut,
    logout, // Ajout de l'alias
    resetPassword,
    updateProfile,
    createUserAccount
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};