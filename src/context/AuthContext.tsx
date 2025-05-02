import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Student, AppState } from "../types";
import { toast } from 'react-hot-toast';
import supabase, { checkSupabaseConnection as checkConnection } from '../supabase';

// Stockage local des étudiants actifs (fallback si Supabase échoue)
interface ActiveStudent {
  student_id: string;
  student_name: string;
  status: 'connected' | 'in_progress' | 'completed';
  cheating_attempts: number;
  connected_at: string;
  last_activity: string;
  has_completed?: boolean;
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

// Store completed quiz names to prevent retakes (fallback local storage)
const completedQuizzes = new Set<string>();

// Stockage local des étudiants actifs
const activeStudents: Record<string, ActiveStudent> = {};

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
  const [supabaseAvailable, setSupabaseAvailable] = useState<boolean>(true);
  
  // Vérifier si Supabase est disponible au chargement
  useEffect(() => {
    const verifySupabaseConnection = async () => {
      try {
        const isConnected = await checkConnection();
        setSupabaseAvailable(isConnected);
        console.log(`Connexion à Supabase: ${isConnected ? 'Établie' : 'Échouée'}`);
      } catch (err) {
        console.error('Erreur lors de la vérification de la connexion Supabase:', err);
        setSupabaseAvailable(false);
      }
    };
    
    verifySupabaseConnection();
  }, []);

  // Fonction pour vérifier si un étudiant a déjà terminé l'examen
  const checkIfStudentHasCompleted = async (studentName: string): Promise<boolean> => {
    // Vérifier d'abord dans le stockage local
    if (completedQuizzes.has(studentName.toLowerCase())) {
      console.log(`L'étudiant ${studentName} a déjà terminé l'examen (vérifié localement)`);
      return true;
    }
    
    // Si Supabase n'est pas disponible, vérifier uniquement localement
    if (!supabaseAvailable) {
      console.log(`Supabase non disponible, vérification locale uniquement pour ${studentName}`);
      return false;
    }
    
    try {
      // Vérifier dans Supabase
      const { data, error } = await supabase
        .from('active_students')
        .select('has_completed')
        .eq('student_name', studentName)
        .maybeSingle();
      
      if (error) {
        console.error('Erreur lors de la vérification du statut de l\'étudiant:', error);
        return false;
      }
      
      if (data && data.has_completed) {
        console.log(`L'étudiant ${studentName} a déjà terminé l'examen (vérifié dans Supabase)`);
        // Ajouter au stockage local pour les futures vérifications
        completedQuizzes.add(studentName.toLowerCase());
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Exception lors de la vérification du statut de l\'étudiant:', error);
      return false;
    }
  };

  // Fonction pour enregistrer un étudiant dans Supabase ou localement
  const registerStudentInSupabase = async (student: Student, isAdmin: boolean) => {
    if (isAdmin) return; // Ne pas enregistrer les administrateurs
    
    // Enregistrer localement en premier (fallback)
    activeStudents[student.id] = {
      student_id: student.id,
      student_name: student.name,
      status: 'connected',
      cheating_attempts: 0,
      connected_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      has_completed: false
    };
    
    // Si Supabase n'est pas disponible, ne pas essayer d'y accéder
    if (!supabaseAvailable) {
      console.log(`Étudiant ${student.name} enregistré localement (Supabase non disponible)`);
      return;
    }
    
    try {
      // Vérifier si l'étudiant existe déjà
      const { data, error } = await supabase
        .from('active_students')
        .select('student_id')
        .eq('student_name', student.name)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification de l\'étudiant:', error);
        return;
      }
      
      if (data) {
        // L'étudiant existe déjà, mettre à jour son statut
        const updateResponse = await supabase
          .from('active_students')
          .update({
            status: 'connected',
            last_activity: new Date().toISOString(),
            has_completed: false
          })
          .eq('student_id', data.student_id)
          .single();
          
        if (updateResponse.error) {
          console.error('Erreur lors de la mise à jour de l\'étudiant:', updateResponse.error);
          return;
        }
        
        console.log(`Étudiant ${student.name} mis à jour dans Supabase`);
      } else {
        // L'étudiant n'existe pas, l'insérer
        const insertResponse = await supabase
          .from('active_students')
          .insert({
            student_id: student.id,
            student_name: student.name,
            status: 'connected',
            cheating_attempts: 0,
            connected_at: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            has_completed: false
          });
          
        if (insertResponse.error) {
          console.error('Erreur lors de l\'insertion de l\'étudiant:', insertResponse.error);
          return;
        }
        
        console.log(`Étudiant ${student.name} enregistré dans Supabase`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'étudiant dans Supabase:', error);
    }
  };

  // Fonction pour mettre à jour le statut d'un étudiant dans Supabase
  const updateStudentStatus = async (student: Student, status: string, hasCompleted = false) => {
    if (!student) return;
    
    // Mettre à jour localement en premier (fallback)
    if (activeStudents[student.id]) {
      activeStudents[student.id].status = status as 'connected' | 'in_progress' | 'completed';
      activeStudents[student.id].last_activity = new Date().toISOString();
      activeStudents[student.id].has_completed = hasCompleted;
    }
    
    // Si Supabase n'est pas disponible, ne pas essayer d'y accéder
    if (!supabaseAvailable) {
      console.log(`Statut de l'étudiant ${student.name} mis à jour localement: ${status}`);
      return;
    }
    
    try {
      const updateResponse = await supabase
        .from('active_students')
        .update({
          status,
          last_activity: new Date().toISOString(),
          has_completed: hasCompleted
        })
        .eq('student_id', student.id)
        .single();
        
      if (updateResponse.error) {
        console.error('Erreur lors de la mise à jour du statut:', updateResponse.error);
        return;
      }
        
      console.log(`Statut de l'étudiant ${student.name} mis à jour: ${status}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'étudiant:', error);
    }
  };

  // Mettre à jour le statut de l'étudiant lorsque l'état de l'application change
  useEffect(() => {
    if (!appState.isAuthenticated) return;
    
    const updateStatus = async () => {
      if (appState.currentUser && !appState.isAdmin) {
        // Mettre à jour le statut de l'étudiant
        await updateStudentStatus(appState.currentUser, 'in_progress');
      }
    };
    
    updateStatus();
    
    // Nous désactivons l'avertissement ESLint car updateStudentStatus dépend de supabase et supabaseAvailable
    // qui ne changent pas souvent, et nous ne voulons pas recréer la fonction à chaque rendu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.isAuthenticated, appState.currentUser, appState.isAdmin]);

  const login = async (name: string, isAdmin = false): Promise<boolean> => {
    const trimmedName = name.trim();
    
    // Vérifier si l'utilisateur a déjà passé l'examen
    if (!isAdmin) {
      const hasCompleted = await checkIfStudentHasCompleted(trimmedName);
      if (hasCompleted) {
        toast.error("Vous avez déjà passé cette évaluation. Vous ne pouvez pas la repasser.");
        return false;
      }
    }

    const student: Student = {
      id: Date.now().toString(),
      name: trimmedName
    };

    // Enregistrer l'étudiant dans Supabase ou localement
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
        await updateStudentStatus(appState.currentUser, 'completed', true);
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