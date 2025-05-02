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
  // Référence pour suivre si une triche a été détectée
  const cheatingDetectedRef = useRef<boolean>(false);

  // Create audio element for alert sound
  const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  
  // Start the quiz when the component mounts
  useEffect(() => {
    if (quizStatus === QuizStatus.NOT_STARTED) {
      startQuiz();
    }
    
    // Afficher une alerte de test après 5 secondes pour vérifier que l'alerte fonctionne
    const testTimeout = setTimeout(() => {
      if (quizStatus === QuizStatus.IN_PROGRESS) {
        console.log("Test d'alerte après 5 secondes");
        showCustomAlert('⚠️ TEST ALERTE ⚠️\n\nCeci est un test pour vérifier que l\'alerte fonctionne correctement.');
      }
    }, 5000);
    
    return () => clearTimeout(testTimeout);
  }, [quizStatus, startQuiz]);
  
  // Fonction pour afficher une alerte personnalisée en rouge
  const showCustomAlert = (message: string) => {
    console.log("Affichage de l'alerte personnalisée:", message);
    
    // Supprimer toute alerte existante
    if (alertRef.current && document.body.contains(alertRef.current)) {
      document.body.removeChild(alertRef.current);
      alertRef.current = null;
    }
    
    // Créer un div d'alerte rouge
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
    
    // Créer le contenu de l'alerte
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message.replace(/\n/g, '<br>');
    messageElement.style.marginBottom = '30px';
    
    // Ajouter un bouton pour fermer l'alerte
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
    
    // Jouer un son d'alerte
    alertSound.play().catch(err => console.error('Erreur lors de la lecture du son:', err));
  };
  
  // Fonction pour détecter la triche (changement d'onglet)
  const detectCheating = () => {
    console.log("Triche détectée! Visibilité:", document.visibilityState);
    
    // Marquer qu'une triche a été détectée
    cheatingDetectedRef.current = true;
    
    // Signaler la tentative de triche
    reportCheatingAttempt();
    
    // Afficher l'alerte rouge en plein écran
    showCustomAlert('⚠️ ALERTE DE SÉCURITÉ ⚠️\n\nTENTATIVE DE TRICHE DÉTECTÉE !\n\nCet incident a été enregistré et sera signalé à l\'administration.\n\nVotre session est surveillée.');
    
    // Afficher également un toast
    toast.error('⚠️ TENTATIVE DE TRICHE DÉTECTÉE !', {
      duration: 120000, // 2 minutes
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
    });
  };
  
  // Set up visibility change detection for anti-cheating
  useEffect(() => {
    console.log("Configuration de la détection de changement d'onglet");
    
    const handleVisibilityChange = () => {
      console.log("Changement de visibilité détecté:", document.visibilityState);
      
      if (document.visibilityState === "hidden" && quizStatus === QuizStatus.IN_PROGRESS) {
        console.log("Tentative de triche détectée - changement d'onglet");
        detectCheating();
      }
    };
    
    // Ajouter un gestionnaire pour le changement de focus de fenêtre
    const handleBlur = () => {
      console.log("Événement blur détecté");
      if (quizStatus === QuizStatus.IN_PROGRESS) {
        console.log("Tentative de triche détectée - perte de focus");
        detectCheating();
      }
    };
    
    // Utiliser plusieurs méthodes pour détecter les changements d'onglet
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    
    // Vérification périodique de la visibilité
    const intervalCheck = setInterval(() => {
      if (document.visibilityState === "hidden" && quizStatus === QuizStatus.IN_PROGRESS) {
        console.log("Tentative de triche détectée - vérification périodique");
        detectCheating();
      }
    }, 2000);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      clearInterval(intervalCheck);
      
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
        
        {/* Bouton de test pour déclencher l'alerte manuellement */}
        <button 
          onClick={() => detectCheating()} 
          className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Tester l'alerte de triche
        </button>
        
        <QuestionCard question={currentQuestion} />
        <QuizNavigation />
      </div>
    </div>
  );
};

export default Quiz;