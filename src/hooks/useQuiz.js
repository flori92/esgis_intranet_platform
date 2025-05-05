import { useContext } from 'react';
import { QuizContext } from '../context/QuizContext';

/**
 * Hook pour accéder au contexte Quiz
 * Fournit l'état du quiz, les questions, et les fonctions de gestion
 * @returns {Object} Contexte du quiz
 */
export const useQuiz = () => useContext(QuizContext);
