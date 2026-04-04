const LEGACY_TO_CANONICAL_TYPE_MAP = {
  multiple_choice: 'qcm_single',
  multiple_select: 'qcm_multiple',
  essay: 'long_answer'
};

const CANONICAL_TO_LEGACY_TYPE_MAP = {
  qcm_single: 'multiple_choice',
  qcm_multiple: 'multiple_select',
  long_answer: 'essay'
};

const parseMaybeJson = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (!['{', '[', '"'].includes(trimmed[0]) && trimmed !== 'true' && trimmed !== 'false') {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return value;
  }
};

const normalizeOptionLabel = (option) => {
  if (typeof option === 'string') {
    return option;
  }

  if (option && typeof option === 'object') {
    return option.text || option.label || option.value || '';
  }

  return '';
};

const buildDefaultMatchingAnswer = (leftItems = [], rightItems = []) => {
  const maxCount = Math.min(leftItems.length, rightItems.length);
  const mapping = {};

  for (let index = 0; index < maxCount; index += 1) {
    mapping[String(index)] = String(index);
  }

  return mapping;
};

const getChoiceIndex = (options, rawValue) => {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '';
  }

  const parsed = parseMaybeJson(rawValue);

  if (typeof parsed === 'number') {
    return String(parsed);
  }

  const parsedString = String(parsed).trim();

  if (/^\d+$/.test(parsedString)) {
    return parsedString;
  }

  const optionIndex = options.findIndex((option) => String(option) === parsedString);
  return optionIndex >= 0 ? String(optionIndex) : '';
};

const getChoiceIndexes = (options, rawValue) => {
  const parsed = parseMaybeJson(rawValue);
  const values = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);

  return values
    .map((value) => getChoiceIndex(options, value))
    .filter(Boolean);
};

const normalizeString = (value) => String(value ?? '').trim().toLowerCase();

const normalizeChoiceArray = (values = []) => {
  return [...values]
    .map((value) => String(value))
    .sort();
};

const normalizeOrderingAnswer = (answer = []) => {
  return (Array.isArray(answer) ? answer : [])
    .map((item) => typeof item === 'string' ? item : item?.text || '')
    .filter(Boolean);
};

const normalizeAnswerMap = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [key, item]) => {
    accumulator[String(key)] = normalizeString(item);
    return accumulator;
  }, {});
};

const buildQuestionMetadata = (question = {}) => {
  const type = normalizeExamQuestionType(question.question_type || question.type);

  if (type === 'numeric') {
    return {
      tolerance: Number(question.tolerance || 0),
      unit: question.unit || ''
    };
  }

  if (type === 'long_answer') {
    return {
      max_words: question.max_words ? Number(question.max_words) : null
    };
  }

  if (type === 'matching') {
    return {
      left_items: Array.isArray(question.left_items) ? question.left_items.filter(Boolean) : [],
      right_items: Array.isArray(question.right_items) ? question.right_items.filter(Boolean) : []
    };
  }

  if (type === 'ordering') {
    return {
      items: Array.isArray(question.items) ? question.items.filter(Boolean) : []
    };
  }

  if (type === 'fill_blank') {
    return {
      text_with_blanks: question.text_with_blanks || ''
    };
  }

  if (type === 'image_question') {
    return {
      image_url: question.image_url || '',
      image_caption: question.image_caption || '',
      answer_type: question.answer_type || 'short_answer',
      options: Array.isArray(question.options) ? question.options.filter(Boolean) : []
    };
  }

  return null;
};

export const normalizeExamQuestionType = (rawType) => {
  if (!rawType) {
    return 'short_answer';
  }

  return LEGACY_TO_CANONICAL_TYPE_MAP[rawType] || rawType;
};

export const toLegacyExamQuestionType = (rawType) => {
  const normalizedType = normalizeExamQuestionType(rawType);
  return CANONICAL_TO_LEGACY_TYPE_MAP[normalizedType] || normalizedType;
};

