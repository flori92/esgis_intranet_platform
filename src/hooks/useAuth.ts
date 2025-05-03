import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Hook pour accéder au contexte d'authentification
export const useAuth = () => useContext(AuthContext);
