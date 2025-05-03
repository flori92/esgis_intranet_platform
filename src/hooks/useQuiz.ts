import { useContext } from 'react';
import { QuizContext, QuizContextType } from '../context/QuizContext';

// Hook pour accéder au contexte Quiz avec typage explicite
export const useQuiz = (): QuizContextType => useContext(QuizContext);
