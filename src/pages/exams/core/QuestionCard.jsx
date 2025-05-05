import React from "react";
import { useQuiz } from "../hooks/useQuiz";

/**
 * Composant d'affichage d'une question d'examen
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.question - L'objet question à afficher
 * @param {string} props.question.id - Identifiant unique de la question
 * @param {string} props.question.text - Texte de la question
 * @param {Array<string>} props.question.options - Options/réponses possibles
 * @returns {JSX.Element} Composant de carte de question
 */
const QuestionCard = ({ question }) => {
  const { userAnswers, answerQuestion } = useQuiz();
  const selectedAnswer = userAnswers[question.id];
  
  /**
   * Gère la sélection d'une option par l'utilisateur
   * @param {number} optionIndex - Index de l'option sélectionnée
   */
  const handleOptionSelect = (optionIndex) => {
    answerQuestion(question.id, optionIndex);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{question.text}</h2>
      
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <div 
            key={index}
            className={`p-4 border rounded-md cursor-pointer transition-all duration-200 hover:border-blue-400 ${
              selectedAnswer === index 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300"
            }`}
            onClick={() => handleOptionSelect(index)}
          >
            <div className="flex items-start">
              <div className={`h-5 w-5 rounded-full border mr-3 flex items-center justify-center ${
                selectedAnswer === index 
                  ? "border-blue-500 bg-blue-500" 
                  : "border-gray-400"
              }`}>
                {selectedAnswer === index && (
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="text-gray-700">{option}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
