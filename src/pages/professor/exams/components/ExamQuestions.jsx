import React, { useState } from 'react';
import {
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
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

/**
 * Composant pour la gestion des questions d'examen
 * S'intègre avec le système de Quiz existant
 *
 * @typedef {Object} ExamQuestion
 * @property {number} [id] ID de la question
 * @property {number} [exam_id] ID de l'examen associé
 * @property {number} question_number Numéro de la question
 * @property {string} question_text Texte de la question
 * @property {string} question_type Type de question ('multiple_choice', 'true_false', 'short_answer', 'essay')
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
  // État pour le formulaire d'édition de question
  const [editingQuestion, setEditingQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    options: ['', '', '', ''],
    correct_answer: '',
    rubric: '',
    explanation: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingErrors, setEditingErrors] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  
  // État pour les options de QCM
  const [options, setOptions] = useState(['', '', '', '']);
  const [nextOptionId, setNextOptionId] = useState(1);
  
  // Calcul du total de points actuel
  const currentTotalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  
  /**
   * Ouvrir le dialogue pour une nouvelle question
   */
  const handleAddQuestion = () => {
    resetForm();
    setIsDialogOpen(true);
    setEditingIndex(null);
    setEditingQuestion({
      question_number: questions.length + 1,
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      options: ['', '', '', ''],
      correct_answer: '',
      rubric: '',
      explanation: ''
    });
    setOptions(['', '', '', '']);
  };
  
  /**
   * Ouvrir le dialogue pour éditer une question existante
   * @param {number} index Index de la question à éditer
   */
  const handleEditQuestion = (index) => {
    const question = questions[index];
    setEditingQuestion({
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
    setEditingQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      options: ['', '', '', ''],
      correct_answer: '',
      rubric: '',
      explanation: ''
    });
    setEditingErrors({});
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
    
    // Si l'option supprimée était la réponse correcte, réinitialiser
    if (options[index] === editingQuestion.correct_answer) {
      setEditingQuestion({
        ...editingQuestion,
        correct_answer: ''
      });
    }
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
    
    if (editingQuestion.question_type === 'multiple_choice') {
      const validOptions = options.filter(opt => opt.trim() !== '');
      
      if (validOptions.length < 2) {
        errors.options_count = 'Au moins 2 options sont requises';
      }
      
      if (!editingQuestion.correct_answer) {
        errors.correct_answer = 'Sélectionnez une réponse correcte';
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
      options: editingQuestion.question_type === 'multiple_choice' ? filteredOptions : undefined,
      // Ensure correct_answer is still valid after filtering options
      correct_answer: editingQuestion.question_type === 'multiple_choice' 
        ? (filteredOptions.includes(editingQuestion.correct_answer) ? editingQuestion.correct_answer : filteredOptions[0])
        : editingQuestion.correct_answer
    };
    
    if (editingIndex !== null) {
      // Mise à jour d'une question existante
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = question;
      setQuestions(updatedQuestions);
    } else {
      // Ajout d'une nouvelle question
      setQuestions([...questions, question]);
    }
    
    // Recalculer le total des points
    setTotalPoints(questions.reduce((sum, q) => sum + q.points, 0) + (editingIndex === null ? question.points : 0));
    
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
    switch (type) {
      case 'multiple_choice':
        return 'Choix multiple';
      case 'true_false':
        return 'Vrai/Faux';
      case 'short_answer':
        return 'Réponse courte';
      case 'essay':
        return 'Rédaction';
      default:
        return type;
    }
  };
  
  /**
   * Réinitialiser le formulaire d'édition
   */
  const resetForm = () => {
    setEditingQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      options: ['', '', '', ''],
      correct_answer: '',
      rubric: '',
      explanation: ''
    });
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
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddQuestion}
        >
          Ajouter une question
        </Button>
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
          {questions.map((question, index) => (
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
                        label={getQuestionTypeText(question.question_type)} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      <Chip 
                        label={`${question.points} point${question.points > 1 ? 's' : ''}`} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                    
                    {question.question_type === 'multiple_choice' && question.options && (
                      <Box sx={{ mt: 1 }}>
                        {question.options.map((option, optIndex) => (
                          <Typography 
                            key={optIndex} 
                            variant="body2" 
                            color={option === question.correct_answer ? 'success.main' : 'text.secondary'}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              fontWeight: option === question.correct_answer ? 'bold' : 'normal'
                            }}
                          >
                            {option === question.correct_answer && '✓ '}
                            {option}
                          </Typography>
                        ))}
                      </Box>
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
          ))}
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
                      question_type: e.target.value
                    })}
                    label="Type de question"
                  >
                    <MenuItem value="multiple_choice">Choix multiple</MenuItem>
                    <MenuItem value="true_false">Vrai/Faux</MenuItem>
                    <MenuItem value="short_answer">Réponse courte</MenuItem>
                    <MenuItem value="essay">Rédaction</MenuItem>
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
              {editingQuestion.question_type === 'multiple_choice' && (
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
                          value={option}
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
              {editingQuestion.question_type !== 'multiple_choice' && (
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
    </Paper>
  );
};

export default ExamQuestions;
