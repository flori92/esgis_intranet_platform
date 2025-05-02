import React, { useEffect } from "react";
import { useQuiz } from "../context/QuizContext";
import { useAuth } from "../context/AuthContext";
import QuestionCard from "./QuestionCard";
import QuizNavigation from "./QuizNavigation";
import QuizResults from "./QuizResults";
import { QuizStatus } from "../types";
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const Quiz: React.FC = () => {
  const { appState } = useAuth();
  const { 
    questions, 
    currentQuestionIndex, 
    quizStatus,
    timer,
    startQuiz, 
    reportCheatingAttempt 
  } = useQuiz();

  // Create audio element for alert sound
  const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  
  // Start the quiz when the component mounts
  useEffect(() => {
    if (quizStatus === QuizStatus.NOT_STARTED) {
      startQuiz();
    }
  }, [quizStatus, startQuiz]);
  
  // Set up visibility change detection for anti-cheating
  useEffect(() => {
    let cheatingToast: string | undefined;
    let cheatingToastTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && quizStatus === QuizStatus.IN_PROGRESS) {
        // User switched tabs or minimized the window
        reportCheatingAttempt();
        
        // Play alert sound
        alertSound.play().catch(err => console.error('Error playing sound:', err));
        
        // If there's an existing toast, dismiss it
        if (cheatingToast) {
          toast.dismiss(cheatingToast);
        }
        
        // Clear any existing timeout
        if (cheatingToastTimeout) {
          clearTimeout(cheatingToastTimeout);
        }
        
        // Show new persistent toast
        cheatingToast = toast.error(
          '⚠️ TENTATIVE DE TRICHE DÉTECTÉE ! Cet incident sera signalé.',
          {
            duration: Infinity,
            position: 'top-center',
            style: {
              background: '#fee2e2',
              color: '#991b1b',
              fontWeight: 'bold',
              fontSize: '1.1em',
              padding: '16px',
              border: '2px solid #dc2626'
            },
          }
        );
      } else if (document.visibilityState === "visible" && cheatingToast) {
        // When user returns to the tab, dismiss the toast after 120 seconds (2 minutes)
        // Clear any existing timeout first
        if (cheatingToastTimeout) {
          clearTimeout(cheatingToastTimeout);
        }
        
        // Set new timeout for 2 minutes
        cheatingToastTimeout = setTimeout(() => {
          toast.dismiss(cheatingToast);
          cheatingToast = undefined;
        }, 120000); // 120 secondes = 2 minutes
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (cheatingToast) {
        toast.dismiss(cheatingToast);
      }
      if (cheatingToastTimeout) {
        clearTimeout(cheatingToastTimeout);
      }
    };
  }, [quizStatus, reportCheatingAttempt, alertSound]);
  
  // Showing results if quiz is completed
  if (quizStatus === QuizStatus.COMPLETED) {
    return <QuizResults />;
  }
  
  // Loading state while quiz initializes
  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des questions...</p>
        </div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toaster />
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Quiz: Virtualization Cloud & Datacenter
            </h1>
            <div className="flex items-center gap-4">
              <div className={`text-lg font-semibold ${
                timer.minutes < 30 ? 'text-red-600' : 'text-gray-600'
              }`}>
                Temps restant: {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
              </div>
              <div className="text-gray-600">
                {appState.currentUser?.name}
              </div>
            </div>
          </div>
        </header>
        
        <QuestionCard question={currentQuestion} />
        <QuizNavigation />
      </div>
    </div>
  );
};

export default Quiz;