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

const AdminDashboard: React.FC = () => {
  const { quizResults: contextQuizResults, timer } = useQuiz();
  const { logout } = useAuth();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  
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
    
    fetchQuizResults();
    
    // Mise en place de l'abonnement temps réel pour les nouveaux résultats
    const subscription = supabase
      .channel('public:quiz_results')
      .on('INSERT', (payload: { new: QuizResult }) => {
        setQuizResults((currentResults: QuizResult[]) => [...currentResults, payload.new]);
      })
      .subscribe();
      
    // Nettoyage de l'abonnement à la destruction du composant
    return () => {
      subscription.unsubscribe();
    };
  }, [contextQuizResults]);
  
  const averageScore = quizResults.length > 0
    ? quizResults.reduce((sum: number, result: QuizResult) => sum + result.score, 0) / quizResults.length
    : 0;
  
  const sortedResults = [...quizResults].sort((a: QuizResult, b: QuizResult) => b.score - a.score);

  const formatTimer = (timer: Timer) => {
    return `${String(timer.minutes).padStart(2, '0')}:${String(timer.seconds).padStart(2, '0')}`;
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
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Étudiants en cours</h2>
            <p className="text-3xl font-bold text-blue-600">{quizResults.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Note moyenne</h2>
            <p className="text-3xl font-bold text-blue-600">{averageScore.toFixed(1)}/20</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Tentatives de triche</h2>
            <p className="text-3xl font-bold text-red-600">
              {quizResults.reduce((sum: number, result: QuizResult) => sum + result.cheatingAttempts, 0)}
            </p>
          </div>
        </div>
        
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