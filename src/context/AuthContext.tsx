import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Student, AppState } from "../types";
import { toast } from 'react-hot-toast';

// Déclaration pour TypeScript - permet d'accéder à window.supabase
declare global {
  interface Window {
    supabase: any;
  }
}

interface AuthContextType {
  appState: AppState;
  login: (name: string, isAdmin?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

const defaultState: AppState = {
  currentUser: null,
  isAdmin: false,
  isAuthenticated: false
};

// Store completed quiz names to prevent retakes
const completedQuizzes = new Set<string>();

const AuthContext = createContext<AuthContextType>({
  appState: defaultState,
  login: async () => false,
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(defaultState);
  
  // Référence au client Supabase initialisé dans index.html
  const supabase = window.supabase;

  // Fonction pour enregistrer un étudiant dans Supabase
  const registerStudentInSupabase = async (student: Student, isAdmin: boolean) => {
    try {
      if (!isAdmin) {
        // Vérifier si l'étudiant est déjà connecté
        const { data: existingStudent } = await supabase
          .from('active_students')
          .select('*')
          .eq('student_name', student.name)
          .single();
          
        if (existingStudent) {
          // Mettre à jour l'entrée existante
          await supabase
            .from('active_students')
            .update({
              status: 'connected',
              last_activity: new Date().toISOString()
            })
            .eq('student_id', existingStudent.student_id);
        } else {
          // Créer une nouvelle entrée
          await supabase
            .from('active_students')
            .insert({
              student_id: student.id,
              student_name: student.name,
              status: 'connected',
              cheating_attempts: 0,
              connected_at: new Date().toISOString(),
              last_activity: new Date().toISOString()
            });
        }
        
        console.log(`Étudiant ${student.name} enregistré dans Supabase`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'étudiant dans Supabase:', error);
    }
  };

  // Fonction pour mettre à jour le statut d'un étudiant dans Supabase
  const updateStudentStatus = async (student: Student, status: string) => {
    try {
      if (student) {
        await supabase
          .from('active_students')
          .update({
            status,
            last_activity: new Date().toISOString()
          })
          .eq('student_id', student.id);
          
        console.log(`Statut de l'étudiant ${student.name} mis à jour: ${status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'étudiant:', error);
    }
  };

  // Mettre à jour le statut de l'étudiant lorsque l'état de l'application change
  useEffect(() => {
    const updateStatus = async () => {
      if (appState.currentUser && !appState.isAdmin) {
        // Mettre à jour le statut de l'étudiant
        await updateStudentStatus(appState.currentUser, 'in_progress');
      }
    };
    
    if (appState.isAuthenticated) {
      updateStatus();
    }
  }, [appState.isAuthenticated]);

  const login = async (name: string, isAdmin = false): Promise<boolean> => {
    const trimmedName = name.trim();
    
    // If user has already completed the quiz and is not an admin, prevent login
    if (!isAdmin && completedQuizzes.has(trimmedName.toLowerCase())) {
      toast.error("Vous avez déjà passé cette évaluation. Vous ne pouvez pas la repasser.");
      return false;
    }

    const student: Student = {
      id: Date.now().toString(),
      name: trimmedName
    };

    // Enregistrer l'étudiant dans Supabase
    await registerStudentInSupabase(student, isAdmin);

    setAppState({
      currentUser: student,
      isAdmin,
      isAuthenticated: true
    });
    
    return true;
  };

  const logout = async () => {
    try {
      // Add the user to completed quizzes when they logout after completing
      if (appState.currentUser && !appState.isAdmin) {
        completedQuizzes.add(appState.currentUser.name.toLowerCase());
        
        // Mettre à jour le statut de l'étudiant dans Supabase
        await updateStudentStatus(appState.currentUser, 'completed');
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setAppState(defaultState);
    }
  };

  return (
    <AuthContext.Provider value={{ appState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};