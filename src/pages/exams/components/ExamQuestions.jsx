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
 * @param {Object} props - Propriétés du composant
 * @param {Array<Object>} props.questions - Liste des questions de l'examen
 * @param {Function} props.setQuestions - Fonction pour mettre à jour la liste des questions
 * @param {number} props.totalPoints - Nombre total de points de l'examen
 * @param {Function} props.setTotalPoints - Fonction pour mettre à jour le nombre total de points
 * @param {Object} props.errors - Erreurs de validation
 * @returns {JSX.Element} Composant de gestion des questions d'examen
 */
const ExamQuestions = ({
  questions,
  setQuestions,
  totalPoints,
  setTotalPoints,
  errors
}) => {
  // État pour le formulaire d'édition de question
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingErrors, setEditingErrors] = useState({});
  
  // État pour les options de QCM
  const [options, setOptions] = useState([]);
  const [nextOptionId, setNextOptionId] = useState(1);
  
  // Calcul du total de points actuel
  const currentTotalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  
  /**
   * Ouvre le dialogue pour ajouter une nouvelle question
   */
  const handleAddQuestion = () => {
    const nextQuestionNumber = questions.length + 1;
    
    setEditingQuestion({
      question_number: nextQuestionNumber,
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      options: [],
      correct_answer: null,
      rubric: ''
    });
    
    setOptions([
      { id: 1, text: '' },
      { id: 2, text: '' },
      { id: 3, text: '' },
      { id: 4, text: '' }
    ]);
    
    setNextOptionId(5);
    setEditingErrors({});
    setIsDialogOpen(true);
  };
  
  /**
   * Ouvre le dialogue pour éditer une question existante
   * @param {number} index - Index de la question à éditer
   */
  const handleEditQuestion = (index) => {
    const question = { ...questions[index] };
    setEditingQuestion(question);
    
    if (question.question_type === 'multiple_choice' && question.options) {
      setOptions([...question.options]);
      setNextOptionId(Math.max(...question.options.map(o => o.id)) + 1);
    } else {
      setOptions([
        { id: 1, text: '' },
        { id: 2, text: '' },
        { id: 3, text: '' },
        { id: 4, text: '' }
      ]);
      setNextOptionId(5);
    }
    
    setEditingErrors({});
    setIsDialogOpen(true);
  };
  
  /**
   * Ferme le dialogue d'édition de question
   */
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };
  
  /**
   * Ajoute une option pour les questions à choix multiples
   */
  const handleAddOption = () => {
    setOptions([...options, { id: nextOptionId, text: '' }]);
    setNextOptionId(nextOptionId + 1);
  };
  
  /**
   * Supprime une option de réponse
   * @param {number} id - ID de l'option à supprimer
   */
  const handleRemoveOption = (id) => {
    setOptions(options.filter(opt => opt.id !== id));
    
    // Si l'option supprimée était la réponse correcte, réinitialiser la réponse
    if (editingQuestion && editingQuestion.correct_answer === id) {
      setEditingQuestion({
        ...editingQuestion,
        correct_answer: null
      });
    }
  };
  
  /**
   * Met à jour le texte d'une option
   * @param {number} id - ID de l'option à mettre à jour
   * @param {string} text - Nouveau texte de l'option
   */
  const handleOptionTextChange = (id, text) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    ));
  };
  
  /**
   * Valide le formulaire d'édition de question
   * @returns {boolean} true si le formulaire est valide, false sinon
   */
  const validateQuestionForm = () => {
    const errors = {};
    
    if (!editingQuestion) return false;
    
    if (!editingQuestion.question_text.trim()) {
      errors.question_text = 'Le texte de la question est requis';
    }
    
    if (editingQuestion.points <= 0) {
      errors.points = 'Le nombre de points doit être supérieur à 0';
    }
    
    if (editingQuestion.question_type === 'multiple_choice') {
      // Vérifier que toutes les options ont du texte
      const emptyOptions = options.filter(opt => !opt.text.trim());
      if (emptyOptions.length > 0) {
        errors.options = 'Toutes les options doivent avoir un texte';
      }
      
      // Vérifier qu'il y a au moins 2 options
      if (options.length < 2) {
        errors.options_count = 'Il doit y avoir au moins 2 options';
      }
      
      // Vérifier qu'une réponse correcte est sélectionnée
      if (editingQuestion.correct_answer === null) {
        errors.correct_answer = 'Vous devez sélectionner une réponse correcte';
      }
    }
    
    setEditingErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  /**
   * Sauvegarde une question (ajout ou modification)
   */
  const handleSaveQuestion = () => {
    if (!editingQuestion || !validateQuestionForm()) return;
    
    const updatedQuestion = {
      ...editingQuestion,
      options: editingQuestion.question_type === 'multiple_choice' ? options : null,
      correct_answer: editingQuestion.question_type === 'multiple_choice' 
        ? editingQuestion.correct_answer 
        : null
    };
    
    // Mise à jour ou ajout de la question
    const existingIndex = questions.findIndex(q => 
      q.question_number === updatedQuestion.question_number
    );
    
    let updatedQuestions;
    if (existingIndex >= 0) {
      updatedQuestions = [...questions];
      updatedQuestions[existingIndex] = updatedQuestion;
    } else {
      updatedQuestions = [...questions, updatedQuestion];
    }
    
    // Trier par numéro de question
    updatedQuestions.sort((a, b) => a.question_number - b.question_number);
    
    setQuestions(updatedQuestions);
    
    // Mettre à jour le total des points
    const newTotalPoints = updatedQuestions.reduce((sum, q) => sum + q.points, 0);
    setTotalPoints(newTotalPoints);
    
    handleCloseDialog();
  };
  
  /**
   * Supprime une question
   * @param {number} index - Index de la question à supprimer
   */
  const handleDeleteQuestion = (index) => {
    // Supprimer la question
    const updatedQuestions = questions.filter((_, i) => i !== index);
    
    // Réorganiser les numéros de question
    const renumberedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      question_number: i + 1
    }));
    
    setQuestions(renumberedQuestions);
    
    // Mettre à jour le total des points
    const newTotalPoints = renumberedQuestions.reduce((sum, q) => sum + q.points, 0);
    setTotalPoints(newTotalPoints);
  };
  
  /**
   * Déplace une question vers le haut dans la liste
   * @param {number} index - Index de la question à déplacer
   */
  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const updatedQuestions = [...questions];
    const temp = { ...updatedQuestions[index] };
    
    // Échanger les numéros de question
    const tempNumber = temp.question_number;
    temp.question_number = updatedQuestions[index - 1].question_number;
    updatedQuestions[index - 1].question_number = tempNumber;
    
    // Échanger les positions dans le tableau
    updatedQuestions[index] = updatedQuestions[index - 1];
    updatedQuestions[index - 1] = temp;
    
    setQuestions(updatedQuestions);
  };
  
  /**
   * Déplace une question vers le bas dans la liste
   * @param {number} index - Index de la question à déplacer
   */
  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    
    const updatedQuestions = [...questions];
    const temp = { ...updatedQuestions[index] };
    
    // Échanger les numéros de question
    const tempNumber = temp.question_number;
    temp.question_number = updatedQuestions[index + 1].question_number;
    updatedQuestions[index + 1].question_number = tempNumber;
    
    // Échanger les positions dans le tableau
    updatedQuestions[index] = updatedQuestions[index + 1];
    updatedQuestions[index + 1] = temp;
    
    setQuestions(updatedQuestions);
  };
  
  /**
   * Obtient le texte correspondant au type de question
   * @param {string} type - Type de question
   * @returns {string} Texte à afficher pour le type de question
   */
  const getQuestionTypeText = (type) => {
    switch (type) {
      case 'multiple_choice':
        return 'QCM';
      case 'short_answer':
        return 'Réponse courte';
      case 'essay':
        return 'Réponse longue';
      default:
        return type;
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Questions de l'examen
        </Typography>
        <Box>
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'right', mb: 1 }}>
            Total des points: {currentTotalPoints}/{totalPoints}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddQuestion}
          >
            Ajouter une question
          </Button>
        </Box>
      </Box>
      
      {errors.questions && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {errors.questions}
        </Typography>
      )}
      
      {questions.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary">
            Aucune question n'a été ajoutée à cet examen.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Cliquez sur "Ajouter une question" pour commencer.
          </Typography>
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {questions.map((question, index) => (
            <React.Fragment key={question.question_number}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" component="span">
                        {question.question_number}. {question.question_text}
                      </Typography>
                      <Chip 
                        label={`${question.points} pt${question.points > 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                      <Chip 
                        label={getQuestionTypeText(question.question_type)}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    question.question_type === 'multiple_choice' && question.options ? (
                      <Box sx={{ mt: 1 }}>
                        {question.options.map((option, i) => (
                          <Typography 
                            key={option.id} 
                            variant="body2" 
                            component="div"
                            sx={{ 
                              color: option.id === question.correct_answer ? 'success.main' : 'text.secondary',
                              fontWeight: option.id === question.correct_answer ? 'bold' : 'normal'
                            }}
                          >
                            {String.fromCharCode(65 + i)}. {option.text}
                            {option.id === question.correct_answer && ' ✓'}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        {question.rubric ? `Barème: ${question.rubric}` : 'Aucun barème défini'}
                      </Typography>
                    )
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title="Déplacer vers le haut">
                      <span>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          size="small"
                        >
                          <ArrowUpwardIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Déplacer vers le bas">
                      <span>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleMoveDown(index)}
                          disabled={index === questions.length - 1}
                          size="small"
                        >
                          <ArrowDownwardIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditQuestion(index)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteQuestion(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Dialogue d'édition de question */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion && editingQuestion.question_number && questions.some(q => q.question_number === editingQuestion.question_number)
            ? 'Modifier la question'
            : 'Ajouter une question'
          }
        </DialogTitle>
        
        <DialogContent dividers>
          {editingQuestion && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Texte de la question"
                  multiline
                  rows={2}
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question_text: e.target.value
                  })}
                  error={!!editingErrors.question_text}
                  helperText={editingErrors.question_text || ''}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type de question</InputLabel>
                  <Select
                    value={editingQuestion.question_type}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question_type: e.target.value,
                      correct_answer: null // Réinitialiser la réponse correcte
                    })}
                    label="Type de question"
                  >
                    <MenuItem value="multiple_choice">QCM</MenuItem>
                    <MenuItem value="short_answer">Réponse courte</MenuItem>
                    <MenuItem value="essay">Réponse longue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Points"
                  type="number"
                  InputProps={{ inputProps: { min: 1 } }}
                  value={editingQuestion.points}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setEditingQuestion({
                        ...editingQuestion,
                        points: value
                      });
                    }
                  }}
                  error={!!editingErrors.points}
                  helperText={editingErrors.points || ''}
                  required
                />
              </Grid>
              
              {/* Options pour les QCM */}
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
                      correct_answer: parseInt(e.target.value)
                    })}
                  >
                    {options.map((option, index) => (
                      <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FormControlLabel
                          value={option.id}
                          control={<Radio />}
                          label=""
                          sx={{ mr: 0 }}
                        />
                        <TextField
                          fullWidth
                          value={option.text}
                          onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveOption(option.id)}
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
