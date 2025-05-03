import React, { createContext, useState, useEffect, ReactNode, useRef } from "react";
import { Question, QuizResult, QuizStatus, Timer } from "../types";
import { getRandomizedQuestions } from "../data/questions";
import { useAuth } from "../hooks/useAuth";
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import supabase from '../supabase';

// Déclaration pour TypeScript - permet d'accéder à window.supabase
declare global {
  interface Window {
    supabase: typeof supabase;
  }
}

// Interface du contexte Quiz avec export pour rendre accessible depuis d'autres fichiers
export interface QuizContextType {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<string, number>;
  quizStatus: QuizStatus;
  cheatingAttempts: number;
  timer: Timer;
  startQuiz: () => void;
  endQuiz: () => void;
  answerQuestion: (questionId: string, answerIndex: number) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  calculateScore: () => number;
  reportCheatingAttempt: () => void;
  quizResults: QuizResult[];
}

const QuizContext = createContext<QuizContextType>({
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  quizStatus: QuizStatus.NOT_STARTED,
  cheatingAttempts: 0,
  timer: { minutes: 120, seconds: 0 },
  startQuiz: () => {},
  endQuiz: () => {},
  answerQuestion: () => {},
  goToNextQuestion: () => {},
  goToPreviousQuestion: () => {},
  calculateScore: () => 0,
  reportCheatingAttempt: () => {},
  quizResults: []
});

// Export du contexte pour qu'il soit accessible depuis le hook useQuiz
export { QuizContext };

interface QuizProviderProps {
  children: ReactNode;
}

// Initialize EmailJS with your public key
emailjs.init("MZdbJf09JZqvMG5M_");

