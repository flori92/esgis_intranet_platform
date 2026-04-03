import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Divider,
  Snackbar, Tabs, Tab, Card, CardContent, Radio, RadioGroup, FormControlLabel,
  Checkbox, FormGroup, Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  QuestionAnswer as QuestionIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';

const QUESTION_TYPES = [
  { value: 'qcm_single', label: 'QCM unique' },
  { value: 'qcm_multiple', label: 'QCM multiple' },
  { value: 'true_false', label: 'Vrai/Faux' },
  { value: 'short_answer', label: 'Réponse courte' },
  { value: 'long_answer', label: 'Dissertation' },
  { value: 'numeric', label: 'Numérique' },
  { value: 'matching', label: 'Association' },
  { value: 'ordering', label: 'Ordonnancement' },
  { value: 'fill_blank', label: 'Texte à trous' },
  { value: 'image_question', label: 'Question sur image' },
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Facile', color: 'success' },
  { value: 'medium', label: 'Moyen', color: 'warning' },
  { value: 'hard', label: 'Difficile', color: 'error' },
];

const MOCK_QUESTIONS = [
  { id: 'q1', text: 'Quel est le protocole utilisé pour le transfert de fichiers sur Internet ?', type: 'qcm_single', difficulty: 'easy', matiere: 'Réseaux', theme: 'Protocoles', options: ['HTTP', 'FTP', 'SMTP', 'DNS'], correct_answer: '1', points: 2, used_count: 5, created_at: '2026-01-15' },
  { id: 'q2', text: 'Parmi les éléments suivants, lesquels sont des langages de programmation orientés objet ?', type: 'qcm_multiple', difficulty: 'medium', matiere: 'Programmation', theme: 'POO', options: ['Java', 'C', 'Python', 'HTML'], correct_answer: ['0', '2'], points: 3, used_count: 3, created_at: '2026-02-10' },
  { id: 'q3', text: 'Le HTML est un langage de programmation.', type: 'true_false', difficulty: 'easy', matiere: 'Développement Web', theme: 'Bases', correct_answer: 'false', points: 1, used_count: 8, created_at: '2026-01-20' },
  { id: 'q4', text: 'Expliquez le principe SOLID en programmation orientée objet.', type: 'long_answer', difficulty: 'hard', matiere: 'Programmation', theme: 'Design Patterns', points: 10, used_count: 2, created_at: '2026-03-05' },
  { id: 'q5', text: 'Quelle est la complexité temporelle du tri rapide (quicksort) dans le pire cas ?', type: 'short_answer', difficulty: 'medium', matiere: 'Algorithmique', theme: 'Tri', correct_answer: 'O(n²)', points: 2, used_count: 4, created_at: '2026-02-28' },
  { id: 'q6', text: 'Calculez le résultat de 2^10.', type: 'numeric', difficulty: 'easy', matiere: 'Mathématiques', theme: 'Puissances', correct_answer: '1024', tolerance: 0, points: 1, used_count: 6, created_at: '2026-01-10' },
];

/**
 * Page Banque de Questions — ESGIS Campus §4.7
 */
