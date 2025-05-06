import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { toast } from 'react-hot-toast';

/**
 * Hook personnalisé pour gérer l'état et la logique d'un quiz/examen
 * @returns {Object} État et fonctions pour gérer le quiz
 */
export const useQuiz = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  // États du quiz
  const [quizStatus, setQuizStatus] = useState('NOT_STARTED'); // NOT_STARTED, IN_PROGRESS, COMPLETED
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState({ minutes: 0, seconds: 0 });
  const [examData, setExamData] = useState(null);
  const [studentExamId, setStudentExamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Références pour les timers et intervalles
  const timerIntervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const cheatingAttemptsRef = useRef(0);
  
  // Charger les données de l'examen et les questions
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        if (!authState.user || !authState.isStudent) {
          {
            throw new Error('Accès non autorisé');
          }
        }
        
        // Récupérer les détails de l'examen
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select(`
            id,
            title,
            course_id,
            courses:course_id (name, code),
            professor_id,
            professors:professor_id (profiles:profile_id(full_name)),
            date,
            duration,
            type,
            room,
            total_points,
            passing_grade,
            status,
            description
          `)
          .eq('id', examId)
          .single();
        
        if (examError) throw examError;
        
        if (!examData) {
          {
            throw new Error('Examen non trouvé');
          }
        }
        
        // Récupérer l'inscription de l'étudiant à l'examen
        const { data: studentExam, error: studentExamError } = await supabase
          .from('student_exams')
          .select('*')
          .eq('exam_id', examId)
          .eq('student_id', authState.user.id)
          .single();
        
        if (studentExamError && studentExamError.code !== 'PGRST116') {
          throw studentExamError;
        }
        
        if (!studentExam) {
          {
            throw new Error('Vous n\'êtes pas inscrit à cet examen');
          }
        }
        
        // Récupérer les questions de l'examen
        const { data: questionsData, error: questionsError } = await supabase
          .from('exam_questions')
          .select(`
            id,
            question_text,
            question_type,
            points,
            options,
            correct_answer,
            order
          `)
          .eq('exam_id', examId)
          .order('order', { ascending: true });
        
        if (questionsError) throw questionsError;
        
        if (!questionsData || questionsData.length === 0) {
          // Si aucune question n'est trouvée, utiliser des questions fictives pour le développement
          const mockQuestions = [
            {
              id: 1,
              question_text: "Qu'est-ce que la virtualisation ?",
              question_type: "multiple_choice",
              points: 2,
              options: [
                "Une technique pour créer des versions virtuelles de ressources informatiques",
                "Un langage de programmation",
                "Un type de base de données",
                "Un protocole réseau"
              ],
              correct_answer: "Une technique pour créer des versions virtuelles de ressources informatiques",
              order: 1
            },
            {
              id: 2,
              question_text: "Quels sont les avantages de la virtualisation ? (Sélectionnez toutes les réponses correctes)",
              question_type: "multiple_select",
              points: 3,
              options: [
                "Réduction des coûts matériels",
                "Augmentation de la consommation d'énergie",
                "Meilleure utilisation des ressources",
                "Facilité de sauvegarde et de récupération"
              ],
              correct_answer: ["Réduction des coûts matériels", "Meilleure utilisation des ressources", "Facilité de sauvegarde et de récupération"],
              order: 2
            },
            {
              id: 3,
              question_text: "Expliquez la différence entre la virtualisation de type 1 et de type 2.",
              question_type: "text",
              points: 5,
              options: [],
              correct_answer: "",
              order: 3
            }
          ];
          setQuestions(mockQuestions);
        } else {
          setQuestions(questionsData);
        }
        
        // Initialiser le timer avec la durée de l'examen
        setTimer({ minutes: examData.duration, seconds: 0 });
        
        // Sauvegarder les données de l'examen et l'ID de l'inscription
        setExamData(examData);
        setStudentExamId(studentExam.id);
        
        // Initialiser les réponses vides
        const initialAnswers = {};
        questionsData.forEach(q => {
          initialAnswers[q.id] = q.question_type === 'multiple_select' ? [] : '';
        });
        setAnswers(initialAnswers);
        
      } catch (error) {
        console.error('Erreur lors du chargement de l\'examen:', error);
        setError(error.message);
        toast.error(error.message);
        
        // Rediriger vers la liste des examens en cas d'erreur
        setTimeout(() => {
          navigate('/exams');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExamData();
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [examId, authState, navigate]);
  
  /**
   * Démarrer le quiz et initialiser le timer
   */
  const startQuiz = useCallback(() => {
    if (quizStatus !== 'NOT_STARTED' || !examData) {
      return;
    }
    
    // Définir l'heure de fin
    const now = new Date();
    const endTime = new Date(now.getTime() + examData.duration * 60000);
    endTimeRef.current = endTime;
    
    // Démarrer le timer
    timerIntervalRef.current = setInterval(() => {
      const now = new Date();
      const diff = endTimeRef.current - now;
      
      if (diff <= 0) {
        // Temps écoulé, soumettre automatiquement
        clearInterval(timerIntervalRef.current);
        setTimer({ minutes: 0, seconds: 0 });
        submitQuiz();
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      setTimer({ minutes, seconds });
    }, 1000);
    
    setQuizStatus('IN_PROGRESS');
    toast.success('L\'examen a commencé. Bonne chance !');
  }, [quizStatus, examData]);
  
  /**
   * Passer à la question suivante
   */
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);
  
  /**
   * Revenir à la question précédente
   */
  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);
  
  /**
   * Aller à une question spécifique
   * @param {number} index - Index de la question
   */
  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);
  
  /**
   * Enregistrer la réponse à une question
   * @param {number} questionId - ID de la question
   * @param {string|Array} answer - Réponse de l'utilisateur
   */
  const saveAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);
  
  /**
   * Soumettre le quiz
   */
  const submitQuiz = useCallback(async () => {
    if (quizStatus !== 'IN_PROGRESS') {
      return;
    }
    
    try {
      // Arrêter le timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Calculer le score
      let totalScore = 0;
      let maxScore = 0;
      
      questions.forEach(question => {
        maxScore += question.points;
        
        const userAnswer = answers[question.id];
        
        if (!userAnswer) {
          return; // Pas de réponse
        }
        
        if (question.question_type === 'multiple_choice') {
          if (userAnswer === question.correct_answer) {
            totalScore += question.points;
          }
        } else if (question.question_type === 'multiple_select') {
          // Vérifier si les tableaux sont identiques (même contenu)
          const correctAnswers = question.correct_answer;
          if (Array.isArray(correctAnswers) && 
              Array.isArray(userAnswer) && 
              correctAnswers.length === userAnswer.length &&
              correctAnswers.every(item => userAnswer.includes(item))) {
            totalScore += question.points;
          }
        } else if (question.question_type === 'text') {
          // Pour les questions textuelles, on ne peut pas calculer automatiquement
          // Le professeur devra corriger manuellement
        }
      });
      
      // Calculer le pourcentage
      const scorePercentage = Math.round((totalScore / (maxScore === 0 ? 1 : maxScore)) * 100);
      
      // Déterminer si l'examen est réussi
      const isPassed = scorePercentage >= (examData.passing_grade || 50);
      
      // Enregistrer les résultats dans la base de données
      const { error } = await supabase
        .from('exam_results')
        .insert({
          exam_id: examId,
          student_id: authState.user.id,
          student_exam_id: studentExamId,
          score: totalScore,
          max_score: maxScore,
          percentage: scorePercentage,
          passed: isPassed,
          answers: answers,
          submitted_at: new Date().toISOString(),
          cheating_attempts: cheatingAttemptsRef.current
        });
      
      if (error) throw error;
      
      // Mettre à jour le statut de la tentative
      await supabase
        .from('student_exams')
        .update({ attempt_status: 'submitted' })
        .eq('id', studentExamId);
      
      // Mettre à jour l'état du quiz
      setQuizStatus('COMPLETED');
      
      toast.success('Examen soumis avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'examen:', error);
      toast.error('Erreur lors de la soumission de l\'examen. Veuillez réessayer.');
    }
  }, [quizStatus, questions, answers, examId, examData, authState.user.id, studentExamId]);
  
  /**
   * Signaler une tentative de triche
   */
  const reportCheatingAttempt = useCallback(async () => {
    if (quizStatus !== 'IN_PROGRESS') {
      return;
    }
    
    try {
      // Incrémenter le compteur de tentatives de triche
      cheatingAttemptsRef.current += 1;
      
      // Enregistrer la tentative de triche dans la base de données
      await supabase
        .from('cheating_attempts')
        .insert({
          exam_id: examId,
          student_id: authState.user.id,
          student_exam_id: studentExamId,
          timestamp: new Date().toISOString(),
          attempt_count: cheatingAttemptsRef.current
        });
      
      // Si trop de tentatives de triche, soumettre automatiquement
      if (cheatingAttemptsRef.current >= 3) {
        toast.error('Trop de tentatives de triche détectées. L\'examen sera soumis automatiquement.');
        submitQuiz();
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la tentative de triche:', error);
    }
  }, [quizStatus, examId, authState.user.id, studentExamId, submitQuiz]);
  
  return {
    quizStatus,
    questions,
    currentQuestionIndex,
    answers,
    timer,
    examData,
    loading,
    error,
    startQuiz,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    saveAnswer,
    submitQuiz,
    reportCheatingAttempt
  };
};
