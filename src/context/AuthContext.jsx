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
  isAuthenticated: false,
  error: null,
  loading: true
};

/**
 * Création du contexte avec une valeur par défaut
 */
export const AuthContext = createContext({
  authState: defaultAuthState,
  signIn: async () => ({ error: null }),
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
  const {
    authState,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    createUserAccount
  } = useSupabaseAuth();

  // Définir l'alias logout pour signOut (pour maintenir la compatibilité)
  const logout = signOut;

  // Créer la valeur du contexte
  const contextValue = {
    authState,
    signIn,
    signOut,
    logout,
    resetPassword,
    updateProfile,
    createUserAccount
  };

  // Retourner le Provider avec les enfants
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
