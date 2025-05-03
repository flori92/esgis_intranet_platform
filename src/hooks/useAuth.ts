import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../context/AuthContext';

// Hook pour accéder au contexte d'authentification avec typage explicite
export const useAuth = (): AuthContextType => useContext(AuthContext);