const QuestionBankPage = () => {
  const { authState } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filtres
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    text: '', type: 'qcm_single', difficulty: 'medium', matiere: '',
    theme: '', options: ['', '', '', ''], correct_answer: '', points: 2,
    explanation: '', tolerance: 0, max_words: 500
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null);

  // Onglets: Personnel / Partagé
  const [tabValue, setTabValue] = useState(0);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('question_bank')
        .select('*')
        .eq('professeur_id', authState.user?.id)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setQuestions(MOCK_QUESTIONS);
      } else {
        setQuestions(data);
      }
    } catch {
      setQuestions(MOCK_QUESTIONS);
    } finally {
      setLoading(false);
    }
  }, [authState.user?.id]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Filtrage
  useEffect(() => {
    let result = [...questions];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(q => q.text?.toLowerCase().includes(s) || q.theme?.toLowerCase().includes(s));
    }
    if (filterType) result = result.filter(q => q.type === filterType);
    if (filterDifficulty) result = result.filter(q => q.difficulty === filterDifficulty);
    if (filterMatiere) result = result.filter(q => q.matiere === filterMatiere);
    setFilteredQuestions(result);
    setPage(1);
  }, [questions, search, filterType, filterDifficulty, filterMatiere]);

  const paginatedQuestions = filteredQuestions.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filteredQuestions.length / perPage);
  const uniqueMatieres = [...new Set(questions.map(q => q.matiere).filter(Boolean))];

  const handleOpenEdit = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        text: question.text || '', type: question.type || 'qcm_single',
        difficulty: question.difficulty || 'medium', matiere: question.matiere || '',
        theme: question.theme || '',
        options: question.options || ['', '', '', ''],
        correct_answer: Array.isArray(question.correct_answer) ? question.correct_answer.join(',') : (question.correct_answer || ''),
        points: question.points || 2, explanation: question.explanation || '',
        tolerance: question.tolerance || 0, max_words: question.max_words || 500
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        text: '', type: 'qcm_single', difficulty: 'medium', matiere: '',
        theme: '', options: ['', '', '', ''], correct_answer: '', points: 2,
        explanation: '', tolerance: 0, max_words: 500
      });
    }
    setEditDialog(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.text) { setError('Le texte de la question est obligatoire.'); return; }
    setSaving(true);
    try {
      const qData = {
        ...questionForm,
        professeur_id: authState.user?.id,
        updated_at: new Date().toISOString(),
      };
      if (editingQuestion) {
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...qData } : q));
        setSuccessMessage('Question mise à jour.');
      } else {
        const newQ = { id: `q${Date.now()}`, ...qData, used_count: 0, created_at: new Date().toISOString() };
        setQuestions(prev => [newQ, ...prev]);
        setSuccessMessage('Question créée.');
      }
      setEditDialog(false);
    } catch (err) {
      setError('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = (question) => {
    const copy = { ...question, id: `q${Date.now()}`, text: `[Copie] ${question.text}`, used_count: 0, created_at: new Date().toISOString() };
    setQuestions(prev => [copy, ...prev]);
    setSuccessMessage('Question dupliquée.');
  };

  const handleDelete = (question) => {
    setQuestions(prev => prev.filter(q => q.id !== question.id));
    setDeleteDialog(null);
    setSuccessMessage('Question supprimée.');
  };

  const handleOptionChange = (idx, value) => {
    setQuestionForm(prev => {
      const newOpts = [...prev.options];
      newOpts[idx] = value;
      return { ...prev, options: newOpts };
    });
  };

  const addOption = () => {
    setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (idx) => {
    setQuestionForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  // Stats
  const stats = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <QuestionIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">Banque de Questions</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenEdit()}>
          Nouvelle question
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total', value: stats.total, color: 'primary' },
          { label: 'Facile', value: stats.easy, color: 'success' },
          { label: 'Moyen', value: stats.medium, color: 'warning' },
          { label: 'Difficile', value: stats.hard, color: 'error' },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card elevation={1}><CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h4" fontWeight="bold" color={`${s.color}.main`}>{s.value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Ma banque personnelle" />
        <Tab label="Banque commune (établissement)" />
      </Tabs>

      {/* Filtres */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField size="small" fullWidth placeholder="Rechercher..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.400' }} /> }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
                <MenuItem value="">Tous</MenuItem>
                {QUESTION_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Difficulté</InputLabel>
              <Select value={filterDifficulty} label="Difficulté" onChange={(e) => setFilterDifficulty(e.target.value)}>
                <MenuItem value="">Toutes</MenuItem>
                {DIFFICULTY_LEVELS.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Matière</InputLabel>
              <Select value={filterMatiere} label="Matière" onChange={(e) => setFilterMatiere(e.target.value)}>
                <MenuItem value="">Toutes</MenuItem>
                {uniqueMatieres.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau */}
      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#003366' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Question</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Matière</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Difficulté</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Pts</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Utilisée</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedQuestions.map((q) => {
              const typeLabel = QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type;
              const diffLevel = DIFFICULTY_LEVELS.find(d => d.value === q.difficulty);
              return (
                <TableRow key={q.id} hover>
                  <TableCell sx={{ maxWidth: 350 }}>
                    <Typography variant="body2" noWrap>{q.text}</Typography>
                    {q.theme && <Chip label={q.theme} size="small" variant="outlined" sx={{ mt: 0.5 }} />}
                  </TableCell>
                  <TableCell><Chip label={typeLabel} size="small" color="info" variant="outlined" /></TableCell>
                  <TableCell><Typography variant="body2">{q.matiere}</Typography></TableCell>
                  <TableCell>
                    <Chip label={diffLevel?.label || q.difficulty} size="small" color={diffLevel?.color || 'default'} />
                  </TableCell>
                  <TableCell align="center"><Typography variant="body2" fontWeight="bold">{q.points}</Typography></TableCell>
                  <TableCell align="center"><Chip label={`${q.used_count || 0}×`} size="small" variant="outlined" /></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Modifier"><IconButton size="small" onClick={() => handleOpenEdit(q)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Dupliquer"><IconButton size="small" onClick={() => handleDuplicate(q)}><CopyIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setDeleteDialog(q)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedQuestions.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Aucune question trouvée</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {/* Dialog Création/Édition */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingQuestion ? 'Modifier la question' : 'Nouvelle question'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField label="Texte de la question *" fullWidth multiline rows={2} value={questionForm.text}
                onChange={(e) => setQuestionForm(p => ({ ...p, text: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={questionForm.type} label="Type"
                  onChange={(e) => setQuestionForm(p => ({ ...p, type: e.target.value }))}>
                  {QUESTION_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulté</InputLabel>
                <Select value={questionForm.difficulty} label="Difficulté"
                  onChange={(e) => setQuestionForm(p => ({ ...p, difficulty: e.target.value }))}>
                  {DIFFICULTY_LEVELS.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField label="Points" type="number" fullWidth size="small" value={questionForm.points}
                onChange={(e) => setQuestionForm(p => ({ ...p, points: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1, max: 100 }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Matière" fullWidth size="small" value={questionForm.matiere}
                onChange={(e) => setQuestionForm(p => ({ ...p, matiere: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Thème" fullWidth size="small" value={questionForm.theme}
                onChange={(e) => setQuestionForm(p => ({ ...p, theme: e.target.value }))} />
            </Grid>

            {/* Options pour QCM */}
            {['qcm_single', 'qcm_multiple', 'image_question'].includes(questionForm.type) && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Options de réponse</Typography>
                {questionForm.options.map((opt, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={String.fromCharCode(65 + idx)} size="small" />
                    <TextField size="small" fullWidth value={opt} placeholder={`Option ${idx + 1}`}
                      onChange={(e) => handleOptionChange(idx, e.target.value)} />
                    {questionForm.options.length > 2 && (
                      <IconButton size="small" onClick={() => removeOption(idx)}><DeleteIcon fontSize="small" /></IconButton>
                    )}
                  </Box>
                ))}
                <Button size="small" startIcon={<AddIcon />} onClick={addOption}>Ajouter une option</Button>
              </Grid>
            )}

            {/* Réponse correcte */}
            <Grid item xs={12}>
              <TextField label="Réponse correcte" fullWidth size="small" value={questionForm.correct_answer}
                onChange={(e) => setQuestionForm(p => ({ ...p, correct_answer: e.target.value }))}
                helperText={questionForm.type === 'qcm_single' ? 'Index de la bonne réponse (0, 1, 2...)' :
                  questionForm.type === 'qcm_multiple' ? 'Index séparés par des virgules (0,2)' :
                  questionForm.type === 'true_false' ? 'true ou false' : 'Texte de la réponse attendue'} />
            </Grid>

            <Grid item xs={12}>
              <TextField label="Explication (affichée après correction)" fullWidth multiline rows={2}
                size="small" value={questionForm.explanation}
                onChange={(e) => setQuestionForm(p => ({ ...p, explanation: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Annuler</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveQuestion} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation suppression */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Supprimer la question</DialogTitle>
        <DialogContent>
          <Typography>Supprimer « {deleteDialog?.text?.substring(0, 80)}... » ?</Typography>
          {deleteDialog?.used_count > 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Cette question a été utilisée {deleteDialog.used_count} fois dans des examens.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={() => handleDelete(deleteDialog)}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionBankPage;
