import React, { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';

// Import des services API
import * as quizService from '../api/quiz';
import { getRandomizedQuestions } from '../data/virtualizationQuizData';

/**
 * Création du contexte Quiz avec des valeurs par défaut
 */
const QuizContext = createContext({
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  quizStatus: {
    isStarted: false,
    isCompleted: false,
    currentQuestionIndex: 0,
    timeRemaining: 0,
    timeStarted: null,
    cheatingAttempts: 0
  },
  cheatingAttempts: 0,
  timer: 0,
  startQuiz: () => {},
  endQuiz: () => {},
  answerQuestion: () => {},
  goToNextQuestion: () => {},
  goToPreviousQuestion: () => {},
  calculateScore: () => 0,
  reportCheatingAttempt: () => {},
  quizResults: [],
  sendQuizResults: async () => {}
});

// Export du contexte pour qu'il soit accessible depuis le hook useQuiz
export { QuizContext };

// Initialisation d'EmailJS avec votre clé publique
emailjs.init("MZdbJf09JZqvMG5M_");

/**
 * Provider du contexte Quiz
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Composants enfants
 */
export const QuizProvider = ({ children }) => {
  const { authState } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizStatus, setQuizStatus] = useState({
    isStarted: false,
    isCompleted: false,
    currentQuestionIndex: 0,
    timeRemaining: 0,
    timeStarted: null,
    cheatingAttempts: 0
  });
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [quizResults, setQuizResults] = useState([]);
  const [timer, setTimer] = useState(0);
  const [currentExamId, setCurrentExamId] = useState(null);

  /**
   * Fonction pour calculer le score
   * @returns {number} Score calculé
   */
  const calculateScore = () => {
    let score = 0;
    
    questions.forEach((question) => {
      const questionId = question.id.toString();
      if (userAnswers[questionId] !== undefined) {
        const userAnswerIndex = userAnswers[questionId];
        const correctOptionIndex = question.options.findIndex(opt => opt.is_correct);
        if (userAnswerIndex === correctOptionIndex) {
          score += 1;
        }
      }
    });
    
    return score;
  };

  /**
   * Fonction pour envoyer une notification par email
   * @param {Object} studentProfile - Profil de l'étudiant
   * @param {number} score - Score obtenu
   * @param {number} totalQuestions - Nombre total de questions
   */
  const sendEmailNotification = async (studentProfile, score, totalQuestions) => {
    if (!studentProfile) {
      return;
    }

    try {
      const templateParams = {
        student_name: studentProfile.full_name,
        student_email: studentProfile.email,
        score: score,
        total_questions: totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      };

      const response = await emailjs.send(
        'service_z6a5yd1',
        'template_9jb1q9l',
        templateParams
      );

      console.log('Email envoyé avec succès:', response);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
    }
  };

  /**
   * Fonction pour terminer le quiz
   */
  const endQuiz = async () => {
    if (!quizStatus.isStarted || quizStatus.isCompleted) {
      return;
    }
    
    try {
      const score = calculateScore();
      const completionTime = new Date().getTime() - new Date(quizStatus.timeStarted).getTime();
      
      setQuizStatus(prev => ({
        ...prev,
        isCompleted: true
      }));
      
      // Calculer la note sur 20
      const scoreOn20 = (score / questions.length) * 20;
      
      // Envoyer une notification par email
      if (authState.profile) {
        await sendEmailNotification(
          authState.profile,
          scoreOn20,
          questions.length
        );
      }
      
      toast.success("Quiz terminé ! Votre note est de " + scoreOn20.toFixed(1) + "/20");
      
      // Si nous avons un ID d'examen, enregistrer les résultats
      if (currentExamId && authState.user) {
        const quizResultData = {
          student_id: authState.user.id,
          exam_id: currentExamId,
          score: score,
          total_questions: questions.length,
          completion_time: Math.floor(completionTime / 1000), // en secondes
          answers: JSON.stringify(userAnswers),
          cheating_attempts: cheatingAttempts,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await quizService.saveQuizResult(quizResultData);
      }
    } catch (error) {
      console.error("Erreur lors de la finalisation du quiz:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement des résultats");
    }
  };

  /**
   * Fonction pour envoyer les résultats du quiz
   * @param {number} examId - ID de l'examen
   * @returns {Promise<void>}
   */
  const sendQuizResults = async (examId) => {
    if (!authState.user) {
      toast.error("Vous devez être connecté pour soumettre vos résultats");
      return;
    }
    
    try {
      // Calcule du score
      const score = calculateScore();
      const completionTime = new Date().getTime() - new Date(quizStatus.timeStarted).getTime();
      
      // Préparation des données à envoyer
      const quizResultData = {
        student_id: authState.user.id,
        exam_id: examId,
        score: score,
        total_questions: questions.length,
        completion_time: Math.floor(completionTime / 1000), // en secondes
        answers: JSON.stringify(userAnswers),
        cheating_attempts: cheatingAttempts,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Envoi des résultats
      await quizService.saveQuizResult(quizResultData);
      
      // Mise à jour du statut
      setQuizStatus(prev => ({
        ...prev,
        isCompleted: true
      }));
      
      toast.success("Résultats soumis avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'envoi des résultats:", error);
      toast.error("Erreur lors de l'envoi des résultats");
    }
  };

  /**
   * Récupère les résultats des quizzes de l'étudiant
   */
  const fetchStudentQuizResults = async () => {
    if (!authState.user) {
      return;
    }
    
    try {
      const { data: resultsData, error } = await quizService.getStudentQuizResults(
        authState.user.id
      );
      
      if (error) {
        throw error;
      }
      
      if (resultsData) {
        setQuizResults(resultsData);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des résultats:", error);
    }
  };
  
  // Effet pour charger les résultats des quizzes lorsque l'utilisateur est connecté
  useEffect(() => {
    if (authState.user) {
      fetchStudentQuizResults();
    }
  }, [authState.user]);
  
  // Minuteur pour les examens
  useEffect(() => {
    let intervalId;
    
    if (quizStatus.isStarted && !quizStatus.isCompleted) {
      intervalId = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [quizStatus.isStarted, quizStatus.isCompleted]);

  /**
   * Fonction pour démarrer le quiz
   * @param {number} examId - ID de l'examen
   */
  const startQuiz = async (examId) => {
    try {
      toast.info("Chargement des questions...");
      
      // Récupérer les questions de l'examen
      const { data: examQuestions, error } = await quizService.getExamQuestions(examId);
      
      if (error || !examQuestions) {
        console.error("Erreur lors de la récupération des questions:", error);
        toast.error("Impossible de charger les questions de l'examen");
        return;
      }
      
      // Randomiser les questions pour éviter la communication des réponses entre étudiants
const randomizedQuestions = getRandomizedQuestions(examQuestions);
console.log(`Questions randomisées: ${randomizedQuestions.length}`);
setQuestions(randomizedQuestions);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      setCheatingAttempts(0);
      setTimer(0);
      setCurrentExamId(examId);
      
      // Enregistrer l'étudiant comme actif pour cet examen
      if (authState.user) {
        const activeStudentData = {
          student_id: authState.user.id,
          exam_id: examId,
          start_time: new Date().toISOString(), // Correction: start_time au lieu de started_at
          last_ping: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await quizService.recordActiveStudent(activeStudentData);
      }
      
      setQuizStatus({
        isStarted: true,
        isCompleted: false,
        currentQuestionIndex: 0,
        timeRemaining: 0,
        timeStarted: new Date().toISOString(),
        cheatingAttempts: 0
      });
      
      toast.success("L'examen a commencé!");
    } catch (error) {
      console.error("Erreur lors du démarrage du quiz:", error);
      toast.error("Une erreur est survenue lors du démarrage de l'examen");
    }
  };

  /**
   * Fonction pour répondre à une question
   * @param {string} questionId - ID de la question
   * @param {number} answerIndex - Index de la réponse choisie
   */
  const answerQuestion = (questionId, answerIndex) => {
    if (quizStatus.isStarted && !quizStatus.isCompleted) {
      setUserAnswers((prev) => ({
        ...prev,
        [questionId]: answerIndex
      }));
    }
  };

  /**
   * Fonction pour aller à la question suivante
   */
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuizStatus(prev => ({
        ...prev,
        currentQuestionIndex: currentQuestionIndex + 1
      }));
    }
  };

  /**
   * Fonction pour aller à la question précédente
   */
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setQuizStatus(prev => ({
        ...prev,
        currentQuestionIndex: currentQuestionIndex - 1
      }));
    }
  };

  /**
   * Fonction pour signaler une tentative de triche
   * @param {string} details - Détails de la tentative de triche
   */
  const reportCheatingAttempt = async (details) => {
    try {
      setCheatingAttempts((prev) => prev + 1);
      
      // Enregistrer la tentative de triche dans la base de données
      if (authState.user && currentExamId) {
        const cheatingData = {
          student_id: authState.user.id,
          exam_id: currentExamId,
          details: details,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await quizService.recordCheatingAttempt(cheatingData);
        
        // Mettre à jour le statut du quiz
        setQuizStatus(prev => ({
          ...prev,
          cheatingAttempts: prev.cheatingAttempts + 1
        }));
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la tentative de triche:", error);
    }
  };

  // Utilisation d'un objet pour le provider au lieu de JSX direct
  const contextValue = {
    questions,
    currentQuestionIndex,
    userAnswers,
    quizStatus,
    cheatingAttempts,
    timer,
    startQuiz,
    endQuiz,
    answerQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    calculateScore,
    reportCheatingAttempt,
    quizResults,
    sendQuizResults
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

/**
 * Hook personnalisé pour faciliter l'utilisation du contexte Quiz
 * @returns {Object} Contexte Quiz
 */
export const useQuiz = () => useContext(QuizContext);
