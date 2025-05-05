import React, { useEffect, useRef } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { useAuth } from "../hooks/useAuth";
import QuestionCard from "./QuestionCard";
import QuizNavigation from "./QuizNavigation";
import QuizResults from "./QuizResults";
import { QuizStatus } from "../types";
import { Toaster } from 'react-hot-toast';

/**
 * Composant principal du Quiz
 * Gère l'affichage des questions, la navigation et la détection de triche
 */
const Quiz = () => {
  // Utilisation des hooks
  const { authState } = useAuth();
  
  // Créer un état d'application équivalent pour la rétrocompatibilité
  const appState = {
    currentUser: authState.user ? {
      id: authState.user.id,
      name: authState.profile?.full_name || "Utilisateur",
      role: authState.isAdmin ? "admin" : authState.isProfessor ? "professor" : "student",
    } : null,
    isAdmin: authState.isAdmin,
    isAuthenticated: !!authState.user,
  };

  const { 
    questions, 
    currentQuestionIndex, 
    quizStatus,
    timer,
    startQuiz, 
    reportCheatingAttempt 
  } = useQuiz();
  
  // Référence pour le div d'alerte personnalisé
  const alertRef = useRef(null);
  // Référence pour suivre si une triche a été détectée
  const cheatingDetectedRef = useRef(false);
  // Référence pour la fonction de détection de triche
  const detectCheatingRef = useRef(null);

  // Référence stable pour le son d'alerte
  const alertSoundRef = React.useRef(null);
  if (!alertSoundRef.current) {
    alertSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }

  /**
   * Fonction pour afficher une alerte personnalisée en rouge
   * @param {string} message - Message à afficher
   */
  const showCustomAlert = (message) => {
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
      alertSoundRef.current.play().catch(err => console.log("Erreur de lecture audio:", err));
    }
  };

  /**
   * Fonction pour formater le timer
   * @param {number} timer - Temps en secondes
   * @returns {string} Temps formaté
   */
  const formatTimer = (timer) => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Création d'une fonction pour détecter la triche
  useEffect(() => {
    detectCheatingRef.current = () => {
      if (!cheatingDetectedRef.current) {
        cheatingDetectedRef.current = true;
        showCustomAlert("⚠️ TENTATIVE DE TRICHE DÉTECTÉE ⚠️\n\nVous avez quitté l'onglet du quiz ou changé de fenêtre. Cette action est considérée comme une tentative de triche et sera signalée.\n\nVeuillez rester sur cette page jusqu'à la fin du quiz.");
        reportCheatingAttempt("Changement d'onglet ou de fenêtre");
      }
    };

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

  // Démarrer le quiz au montage du composant
  useEffect(() => {
    if (quizStatus === QuizStatus.NOT_STARTED) {
      startQuiz();
    }
  }, [quizStatus, startQuiz]);

  // Afficher les résultats si le quiz est terminé
  if (quizStatus === QuizStatus.COMPLETED) {
    return <QuizResults />;
  }

  // État de chargement pendant l'initialisation du quiz
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
                timer < 300 ? 'text-red-600' : 'text-gray-600'
              }`}>
                Temps restant: {formatTimer(timer)}
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
