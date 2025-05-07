import React, { useEffect, useState } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { useAuth } from "../hooks/useAuth";
// Remplacer l'import de lucide-react par une icône de Material-UI
import { AccessTime as Clock } from "@mui/icons-material";
// Import du client Supabase depuis le bon chemin
import { supabase } from '../supabase';

/**
 * @typedef {Object} ActiveStudent
 * @property {string} [id] - Identifiant optionnel
 * @property {string} student_id - Identifiant de l'étudiant
 * @property {string} student_name - Nom de l'étudiant
 * @property {'connected'|'in_progress'|'completed'} status - Statut de l'étudiant
 * @property {number} cheating_attempts - Nombre de tentatives de triche
 * @property {string} connected_at - Date de connexion
 * @property {string} last_activity - Date de dernière activité
 */

/**
 * Tableau de bord d'administration pour le suivi des étudiants en temps réel
 * Permet de surveiller les étudiants actifs et de gérer les tentatives de triche
 * @returns {JSX.Element} Composant de tableau de bord d'administration
 */
const AdminDashboard = () => {
  const { quizResults: contextQuizResults, timer } = useQuiz();
  const { logout } = useAuth();
  const [quizResults, setQuizResults] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  
  // Référence au client Supabase
  const supabaseClient = supabase;
  
  /**
   * Vérification de la connexion Supabase
   * @returns {Promise<boolean>} État de la connexion
   */
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
  
  /**
   * Récupération des résultats depuis Supabase
   * @returns {Promise<void>} Résultats des quiz
   */
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
        setQuizResults(prevResults => {
          // Fusionner les résultats locaux et ceux de Supabase en évitant les doublons
          const existingIds = new Set(prevResults.map(r => r.studentId));
          const newResults = data.filter(r => !existingIds.has(r.studentId));
          return [...prevResults, ...newResults];
        });
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
    }
  };
  
  /**
   * Récupération des étudiants actifs
   * @returns {Promise<void>} Étudiants actifs
   */
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
        setError("Erreur lors de la récupération des étudiants. Vérifiez votre connexion.");
        setLoading(false);
        return;
      }
      
      if (data) {
        // Mise à jour avec les données de Supabase
        setActiveStudents(data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur inattendue lors du chargement des étudiants:', err);
      setError("Une erreur est survenue lors du chargement des étudiants actifs.");
      setLoading(false);
    }
  };
  
  /**
   * Initialisation des données au chargement
   * @returns {Promise<void>} Initialisation de données
   */
  const initializeData = async () => {
    setLoading(true);
    const connected = await checkSupabaseConnection();
    if (connected) {
      await fetchActiveStudents();
      await fetchQuizResults();
    }
    setLoading(false);
  };
  
  /**
   * Configuration des abonnements en temps réel
   * @returns {Function} Fonction de nettoyage des abonnements
   */
  const setupRealtimeSubscriptions = () => {
    if (!supabaseClient || !supabaseAvailable) {
      console.warn('Abonnements temps réel non configurés : client Supabase non disponible');
      return () => {};
    }
    
    try {
      // Abonnement aux mises à jour de la table active_students
      const activeStudentsSubscription = supabaseClient
        .channel('active-students-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'active_students'
        }, (payload) => {
          console.log('Changement dans active_students:', payload);
          
          // Mettre à jour le state en fonction du type d'événement
          if (payload.eventType === 'INSERT') {
            setActiveStudents(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setActiveStudents(prev => 
              prev.map(student => 
                student.id === payload.new.id ? payload.new : student
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setActiveStudents(prev => 
              prev.filter(student => student.id !== payload.old.id)
            );
          }
        })
        .subscribe((status) => {
          console.log('Statut de l\'abonnement active_students:', status);
        });
      
      // Abonnement aux mises à jour de la table quiz_results
      const quizResultsSubscription = supabaseClient
        .channel('quiz-results-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'quiz_results'
        }, (payload) => {
          console.log('Changement dans quiz_results:', payload);
          
          // Mettre à jour le state en fonction du type d'événement
          if (payload.eventType === 'INSERT') {
            setQuizResults(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setQuizResults(prev => 
              prev.map(result => 
                result.id === payload.new.id ? payload.new : result
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setQuizResults(prev => 
              prev.filter(result => result.id !== payload.old.id)
            );
          }
        })
        .subscribe((status) => {
          console.log('Statut de l\'abonnement quiz_results:', status);
        });
      
      // Fonction de nettoyage
      return () => {
        activeStudentsSubscription.unsubscribe();
        quizResultsSubscription.unsubscribe();
      };
    } catch (error) {
      console.error('Erreur lors de la configuration des abonnements temps réel:', error);
      return () => {};
    }
  };
  
  // Initialisation au montage du composant
  useEffect(() => {
    initializeData();
    
    // Configurer les abonnements temps réel
    const cleanupSubscriptions = setupRealtimeSubscriptions();
    
    // Nettoyage à la désinscription
    return () => {
      cleanupSubscriptions();
    };
  }, []);
  
  /**
   * Fonction pour signaler une tentative de triche pour un étudiant spécifique
   * @param {string} studentId - Identifiant de l'étudiant
   * @returns {Promise<void>} Mise à jour du nombre de tentatives de triche
   */
  const reportCheatingForStudent = async (studentId) => {
    if (!supabaseClient || !supabaseAvailable) {
      console.warn('Impossible de signaler la triche : client Supabase non disponible');
      return;
    }
    
    try {
      // Trouver l'étudiant spécifique
      const studentToUpdate = activeStudents.find(s => s.student_id === studentId);
      
      if (!studentToUpdate) {
        console.error(`Étudiant avec l'ID ${studentId} non trouvé`);
        return;
      }
      
      // Incrémenter le compteur de triche
      const updatedCheatingAttempts = (studentToUpdate.cheating_attempts || 0) + 1;
      
      // Mettre à jour dans Supabase
      const { error } = await supabaseClient
        .from('active_students')
        .update({ 
          cheating_attempts: updatedCheatingAttempts,
          last_activity: new Date().toISOString() 
        })
        .eq('student_id', studentId);
        
      if (error) {
        console.error('Erreur lors de la mise à jour de la tentative de triche:', error);
        return;
      }
      
      console.log(`Tentative de triche signalée pour l'étudiant ${studentId}`);
      
      // Mettre à jour le state local
      setActiveStudents(prev => 
        prev.map(student => 
          student.student_id === studentId 
            ? { ...student, cheating_attempts: updatedCheatingAttempts }
            : student
        )
      );
    } catch (err) {
      console.error('Erreur inattendue lors du signalement de triche:', err);
    }
  };
  
  /**
   * Fonction pour formater le timer
   * @param {number} timerSeconds - Temps en secondes
   * @returns {string} Temps formaté
   */
  const formatTimer = (timerSeconds) => {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  /**
   * Fonction pour obtenir la classe CSS en fonction du statut
   * @param {string} status - Statut de l'étudiant
   * @returns {string} Classes CSS à appliquer
   */
  const getStatusClass = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  /**
   * Fonction pour formater la date
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Date invalide';
    }
  };
  
  /**
   * Fonction pour calculer le temps écoulé depuis la dernière activité
   * @param {string} lastActivity - Date de dernière activité
   * @returns {string} Temps écoulé formaté
   */
  const getTimeElapsed = (lastActivity) => {
    try {
      const lastActivityDate = new Date(lastActivity);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - lastActivityDate.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return `${diffInSeconds}s`;
      }
      if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m`;
      }
      return `${Math.floor(diffInSeconds / 3600)}h ${Math.floor((diffInSeconds % 3600) / 60)}m`;
    } catch (error) {
      return 'N/A';
    }
  };
  
  /**
   * Fonction pour convertir le score sur 20
   * @param {number} score - Score obtenu
   * @param {number} maxScore - Score maximum possible
   * @returns {number} Score sur 20
   */
  const convertToScore20 = (score, maxScore) => {
    return Math.round((score / maxScore) * 20 * 100) / 100;
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Tableau de bord de l'examen</h1>
            {timer && (
              <div className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">{formatTimer(timer.seconds)}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Étudiants connectés</h3>
              <p className="text-3xl font-bold text-blue-900">
                {activeStudents.filter(s => s.status === 'connected' || s.status === 'in_progress').length}
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">En cours d'examen</h3>
              <p className="text-3xl font-bold text-yellow-900">
                {activeStudents.filter(s => s.status === 'in_progress').length}
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Examens terminés</h3>
              <p className="text-3xl font-bold text-green-900">
                {quizResults.length}
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Étudiants actifs</h2>
            
            {loading ? (
              <div className="text-center py-10">
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