export const normalizeExamQuestion = (rawQuestion = {}) => {
  const type = normalizeExamQuestionType(rawQuestion.question_type || rawQuestion.type);
  const parsedOptions = Array.isArray(rawQuestion.options)
    ? rawQuestion.options
    : (rawQuestion.options && typeof rawQuestion.options === 'object' ? rawQuestion.options.options || [] : []);
  const options = parsedOptions.map(normalizeOptionLabel).filter(Boolean);
  const parsedCorrectAnswer = parseMaybeJson(rawQuestion.correct_answer ?? rawQuestion.correctAnswer);
  const metadata = rawQuestion.options && typeof rawQuestion.options === 'object' && !Array.isArray(rawQuestion.options)
    ? rawQuestion.options
    : {};

  const normalizedQuestion = {
    ...rawQuestion,
    id: rawQuestion.id,
    exam_id: rawQuestion.exam_id,
    question_number: Number(rawQuestion.question_number || 0),
    text: rawQuestion.question_text || rawQuestion.text || '',
    question_text: rawQuestion.question_text || rawQuestion.text || '',
    type,
    question_type: type,
    points: Number(rawQuestion.points || 0),
    options,
    rubric: rawQuestion.rubric || '',
    correct_answer: null,
    correct_answers: [],
    tolerance: Number(metadata.tolerance || rawQuestion.tolerance || 0),
    unit: metadata.unit || rawQuestion.unit || '',
    max_words: Number(metadata.max_words || rawQuestion.max_words || 0) || null,
    left_items: Array.isArray(metadata.left_items || rawQuestion.left_items) ? (metadata.left_items || rawQuestion.left_items).filter(Boolean) : [],
    right_items: Array.isArray(metadata.right_items || rawQuestion.right_items) ? (metadata.right_items || rawQuestion.right_items).filter(Boolean) : [],
    items: Array.isArray(metadata.items || rawQuestion.items) ? (metadata.items || rawQuestion.items).filter(Boolean) : [],
    text_with_blanks: metadata.text_with_blanks || rawQuestion.text_with_blanks || '',
    image_url: metadata.image_url || rawQuestion.image_url || '',
    image_caption: metadata.image_caption || rawQuestion.image_caption || '',
    answer_type: normalizeExamQuestionType(metadata.answer_type || rawQuestion.answer_type || 'short_answer')
  };

  if (type === 'qcm_single') {
    normalizedQuestion.correct_answer = getChoiceIndex(options, parsedCorrectAnswer);
  } else if (type === 'qcm_multiple') {
    normalizedQuestion.correct_answers = getChoiceIndexes(options, parsedCorrectAnswer);
    normalizedQuestion.correct_answer = normalizedQuestion.correct_answers;
  } else if (type === 'true_false') {
    normalizedQuestion.correct_answer =
      parsedCorrectAnswer === true || String(parsedCorrectAnswer).toLowerCase() === 'true'
        ? 'true'
        : 'false';
  } else if (type === 'numeric') {
    const numericPayload = parsedCorrectAnswer && typeof parsedCorrectAnswer === 'object'
      ? parsedCorrectAnswer
      : { value: parsedCorrectAnswer };
    normalizedQuestion.correct_answer = String(numericPayload.value ?? '');
    normalizedQuestion.tolerance = Number(numericPayload.tolerance ?? normalizedQuestion.tolerance ?? 0);
    normalizedQuestion.unit = numericPayload.unit || normalizedQuestion.unit || '';
  } else if (type === 'matching') {
    normalizedQuestion.correct_answer = parsedCorrectAnswer && typeof parsedCorrectAnswer === 'object'
      ? parsedCorrectAnswer
      : buildDefaultMatchingAnswer(normalizedQuestion.left_items, normalizedQuestion.right_items);
  } else if (type === 'ordering') {
    normalizedQuestion.correct_answer = Array.isArray(parsedCorrectAnswer)
      ? parsedCorrectAnswer
      : normalizedQuestion.items.map((item) => item);
  } else {
    normalizedQuestion.correct_answer = parsedCorrectAnswer ?? '';
  }

  normalizedQuestion.correctAnswer = normalizedQuestion.correct_answer;
  return normalizedQuestion;
};

