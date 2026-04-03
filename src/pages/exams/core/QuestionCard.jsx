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
  const questionText = question.text || question.question_text || '';
  const questionType = question.question_type || 'multiple_choice';
  const options = Array.isArray(question.options) ? question.options : [];

  const handleOptionSelect = (optionValue) => {
    answerQuestion(question.id, optionValue);
  };

  const renderChoiceQuestion = () => {
    const choiceOptions = questionType === 'true_false' && options.length === 0
      ? ['true', 'false']
      : options;

    return (
      <div className="space-y-3">
        {choiceOptions.map((option, index) => {
          const optionLabel = option === 'true' ? 'Vrai' : option === 'false' ? 'Faux' : option;
          const isSelected = selectedAnswer === option;

          return (
            <div
              key={`${optionLabel}-${index}`}
              className={`p-4 border rounded-md cursor-pointer transition-all duration-200 hover:border-blue-400 ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex items-start">
                <div className={`h-5 w-5 rounded-full border mr-3 flex items-center justify-center ${
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                }`}>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white"></div>}
                </div>
                <span className="text-gray-700">{optionLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFreeTextQuestion = () => {
    if (questionType === 'essay') {
      return (
        <textarea
          className="w-full min-h-[180px] border border-gray-300 rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Saisissez votre reponse ici..."
          value={selectedAnswer || ''}
          onChange={(event) => answerQuestion(question.id, event.target.value)}
        />
      );
    }

    return (
      <input
        type={questionType === 'numeric' ? 'number' : 'text'}
        className="w-full border border-gray-300 rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={questionType === 'numeric' ? 'Entrez une valeur numerique' : 'Saisissez votre reponse'}
        value={selectedAnswer || ''}
        onChange={(event) => answerQuestion(question.id, event.target.value)}
      />
    );
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{questionText}</h2>

      {(questionType === 'multiple_choice' || questionType === 'true_false')
        ? renderChoiceQuestion()
        : renderFreeTextQuestion()}
    </div>
  );
};

export default QuestionCard;
