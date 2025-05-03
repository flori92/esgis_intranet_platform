import React from "react";
import { useQuiz } from "../hooks/useQuiz";
import { useAuth } from "../hooks/useAuth";

const QuizResults: React.FC = () => {
  const { questions, userAnswers, calculateScore, cheatingAttempts } = useQuiz();
  const { appState, logout } = useAuth();
  
  const score = calculateScore();
  const totalPossibleScore = questions.length * 0.5;
  const percentage = (score / totalPossibleScore) * 100;
  
  const correctAnswers = questions.filter(
    question => userAnswers[question.id] === question.correctAnswer
  ).length;
  
  const getScoreColor = () => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Résultats du Quiz</h1>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-700">Étudiant:</p>
              <p className="font-medium">{appState.currentUser?.name}</p>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-700">Note finale:</p>
              <p className={`text-2xl font-bold ${getScoreColor()}`}>
                {score.toFixed(1)}/20
              </p>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-700">Réponses correctes:</p>
              <p className="font-medium">{correctAnswers} sur {questions.length}</p>
            </div>
            
            {cheatingAttempts > 0 && (
              <div className="flex justify-between items-center mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">Tentatives de triche détectées:</p>
                <p className="font-medium text-red-700">{cheatingAttempts}</p>
              </div>
            )}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div 
              className={`h-4 rounded-full ${
                percentage >= 80 
                  ? "bg-green-500" 
                  : percentage >= 60 
                    ? "bg-yellow-500" 
                    : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          <div className="text-center mt-8">
            <button
              onClick={logout}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;