export const serializeExamQuestion = (question = {}) => {
  const normalizedType = normalizeExamQuestionType(question.question_type || question.type);
  const filteredOptions = Array.isArray(question.options)
    ? question.options.map(normalizeOptionLabel).filter((option) => option.trim() !== '')
    : [];
  let serializedOptions = filteredOptions.length > 0 ? filteredOptions : null;
  let serializedCorrectAnswer = null;

  if (normalizedType === 'qcm_single') {
    serializedCorrectAnswer =
      question.correct_answer === null || question.correct_answer === undefined || question.correct_answer === ''
        ? null
        : String(question.correct_answer);
  } else if (normalizedType === 'qcm_multiple') {
    serializedCorrectAnswer = JSON.stringify(
      Array.isArray(question.correct_answers)
        ? question.correct_answers.map((value) => String(value))
        : Array.isArray(question.correct_answer)
          ? question.correct_answer.map((value) => String(value))
          : []
    );
  } else if (normalizedType === 'true_false') {
    serializedCorrectAnswer = String(question.correct_answer || 'false');
  } else if (normalizedType === 'short_answer') {
    serializedCorrectAnswer = question.correct_answer ? String(question.correct_answer) : null;
  } else if (normalizedType === 'numeric') {
    serializedCorrectAnswer = JSON.stringify({
      value: question.correct_answer ?? '',
      tolerance: Number(question.tolerance || 0),
      unit: question.unit || ''
    });
    serializedOptions = buildQuestionMetadata(question);
  } else if (normalizedType === 'long_answer') {
    serializedOptions = buildQuestionMetadata(question);
  } else if (normalizedType === 'matching') {
    serializedOptions = buildQuestionMetadata(question);
    serializedCorrectAnswer = JSON.stringify(
      question.correct_answer && typeof question.correct_answer === 'object'
        ? question.correct_answer
        : buildDefaultMatchingAnswer(question.left_items, question.right_items)
    );
  } else if (normalizedType === 'ordering') {
    serializedOptions = buildQuestionMetadata(question);
    serializedCorrectAnswer = JSON.stringify(Array.isArray(question.correct_answer) ? question.correct_answer : question.items || []);
  } else if (normalizedType === 'fill_blank') {
    serializedOptions = buildQuestionMetadata(question);
    serializedCorrectAnswer = question.correct_answer ? JSON.stringify(question.correct_answer) : null;
  } else if (normalizedType === 'image_question') {
    serializedOptions = buildQuestionMetadata(question);
    serializedCorrectAnswer = question.correct_answer ? JSON.stringify(question.correct_answer) : null;
  }

  return {
    question_text: question.question_text || question.text || '',
    question_type: normalizedType,
    points: Number(question.points || 0),
    options: serializedOptions,
    correct_answer: serializedCorrectAnswer,
    rubric: question.rubric || null
  };
};

const computeChoiceScore = (question, rawAnswer) => {
  if (question.question_type === 'qcm_single') {
    return normalizeString(rawAnswer) === normalizeString(question.correct_answer)
      ? Number(question.points || 0)
      : 0;
  }

  if (question.question_type === 'qcm_multiple') {
    const expected = normalizeChoiceArray(question.correct_answers || question.correct_answer || []);
    const received = normalizeChoiceArray(Array.isArray(rawAnswer) ? rawAnswer : []);

    return expected.length > 0 && expected.length === received.length && expected.every((value, index) => value === received[index])
      ? Number(question.points || 0)
      : 0;
  }

  return 0;
};

const computeScalarScore = (question, rawAnswer) => {
  if (question.question_type === 'true_false' || question.question_type === 'short_answer') {
    return normalizeString(rawAnswer) === normalizeString(question.correct_answer)
      ? Number(question.points || 0)
      : 0;
  }

  if (question.question_type === 'numeric') {
    const expected = Number(question.correct_answer);
    const received = Number(rawAnswer);
    const tolerance = Number(question.tolerance || 0);

    if (Number.isFinite(expected) && Number.isFinite(received) && Math.abs(expected - received) <= tolerance) {
      return Number(question.points || 0);
    }
  }

  return 0;
};

