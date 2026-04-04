import React from "react";
import QuestionRenderer from "../components/QuestionRenderer";

/**
 * Composant d'affichage d'une question d'examen
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.question - L'objet question à afficher
 * @param {string} props.question.id - Identifiant unique de la question
 * @param {string} props.question.text - Texte de la question
 * @param {*} props.answer - Réponse courante
 * @param {Function} props.onAnswerChange - Mise à jour de la réponse
 * @param {number} props.questionNumber - Numéro de la question
 * @param {number} props.totalQuestions - Nombre total de questions
 * @returns {JSX.Element} Composant de carte de question
 */
const QuestionCard = ({ question, answer, onAnswerChange, questionNumber, totalQuestions }) => {
  return (
    <QuestionRenderer
      question={question}
      answer={answer}
      onAnswerChange={onAnswerChange}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
    />
  );
};

export default QuestionCard;
