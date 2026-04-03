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
  Checkbox,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

/**
 * Les 10 types de questions supportés — ESGIS Campus §6.1
 */
const QUESTION_TYPES = [
  { value: 'qcm_single', label: 'QCM à réponse unique', description: 'Une seule bonne réponse parmi 2 à 6 choix' },
  { value: 'qcm_multiple', label: 'QCM à réponses multiples', description: 'Plusieurs réponses correctes possibles' },
  { value: 'true_false', label: 'Vrai / Faux', description: 'Question binaire' },
  { value: 'short_answer', label: 'Réponse courte', description: 'Zone de saisie libre courte (1 ligne)' },
  { value: 'long_answer', label: 'Réponse longue / Dissertation', description: 'Zone de saisie étendue avec compteur de mots' },
  { value: 'numeric', label: 'Numérique', description: "Saisie d'un nombre avec tolérance d'erreur paramétrable" },
  { value: 'matching', label: 'Association / Correspondance', description: 'Relier des éléments de deux colonnes' },
  { value: 'ordering', label: 'Ordonnancement', description: 'Remettre des éléments dans le bon ordre' },
  { value: 'fill_blank', label: 'Complétion de texte à trous', description: 'Remplir les cases vides d\'un texte' },
  { value: 'image_question', label: 'Question sur image', description: "Image affichée, l'étudiant répond à son sujet" },
];

/**
 * Retourne le libellé court d'un type de question
 */
const getTypeLabel = (type) => QUESTION_TYPES.find(t => t.value === type)?.label || type;

/**
 * Retourne la couleur du chip selon le type
 */
const getTypeColor = (type) => {
  const colors = {
    qcm_single: 'primary', qcm_multiple: 'secondary', true_false: 'info',
    short_answer: 'default', long_answer: 'default', numeric: 'warning',
    matching: 'success', ordering: 'success', fill_blank: 'info', image_question: 'error'
  };
  return colors[type] || 'default';
};

/**
 * Template vide pour une nouvelle question
 */
const emptyQuestion = () => ({
  question_number: 0,
  question_text: '',
  question_type: 'qcm_single',
  points: 2,
  options: ['', '', '', ''],
  correct_answer: null,
  correct_answers: [],
  rubric: '',
  explanation: '',
  // Champs spécifiques par type
  tolerance: 0,
  unit: '',
  max_words: 500,
  left_items: ['', ''],
  right_items: ['', ''],
  items: ['', '', ''],
  text_with_blanks: '',
  image_url: '',
  image_caption: '',
  answer_type: 'short_answer',
});

/**
 * Composant pour la gestion des questions d'examen — ESGIS Campus §6.1
 * Supporte les 10 types de questions. Un examen peut regrouper plusieurs types.
 */