export const isExamQuestionAutoGradable = (question = {}) => {
  const normalizedQuestion = normalizeExamQuestion(question);

  if (['qcm_single', 'qcm_multiple', 'true_false', 'short_answer', 'numeric', 'matching', 'ordering', 'fill_blank'].includes(normalizedQuestion.question_type)) {
    return true;
  }

  if (normalizedQuestion.question_type === 'image_question') {
    return ['qcm_single', 'qcm_multiple', 'true_false', 'short_answer', 'numeric'].includes(
      normalizeExamQuestionType(normalizedQuestion.answer_type)
    );
  }

  return false;
};

export const computeExamQuestionScore = (question = {}, rawAnswer) => {
  const normalizedQuestion = normalizeExamQuestion(question);

  if (
    rawAnswer === null ||
    rawAnswer === undefined ||
    rawAnswer === '' ||
    (Array.isArray(rawAnswer) && rawAnswer.length === 0) ||
    (typeof rawAnswer === 'object' && !Array.isArray(rawAnswer) && Object.keys(rawAnswer).length === 0)
  ) {
    return isExamQuestionAutoGradable(normalizedQuestion) ? 0 : null;
  }

  if (['qcm_single', 'qcm_multiple'].includes(normalizedQuestion.question_type)) {
    return computeChoiceScore(normalizedQuestion, rawAnswer);
  }

  if (['true_false', 'short_answer', 'numeric'].includes(normalizedQuestion.question_type)) {
    return computeScalarScore(normalizedQuestion, rawAnswer);
  }

  if (normalizedQuestion.question_type === 'matching') {
    const expected = normalizeAnswerMap(normalizedQuestion.correct_answer);
    const received = normalizeAnswerMap(rawAnswer);
    const expectedEntries = Object.entries(expected);

    return expectedEntries.length > 0 && expectedEntries.every(([key, value]) => received[key] === value)
      ? Number(normalizedQuestion.points || 0)
      : 0;
  }

  if (normalizedQuestion.question_type === 'ordering') {
    const expected = normalizeOrderingAnswer(normalizedQuestion.correct_answer || normalizedQuestion.items || []);
    const received = normalizeOrderingAnswer(rawAnswer);

    return expected.length > 0 && expected.length === received.length && expected.every((value, index) => value === received[index])
      ? Number(normalizedQuestion.points || 0)
      : 0;
  }

  if (normalizedQuestion.question_type === 'fill_blank') {
    const expected = normalizeAnswerMap(normalizedQuestion.correct_answer);
    const received = normalizeAnswerMap(rawAnswer);
    const expectedEntries = Object.entries(expected);

    return expectedEntries.length > 0 && expectedEntries.every(([key, value]) => received[key] === value)
      ? Number(normalizedQuestion.points || 0)
      : 0;
  }

  if (normalizedQuestion.question_type === 'image_question') {
    const answerType = normalizeExamQuestionType(normalizedQuestion.answer_type || 'short_answer');
    const delegatedQuestion = {
      ...normalizedQuestion,
      question_type: answerType,
      type: answerType
    };

    if (['qcm_single', 'qcm_multiple'].includes(answerType)) {
      return computeChoiceScore(delegatedQuestion, rawAnswer);
    }

    if (['true_false', 'short_answer', 'numeric'].includes(answerType)) {
      return computeScalarScore(delegatedQuestion, rawAnswer);
    }
  }

  return null;
};

export const formatExamAnswer = (question = {}, rawAnswer) => {
  const normalizedQuestion = normalizeExamQuestion(question);

  if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '') {
    return 'Aucune réponse';
  }

  if (normalizedQuestion.question_type === 'qcm_single') {
    const choiceIndex = getChoiceIndex(normalizedQuestion.options, rawAnswer);
    return normalizedQuestion.options[Number(choiceIndex)] || String(rawAnswer);
  }

  if (normalizedQuestion.question_type === 'qcm_multiple') {
    const choiceIndexes = Array.isArray(rawAnswer)
      ? rawAnswer.map((value) => getChoiceIndex(normalizedQuestion.options, value)).filter(Boolean)
      : getChoiceIndexes(normalizedQuestion.options, rawAnswer);
    return choiceIndexes.map((value) => normalizedQuestion.options[Number(value)] || value).join(', ');
  }

  if (normalizedQuestion.question_type === 'true_false') {
    return String(rawAnswer).toLowerCase() === 'true' ? 'Vrai' : 'Faux';
  }

  if (normalizedQuestion.question_type === 'matching') {
    const answerMap = typeof rawAnswer === 'object' && rawAnswer !== null ? rawAnswer : {};
    return Object.entries(answerMap)
      .map(([leftIndex, rightIndex]) => {
        const leftValue = normalizedQuestion.left_items[Number(leftIndex)] || leftIndex;
        const rightValue = normalizedQuestion.right_items[Number(rightIndex)] || rightIndex;
        return `${leftValue} -> ${rightValue}`;
      })
      .join(' | ');
  }

  if (normalizedQuestion.question_type === 'ordering') {
    return (Array.isArray(rawAnswer) ? rawAnswer : [])
      .map((item) => typeof item === 'string' ? item : item?.text || '')
      .filter(Boolean)
      .join(' > ');
  }

  if (normalizedQuestion.question_type === 'fill_blank') {
    const answerMap = typeof rawAnswer === 'object' && rawAnswer !== null ? rawAnswer : {};
    return Object.entries(answerMap)
      .map(([blankId, value]) => `Trou ${blankId}: ${value}`)
      .join(' | ');
  }

  if (normalizedQuestion.question_type === 'image_question') {
    if (['qcm_single', 'qcm_multiple'].includes(normalizedQuestion.answer_type)) {
      return formatExamAnswer({
        ...normalizedQuestion,
        question_type: normalizedQuestion.answer_type
      }, rawAnswer);
    }

    return String(rawAnswer);
  }

  return String(rawAnswer);
};

export const getExamCorrectAnswerLabel = (question = {}) => {
  const normalizedQuestion = normalizeExamQuestion(question);

  if (normalizedQuestion.question_type === 'qcm_single') {
    return normalizedQuestion.options[Number(normalizedQuestion.correct_answer)] || '—';
  }

  if (normalizedQuestion.question_type === 'qcm_multiple') {
    return (normalizedQuestion.correct_answers || [])
      .map((value) => normalizedQuestion.options[Number(value)] || value)
      .join(', ');
  }

  if (normalizedQuestion.question_type === 'true_false') {
    return normalizedQuestion.correct_answer === 'true' ? 'Vrai' : 'Faux';
  }

  if (normalizedQuestion.question_type === 'numeric') {
    const value = normalizedQuestion.correct_answer || '—';
    const tolerance = normalizedQuestion.tolerance ? ` (±${normalizedQuestion.tolerance})` : '';
    const unit = normalizedQuestion.unit ? ` ${normalizedQuestion.unit}` : '';
    return `${value}${unit}${tolerance}`;
  }

  if (normalizedQuestion.question_type === 'matching') {
    return formatExamAnswer(normalizedQuestion, normalizedQuestion.correct_answer);
  }

  if (normalizedQuestion.question_type === 'ordering') {
    return formatExamAnswer(normalizedQuestion, normalizedQuestion.correct_answer);
  }

  if (normalizedQuestion.question_type === 'fill_blank') {
    return formatExamAnswer(normalizedQuestion, normalizedQuestion.correct_answer);
  }

  if (normalizedQuestion.question_type === 'image_question') {
    if (['qcm_single', 'qcm_multiple'].includes(normalizedQuestion.answer_type)) {
      return getExamCorrectAnswerLabel({
        ...normalizedQuestion,
        question_type: normalizedQuestion.answer_type
      });
    }

    return normalizedQuestion.correct_answer ? String(normalizedQuestion.correct_answer) : '—';
  }

  return normalizedQuestion.correct_answer ? String(normalizedQuestion.correct_answer) : '—';
};
