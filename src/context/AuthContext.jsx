import React, { createContext } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

/**
 * Valeur par défaut du contexte d'authentification
 */
const defaultAuthState = {
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
};

/**
 * Création du contexte avec une valeur par défaut
 */
export const AuthContext = createContext({
  authState: defaultAuthState,
  user: null,
  profile: null,
  session: null,
  admin: null,
  professor: null,
  student: null,
  isAdmin: false,
  isProfessor: false,
  isStudent: false,
  isAuthenticated: false,
  loading: true,
  error: null,
  fullName: '',
  signIn: async () => ({ error: null }),
  login: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  logout: async () => {},
  resetPassword: async () => ({ error: null }),
  updateProfile: async () => ({ error: null, data: null }),
  createUserAccount: async () => ({ error: null, userId: null })
});

/**
 * Hook personnalisé pour utiliser le contexte
 * @returns {Object} Le contexte d'authentification
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

/**
 * Provider pour le contexte d'authentification
 * @param {Object} props - Les propriétés du composant
 * @param {React.ReactNode} props.children - Les composants enfants
 */
export const AuthProvider = ({ children }) => {
  // Utiliser notre hook personnalisé
  const contextValue = useSupabaseAuth();

  // Retourner le Provider avec les enfants
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
