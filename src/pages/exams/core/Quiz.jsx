import React, { useEffect, useRef } from "react";
import { useQuiz } from "../hooks/useQuiz";
import { useAuth } from "../hooks/useAuth";
import QuestionCard from "./QuestionCard";
import QuizNavigation from "./QuizNavigation";
import QuizResults from "./QuizResults";
import { Toaster } from 'react-hot-toast';

/**
 * Composant principal du quiz/examen
 * Gère l'affichage des questions, la navigation et la détection de triche
 * @returns {JSX.Element} Composant principal du quiz
 */
const Quiz = () => {
  const { appState } = useAuth();
  const { 
    questions, 
    currentQuestionIndex, 
    userAnswers,
    quizStatus,
    timer,
    examData,
    loading,
    error,
    startQuiz, 
    reportCheatingAttempt,
    answerQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    endQuiz,
    calculateScore,
    cheatingAttempts,
    scoreSummary,
    countCorrectAnswers
  } = useQuiz();
  
  // Référence pour le div d'alerte personnalisé
  const alertRef = useRef(null);
  // Référence pour suivre si une triche a été détectée
  const cheatingDetectedRef = useRef(false);

  // Référence stable pour le son d'alerte
  const alertSoundRef = React.useRef(null);
  if (!alertSoundRef.current) {
    alertSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }

  /**
   * Affiche une alerte personnalisée en rouge
   * @param {string} message - Message à afficher dans l'alerte
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
      alertSoundRef.current.play().catch((err) => console.error('Erreur lors de la lecture du son:', err));
    }
  };

  // Référence stable qui ne sera pas recréée entre les rendus
  const detectCheatingRef = useRef(() => {
    // Implémentation par défaut vide
  });
  
  // Mise à jour de l'implémentation à chaque rendu
  detectCheatingRef.current = () => {
    if (quizStatus !== 'IN_PROGRESS') return;
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
    
    /**
     * Gère les changements de visibilité du document
     */
    const handleVisibilityChange = () => {
      console.log("Changement de visibilité détecté:", document.visibilityState);
      
      if (document.visibilityState === "hidden" && quizStatus === 'IN_PROGRESS') {
        console.log("Tentative de triche détectée - changement d'onglet");
        // Sécurisation avec vérification de nullité
        if (detectCheatingRef.current) {
          detectCheatingRef.current();
        }
      }
    };
    
    /**
     * Gère les événements de perte de focus de la fenêtre
     */
    const handleBlur = () => {
      console.log("Événement blur détecté");
      if (quizStatus === 'IN_PROGRESS') {
        console.log("Tentative de triche détectée - perte de focus");
        if (detectCheatingRef.current) {
          detectCheatingRef.current();
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    
    const intervalCheck = setInterval(() => {
      if (document.visibilityState === "hidden" && quizStatus === 'IN_PROGRESS') {
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

  // Démarrage du quiz lorsque le composant est monté
  useEffect(() => {
    if (quizStatus === 'NOT_STARTED') {
      startQuiz();
    }
  }, [quizStatus, startQuiz]);

  // Affichage des résultats si le quiz est terminé
  if (quizStatus === 'COMPLETED') {
    return (
      <QuizResults
        questions={questions}
        userAnswers={userAnswers}
        calculateScore={calculateScore}
        cheatingAttempts={cheatingAttempts}
        scoreSummary={scoreSummary}
        correctAnswersCount={countCorrectAnswers()}
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-xl bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Examen indisponible</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  // État de chargement pendant l'initialisation du quiz
  if (loading || questions.length === 0) {
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
              {examData?.title || 'Examen en ligne'}
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
        <QuestionCard
          question={currentQuestion}
          answer={userAnswers[currentQuestion.id]}
          onAnswerChange={(value) => answerQuestion(currentQuestion.id, value)}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />
        <QuizNavigation
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          goToNextQuestion={goToNextQuestion}
          goToPreviousQuestion={goToPreviousQuestion}
          endQuiz={endQuiz}
        />
      </div>
    </div>
  );
};

export default Quiz;
