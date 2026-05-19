export const RETAKABLE_EXAM_CATEGORIES = ['training', 'mock_exam'];

export const isRetakableExamCategory = (category) => (
  RETAKABLE_EXAM_CATEGORIES.includes(String(category || '').toLowerCase())
);

export const getRetakableExamLabel = (category) => (
  String(category || '').toLowerCase() === 'mock_exam'
    ? "l'examen blanc"
    : "l'entraînement"
);