export const QuizProvider: React.FC<QuizProviderProps> = ({ children }: QuizProviderProps) => {
  const { appState } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizStatus, setQuizStatus] = useState<QuizStatus>(QuizStatus.NOT_STARTED);
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [timer, setTimer] = useState<Timer>({ minutes: 120, seconds: 0 });
  
  // Référence au client Supabase initialisé dans index.html
  const supabase = window.supabase;

  // Utilisation de useRef pour stocker des références stables aux fonctions
  // qui seront utilisées dans les useEffect pour éviter les recréations
  const functionsRef = useRef<{
    calculateScore: () => number;
    sendEmailNotification: (result: QuizResult) => Promise<void>;
    endQuiz: () => void;
  }>({
    calculateScore: () => {
      let score = 0;
      
      questions.forEach((question) => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
          score += 0.5; // Chaque question vaut 0.5 point
        }
      });
      
      return score;
    },
    
    sendEmailNotification: async (result: QuizResult) => {
      try {
        const templateParams = {
          to_email: 'florifavi@gmail.com',
          student_name: result.studentName,
          score: result.score.toFixed(1),
          max_score: result.maxScore,
          percentage: ((result.score / result.maxScore) * 100).toFixed(1),
          cheating_attempts: result.cheatingAttempts,
          completion_date: new Date(result.completedAt).toLocaleString(),
        };
  
        await emailjs.send(
          'service_default',
          'template_default',
          templateParams
        );
  
        toast.success('Résultats envoyés à l\'administrateur');
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        toast.error('Erreur lors de l\'envoi des résultats');
      }
    },
    
    endQuiz: () => {
      if (appState.currentUser && quizStatus === QuizStatus.IN_PROGRESS) {
        const score = functionsRef.current!.calculateScore();
        const result: QuizResult = {
          studentId: appState.currentUser.id,
          studentName: appState.currentUser.name,
          score,
          maxScore: questions.length * 0.5,
          answers: { ...userAnswers },
          cheatingAttempts,
          completedAt: new Date().toISOString()
        };
        
        // Insertion du résultat dans Supabase
        const insertQuizResult = async () => {
          try {
            const { error } = await supabase
              .from('quiz_results')
              .insert([result]);
              
            if (error) {
              console.error('Erreur lors de l\'enregistrement du résultat:', error);
              toast.error('Erreur lors de l\'enregistrement du résultat');
              // Fallback : enregistrement local en cas d'échec
              setQuizResults((prev: QuizResult[]) => [...prev, result]);
              return;
            }
            
            toast.success('Résultat enregistré avec succès');
            // Mise à jour locale pour cohérence de l'UI
            setQuizResults((prev: QuizResult[]) => [...prev, result]);
          } catch (err) {
            console.error('Erreur inattendue:', err);
            toast.error('Erreur lors de l\'enregistrement du résultat');
            // Fallback : enregistrement local en cas d'échec
            setQuizResults((prev: QuizResult[]) => [...prev, result]);
          }
        };
        
        insertQuizResult();
        setQuizStatus(QuizStatus.COMPLETED);
        
        // Send email notification with the results
        functionsRef.current!.sendEmailNotification(result);
      }
    }
  });

  // Mise à jour des fonctions dans la ref quand les dépendances changent
  useEffect(() => {
    functionsRef.current!.calculateScore = () => {
      let score = 0;
      
      questions.forEach((question) => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
          score += 0.5; // Chaque question vaut 0.5 point
        }
      });
      
      return score;
    };
  }, [questions, userAnswers]);

  useEffect(() => {
    functionsRef.current!.endQuiz = () => {
      if (appState.currentUser && quizStatus === QuizStatus.IN_PROGRESS) {
        const score = functionsRef.current!.calculateScore();
        const result: QuizResult = {
          studentId: appState.currentUser.id,
          studentName: appState.currentUser.name,
          score,
          maxScore: questions.length * 0.5,
          answers: { ...userAnswers },
          cheatingAttempts,
          completedAt: new Date().toISOString()
        };
        
        // Insertion du résultat dans Supabase
        const insertQuizResult = async () => {
          try {
            const { error } = await supabase
              .from('quiz_results')
              .insert([result]);
              
            if (error) {
              console.error('Erreur lors de l\'enregistrement du résultat:', error);
              toast.error('Erreur lors de l\'enregistrement du résultat');
              // Fallback : enregistrement local en cas d'échec
              setQuizResults((prev: QuizResult[]) => [...prev, result]);
              return;
            }
            
            toast.success('Résultat enregistré avec succès');
            // Mise à jour locale pour cohérence de l'UI
            setQuizResults((prev: QuizResult[]) => [...prev, result]);
          } catch (err) {
            console.error('Erreur inattendue:', err);
            toast.error('Erreur lors de l\'enregistrement du résultat');
            // Fallback : enregistrement local en cas d'échec
            setQuizResults((prev: QuizResult[]) => [...prev, result]);
          }
        };
        
        insertQuizResult();
        setQuizStatus(QuizStatus.COMPLETED);
        
        // Send email notification with the results
        functionsRef.current!.sendEmailNotification(result);
      }
    };
  }, [appState.currentUser, questions.length, userAnswers, cheatingAttempts, quizStatus, supabase]);

  // Récupération des résultats depuis Supabase au chargement
  useEffect(() => {
    const fetchQuizResults = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_results')
          .select('*');
          
        if (error) {
          console.error('Erreur lors de la récupération des résultats:', error);
          toast.error('Erreur lors de la récupération des résultats');
          return;
        }
        
        if (data) {
          setQuizResults(data);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
        toast.error('Erreur lors de la récupération des résultats');
      }
    };
    
    fetchQuizResults();
  }, [supabase]);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (quizStatus === QuizStatus.IN_PROGRESS && timer.minutes >= 0) {
      interval = setInterval(() => {
        setTimer((prevTimer: Timer) => {
          if (prevTimer.minutes === 0 && prevTimer.seconds === 0) {
            clearInterval(interval);
            functionsRef.current!.endQuiz();
            return prevTimer;
          }

          if (prevTimer.seconds === 0) {
            return {
              minutes: prevTimer.minutes - 1,
              seconds: 59
            };
          }

          return {
            minutes: prevTimer.minutes,
            seconds: prevTimer.seconds - 1
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [quizStatus, timer]);

  const startQuiz = () => {
    const randomizedQuestions = getRandomizedQuestions();
    setQuestions(randomizedQuestions);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setCheatingAttempts(0);
    setTimer({ minutes: 120, seconds: 0 });
    setQuizStatus(QuizStatus.IN_PROGRESS);
  };

  const answerQuestion = (questionId: string, answerIndex: number) => {
    if (quizStatus === QuizStatus.IN_PROGRESS) {
      setUserAnswers((prev: Record<string, number>) => ({
        ...prev,
        [questionId]: answerIndex
      }));
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev: number) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev: number) => prev - 1);
    }
  };

  const reportCheatingAttempt = () => {
    setCheatingAttempts((prev: number) => prev + 1);
  };

  return (
    <QuizContext.Provider value={{
      questions,
      currentQuestionIndex,
      userAnswers,
      quizStatus,
      cheatingAttempts,
      timer,
      startQuiz,
      endQuiz: functionsRef.current!.endQuiz,
      answerQuestion,
      goToNextQuestion,
      goToPreviousQuestion,
      calculateScore: functionsRef.current!.calculateScore,
      reportCheatingAttempt,
      quizResults
    }}>
      {children}
    </QuizContext.Provider>
  );
};