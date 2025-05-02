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
  const [tableCreated, setTableCreated] = useState<boolean>(false);
  
  // Référence au client Supabase initialisé dans index.html
  const supabase = window.supabase;

  // Fonction pour créer la table active_students si elle n'existe pas
  const createActiveStudentsTable = async () => {
    try {
      console.log('Tentative de création de la table active_students...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.active_students (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          student_id TEXT NOT NULL,
          student_name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'connected',
          cheating_attempts INTEGER NOT NULL DEFAULT 0,
          connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        
        ALTER TABLE public.active_students ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Lecture pour tous" ON public.active_students
          FOR SELECT USING (true);
        
        CREATE POLICY "Insertion pour tous" ON public.active_students
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Mise à jour pour tous" ON public.active_students
          FOR UPDATE USING (true);
        
        ALTER PUBLICATION supabase_realtime ADD TABLE public.active_students;
      `;
      
      // Exécuter le SQL via l'API SQL
      const { error } = await supabase.rpc('exec_sql', { query: createTableSQL });
      
      if (error) {
        console.error('Erreur lors de la création de la table:', error);
        return false;
      }
      
      console.log('Table active_students créée avec succès!');
      setTableCreated(true);
      return true;
    } catch (err) {
      console.error('Erreur lors de la création de la table:', err);
      return false;
    }
  };

  // Fonction pour enregistrer un étudiant dans Supabase
  const registerStudentInSupabase = async (student: Student, isAdmin: boolean) => {
    if (isAdmin) return; // Ne pas enregistrer les administrateurs
    
    try {
      // Vérifier si la table existe en tentant d'y accéder
      const { error: checkError } = await supabase
        .from('active_students')
        .select('count(*)', { count: 'exact', head: true })
        .limit(1);
      
      // Si la table n'existe pas, essayer de la créer
      if (checkError && (checkError.code === '42P01' || checkError.message.includes('does not exist') || checkError.status === 404)) {
        console.log('Table active_students non trouvée, tentative de création...');
        const created = await createActiveStudentsTable();
        
        if (!created) {
          console.error('Impossible de créer la table active_students');
          return;
        }
      }
      
      // Vérifier si l'étudiant est déjà connecté
      try {
        const { data: existingStudent, error: fetchError } = await supabase
          .from('active_students')
          .select('*')
          .eq('student_name', student.name)
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Erreur lors de la vérification de l\'étudiant:', fetchError);
          return;
        }
        
        if (existingStudent) {
          // Mettre à jour l'entrée existante
          await supabase
            .from('active_students')
            .update({
              status: 'connected',
              last_activity: new Date().toISOString()
            })
            .eq('student_id', existingStudent.student_id);
            
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
      } catch (err) {
        console.error('Erreur lors de la gestion de l\'étudiant:', err);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'étudiant dans Supabase:', error);
    }
  };

  // Fonction pour mettre à jour le statut d'un étudiant dans Supabase
  const updateStudentStatus = async (student: Student, status: string) => {
    try {
      if (student) {
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