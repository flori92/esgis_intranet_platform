const hashSeed = (value) => {
  const input = String(value || '');
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createSeededRandom = (seedValue) => {
  let seed = hashSeed(seedValue) || 1;

  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const seededShuffle = (items, seedValue) => {
  const random = createSeededRandom(seedValue);
  const clonedItems = [...items];

  for (let index = clonedItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [clonedItems[index], clonedItems[swapIndex]] = [clonedItems[swapIndex], clonedItems[index]];
  }

  return clonedItems;
};

const remapChoiceValue = (value, indexMap) => {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  return indexMap.get(String(value)) ?? value;
};

const remapChoiceArray = (values, indexMap) => {
  if (!Array.isArray(values)) {
    return values;
  }

  return values
    .map((value) => remapChoiceValue(value, indexMap))
    .filter((value) => value !== null && value !== undefined && value !== '');
};

const randomizeQuestionOptions = (question, seedValue) => {
  const options = Array.isArray(question.options) ? question.options : [];

  if (options.length < 2) {
    return question;
  }

  const shuffledEntries = seededShuffle(
    options.map((option, originalIndex) => ({
      option,
      originalIndex
    })),
    seedValue
  );

  const remappedIndexes = new Map();
  shuffledEntries.forEach((entry, newIndex) => {
    remappedIndexes.set(String(entry.originalIndex), String(newIndex));
  });

  const randomizedQuestion = {
    ...question,
    options: shuffledEntries.map((entry) => entry.option)
  };

  if (question.question_type === 'qcm_single') {
    randomizedQuestion.correct_answer = remapChoiceValue(question.correct_answer, remappedIndexes);
    randomizedQuestion.correctAnswer = randomizedQuestion.correct_answer;
  }

  if (question.question_type === 'qcm_multiple') {
    randomizedQuestion.correct_answer = remapChoiceArray(question.correct_answer, remappedIndexes);
    randomizedQuestion.correct_answers = remapChoiceArray(question.correct_answers, remappedIndexes);
    randomizedQuestion.correctAnswer = randomizedQuestion.correct_answer;
  }

  if (question.question_type === 'image_question' && question.answer_type === 'qcm_single') {
    randomizedQuestion.correct_answer = remapChoiceValue(question.correct_answer, remappedIndexes);
    randomizedQuestion.correctAnswer = randomizedQuestion.correct_answer;
  }

  if (question.question_type === 'image_question' && question.answer_type === 'qcm_multiple') {
    randomizedQuestion.correct_answer = remapChoiceArray(question.correct_answer, remappedIndexes);
    randomizedQuestion.correct_answers = remapChoiceArray(question.correct_answers, remappedIndexes);
    randomizedQuestion.correctAnswer = randomizedQuestion.correct_answer;
  }

  return randomizedQuestion;
};

export const randomizeExamQuestions = ({ questions = [], examId, studentProfileId, settings = {} }) => {
  const shouldShuffleQuestions = Boolean(
    settings.randomize_questions_per_student
    || (settings.randomize_questions && settings.randomization_scope === 'per_student')
  );
  const shouldShuffleOptions = Boolean(
    settings.randomize_options_per_student
    || settings.randomize_options
  );

  if (!shouldShuffleQuestions && !shouldShuffleOptions) {
    return questions;
  }

  const baseSeed = `${examId}:${studentProfileId}:v1`;
  let randomizedQuestions = questions.map((question) => ({ ...question }));

  if (shouldShuffleOptions) {
    randomizedQuestions = randomizedQuestions.map((question) =>
      randomizeQuestionOptions(question, `${baseSeed}:options:${question.id}`)
    );
  }

  if (shouldShuffleQuestions) {
    randomizedQuestions = seededShuffle(randomizedQuestions, `${baseSeed}:questions`)
      .map((question, index) => ({
        ...question,
        original_question_number: question.question_number,
        question_number: index + 1
      }));
  }

  return randomizedQuestions;
};
