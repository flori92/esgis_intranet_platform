import React, { useEffect, useState } from "react";
import { useQuiz } from "../context/QuizContext";
import { useAuth } from "../context/AuthContext";
import { Timer, QuizResult } from "../types";
import { Clock } from "lucide-react";

// Déclaration pour TypeScript - permet d'accéder à window.supabase
declare global {
  interface Window {
    supabase: any;
  }
}

// Interface pour les étudiants actifs
interface ActiveStudent {
  id: string;
  student_id: string;
  student_name: string;
  status: 'connected' | 'in_progress' | 'completed';
  cheating_attempts: number;
  connected_at: string;
  last_activity: string;
}

const AdminDashboard: React.FC = () => {
  const { quizResults: contextQuizResults, timer } = useQuiz() as any;
  const { logout } = useAuth() as any;
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Référence au client Supabase initialisé dans index.html
  const supabase = window.supabase;
  
  // Récupération des résultats depuis Supabase et mise en place de l'abonnement temps réel
  useEffect(() => {
    // Initialisation avec les résultats du contexte pour un affichage immédiat
    setQuizResults(contextQuizResults);
    
    // Récupération des résultats depuis Supabase
    const fetchQuizResults = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_results')
          .select('*');
          
        if (error) {
          console.error('Erreur lors de la récupération des résultats:', error);
          return;
        }
        
        if (data) {
          setQuizResults(data);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
      }
    };
    
    // Récupération des étudiants actifs
    const fetchActiveStudents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('active_students')
          .select('*')
          .order('connected_at', { ascending: false });
          
        if (error) {
          console.error('Erreur lors de la récupération des étudiants actifs:', error);
          return;
        }
        
        if (data) {
          setActiveStudents(data);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizResults();
    fetchActiveStudents();
    
    // Mise en place de l'abonnement temps réel pour les nouveaux résultats
    const resultsSubscription = supabase
      .channel('public:quiz_results')
      .on('INSERT', (payload: { new: QuizResult }) => {
        setQuizResults((currentResults) => [...currentResults, payload.new]);
      })
      .subscribe();
      
    // Mise en place de l'abonnement temps réel pour les étudiants actifs
    const studentsSubscription = supabase
      .channel('public:active_students')
      .on('INSERT', (payload: { new: ActiveStudent }) => {
        console.log('Nouvel étudiant connecté:', payload.new);
        setActiveStudents((current) => [payload.new, ...current]);
      })
      .on('UPDATE', (payload: { new: ActiveStudent }) => {
        console.log('Mise à jour étudiant:', payload.new);
        setActiveStudents((current) => 
          current.map(student => 
            student.student_id === payload.new.student_id ? payload.new : student
          )
        );
      })
      .subscribe();
      
    // Nettoyage des abonnements à la destruction du composant
    return () => {
      resultsSubscription.unsubscribe();
      studentsSubscription.unsubscribe();
    };
  }, [contextQuizResults]);
  
  // Fonction pour signaler une tentative de triche pour un étudiant spécifique
  const reportCheatingForStudent = async (studentId: string) => {
    try {
      // Mettre à jour le nombre de tentatives de triche dans Supabase
      const { data, error } = await supabase
        .from('active_students')
        .select('cheating_attempts')
        .eq('student_id', studentId)
        .single();
        
      if (error) {
        console.error('Erreur lors de la récupération des tentatives de triche:', error);
        return;
      }
      
      const updatedCheatingAttempts = (data?.cheating_attempts || 0) + 1;
      
      await supabase
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
              {activeStudents.reduce((sum, student) => sum + student.cheating_attempts, 0)}
            </p>
          </div>
        </div>
        
        {/* Section des étudiants actifs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
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
                    <tr key={student.id} className="hover:bg-gray-50">
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
                        Aucun étudiant connecté
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Section des résultats des étudiants */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                          {result.score.toFixed(1)}/20
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
      </div>
    </div>
  );
};

export default AdminDashboard;