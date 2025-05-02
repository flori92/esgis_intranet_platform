import React from "react";
import { useQuiz } from "../context/QuizContext";

const QuizNavigation: React.FC = () => {
  const { 
    questions, 
    currentQuestionIndex, 
    userAnswers,
    goToNextQuestion, 
    goToPreviousQuestion,
    endQuiz
  } = useQuiz();
  
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Calculate progress percentage
  const progress = questions.length > 0 
    ? ((Object.keys(userAnswers).length / questions.length) * 100).toFixed(0) 
    : "0";
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} sur {questions.length}
        </div>
        <div className="text-sm text-gray-600">
          Progression: {progress}%
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={goToPreviousQuestion}
          disabled={isFirstQuestion}
          className={`px-4 py-2 rounded-md ${
            isFirstQuestion
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gray-600 hover:bg-gray-700 text-white"
          } transition-colors duration-200`}
        >
          Précédent
        </button>
        
        {isLastQuestion ? (
          <button
            onClick={endQuiz}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            Terminer
          </button>
        ) : (
          <button
            onClick={goToNextQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizNavigation;