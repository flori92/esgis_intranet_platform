import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Chip,
  CircularProgress,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LibraryAdd as LibraryAddIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { getProfessorQuestions, getSharedQuestions } from '@/api/questionBank';
import { getExamCorrectAnswerLabel, normalizeExamQuestion, normalizeExamQuestionType } from '@/utils/examQuestionUtils';

const QUESTION_TYPE_LABELS = {
  qcm_single: 'QCM unique',
  qcm_multiple: 'QCM multiple',
  true_false: 'Vrai/Faux',
  short_answer: 'Reponse courte',
  long_answer: 'Reponse longue',
  numeric: 'Numerique',
  matching: 'Association',
  ordering: 'Ordonnancement',
  fill_blank: 'Texte a trous',
  image_question: 'Question sur image',
  multiple_choice: 'QCM unique',
  multiple_select: 'QCM multiple',
  essay: 'Reponse longue'
};

const IMPORTABLE_TYPE_MAP = {
  qcm_single: 'qcm_single',
  qcm_multiple: 'qcm_multiple',
  true_false: 'true_false',
  short_answer: 'short_answer',
  long_answer: 'long_answer',
  numeric: 'numeric',
  matching: 'matching',
  ordering: 'ordering',
  fill_blank: 'fill_blank',
  image_question: 'image_question',
  multiple_choice: 'qcm_single',
  multiple_select: 'qcm_multiple',
  essay: 'long_answer'
};

const createEmptyQuestion = (questionNumber = 1) => ({
  question_number: questionNumber,
  question_text: '',
  question_type: 'qcm_single',
  points: 1,
  options: ['', '', '', ''],
  correct_answer: '',
  correct_answers: [],
  rubric: '',
  explanation: '',
  tolerance: 0,
  unit: '',
  max_words: 500,
  left_items: ['', ''],
  right_items: ['', ''],
  items: ['', ''],
  text_with_blanks: '',
  image_url: '',
  image_caption: '',
  answer_type: 'short_answer'
});

/**
 * Composant pour la gestion des questions d'examen
 * S'intègre avec le système de Quiz existant
 *
 * @typedef {Object} ExamQuestion
 * @property {number} [id] ID de la question
 * @property {number} [exam_id] ID de l'examen associé
 * @property {number} question_number Numéro de la question
 * @property {string} question_text Texte de la question
 * @property {string} question_type Type de question
 * @property {number} points Points attribués à la question
 * @property {string[]} [options] Options pour les questions à choix multiples
 * @property {string} [correct_answer] Réponse correcte
 * @property {string|null} [rubric] Critères d'évaluation
 * @property {string} [explanation] Explication de la réponse
 * 
 * @param {Object} props Les propriétés du composant
 * @param {ExamQuestion[]} props.questions Liste des questions de l'examen
 * @param {Function} props.setQuestions Fonction pour mettre à jour les questions
 * @param {number} props.totalPoints Total des points de l'examen
 * @param {Function} props.setTotalPoints Fonction pour mettre à jour le total des points
 * @param {Object} props.errors Erreurs de validation
 */
const ExamQuestions = ({
  questions,
  setQuestions,
  totalPoints,
  setTotalPoints,
  errors
}) => {
  const { authState } = useAuth();
  // État pour le formulaire d'édition de question
  const [editingQuestion, setEditingQuestion] = useState(createEmptyQuestion());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingErrors, setEditingErrors] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  
  // État pour les options de QCM
  const [options, setOptions] = useState(['', '', '', '']);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTab, setImportTab] = useState(0);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState(null);
  const [bankSearch, setBankSearch] = useState('');
  
  // Calcul du total de points actuel
  const currentTotalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  useEffect(() => {
    if (!importDialogOpen) {
      return;
    }

    let active = true;

    const loadQuestionBank = async () => {
      setBankLoading(true);
      setBankError(null);

      try {
        const { data, error } = importTab === 0
          ? await getProfessorQuestions(authState.profile?.id)
          : await getSharedQuestions();

        if (error) {
          throw error;
        }

        if (active) {
          setBankQuestions(data || []);
        }
      } catch (loadError) {
        console.error('Erreur chargement banque de questions examen:', loadError);
        if (active) {
          setBankQuestions([]);
          setBankError(loadError.message || 'Impossible de charger la banque de questions.');
        }
      } finally {
        if (active) {
          setBankLoading(false);
        }
      }
    };

    loadQuestionBank();

    return () => {
      active = false;
    };
  }, [authState.profile?.id, importDialogOpen, importTab]);

  const filteredBankQuestions = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();

    if (!query) {
      return bankQuestions;
    }

    return bankQuestions.filter((question) => {
      return (
        String(question.question_text || question.text || '').toLowerCase().includes(query) ||
        String(question.matiere || '').toLowerCase().includes(query) ||
        String(question.theme || '').toLowerCase().includes(query)
      );
    });
  }, [bankQuestions, bankSearch]);
  
  /**
   * Ouvrir le dialogue pour une nouvelle question
   */
  const handleAddQuestion = () => {
    resetForm();
    setIsDialogOpen(true);
    setEditingIndex(null);
    setEditingQuestion(createEmptyQuestion(questions.length + 1));
    setOptions(['', '', '', '']);
  };
  
  /**
   * Ouvrir le dialogue pour éditer une question existante
   * @param {number} index Index de la question à éditer
   */
  const handleEditQuestion = (index) => {
    const question = normalizeExamQuestion(questions[index]);
    setEditingQuestion({
      ...createEmptyQuestion(question.question_number || index + 1),
      ...question,
      options: question.options || ['', '', '', ''],
      options_count: question.options?.length || 4
    });
    setOptions(question.options || ['', '', '', '']);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };
  
  /**
   * Fermer le dialogue d'édition
   */
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(createEmptyQuestion());
    setEditingErrors({});
  };

  const updateListItem = (field, index, value) => {
    const items = [...(editingQuestion[field] || [])];
    items[index] = value;
    setEditingQuestion({
      ...editingQuestion,
      [field]: items
    });
  };

  const addListItem = (field) => {
    setEditingQuestion({
      ...editingQuestion,
      [field]: [...(editingQuestion[field] || []), '']
    });
  };

  const removeListItem = (field, index) => {
    setEditingQuestion({
      ...editingQuestion,
      [field]: (editingQuestion[field] || []).filter((_, itemIndex) => itemIndex !== index)
    });
  };
  
  /**
   * Ajouter une option pour les QCM
   */
  const handleAddOption = () => {
    setOptions([...options, '']);
  };
  
  /**
   * Supprimer une option
   * @param {number} index Index de l'option à supprimer
   */
  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      return; // Minimum de 2 options
    }
    
    const updatedOptions = [...options];
    updatedOptions.splice(index, 1);
    setOptions(updatedOptions);
    
    const removedIndex = String(index);
    const nextQuestion = { ...editingQuestion };

    if (editingQuestion.question_type === 'qcm_single') {
      if (String(editingQuestion.correct_answer) === removedIndex) {
        nextQuestion.correct_answer = '';
      } else if (editingQuestion.correct_answer !== '' && Number(editingQuestion.correct_answer) > index) {
        nextQuestion.correct_answer = String(Number(editingQuestion.correct_answer) - 1);
      }
    }

    if (editingQuestion.question_type === 'qcm_multiple') {
      nextQuestion.correct_answers = (editingQuestion.correct_answers || [])
        .filter((value) => String(value) !== removedIndex)
        .map((value) => (Number(value) > index ? String(Number(value) - 1) : String(value)));
    }

    setEditingQuestion(nextQuestion);
  };
  
  /**
   * Mettre à jour le texte d'une option
   * @param {number} index Index de l'option à modifier
   * @param {string} text Nouveau texte de l'option
   */
  const handleOptionTextChange = (index, text) => {
    const updatedOptions = [...options];
    updatedOptions[index] = text;
    setOptions(updatedOptions);
  };
  
  /**
   * Valider le formulaire d'édition de question
   * @returns {boolean} true si le formulaire est valide, false sinon
   */
  const validateQuestion = () => {
    const errors = {};
    
    if (!editingQuestion.question_text.trim()) {
      errors.question_text = 'Le texte de la question est obligatoire';
    }
    
    if (editingQuestion.points <= 0) {
      errors.points = 'Les points doivent être supérieurs à 0';
    }
    
    if (editingQuestion.question_type === 'qcm_single' || editingQuestion.question_type === 'qcm_multiple') {
      const validOptions = options.filter(opt => opt.trim() !== '');
      
      if (validOptions.length < 2) {
        errors.options_count = 'Au moins 2 options sont requises';
      }
      
      if (editingQuestion.question_type === 'qcm_single' && editingQuestion.correct_answer === '') {
        errors.correct_answer = 'Sélectionnez une réponse correcte';
      }

      if (editingQuestion.question_type === 'qcm_multiple' && (editingQuestion.correct_answers || []).length === 0) {
        errors.correct_answer = 'Sélectionnez au moins une réponse correcte';
      }
    }

    if (editingQuestion.question_type === 'numeric' && editingQuestion.correct_answer === '') {
      errors.correct_answer = 'La réponse correcte est obligatoire pour une question numérique';
    }

    if (editingQuestion.question_type === 'matching') {
      const leftItems = (editingQuestion.left_items || []).filter((item) => item.trim() !== '');
      const rightItems = (editingQuestion.right_items || []).filter((item) => item.trim() !== '');

      if (leftItems.length < 2 || rightItems.length < 2 || leftItems.length !== rightItems.length) {
        errors.matching = 'Ajoutez le même nombre d\'éléments dans chaque colonne (minimum 2).';
      }
    }

    if (editingQuestion.question_type === 'ordering') {
      const items = (editingQuestion.items || []).filter((item) => item.trim() !== '');
      if (items.length < 2) {
        errors.ordering = 'Ajoutez au moins deux éléments à ordonner.';
      }
    }

    if (editingQuestion.question_type === 'fill_blank') {
      if (!editingQuestion.text_with_blanks.includes('{{blank_')) {
        errors.fill_blank = 'Le texte doit contenir au moins un trou au format {{blank_1}}.';
      }
    }

    if (editingQuestion.question_type === 'image_question') {
      if (!editingQuestion.image_url.trim()) {
        errors.image_url = 'L\'URL de l\'image est obligatoire.';
      }

      const delegatedType = editingQuestion.answer_type || 'short_answer';

      if (['qcm_single', 'qcm_multiple'].includes(delegatedType)) {
        const validOptions = options.filter((opt) => opt.trim() !== '');
        if (validOptions.length < 2) {
          errors.options_count = 'Au moins 2 options sont requises pour une question sur image de type QCM.';
        }

        if (delegatedType === 'qcm_single' && editingQuestion.correct_answer === '') {
          errors.correct_answer = 'Sélectionnez une réponse correcte.';
        }

        if (delegatedType === 'qcm_multiple' && (editingQuestion.correct_answers || []).length === 0) {
          errors.correct_answer = 'Sélectionnez au moins une réponse correcte.';
        }
      }
    }
    
    setEditingErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  /**
   * Sauvegarder une question
   */
  const handleSaveQuestion = () => {
    if (!validateQuestion()) {
      return;
    }
    
    // Filtrer les options vides
    const filteredOptions = options.filter(opt => opt.trim() !== '');
    
    const question = {
      ...editingQuestion,
      question_number: editingIndex !== null ? questions[editingIndex].question_number : questions.length + 1,
      options: ['qcm_single', 'qcm_multiple'].includes(editingQuestion.question_type) ||
        (editingQuestion.question_type === 'image_question' && ['qcm_single', 'qcm_multiple'].includes(editingQuestion.answer_type))
        ? filteredOptions
        : undefined,
      correct_answer:
        editingQuestion.question_type === 'qcm_single'
          ? (editingQuestion.correct_answer === '' ? '0' : String(editingQuestion.correct_answer))
          : editingQuestion.question_type === 'qcm_multiple'
            ? (editingQuestion.correct_answers || []).map((value) => String(value))
            : editingQuestion.question_type === 'matching'
              ? Object.fromEntries(
                (editingQuestion.left_items || [])
                  .filter((item) => item.trim() !== '')
                  .map((_, index) => [String(index), String(index)])
              )
              : editingQuestion.question_type === 'ordering'
                ? (editingQuestion.items || []).filter((item) => item.trim() !== '')
                : editingQuestion.question_type === 'fill_blank'
                  ? Object.fromEntries(
                    Object.entries(editingQuestion.correct_answer || {}).filter(([, value]) => String(value || '').trim() !== '')
                  )
                  : editingQuestion.question_type === 'image_question' && editingQuestion.answer_type === 'qcm_single'
                    ? (editingQuestion.correct_answer === '' ? '0' : String(editingQuestion.correct_answer))
                    : editingQuestion.question_type === 'image_question' && editingQuestion.answer_type === 'qcm_multiple'
                      ? (editingQuestion.correct_answers || []).map((value) => String(value))
            : editingQuestion.correct_answer,
      correct_answers:
        editingQuestion.question_type === 'qcm_multiple' || (editingQuestion.question_type === 'image_question' && editingQuestion.answer_type === 'qcm_multiple')
          ? (editingQuestion.correct_answers || []).map((value) => String(value))
          : [],
      left_items: (editingQuestion.left_items || []).filter((item) => item.trim() !== ''),
      right_items: (editingQuestion.right_items || []).filter((item) => item.trim() !== ''),
      items: (editingQuestion.items || []).filter((item) => item.trim() !== ''),
      text_with_blanks: editingQuestion.text_with_blanks || '',
      image_url: editingQuestion.image_url || '',
      image_caption: editingQuestion.image_caption || '',
      answer_type: editingQuestion.answer_type || 'short_answer'
    };
    
    let nextQuestions = [];

    if (editingIndex !== null) {
      nextQuestions = [...questions];
      nextQuestions[editingIndex] = question;
    } else {
      nextQuestions = [...questions, question];
    }

    setQuestions(nextQuestions);
    setTotalPoints(nextQuestions.reduce((sum, item) => sum + Number(item.points || 0), 0));
    
    handleCloseDialog();
  };
  
  /**
   * Supprimer une question
   * @param {number} index Index de la question à supprimer
   */
  const handleDeleteQuestion = (index) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      const updatedQuestions = [...questions];
      const removedPoints = updatedQuestions[index].points;
      
      updatedQuestions.splice(index, 1);
      
      // Réajuster les numéros de question
      updatedQuestions.forEach((q, i) => {
        q.question_number = i + 1;
      });
      
      setQuestions(updatedQuestions);
      setTotalPoints(Math.max(0, totalPoints - removedPoints));
    }
  };
  
  /**
   * Déplacer une question vers le haut
   * @param {number} index Index de la question à déplacer
   */
  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const updatedQuestions = [...questions];
    const currentQuestion = { ...updatedQuestions[index] };
    const prevQuestion = { ...updatedQuestions[index - 1] };
    
    // Échanger les numéros de question
    const tempNumber = currentQuestion.question_number;
    currentQuestion.question_number = prevQuestion.question_number;
    prevQuestion.question_number = tempNumber;
    
    updatedQuestions[index] = prevQuestion;
    updatedQuestions[index - 1] = currentQuestion;
    
    setQuestions(updatedQuestions);
  };
  
  /**
   * Déplacer une question vers le bas
   * @param {number} index Index de la question à déplacer
   */
  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    
    const updatedQuestions = [...questions];
    const currentQuestion = { ...updatedQuestions[index] };
    const nextQuestion = { ...updatedQuestions[index + 1] };
    
    // Échanger les numéros de question
    const tempNumber = currentQuestion.question_number;
    currentQuestion.question_number = nextQuestion.question_number;
    nextQuestion.question_number = tempNumber;
    
    updatedQuestions[index] = nextQuestion;
    updatedQuestions[index + 1] = currentQuestion;
    
    setQuestions(updatedQuestions);
  };
  
  /**
   * Obtenir le texte pour le type de question
   * @param {string} type Type de question
   * @returns {string} Texte correspondant au type de question
   */
  const getQuestionTypeText = (type) => {
    return QUESTION_TYPE_LABELS[normalizeExamQuestionType(type)] || type;
  };

  const isImportableQuestion = (question) => Boolean(IMPORTABLE_TYPE_MAP[question.question_type || question.type]);

  const mapQuestionBankToExamQuestion = (question) => {
    const sourceType = normalizeExamQuestionType(question.question_type || question.type);
    const mappedType = IMPORTABLE_TYPE_MAP[sourceType];

    if (!mappedType) {
      return null;
    }

    const normalizedSource = normalizeExamQuestion({
      ...question,
      question_type: sourceType
    });

    return {
      question_number: questions.length + 1,
      question_text: normalizedSource.question_text,
      question_type: mappedType,
      points: Number(normalizedSource.points || 1),
      options: ['qcm_single', 'qcm_multiple'].includes(mappedType) ? normalizedSource.options : undefined,
      correct_answer: normalizedSource.correct_answer,
      correct_answers: normalizedSource.correct_answers || [],
      rubric: ['long_answer', 'short_answer'].includes(mappedType) ? question.explanation || question.rubric || '' : question.rubric || '',
      explanation: question.explanation || '',
      tolerance: normalizedSource.tolerance || 0,
      unit: normalizedSource.unit || '',
      max_words: normalizedSource.max_words || 500,
      left_items: normalizedSource.left_items || ['', ''],
      right_items: normalizedSource.right_items || ['', ''],
      items: normalizedSource.items || ['', ''],
      text_with_blanks: normalizedSource.text_with_blanks || '',
      image_url: normalizedSource.image_url || '',
      image_caption: normalizedSource.image_caption || '',
      answer_type: normalizedSource.answer_type || 'short_answer',
      source_question_bank_id: question.id
    };
  };

  const handleImportQuestion = (question) => {
    const importedQuestion = mapQuestionBankToExamQuestion(question);

    if (!importedQuestion) {
      setBankError("Ce type de question n'est pas encore compatible avec le createur d'examen.");
      return;
    }

    const nextQuestions = [...questions, importedQuestion].map((item, index) => ({
      ...item,
      question_number: index + 1
    }));

    setQuestions(nextQuestions);
    setTotalPoints(nextQuestions.reduce((sum, item) => sum + Number(item.points || 0), 0));
    setBankError(null);
  };
  
  /**
   * Réinitialiser le formulaire d'édition
   */
  const resetForm = () => {
    setEditingQuestion(createEmptyQuestion());
    setOptions(['', '', '', '']);
    setEditingErrors({});
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Questions de l'examen
          <Chip 
            label={`${currentTotalPoints} points`} 
            color="primary" 
            size="small" 
            sx={{ ml: 2 }} 
          />
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddQuestion}
          >
            Ajouter une question
          </Button>
          <Button
            variant="outlined"
            startIcon={<LibraryAddIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            Importer depuis la banque
          </Button>
        </Box>
      </Box>
      
      {errors.questions && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errors.questions}
        </Typography>
      )}
      
      {questions.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
          Aucune question n'a été ajoutée. Cliquez sur "Ajouter une question" pour commencer.
        </Typography>
      ) : (
        <List>
          {questions.map((question, index) => {
            const displayQuestion = normalizeExamQuestion(question);
            return (
            <React.Fragment key={index}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <Typography variant="h6" sx={{ mr: 2, minWidth: '36px' }}>
                    {question.question_number}.
                  </Typography>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">
                      {question.question_text}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', mt: 1 }}>
                      <Chip 
                        label={getQuestionTypeText(displayQuestion.question_type)} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      <Chip 
                        label={`${question.points} point${question.points > 1 ? 's' : ''}`} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                    
                    {['qcm_single', 'qcm_multiple'].includes(displayQuestion.question_type) && displayQuestion.options && (
                      <Box sx={{ mt: 1 }}>
                        {displayQuestion.options.map((option, optIndex) => {
                          const isCorrect = displayQuestion.question_type === 'qcm_single'
                            ? String(displayQuestion.correct_answer) === String(optIndex)
                            : (displayQuestion.correct_answers || []).includes(String(optIndex));
                          return (
                          <Typography 
                            key={optIndex} 
                            variant="body2" 
                            color={isCorrect ? 'success.main' : 'text.secondary'}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              fontWeight: isCorrect ? 'bold' : 'normal'
                            }}
                          >
                            {isCorrect && '✓ '}
                            {option}
                          </Typography>
                        );
                        })}
                      </Box>
                    )}
                    {displayQuestion.question_type === 'true_false' && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="success.main">
                        Reponse correcte : {getExamCorrectAnswerLabel(displayQuestion)}
                      </Typography>
                    )}
                    {displayQuestion.question_type === 'numeric' && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                        Reponse correcte : {getExamCorrectAnswerLabel(displayQuestion)}
                      </Typography>
                    )}
                    {displayQuestion.question_type === 'matching' && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                        Associations : {getExamCorrectAnswerLabel(displayQuestion)}
                      </Typography>
                    )}
                    {displayQuestion.question_type === 'ordering' && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                        Ordre attendu : {getExamCorrectAnswerLabel(displayQuestion)}
                      </Typography>
                    )}
                    {displayQuestion.question_type === 'fill_blank' && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                        Texte a trous configure
                      </Typography>
                    )}
                    {displayQuestion.question_type === 'image_question' && (
                      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                        Question sur image ({QUESTION_TYPE_LABELS[displayQuestion.answer_type] || displayQuestion.answer_type})
                      </Typography>
                    )}
                  </Box>
                  
                  <Box>
                    <Tooltip title="Modifier">
                      <IconButton onClick={() => handleEditQuestion(index)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton onClick={() => handleDeleteQuestion(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Déplacer vers le haut">
                      <span>
                        <IconButton onClick={() => handleMoveUp(index)} disabled={index === 0}>
                          <ArrowUpwardIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Déplacer vers le bas">
                      <span>
                        <IconButton onClick={() => handleMoveDown(index)} disabled={index === questions.length - 1}>
                          <ArrowDownwardIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </ListItem>
            </React.Fragment>
          );
          })}
        </List>
      )}
      
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingIndex !== null ? 'Modifier la question' : 'Ajouter une question'}
        </DialogTitle>
        
        <DialogContent>
          {/* Formulaire d'édition de question */}
          {isDialogOpen && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Texte de la question"
                  multiline
                  rows={3}
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question_text: e.target.value
                  })}
                  error={!!editingErrors.question_text}
                  helperText={editingErrors.question_text}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!editingErrors.question_type}>
                  <InputLabel>Type de question</InputLabel>
                  <Select
                    value={editingQuestion.question_type}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question_type: e.target.value,
                      correct_answer: '',
                      correct_answers: [],
                      tolerance: 0,
                      unit: '',
                      max_words: 500,
                      left_items: ['', ''],
                      right_items: ['', ''],
                      items: ['', ''],
                      text_with_blanks: '',
                      image_url: '',
                      image_caption: '',
                      answer_type: 'short_answer'
                    })}
                    label="Type de question"
                  >
                    <MenuItem value="qcm_single">QCM unique</MenuItem>
                    <MenuItem value="qcm_multiple">QCM multiple</MenuItem>
                    <MenuItem value="true_false">Vrai/Faux</MenuItem>
                    <MenuItem value="short_answer">Réponse courte</MenuItem>
                    <MenuItem value="long_answer">Rédaction / Dissertation</MenuItem>
                    <MenuItem value="numeric">Numérique</MenuItem>
                    <MenuItem value="matching">Association</MenuItem>
                    <MenuItem value="ordering">Ordonnancement</MenuItem>
                    <MenuItem value="fill_blank">Texte a trous</MenuItem>
                    <MenuItem value="image_question">Question sur image</MenuItem>
                  </Select>
                  {editingErrors.question_type && (
                    <FormHelperText>{editingErrors.question_type}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Points"
                  value={editingQuestion.points}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    points: Math.max(1, parseInt(e.target.value) || 1)
                  })}
                  error={!!editingErrors.points}
                  helperText={editingErrors.points}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Explication de la réponse"
                  multiline
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    explanation: e.target.value
                  })}
                  helperText="Sera affichée aux étudiants après l'examen (facultatif)"
                />
              </Grid>
              
              {/* Options pour QCM */}
              {['qcm_single', 'qcm_multiple'].includes(editingQuestion.question_type) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Options de réponse
                  </Typography>
                  
                  {editingErrors.options && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                      {editingErrors.options}
                    </Typography>
                  )}
                  
                  {editingErrors.options_count && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                      {editingErrors.options_count}
                    </Typography>
                  )}
                  
                  {editingQuestion.question_type === 'qcm_single' ? (
                  <RadioGroup
                    value={editingQuestion.correct_answer || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      correct_answer: e.target.value
                    })}
                  >
                    {options.map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FormControlLabel
                          value={String(index)}
                          control={<Radio />}
                          label=""
                          sx={{ mr: 0 }}
                        />
                        <TextField
                          fullWidth
                          value={option}
                          onChange={(e) => handleOptionTextChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveOption(index)}
                          disabled={options.length <= 2}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </RadioGroup>
                  ) : (
                    <Box>
                      {options.map((option, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Checkbox
                            checked={(editingQuestion.correct_answers || []).includes(String(index))}
                            onChange={(e) => {
                              const nextValues = e.target.checked
                                ? [...new Set([...(editingQuestion.correct_answers || []), String(index)])]
                                : (editingQuestion.correct_answers || []).filter((value) => String(value) !== String(index));
                              setEditingQuestion({
                                ...editingQuestion,
                                correct_answers: nextValues
                              });
                            }}
                          />
                          <TextField
                            fullWidth
                            value={option}
                            onChange={(e) => handleOptionTextChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveOption(index)}
                            disabled={options.length <= 2}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {editingErrors.correct_answer && (
                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                      {editingErrors.correct_answer}
                    </Typography>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddOption}
                    sx={{ mt: 2 }}
                  >
                    Ajouter une option
                  </Button>
                </Grid>
              )}
              
              {/* Barème pour les questions à réponse ouverte */}
              {editingQuestion.question_type === 'true_false' && (
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={editingQuestion.correct_answer || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        correct_answer: e.target.value
                      })}
                    >
                      <FormControlLabel value="true" control={<Radio />} label="Vrai" />
                      <FormControlLabel value="false" control={<Radio />} label="Faux" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              )}

              {editingQuestion.question_type === 'short_answer' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Réponse attendue"
                    value={editingQuestion.correct_answer || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      correct_answer: e.target.value
                    })}
                    helperText="Laissez vide pour une correction uniquement manuelle"
                  />
                </Grid>
              )}

              {editingQuestion.question_type === 'numeric' && (
                <>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Réponse correcte"
                      type="number"
                      value={editingQuestion.correct_answer || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        correct_answer: e.target.value
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Tolérance"
                      type="number"
                      value={editingQuestion.tolerance || 0}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        tolerance: Number(e.target.value || 0)
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Unité"
                      value={editingQuestion.unit || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        unit: e.target.value
                      })}
                    />
                  </Grid>
                </>
              )}

              {editingQuestion.question_type === 'long_answer' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre maximum de mots"
                    type="number"
                    value={editingQuestion.max_words || 500}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      max_words: Number(e.target.value || 500)
                    })}
                  />
                </Grid>
              )}

              {editingQuestion.question_type === 'matching' && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Colonne de gauche</Typography>
                    {(editingQuestion.left_items || []).map((item, index) => (
                      <Box key={`left-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          fullWidth
                          value={item}
                          onChange={(e) => updateListItem('left_items', index, e.target.value)}
                          placeholder={`Element gauche ${index + 1}`}
                          size="small"
                        />
                        <IconButton size="small" onClick={() => removeListItem('left_items', index)} disabled={(editingQuestion.left_items || []).length <= 2}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addListItem('left_items')}>
                      Ajouter
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Colonne de droite</Typography>
                    {(editingQuestion.right_items || []).map((item, index) => (
                      <Box key={`right-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          fullWidth
                          value={item}
                          onChange={(e) => updateListItem('right_items', index, e.target.value)}
                          placeholder={`Element droit ${index + 1}`}
                          size="small"
                        />
                        <IconButton size="small" onClick={() => removeListItem('right_items', index)} disabled={(editingQuestion.right_items || []).length <= 2}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addListItem('right_items')}>
                      Ajouter
                    </Button>
                  </Grid>
                  {editingErrors.matching && (
                    <Grid item xs={12}>
                      <Alert severity="error">{editingErrors.matching}</Alert>
                    </Grid>
                  )}
                </>
              )}

              {editingQuestion.question_type === 'ordering' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>Elements a ordonner</Typography>
                    {(editingQuestion.items || []).map((item, index) => (
                      <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          fullWidth
                          value={item}
                          onChange={(e) => updateListItem('items', index, e.target.value)}
                          placeholder={`Element ${index + 1}`}
                          size="small"
                        />
                        <IconButton size="small" onClick={() => removeListItem('items', index)} disabled={(editingQuestion.items || []).length <= 2}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addListItem('items')}>
                      Ajouter un element
                    </Button>
                  </Grid>
                  {editingErrors.ordering && (
                    <Grid item xs={12}>
                      <Alert severity="error">{editingErrors.ordering}</Alert>
                    </Grid>
                  )}
                </>
              )}

              {editingQuestion.question_type === 'fill_blank' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Texte avec trous"
                      value={editingQuestion.text_with_blanks || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        text_with_blanks: e.target.value
                      })}
                      helperText="Utilisez des marqueurs comme {{blank_1}}, {{blank_2}}"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Reponses attendues (JSON)"
                      value={typeof editingQuestion.correct_answer === 'object' ? JSON.stringify(editingQuestion.correct_answer) : (editingQuestion.correct_answer || '')}
                      onChange={(e) => {
                        let nextValue = {};
                        try {
                          nextValue = e.target.value ? JSON.parse(e.target.value) : {};
                        } catch (_error) {
                          nextValue = editingQuestion.correct_answer || {};
                        }
                        setEditingQuestion({
                          ...editingQuestion,
                          correct_answer: nextValue
                        });
                      }}
                      helperText='Exemple: {"blank_1":"cloud","blank_2":"vm"}'
                    />
                  </Grid>
                  {editingErrors.fill_blank && (
                    <Grid item xs={12}>
                      <Alert severity="error">{editingErrors.fill_blank}</Alert>
                    </Grid>
                  )}
                </>
              )}

              {editingQuestion.question_type === 'image_question' && (
                <>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="URL de l'image"
                      value={editingQuestion.image_url || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        image_url: e.target.value
                      })}
                      error={!!editingErrors.image_url}
                      helperText={editingErrors.image_url || 'URL publique ou fichier statique deja accessible'}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Type de reponse</InputLabel>
                      <Select
                        value={editingQuestion.answer_type || 'short_answer'}
                        label="Type de reponse"
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          answer_type: e.target.value,
                          correct_answer: '',
                          correct_answers: [],
                          tolerance: 0,
                          unit: '',
                          max_words: 500
                        })}
                      >
                        <MenuItem value="qcm_single">QCM unique</MenuItem>
                        <MenuItem value="qcm_multiple">QCM multiple</MenuItem>
                        <MenuItem value="true_false">Vrai/Faux</MenuItem>
                        <MenuItem value="short_answer">Réponse courte</MenuItem>
                        <MenuItem value="long_answer">Réponse longue</MenuItem>
                        <MenuItem value="numeric">Numérique</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Legende de l'image"
                      value={editingQuestion.image_caption || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        image_caption: e.target.value
                      })}
                    />
                  </Grid>
                  {['qcm_single', 'qcm_multiple'].includes(editingQuestion.answer_type) && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>Options de reponse</Typography>
                      {options.map((option, index) => (
                        <Box key={`image-opt-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {editingQuestion.answer_type === 'qcm_single' ? (
                            <Radio
                              checked={String(editingQuestion.correct_answer) === String(index)}
                              onChange={() => setEditingQuestion({
                                ...editingQuestion,
                                correct_answer: String(index)
                              })}
                            />
                          ) : (
                            <Checkbox
                              checked={(editingQuestion.correct_answers || []).includes(String(index))}
                              onChange={(e) => {
                                const nextValues = e.target.checked
                                  ? [...new Set([...(editingQuestion.correct_answers || []), String(index)])]
                                  : (editingQuestion.correct_answers || []).filter((value) => String(value) !== String(index));
                                setEditingQuestion({
                                  ...editingQuestion,
                                  correct_answers: nextValues
                                });
                              }}
                            />
                          )}
                          <TextField
                            fullWidth
                            value={option}
                            onChange={(e) => handleOptionTextChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            size="small"
                          />
                          <IconButton size="small" onClick={() => handleRemoveOption(index)} disabled={options.length <= 2}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddOption}>
                        Ajouter une option
                      </Button>
                    </Grid>
                  )}
                  {editingQuestion.answer_type === 'true_false' && (
                    <Grid item xs={12}>
                      <FormControl component="fieldset">
                        <RadioGroup
                          row
                          value={editingQuestion.correct_answer || ''}
                          onChange={(e) => setEditingQuestion({
                            ...editingQuestion,
                            correct_answer: e.target.value
                          })}
                        >
                          <FormControlLabel value="true" control={<Radio />} label="Vrai" />
                          <FormControlLabel value="false" control={<Radio />} label="Faux" />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  )}
                  {editingQuestion.answer_type === 'short_answer' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Réponse attendue"
                        value={editingQuestion.correct_answer || ''}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          correct_answer: e.target.value
                        })}
                        helperText="Laissez vide pour une correction uniquement manuelle"
                      />
                    </Grid>
                  )}
                  {editingQuestion.answer_type === 'numeric' && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Réponse correcte"
                          type="number"
                          value={editingQuestion.correct_answer || ''}
                          onChange={(e) => setEditingQuestion({
                            ...editingQuestion,
                            correct_answer: e.target.value
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Tolérance"
                          type="number"
                          value={editingQuestion.tolerance || 0}
                          onChange={(e) => setEditingQuestion({
                            ...editingQuestion,
                            tolerance: Number(e.target.value || 0)
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Unité"
                          value={editingQuestion.unit || ''}
                          onChange={(e) => setEditingQuestion({
                            ...editingQuestion,
                            unit: e.target.value
                          })}
                        />
                      </Grid>
                    </>
                  )}
                  {editingQuestion.answer_type === 'long_answer' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nombre maximum de mots"
                        type="number"
                        value={editingQuestion.max_words || 500}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          max_words: Number(e.target.value || 500)
                        })}
                      />
                    </Grid>
                  )}
                </>
              )}

              {['short_answer', 'long_answer', 'numeric'].includes(editingQuestion.question_type) && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Barème / Critères d'évaluation"
                    multiline
                    rows={3}
                    value={editingQuestion.rubric || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      rubric: e.target.value
                    })}
                    helperText="Décrivez comment la réponse sera évaluée (facultatif)"
                  />
                </Grid>
              )}

              {editingQuestion.question_type === 'image_question' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Barème / Critères d'évaluation"
                    multiline
                    rows={3}
                    value={editingQuestion.rubric || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      rubric: e.target.value
                    })}
                    helperText="Décrivez comment la réponse sera évaluée (facultatif)"
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveQuestion} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Importer depuis la banque de questions</DialogTitle>
        <DialogContent>
          <Tabs value={importTab} onChange={(_event, value) => setImportTab(value)} sx={{ mb: 2 }}>
            <Tab label="Ma banque" />
            <Tab label="Banque partagee" />
          </Tabs>

          <TextField
            fullWidth
            size="small"
            label="Rechercher une question"
            value={bankSearch}
            onChange={(event) => setBankSearch(event.target.value)}
            sx={{ mb: 2 }}
          />

          {bankError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {bankError}
            </Alert>
          )}

          {bankLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filteredBankQuestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              Aucune question disponible.
            </Typography>
          ) : (
            <List>
              {filteredBankQuestions.map((question) => {
                const importable = isImportableQuestion(question);
                const sourceType = question.question_type || question.type;
                return (
                  <React.Fragment key={question.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={question.question_text || question.text}
                        secondary={
                          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip size="small" label={QUESTION_TYPE_LABELS[sourceType] || sourceType} />
                            {question.matiere && <Chip size="small" label={question.matiere} variant="outlined" />}
                            {question.theme && <Chip size="small" label={question.theme} variant="outlined" />}
                            {!importable && (
                              <Chip
                                size="small"
                                color="warning"
                                label="Type non compatible avec ce createur"
                              />
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={!importable}
                          onClick={() => handleImportQuestion(question)}
                        >
                          Importer
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ExamQuestions;
