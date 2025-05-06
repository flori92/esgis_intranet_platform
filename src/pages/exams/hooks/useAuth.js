import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

/**
 * Hook d'authentification adapté pour le module d'examen
 * Adapte le hook useSupabaseAuth pour qu'il soit compatible avec le composant Quiz
 * @returns {Object} État d'authentification adapté pour le module d'examen
 */
export const useAuth = () => {
  const auth = useSupabaseAuth();
  
  // Adapter l'état d'authentification pour qu'il soit compatible avec le composant Quiz
  return {
    appState: {
      currentUser: {
        id: auth.authState.user?.id,
        email: auth.authState.user?.email,
        name: auth.authState.profile?.full_name || auth.authState.user?.email,
        role: auth.authState.isAdmin ? 'admin' : auth.authState.isProfessor ? 'professor' : 'student'
      },
      isAuthenticated: auth.authState.isAuthenticated,
      isAdmin: auth.authState.isAdmin,
      isProfessor: auth.authState.isProfessor,
      isStudent: auth.authState.isStudent
    },
    authState: auth.authState,
    signIn: auth.signIn,
    signOut: auth.signOut
  };
};
