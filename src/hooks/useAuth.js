import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook pour accéder au contexte d'authentification
 * Retourne l'état d'authentification, le profil utilisateur et les fonctions associées
 * @returns {Object} Contexte d'authentification
 */
export const useAuth = () => useContext(AuthContext);
