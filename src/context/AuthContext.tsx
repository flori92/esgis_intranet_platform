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

// Stockage local des étudiants actifs (fallback si Supabase échoue)
const activeStudents: Record<string, any> = {};

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
  
  // Référence au client Supabase initialisé dans index.html
  const supabase = window.supabase;
  
  // Vérifier si Supabase est disponible au chargement
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Tenter une requête simple pour vérifier la connexion
        const { error } = await supabase
          .from('quiz_results')
          .select('count(*)', { count: 'exact', head: true })
          .limit(1);
          
        if (error) {
          console.warn('Problème de connexion à Supabase:', error);
          setSupabaseAvailable(false);
        } else {
          console.log('Connexion à Supabase établie');
          setSupabaseAvailable(true);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de la connexion Supabase:', err);
        setSupabaseAvailable(false);
      }
    };
    
    checkSupabaseConnection();
  }, []);

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
      last_activity: new Date().toISOString()
    };
    
    // Si Supabase n'est pas disponible, ne pas essayer d'y accéder
    if (!supabaseAvailable) {
      console.log(`Étudiant ${student.name} enregistré localement (Supabase non disponible)`);
      return;
    }
    
    try {
      // Vérifier si l'étudiant est déjà connecté
      const { data, error } = await supabase
        .from('active_students')
        .select('*')
        .eq('student_name', student.name)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors de la vérification de l\'étudiant:', error);
        return;
      }
      
      if (data) {
        // Mettre à jour l'entrée existante
        const { error: updateError } = await supabase
          .from('active_students')
          .update({
            status: 'connected',
            last_activity: new Date().toISOString()
          })
          .eq('student_id', data.student_id);
          
        if (updateError) {
          console.error('Erreur lors de la mise à jour de l\'étudiant:', updateError);
          return;
        }
          
        console.log(`Étudiant ${student.name} mis à jour dans Supabase`);
      } else {
        // Créer une nouvelle entrée
        const { error: insertError } = await supabase
          .from('active_students')
          .insert({
            student_id: student.id,
            student_name: student.name,
            status: 'connected',
            cheating_attempts: 0,
            connected_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Erreur lors de l\'insertion de l\'étudiant:', insertError);
          return;
        }
        
        console.log(`Étudiant ${student.name} enregistré dans Supabase`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'étudiant dans Supabase:', error);
    }
  };

  // Fonction pour mettre à jour le statut d'un étudiant dans Supabase
  const updateStudentStatus = async (student: Student, status: string) => {
    if (!student) return;
    
    // Mettre à jour localement en premier (fallback)
    if (activeStudents[student.id]) {
      activeStudents[student.id].status = status;
      activeStudents[student.id].last_activity = new Date().toISOString();
    }
    
    // Si Supabase n'est pas disponible, ne pas essayer d'y accéder
    if (!supabaseAvailable) {
      console.log(`Statut de l'étudiant ${student.name} mis à jour localement: ${status}`);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('active_students')
        .update({
          status,
          last_activity: new Date().toISOString()
        })
        .eq('student_id', student.id);
        
      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return;
      }
        
      console.log(`Statut de l'étudiant ${student.name} mis à jour: ${status}`);
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