const ExamQuestions = ({
  questions,
  setQuestions,
  totalPoints,
  setTotalPoints,
  errors
}) => {
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingErrors, setEditingErrors] = useState({});

  const currentTotalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  // --- Stats par type ---
  const typeCounts = {};
  questions.forEach(q => {
    typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
  });

  // ========== HANDLERS ==========

  const handleAddQuestion = () => {
    const q = emptyQuestion();
    q.question_number = questions.length + 1;
    setEditingQuestion(q);
    setEditingErrors({});
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (index) => {
    const q = { ...emptyQuestion(), ...questions[index] };
    // Assurer la rétro-compatibilité avec l'ancien format
    if (q.question_type === 'multiple_choice') q.question_type = 'qcm_single';
    if (q.question_type === 'essay') q.question_type = 'long_answer';
    setEditingQuestion(q);
    setEditingErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleDuplicate = (index) => {
    const original = questions[index];
    const copy = {
      ...original,
      question_number: questions.length + 1,
      question_text: `[Copie] ${original.question_text}`
    };
    const updated = [...questions, copy];
    setQuestions(updated);
    setTotalPoints(updated.reduce((s, q) => s + (q.points || 0), 0));
  };

  const handleDeleteQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, question_number: i + 1 }));
    setQuestions(updated);
    setTotalPoints(updated.reduce((s, q) => s + (q.points || 0), 0));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...questions];
    [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    updated.forEach((q, i) => { q.question_number = i + 1; });
    setQuestions(updated);
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((q, i) => { q.question_number = i + 1; });
    setQuestions(updated);
  };

  // --- Validation ---
  const validateQuestionForm = () => {
    const errs = {};
    if (!editingQuestion) return false;
    if (!editingQuestion.question_text?.trim()) errs.question_text = 'Le texte de la question est requis';
    if (!editingQuestion.points || editingQuestion.points <= 0) errs.points = 'Les points doivent être > 0';

    const type = editingQuestion.question_type;
    if (type === 'qcm_single' || type === 'qcm_multiple') {
      const opts = editingQuestion.options || [];
      if (opts.filter(o => o?.trim()).length < 2) errs.options = 'Au moins 2 options non vides requises';
      if (type === 'qcm_single' && (editingQuestion.correct_answer === null || editingQuestion.correct_answer === undefined))
        errs.correct_answer = 'Sélectionnez la bonne réponse';
      if (type === 'qcm_multiple' && (!editingQuestion.correct_answers || editingQuestion.correct_answers.length === 0))
        errs.correct_answer = 'Sélectionnez au moins une bonne réponse';
    }
    if (type === 'matching') {
      if (!editingQuestion.left_items?.filter(i => i?.trim()).length || !editingQuestion.right_items?.filter(i => i?.trim()).length)
        errs.matching = 'Remplissez les éléments des deux colonnes';
    }
    if (type === 'ordering') {
      if (!editingQuestion.items?.filter(i => i?.trim()).length)
        errs.ordering = 'Ajoutez au moins 2 éléments à ordonner';
    }
    if (type === 'fill_blank') {
      if (!editingQuestion.text_with_blanks?.includes('{{blank_'))
        errs.fill_blank = 'Le texte doit contenir au moins un trou: {{blank_1}}';
    }

    setEditingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion || !validateQuestionForm()) return;

    const existingIdx = questions.findIndex(q => q.question_number === editingQuestion.question_number);
    let updated;
    if (existingIdx >= 0) {
      updated = [...questions];
      updated[existingIdx] = editingQuestion;
    } else {
      updated = [...questions, editingQuestion];
    }
    updated.sort((a, b) => a.question_number - b.question_number);
    setQuestions(updated);
    setTotalPoints(updated.reduce((s, q) => s + (q.points || 0), 0));
    handleCloseDialog();
  };

  // --- Helpers pour le formulaire d'options ---
  const updateOption = (idx, value) => {
    const opts = [...(editingQuestion.options || [])];
    opts[idx] = value;
    setEditingQuestion({ ...editingQuestion, options: opts });
  };
  const addOption = () => {
    setEditingQuestion({ ...editingQuestion, options: [...(editingQuestion.options || []), ''] });
  };
  const removeOption = (idx) => {
    const opts = (editingQuestion.options || []).filter((_, i) => i !== idx);
    setEditingQuestion({ ...editingQuestion, options: opts });
  };
  const updateListItem = (field, idx, value) => {
    const items = [...(editingQuestion[field] || [])];
    items[idx] = value;
    setEditingQuestion({ ...editingQuestion, [field]: items });
  };
  const addListItem = (field) => {
    setEditingQuestion({ ...editingQuestion, [field]: [...(editingQuestion[field] || []), ''] });
  };
  const removeListItem = (field, idx) => {
    setEditingQuestion({ ...editingQuestion, [field]: (editingQuestion[field] || []).filter((_, i) => i !== idx) });
  };

  // ========== RENDU DU FORMULAIRE ADAPTATIF ==========

  const renderTypeSpecificFields = () => {
    if (!editingQuestion) return null;
    const type = editingQuestion.question_type;

    switch (type) {
      case 'qcm_single':
        return (
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Options de réponse (cochez la bonne réponse)</Typography>
            {editingErrors.options && <Alert severity="error" sx={{ mb: 1 }}>{editingErrors.options}</Alert>}
            {editingErrors.correct_answer && <Alert severity="error" sx={{ mb: 1 }}>{editingErrors.correct_answer}</Alert>}
            <RadioGroup
              value={editingQuestion.correct_answer ?? ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: parseInt(e.target.value) })}
            >
              {(editingQuestion.options || []).map((opt, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FormControlLabel value={idx} control={<Radio />} label="" sx={{ mr: 0 }} />
                  <Chip label={String.fromCharCode(65 + idx)} size="small" sx={{ mr: 1 }} />
                  <TextField fullWidth size="small" value={opt} placeholder={`Option ${idx + 1}`}
                    onChange={(e) => updateOption(idx, e.target.value)} />
                  <IconButton size="small" onClick={() => removeOption(idx)} disabled={(editingQuestion.options || []).length <= 2}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </RadioGroup>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addOption} sx={{ mt: 1 }}>
              Ajouter une option
            </Button>
          </Grid>
        );

      case 'qcm_multiple':
        return (
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Options (cochez toutes les bonnes réponses)</Typography>
            {editingErrors.options && <Alert severity="error" sx={{ mb: 1 }}>{editingErrors.options}</Alert>}
            {editingErrors.correct_answer && <Alert severity="error" sx={{ mb: 1 }}>{editingErrors.correct_answer}</Alert>}
            {(editingQuestion.options || []).map((opt, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Checkbox
                  checked={(editingQuestion.correct_answers || []).includes(idx)}
                  onChange={(e) => {
                    const ca = editingQuestion.correct_answers || [];
                    const updated = e.target.checked ? [...ca, idx] : ca.filter(i => i !== idx);
                    setEditingQuestion({ ...editingQuestion, correct_answers: updated });
                  }}
                />
                <Chip label={String.fromCharCode(65 + idx)} size="small" sx={{ mr: 1 }} />
                <TextField fullWidth size="small" value={opt} placeholder={`Option ${idx + 1}`}
                  onChange={(e) => updateOption(idx, e.target.value)} />
                <IconButton size="small" onClick={() => removeOption(idx)} disabled={(editingQuestion.options || []).length <= 2}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addOption} sx={{ mt: 1 }}>
              Ajouter une option
            </Button>
          </Grid>
        );

      case 'true_false':
        return (
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Réponse correcte</Typography>
            <RadioGroup row value={editingQuestion.correct_answer || ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })}>
              <FormControlLabel value="true" control={<Radio />} label="Vrai" />
              <FormControlLabel value="false" control={<Radio />} label="Faux" />
            </RadioGroup>
          </Grid>
        );

      case 'short_answer':
        return (
          <Grid item xs={12}>
            <TextField fullWidth label="Réponse attendue (pour la correction automatique)" size="small"
              value={editingQuestion.correct_answer || ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })}
              helperText="Laissez vide pour correction manuelle" />
          </Grid>
        );

      case 'long_answer':
        return (
          <Grid item xs={12}>
            <TextField fullWidth label="Nombre maximal de mots" type="number" size="small"
              value={editingQuestion.max_words || 500}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, max_words: parseInt(e.target.value) || 500 })}
              inputProps={{ min: 50, max: 10000 }} />
          </Grid>
        );

      case 'numeric':
        return (
          <>
            <Grid item xs={4}>
              <TextField fullWidth label="Réponse correcte" type="number" size="small"
                value={editingQuestion.correct_answer || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Tolérance (±)" type="number" size="small"
                value={editingQuestion.tolerance || 0}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, tolerance: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.1 }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Unité (optionnel)" size="small"
                value={editingQuestion.unit || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, unit: e.target.value })}
                placeholder="Ex: kg, m, €" />
            </Grid>
          </>
        );

      case 'matching':
        return (
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Éléments à associer</Typography>
            {editingErrors.matching && <Alert severity="error" sx={{ mb: 1 }}>{editingErrors.matching}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" fontWeight="bold">Colonne gauche</Typography>
                {(editingQuestion.left_items || []).map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip label={idx + 1} size="small" sx={{ mr: 1 }} />
                    <TextField fullWidth size="small" value={item} placeholder={`Élément ${idx + 1}`}
                      onChange={(e) => updateListItem('left_items', idx, e.target.value)} />
                    <IconButton size="small" onClick={() => removeListItem('left_items', idx)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                ))}
                <Button size="small" startIcon={<AddIcon />} onClick={() => addListItem('left_items')}>Ajouter</Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" fontWeight="bold">Colonne droite</Typography>
                {(editingQuestion.right_items || []).map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip label={String.fromCharCode(65 + idx)} size="small" sx={{ mr: 1 }} />
                    <TextField fullWidth size="small" value={item} placeholder={`Élément ${String.fromCharCode(65 + idx)}`}
                      onChange={(e) => updateListItem('right_items', idx, e.target.value)} />
                    <IconButton size="small" onClick={() => removeListItem('right_items', idx)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                ))}
                <Button size="small" startIcon={<AddIcon />} onClick={() => addListItem('right_items')}>Ajouter</Button>
              </Grid>
            </Grid>
          </Grid>
        );

      case 'ordering':
        return (
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Éléments à ordonner (dans l'ordre correct)
            </Typography>
            <Alert severity="info" sx={{ mb: 1 }}>
              Saisissez les éléments dans le bon ordre. Ils seront mélangés aléatoirement pour l'étudiant.
            </Alert>
            {editingErrors.ordering && <Alert severity="error" sx={{ mb: 1 }}>{editingErrors.ordering}</Alert>}
            {(editingQuestion.items || []).map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip label={idx + 1} size="small" color="primary" sx={{ mr: 1 }} />
                <TextField fullWidth size="small" value={item} placeholder={`Élément ${idx + 1}`}
                  onChange={(e) => updateListItem('items', idx, e.target.value)} />
                <IconButton size="small" onClick={() => removeListItem('items', idx)}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={() => addListItem('items')}>Ajouter un élément</Button>
          </Grid>
        );

      case 'fill_blank':
        return (
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Texte avec trous</Typography>
            <Alert severity="info" sx={{ mb: 1 }}>
              Utilisez {'{{blank_1}}'}, {'{{blank_2}}'}, etc. pour marquer les trous.
              Exemple : "Le HTML est un langage de {'{{blank_1}}'} et non de {'{{blank_2}}'}."
            </Alert>
            {editingErrors.fill_blank && <Alert severity="error" sx={{ mb: 1 }}>{editingErrors.fill_blank}</Alert>}
            <TextField fullWidth multiline rows={3} size="small"
              value={editingQuestion.text_with_blanks || ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, text_with_blanks: e.target.value })}
              placeholder="Le {{blank_1}} est la capitale du {{blank_2}}." />
          </Grid>
        );

      case 'image_question':
        return (
          <>
            <Grid item xs={12}>
              <TextField fullWidth label="URL de l'image" size="small"
                value={editingQuestion.image_url || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, image_url: e.target.value })}
                placeholder="https://..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Légende de l'image (optionnel)" size="small"
                value={editingQuestion.image_caption || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, image_caption: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Type de réponse attendue</InputLabel>
                <Select value={editingQuestion.answer_type || 'short_answer'} label="Type de réponse attendue"
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, answer_type: e.target.value })}>
                  <MenuItem value="qcm_single">QCM unique</MenuItem>
                  <MenuItem value="qcm_multiple">QCM multiple</MenuItem>
                  <MenuItem value="short_answer">Réponse courte</MenuItem>
                  <MenuItem value="long_answer">Réponse longue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {editingQuestion.image_url && (
              <Grid item xs={12}>
                <Box component="img" src={editingQuestion.image_url} alt="Aperçu"
                  sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 1, border: '1px solid #ccc' }} />
              </Grid>
            )}
          </>
        );

      default:
        return null;
    }
  };

  // ========== RENDU PRINCIPAL ==========

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6">Questions de l'examen</Typography>
          {/* Résumé par type */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {Object.entries(typeCounts).map(([type, count]) => (
              <Chip key={type} label={`${getTypeLabel(type)}: ${count}`} size="small"
                color={getTypeColor(type)} variant="outlined" />
            ))}
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            {questions.length} question{questions.length > 1 ? 's' : ''} — Total: {currentTotalPoints}/{totalPoints} pts
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddQuestion}>
            Ajouter une question
          </Button>
        </Box>
      </Box>

      {errors.questions && (
        <Alert severity="error" sx={{ mb: 2 }}>{errors.questions}</Alert>
      )}

      {questions.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">Aucune question ajoutée.</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Un examen peut combiner librement différents types de questions (QCM, Vrai/Faux, dissertation, association, etc.).
          </Typography>
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {questions.map((question, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start" sx={{ pr: 16 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="subtitle1" component="span" fontWeight="bold">
                        Q{question.question_number}.
                      </Typography>
                      <Typography variant="subtitle1" component="span" sx={{ flex: 1 }}>
                        {question.question_text}
                      </Typography>
                      <Chip label={`${question.points} pt${question.points > 1 ? 's' : ''}`}
                        size="small" color="primary" />
                      <Chip label={getTypeLabel(question.question_type)} size="small"
                        color={getTypeColor(question.question_type)} variant="outlined" />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {/* Aperçu des options pour QCM */}
                      {(question.question_type === 'qcm_single' || question.question_type === 'qcm_multiple') && question.options && (
                        <Box>
                          {question.options.filter(Boolean).map((opt, i) => {
                            const isCorrectSingle = question.correct_answer === i;
                            const isCorrectMulti = (question.correct_answers || []).includes(i);
                            const isCorrect = question.question_type === 'qcm_single' ? isCorrectSingle : isCorrectMulti;
                            return (
                              <Typography key={i} variant="body2" component="div"
                                sx={{ color: isCorrect ? 'success.main' : 'text.secondary',
                                      fontWeight: isCorrect ? 'bold' : 'normal' }}>
                                {String.fromCharCode(65 + i)}. {opt} {isCorrect && ' ✓'}
                              </Typography>
                            );
                          })}
                        </Box>
                      )}
                      {question.question_type === 'true_false' && (
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          Réponse : {question.correct_answer === 'true' ? 'Vrai' : question.correct_answer === 'false' ? 'Faux' : '—'}
                        </Typography>
                      )}
                      {question.question_type === 'numeric' && (
                        <Typography variant="body2" color="text.secondary">
                          Réponse : {question.correct_answer || '—'} {question.unit} (±{question.tolerance || 0})
                        </Typography>
                      )}
                      {question.question_type === 'matching' && (
                        <Typography variant="body2" color="text.secondary">
                          {(question.left_items || []).filter(Boolean).length} éléments ↔ {(question.right_items || []).filter(Boolean).length} correspondances
                        </Typography>
                      )}
                      {question.question_type === 'ordering' && (
                        <Typography variant="body2" color="text.secondary">
                          {(question.items || []).filter(Boolean).length} éléments à ordonner
                        </Typography>
                      )}
                      {question.question_type === 'fill_blank' && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {(question.text_with_blanks || '').substring(0, 100)}...
                        </Typography>
                      )}
                      {question.question_type === 'image_question' && question.image_url && (
                        <Box component="img" src={question.image_url} alt="" sx={{ maxHeight: 60, borderRadius: 1, mt: 0.5 }} />
                      )}
                      {(question.question_type === 'long_answer' || question.question_type === 'short_answer') && question.rubric && (
                        <Typography variant="body2" color="text.secondary">
                          Barème : {question.rubric}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title="Monter">
                      <span><IconButton size="small" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton></span>
                    </Tooltip>
                    <Tooltip title="Descendre">
                      <span><IconButton size="small" onClick={() => handleMoveDown(index)} disabled={index === questions.length - 1}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton></span>
                    </Tooltip>
                    <Tooltip title="Dupliquer">
                      <IconButton size="small" onClick={() => handleDuplicate(index)}><CopyIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton size="small" onClick={() => handleEditQuestion(index)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton size="small" color="error" onClick={() => handleDeleteQuestion(index)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {/* ========== DIALOGUE D'ÉDITION ========== */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuestion && questions.some(q => q.question_number === editingQuestion.question_number)
            ? `Modifier la question Q${editingQuestion.question_number}`
            : 'Ajouter une question'
          }
        </DialogTitle>

        <DialogContent dividers>
          {editingQuestion && (
            <Grid container spacing={2}>
              {/* Type de question */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Type de question</InputLabel>
                  <Select value={editingQuestion.question_type} label="Type de question"
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question_type: e.target.value,
                      correct_answer: null,
                      correct_answers: [],
                    })}>
                    {QUESTION_TYPES.map(t => (
                      <MenuItem key={t.value} value={t.value}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{t.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.description}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Points */}
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Points" type="number" size="small"
                  value={editingQuestion.points}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) || 1 })}
                  error={!!editingErrors.points} helperText={editingErrors.points || ''}
                  inputProps={{ min: 1, max: 100 }} required />
              </Grid>

              {/* Texte de la question */}
              <Grid item xs={12}>
                <TextField fullWidth label="Texte de la question" multiline rows={2} size="small"
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                  error={!!editingErrors.question_text} helperText={editingErrors.question_text || ''}
                  required />
              </Grid>

              {/* Champs spécifiques au type */}
              {renderTypeSpecificFields()}

              {/* Explication (tous types) */}
              <Grid item xs={12}>
                <TextField fullWidth label="Explication (affichée après correction, optionnel)"
                  multiline rows={2} size="small"
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })} />
              </Grid>

              {/* Barème pour les réponses ouvertes */}
              {['short_answer', 'long_answer', 'image_question'].includes(editingQuestion.question_type) && (
                <Grid item xs={12}>
                  <TextField fullWidth label="Barème / Critères d'évaluation (optionnel)"
                    multiline rows={2} size="small"
                    value={editingQuestion.rubric || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, rubric: e.target.value })}
                    helperText="Décrivez comment la réponse sera évaluée" />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>Annuler</Button>
          <Button onClick={handleSaveQuestion} variant="contained" color="primary" startIcon={<SaveIcon />}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ExamQuestions;
