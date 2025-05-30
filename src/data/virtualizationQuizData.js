/**
 * Données du quiz "Virtualization Cloud et Datacenter advanced"
 * Implémentation originale du commit f24e043
 */
import { questions, getRandomizedQuestions } from './questions';

export const virtualizationQuizData = {
  title: "Quiz - Virtualization Cloud et Datacenter advanced",
  description: "Quiz sur les concepts avancés de virtualisation, cloud computing et datacenter",
  duration: 120, // minutes (2 heures)
  questions: getRandomizedQuestions()
};

export default virtualizationQuizData;
