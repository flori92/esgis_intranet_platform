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

// Types pour les questions d'examen
export interface ExamQuestion {
  id?: number;
  exam_id?: number; 
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'essay';
  points: number;
  options?: Array<{
    id: number;
    text: string;
  }> | null;
  correct_answer?: string | number | null;
  rubric?: string | null;
}

interface ExamQuestionsProps {
  questions: ExamQuestion[];
  setQuestions: (questions: ExamQuestion[]) => void;
  totalPoints: number;
  setTotalPoints: (points: number) => void;
  errors: {
    questions?: string;
  };
}

/**
 * Composant pour la gestion des questions d'examen
 * S'intègre avec le système de Quiz existant
 */
const ExamQuestions: React.FC<ExamQuestionsProps> = ({
  questions,
  setQuestions,
  totalPoints,
  setTotalPoints,
  errors
}) => {
  // État pour le formulaire d'édition de question
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingErrors, setEditingErrors] = useState<Record<string, string>>({});
  
  // État pour les options de QCM
  const [options, setOptions] = useState<Array<{ id: number; text: string }>>([]);
  const [nextOptionId, setNextOptionId] = useState(1);
  
  // Calcul du total de points actuel
  const currentTotalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  
  // Ouvrir le dialogue pour une nouvelle question
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
  
  // Ouvrir le dialogue pour éditer une question existante
  const handleEditQuestion = (index: number) => {
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
  
  // Fermer le dialogue d'édition
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };
  
  // Ajouter une option pour les QCM
  const handleAddOption = () => {
    setOptions([...options, { id: nextOptionId, text: '' }]);
    setNextOptionId(nextOptionId + 1);
  };
  
  // Supprimer une option
  const handleRemoveOption = (id: number) => {
    setOptions(options.filter(opt => opt.id !== id));
    
    // Si l'option supprimée était la réponse correcte, réinitialiser la réponse
    if (editingQuestion && editingQuestion.correct_answer === id) {
      setEditingQuestion({
        ...editingQuestion,
        correct_answer: null
      });
    }
  };
  
  // Mettre à jour le texte d'une option
  const handleOptionTextChange = (id: number, text: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    ));
  };
  
  // Valider le formulaire d'édition de question
  const validateQuestionForm = (): boolean => {
    const errors: Record<string, string> = {};
    
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
  
  // Sauvegarder une question
  const handleSaveQuestion = () => {
    if (!editingQuestion || !validateQuestionForm()) return;
    
    const updatedQuestion: ExamQuestion = {
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
  
  // Supprimer une question
  const handleDeleteQuestion = (index: number) => {
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
  
  // Déplacer une question vers le haut
  const handleMoveUp = (index: number) => {
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
  
  // Déplacer une question vers le bas
  const handleMoveDown = (index: number) => {
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
  
  // Obtenir le texte pour le type de question
  const getQuestionTypeText = (type: string): string => {
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
            <React.Fragment key={index}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start">
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1">
                        Question {question.question_number}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip 
                          label={getQuestionTypeText(question.question_type)} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                        <Chip 
                          label={`${question.points} point${question.points > 1 ? 's' : ''}`} 
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleMoveDown(index)}
                        disabled={index === questions.length - 1}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditQuestion(index)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteQuestion(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {question.question_text}
                  </Typography>
                  
                  {question.question_type === 'multiple_choice' && question.options && (
                    <Box sx={{ mt: 1, ml: 2 }}>
                      {question.options.map((option, i) => (
                        <Typography 
                          key={i} 
                          variant="body2" 
                          sx={{ 
                            color: question.correct_answer === option.id ? 'success.main' : 'text.primary',
                            fontWeight: question.correct_answer === option.id ? 'bold' : 'normal'
                          }}
                        >
                          {option.id === question.correct_answer ? '✓ ' : '○ '}
                          {option.text}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  
                  {question.question_type !== 'multiple_choice' && question.rubric && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Barème: {question.rubric}
                    </Typography>
                  )}
                </Box>
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
          {editingQuestion && editingQuestion.id 
            ? 'Modifier la question' 
            : 'Ajouter une nouvelle question'
          }
        </DialogTitle>
        
        <DialogContent dividers>
          {editingQuestion && (
            <Grid container spacing={3}>
              {/* Type de question */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type de question</InputLabel>
                  <Select
                    value={editingQuestion.question_type}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question_type: e.target.value as 'multiple_choice' | 'short_answer' | 'essay'
                    })}
                    label="Type de question"
                  >
                    <MenuItem value="multiple_choice">QCM</MenuItem>
                    <MenuItem value="short_answer">Réponse courte</MenuItem>
                    <MenuItem value="essay">Réponse longue / Essai</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Points */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre de points"
                  type="number"
                  InputProps={{ inputProps: { min: 0.5, step: 0.5 } }}
                  value={editingQuestion.points}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    points: parseFloat(e.target.value)
                  })}
                  error={!!editingErrors.points}
                  helperText={editingErrors.points}
                />
              </Grid>
              
              {/* Texte de la question */}
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
                  helperText={editingErrors.question_text || 'Saisissez le texte de votre question ici'}
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
