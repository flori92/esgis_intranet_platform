import React, { useEffect, useRef } from "react";
import { useQuiz } from "../context/QuizContext";
import { useAuth } from "../hooks/useAuth";
import QuestionCard from "./QuestionCard";
import QuizNavigation from "./QuizNavigation";
import QuizResults from "./QuizResults";
import { QuizStatus, AppState, Question, Timer } from "../types";
import { Toaster } from 'react-hot-toast';

// Interface pour typer correctement le retour de useQuiz
interface QuizContextValue {
  questions: Question[];
  currentQuestionIndex: number;
  quizStatus: QuizStatus;
  timer: Timer;
  startQuiz: () => void;
  reportCheatingAttempt: () => void;
}

const Quiz: React.FC = () => {
  // Utilisation de types spécifiques au lieu de 'any'
  const { appState } = useAuth() as { appState: AppState };
  const { 
    questions, 
    currentQuestionIndex, 
    quizStatus,
    timer,
    startQuiz, 
    reportCheatingAttempt 
  } = useQuiz() as QuizContextValue;
  
  // Référence pour le div d'alerte personnalisé
  const alertRef = useRef<HTMLDivElement>(null);
  // Référence pour suivre si une triche a été détectée
  const cheatingDetectedRef = useRef<boolean>(false);

  // Référence stable pour le son d'alerte
  const alertSoundRef = React.useRef<HTMLAudioElement | null>(null);
  if (!alertSoundRef.current) {
    alertSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }

  // Fonction pour afficher une alerte personnalisée en rouge
  const showCustomAlert = (message: string) => {
    console.log("Affichage de l'alerte personnalisée:", message);
    if (alertRef.current && document.body.contains(alertRef.current)) {
      document.body.removeChild(alertRef.current);
      alertRef.current = null;
    }
    const alertDiv = document.createElement('div');
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '0';
    alertDiv.style.left = '0';
    alertDiv.style.width = '100%';
    alertDiv.style.height = '100%';
    alertDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
    alertDiv.style.color = 'white';
    alertDiv.style.display = 'flex';
    alertDiv.style.flexDirection = 'column';
    alertDiv.style.justifyContent = 'center';
    alertDiv.style.alignItems = 'center';
    alertDiv.style.zIndex = '99999';
    alertDiv.style.fontWeight = 'bold';
    alertDiv.style.fontSize = '24px';
    alertDiv.style.textAlign = 'center';
    alertDiv.style.padding = '20px';
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message.replace(/\n/g, '<br>');
    messageElement.style.marginBottom = '30px';
    const closeButton = document.createElement('button');
    closeButton.textContent = 'FERMER';
    closeButton.style.padding = '12px 24px';
    closeButton.style.backgroundColor = 'white';
    closeButton.style.color = 'red';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.fontSize = '18px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
    closeButton.onclick = () => {
      if (alertRef.current && document.body.contains(alertRef.current)) {
        document.body.removeChild(alertRef.current);
        alertRef.current = null;
      }
    };
    alertDiv.appendChild(messageElement);
    alertDiv.appendChild(closeButton);
    document.body.appendChild(alertDiv);
    alertRef.current = alertDiv;
    if (alertSoundRef.current) {
      alertSoundRef.current.play().catch((err: Error) => console.error('Erreur lors de la lecture du son:', err));
    }
  };

  // Fonction stable pour détecter la triche (changement d'onglet)
  // Utilisation d'une référence pour maintenir la fonction stable entre les rendus
  // Type précis pour la fonction de détection de triche
  type CheatingDetectionFn = () => void;
  
  // Référence stable qui ne sera pas recréée entre les rendus
  const detectCheatingRef = useRef<CheatingDetectionFn>(() => {
    // Implémentation par défaut vide
  });
  
  // Mise à jour de l'implémentation à chaque rendu
  detectCheatingRef.current = () => {
    if (quizStatus !== QuizStatus.IN_PROGRESS) return;
    console.log("Triche détectée! Visibilité:", document.visibilityState);
    if (cheatingDetectedRef.current) return;
    cheatingDetectedRef.current = true;
    showCustomAlert('🚨 TRICHE DÉTECTÉE 🚨\n\nVous avez quitté l\'onglet ou changé de fenêtre pendant l\'examen.\n\nVotre tentative a été enregistrée.');
    reportCheatingAttempt();
    setTimeout(() => {
      cheatingDetectedRef.current = false;
    }, 5000);
  };
  
  // Setup du hook useEffect avec une référence stable
  useEffect(() => {
    console.log("Configuration de la détection de changement d'onglet");
    
    const handleVisibilityChange = () => {
      console.log("Changement de visibilité détecté:", document.visibilityState);
      
      if (document.visibilityState === "hidden" && quizStatus === QuizStatus.IN_PROGRESS) {
        console.log("Tentative de triche détectée - changement d'onglet");
        // Sécurisation avec vérification de nullité
        if (detectCheatingRef.current) {
          detectCheatingRef.current();
        }
      }
    };
    
    const handleBlur = () => {
      console.log("Événement blur détecté");
      if (quizStatus === QuizStatus.IN_PROGRESS) {
        console.log("Tentative de triche détectée - perte de focus");
        if (detectCheatingRef.current) {
          detectCheatingRef.current();
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    
    const intervalCheck = setInterval(() => {
      if (document.visibilityState === "hidden" && quizStatus === QuizStatus.IN_PROGRESS) {
        console.log("Tentative de triche détectée - vérification périodique");
        if (detectCheatingRef.current) {
          detectCheatingRef.current();
        }
      }
    }, 2000);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      clearInterval(intervalCheck);
      if (alertRef.current && document.body.contains(alertRef.current)) {
        document.body.removeChild(alertRef.current);
        alertRef.current = null;
      }
    };
  }, [quizStatus, reportCheatingAttempt]);

  // Start the quiz when the component mounts
  useEffect(() => {
    if (quizStatus === QuizStatus.NOT_STARTED) {
      startQuiz();
    }
  }, [quizStatus, startQuiz]);

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
        {/* Bouton de test pour déclencher l'alerte manuellement - visible uniquement pour les administrateurs */}
        {appState.isAdmin && (
          <button 
            onClick={() => detectCheatingRef.current && detectCheatingRef.current()} 
            className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            Tester l'alerte de triche
          </button>
        )}
        <QuestionCard question={currentQuestion} />
        <QuizNavigation />
      </div>
    </div>
  );
};

export default Quiz;