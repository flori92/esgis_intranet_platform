import React, { useEffect, useRef } from "react";
import { useQuiz } from "../context/QuizContext";
import { useAuth } from "../context/AuthContext";
import QuestionCard from "./QuestionCard";
import QuizNavigation from "./QuizNavigation";
import QuizResults from "./QuizResults";
import { QuizStatus } from "../types";
import { toast, Toaster } from 'react-hot-toast';

const Quiz: React.FC = () => {
  // Utilisation de type assertion pour résoudre les erreurs TypeScript
  const { appState } = useAuth() as any;
  const { 
    questions, 
    currentQuestionIndex, 
    quizStatus,
    timer,
    startQuiz, 
    reportCheatingAttempt 
  } = useQuiz() as any;
  
  // Référence pour le div d'alerte personnalisé
  const alertRef = useRef<HTMLDivElement>(null);

  // Create audio element for alert sound
  const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  
  // Start the quiz when the component mounts
  useEffect(() => {
    if (quizStatus === QuizStatus.NOT_STARTED) {
      startQuiz();
    }
  }, [quizStatus, startQuiz]);
  
  // Fonction pour afficher une alerte personnalisée en rouge
  const showCustomAlert = (message: string) => {
    // Créer un div d'alerte rouge si ce n'est pas déjà fait
    if (!alertRef.current) {
      const alertDiv = document.createElement('div');
      alertDiv.style.position = 'fixed';
      alertDiv.style.top = '50%';
      alertDiv.style.left = '50%';
      alertDiv.style.transform = 'translate(-50%, -50%)';
      alertDiv.style.backgroundColor = '#ff0000';
      alertDiv.style.color = 'white';
      alertDiv.style.padding = '20px';
      alertDiv.style.borderRadius = '10px';
      alertDiv.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
      alertDiv.style.zIndex = '10000';
      alertDiv.style.fontWeight = 'bold';
      alertDiv.style.fontSize = '18px';
      alertDiv.style.textAlign = 'center';
      alertDiv.style.width = '80%';
      alertDiv.style.maxWidth = '500px';
      
      // Ajouter un bouton pour fermer l'alerte
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Fermer';
      closeButton.style.marginTop = '15px';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = 'white';
      closeButton.style.color = 'red';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '5px';
      closeButton.style.fontWeight = 'bold';
      closeButton.style.cursor = 'pointer';
      
      closeButton.onclick = () => {
        document.body.removeChild(alertDiv);
        alertRef.current = null;
      };
      
      alertDiv.appendChild(document.createTextNode(message));
      alertDiv.appendChild(document.createElement('br'));
      alertDiv.appendChild(document.createElement('br'));
      alertDiv.appendChild(closeButton);
      
      document.body.appendChild(alertDiv);
      alertRef.current = alertDiv;
    }
  };
  
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
        
        // Show new persistent toast with increased z-index
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
              border: '2px solid #dc2626',
              zIndex: 9999
            },
            icon: '⚠️',
          }
        );
        
        // Afficher l'alerte personnalisée rouge
        showCustomAlert('⚠️ ALERTE DE SÉCURITÉ ⚠️\n\nTENTATIVE DE TRICHE DÉTECTÉE !\n\nCet incident a été enregistré et sera signalé à l\'administration.\n\nVotre session est surveillée.');
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
      // Nettoyer l'alerte personnalisée si elle existe
      if (alertRef.current && document.body.contains(alertRef.current)) {
        document.body.removeChild(alertRef.current);
        alertRef.current = null;
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
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            zIndex: 9999,
          },
        }}
      />
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