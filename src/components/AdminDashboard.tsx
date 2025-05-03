import React, { useEffect, useState } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { useAuth } from "../hooks/useAuth";
import { Timer, QuizResult } from "../types";
import { Clock } from "lucide-react";
import supabase from '../services/supabase';

// Suppression de la déclaration globale qui cause des problèmes de typage
// Les accès à window.supabase seront typés via casting explicite

// Interface pour les étudiants actifs
interface ActiveStudent {
  id?: string;
  student_id: string;
  student_name: string;
  status: 'connected' | 'in_progress' | 'completed';
  cheating_attempts: number;
  connected_at: string;
  last_activity: string;
}

const AdminDashboard: React.FC = () => {
  const { quizResults: contextQuizResults, timer } = useQuiz();
  const { logout } = useAuth();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseAvailable, setSupabaseAvailable] = useState<boolean>(true);
  
  // Référence au client Supabase avec casting explicite
  const supabaseClient = (window as any).supabase || supabase;
  
  // Vérification de la connexion Supabase
  const checkSupabaseConnection = async () => {
    try {
      // Vérifier d'abord si supabase est défini
      if (!supabaseClient) {
        console.warn('Client Supabase non initialisé');
        setSupabaseAvailable(false);
        setError("Client Supabase non disponible. Affichage des données locales uniquement.");
        return false;
      }
      
      // Tenter une requête simple pour vérifier la connexion
      const { error } = await supabaseClient
        .from('quiz_results')
        .select('*')
        .limit(1);
        
      if (error) {
        console.warn('Problème de connexion à Supabase:', error);
        setSupabaseAvailable(false);
        setError("Impossible de se connecter à la base de données. Affichage des données locales uniquement.");
        return false;
      } else {
        console.log('Connexion à Supabase établie');
        setSupabaseAvailable(true);
        return true;
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de la connexion Supabase:', err);
      setSupabaseAvailable(false);
      setError("Erreur de connexion à la base de données. Affichage des données locales uniquement.");
      return false;
    }
  };
  
  // Récupération des résultats depuis Supabase
  const fetchQuizResults = async () => {
    if (!supabaseClient || !supabaseAvailable) {
      return;
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('quiz_results')
        .select('*');
        
      if (error) {
        console.error('Erreur lors de la récupération des résultats:', error);
        return;
      }
      
      if (data) {
        const typedData = data as QuizResult[];
        setQuizResults(prevResults => {
          // Fusionner les résultats locaux et ceux de Supabase en évitant les doublons
          const existingIds = new Set(prevResults.map((r: QuizResult) => r.studentId));
          const newResults = typedData.filter((r: QuizResult) => !existingIds.has(r.studentId));
          return [...prevResults, ...newResults];
        });
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
    }
  };
  
  // Récupération des étudiants actifs
  const fetchActiveStudents = async () => {
    try {
      setLoading(true);
      
      if (!supabaseClient || !supabaseAvailable) {
        setLoading(false);
        return;
      }
      
      // Tenter de récupérer les étudiants actifs
      const { data, error } = await supabaseClient
        .from('active_students')
        .select('*');
        
      if (error) {
        console.error('Erreur lors de la récupération des étudiants actifs:', error);
        setError("Impossible de récupérer les étudiants actifs. Veuillez créer la table manuellement dans Supabase.");
        setLoading(false);
        return;
      }
      
      if (data) {
        const typedData = data as ActiveStudent[];
        setActiveStudents(typedData);
        setError(null);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setError("Une erreur inattendue s'est produite. Veuillez rafraîchir la page.");
    } finally {
      setLoading(false);
    }
  };
  
  // Exécuter les fonctions de manière séquentielle
  const initializeData = async () => {
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      await fetchQuizResults();
      await fetchActiveStudents();
      setupRealtimeSubscriptions();
    }
  };
  
  // Configuration des abonnements temps réel
  const setupRealtimeSubscriptions = () => {
    if (!supabaseClient || !supabaseAvailable) {
      return;
    }
    
    // Mise en place de l'abonnement temps réel pour les nouveaux résultats
    try {
      const resultsSubscription = supabaseClient
        .channel('public:quiz_results')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_results' }, (payload: { new: QuizResult }) => {
          console.log('Nouveau résultat reçu:', payload.new);
          
          // Ajouter le nouveau résultat aux résultats existants
          setQuizResults(prevResults => {
            // Éviter les doublons en vérifiant si le résultat existe déjà
            const exists = prevResults.some(r => r.studentId === payload.new.studentId);
            if (exists) {
              return prevResults.map(r => 
                r.studentId === payload.new.studentId ? payload.new : r
              );
            } else {
              return [...prevResults, payload.new];
            }
          });
        })
        .subscribe();
        
      // Abonnement aux mises à jour des étudiants actifs
      const studentsSubscription = supabaseClient
        .channel('public:active_students')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'active_students' }, (payload: { new: ActiveStudent }) => {
          console.log('Nouvel étudiant actif:', payload.new);
          
          setActiveStudents(prev => {
            // Éviter les doublons
            const exists = prev.some(s => s.student_id === payload.new.student_id);
            if (exists) {
              return prev.map(s => 
                s.student_id === payload.new.student_id ? payload.new : s
              );
            } else {
              return [...prev, payload.new];
            }
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'active_students' }, (payload: { new: ActiveStudent }) => {
          console.log('Mise à jour étudiant:', payload.new);
          
          setActiveStudents(prev => 
            prev.map(s => 
              s.student_id === payload.new.student_id ? payload.new : s
            )
          );
        })
        .subscribe();
        
      // Nettoyage des abonnements à la destruction du composant
      return () => {
        if (resultsSubscription) {
          resultsSubscription.unsubscribe();
        }
        if (studentsSubscription) {
          studentsSubscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error("Erreur lors de la configuration des abonnements temps réel:", error);
      return () => {}; // Retourner une fonction de nettoyage vide en cas d'erreur
    }
  };
  
  useEffect(() => {
    // Initialisation avec les résultats du contexte pour un affichage immédiat
    setQuizResults(contextQuizResults || []);
    
    initializeData();
  }, [contextQuizResults, supabaseClient, supabaseAvailable]);
  
  // Fonction pour signaler une tentative de triche pour un étudiant spécifique
  const reportCheatingForStudent = async (studentId: string) => {
    try {
      if (!supabaseClient || !supabaseAvailable) {
        // Mise à jour locale
        setActiveStudents(current => 
          current.map(student => {
            if (student.student_id === studentId) {
              return {
                ...student,
                cheating_attempts: (student.cheating_attempts || 0) + 1
              };
            }
            return student;
          })
        );
        return;
      }
      
      // Mettre à jour le nombre de tentatives de triche dans Supabase
      const { data, error } = await supabaseClient
        .from('active_students')
        .select('cheating_attempts')
        .eq('student_id', studentId)
        .single();
        
      if (error) {
        console.error('Erreur lors de la récupération des tentatives de triche:', error);
        return;
      }
      
      const updatedCheatingAttempts = (data?.cheating_attempts || 0) + 1;
      
      await supabaseClient
        .from('active_students')
        .update({ cheating_attempts: updatedCheatingAttempts })
        .eq('student_id', studentId);
        
      console.log(`Tentative de triche signalée pour l'étudiant ${studentId}`);
    } catch (err) {
      console.error('Erreur lors du signalement de triche:', err);
    }
  };
  
  const averageScore = quizResults.length > 0
    ? quizResults.reduce((sum: number, result: QuizResult) => sum + result.score, 0) / quizResults.length
    : 0;
  
  const sortedResults = [...quizResults].sort((a: QuizResult, b: QuizResult) => b.score - a.score);

  const formatTimer = (timer: Timer) => {
    return `${String(timer.minutes).padStart(2, '0')}:${String(timer.seconds).padStart(2, '0')}`;
  };
  
  // Fonction pour obtenir la classe CSS en fonction du statut
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Fonction pour calculer le temps écoulé depuis la dernière activité
  const getTimeElapsed = (lastActivity: string) => {
    const lastActivityTime = new Date(lastActivity).getTime();
    const now = new Date().getTime();
    const diffInSeconds = Math.floor((now - lastActivityTime) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} min`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)} h ${Math.floor((diffInSeconds % 3600) / 60)} min`;
    }
  };
  
  // Fonction pour convertir le score sur 20
  const convertToScore20 = (score: number, maxScore: number) => {
    return (score / maxScore) * 20;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Tableau de bord administrateur
            </h1>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>Temps restant: {formatTimer(timer)}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            Déconnexion
          </button>
        </header>
        
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700">{error}</p>
            <p className="text-sm text-yellow-600 mt-2">
              Pour résoudre ce problème, veuillez exécuter le script SQL dans l'éditeur SQL de Supabase :
              <br />
              <code className="bg-yellow-100 px-2 py-1 rounded">scripts/create_active_students_manual.sql</code>
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Étudiants connectés</h2>
            <p className="text-3xl font-bold text-blue-600">{activeStudents.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Note moyenne</h2>
            <p className="text-3xl font-bold text-blue-600">{averageScore.toFixed(1)}/20</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Tentatives de triche</h2>
            <p className="text-3xl font-bold text-red-600">
              {activeStudents.reduce((sum, student) => sum + (student.cheating_attempts || 0), 0)}
            </p>
          </div>
        </div>
        
        {/* Section des résultats des étudiants */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Résultats des étudiants</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pourcentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Triche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedResults.map((result: QuizResult) => {
                  const scorePercentage = (result.score / result.maxScore) * 100;
                  const scoreOn20 = convertToScore20(result.score, result.maxScore);
                  const dateFormatted = new Date(result.completedAt).toLocaleString();
                  
                  return (
                    <tr key={result.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.studentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          scorePercentage >= 80 ? "text-green-600" :
                          scorePercentage >= 60 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {scoreOn20.toFixed(1)}/20
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{scorePercentage.toFixed(1)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          result.cheatingAttempts > 0 ? "text-red-600 font-medium" : "text-gray-500"
                        }`}>
                          {result.cheatingAttempts}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dateFormatted}
                      </td>
                    </tr>
                  );
                })}
                
                {quizResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun résultat disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Section des étudiants actifs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Étudiants connectés</h2>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des données...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tentatives de triche
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Connecté à
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière activité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeStudents.map((student) => (
                    <tr key={student.id || student.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(student.status)}`}>
                          {student.status === 'connected' ? 'Connecté' : 
                           student.status === 'in_progress' ? 'En cours d\'examen' : 'Terminé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          student.cheating_attempts > 0 ? "text-red-600 font-medium" : "text-gray-500"
                        }`}>
                          {student.cheating_attempts}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(student.connected_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getTimeElapsed(student.last_activity)} ({formatDate(student.last_activity)})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => reportCheatingForStudent(student.student_id)}
                          className="text-red-600 hover:text-red-900 mr-2"
                        >
                          Signaler triche
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {activeStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        {error ? 
                          "Impossible d'afficher les étudiants connectés. Veuillez créer la table manuellement." : 
                          "Aucun étudiant connecté"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;