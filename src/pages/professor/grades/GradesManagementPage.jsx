import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  Tooltip, Card, CardContent, Divider, Snackbar, Tabs, Tab,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Publish as PublishIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  Grading as GradingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import {
  getProfessorCourses,
  getStudentsByCourse,
  getGradesByCourse,
  batchUpsertGrades,
  getCourseGradeStats,
  publishGrades
} from '@/api/grades';

/**
 * Données mock pour le développement
 */
const MOCK_COURSES = [
  { id: 'c1', code: 'INFO-345', name: 'Développement Web Frontend', credits: 4, niveaux: { id: 'n1', code: 'L3', name: 'Licence 3', filieres: { id: 'f1', code: 'INFO', name: 'Informatique' } } },
  { id: 'c2', code: 'INFO-221', name: 'Algorithmique Avancée', credits: 3, niveaux: { id: 'n2', code: 'L2', name: 'Licence 2', filieres: { id: 'f1', code: 'INFO', name: 'Informatique' } } },
  { id: 'c3', code: 'INFO-234', name: 'Base de Données Relationnelles', credits: 4, niveaux: { id: 'n2', code: 'L2', name: 'Licence 2', filieres: { id: 'f1', code: 'INFO', name: 'Informatique' } } },
];

const MOCK_STUDENTS = [
  { id: 's1', etudiant: { id: 's1', first_name: 'Kofi', last_name: 'AGBEKO' } },
  { id: 's2', etudiant: { id: 's2', first_name: 'Ama', last_name: 'DOSSEH' } },
  { id: 's3', etudiant: { id: 's3', first_name: 'Yao', last_name: 'KPOMASSE' } },
  { id: 's4', etudiant: { id: 's4', first_name: 'Akossiwa', last_name: 'MENSAH' } },
  { id: 's5', etudiant: { id: 's5', first_name: 'Komi', last_name: 'AMEGAH' } },
  { id: 's6', etudiant: { id: 's6', first_name: 'Edem', last_name: 'TOGBUI' } },
  { id: 's7', etudiant: { id: 's7', first_name: 'Ablavi', last_name: 'SODJI' } },
  { id: 's8', etudiant: { id: 's8', first_name: 'Kodjo', last_name: 'AFANOU' } },
];

const EVALUATION_TYPES = [
  { value: 'cc1', label: 'Contrôle Continu 1' },
  { value: 'cc2', label: 'Contrôle Continu 2' },
  { value: 'cc3', label: 'Contrôle Continu 3' },
  { value: 'tp', label: 'Travaux Pratiques' },
  { value: 'td', label: 'Travaux Dirigés' },
  { value: 'examen', label: 'Examen Final' },
  { value: 'rattrapage', label: 'Rattrapage' },
];

/**
 * Page de gestion des notes pour les professeurs
 * Interface tableur pour la saisie, la revue et la publication des notes
 */
const GradesManagementPage = () => {
  const { authState } = useAuth();

  // États principaux
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [existingGrades, setExistingGrades] = useState([]);
  const [stats, setStats] = useState(null);

  // États UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // États pour les colonnes d'évaluation
  const [evaluationColumns, setEvaluationColumns] = useState([
    { key: 'cc1', label: 'CC1', coefficient: 1, maxNote: 20 },
    { key: 'examen', label: 'Examen Final', coefficient: 2, maxNote: 20 },
  ]);
  const [newColumnDialog, setNewColumnDialog] = useState(false);
  const [newColumnType, setNewColumnType] = useState('');
  const [newColumnCoef, setNewColumnCoef] = useState(1);

  // États pour la publication
  const [publishDialog, setPublishDialog] = useState(false);

  /**
   * Charger les cours du professeur
   */
  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getProfessorCourses(authState.user?.id);
      if (error) throw error;

      if (data && data.length > 0) {
        setCourses(data);
      } else {
        // Utiliser les données mock en développement
        setCourses(MOCK_COURSES);
      }
    } catch (err) {
      console.error('Erreur chargement cours:', err);
      setCourses(MOCK_COURSES);
    } finally {
      setLoading(false);
    }
  }, [authState.user?.id]);

  /**
   * Charger les étudiants et notes existantes pour un cours
   */
  const loadCourseData = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setError(null);

    try {
      // Charger les étudiants
      const { data: studentsData, error: studentsError } = await getStudentsByCourse(courseId);

      let studentsList;
      if (studentsError || !studentsData || studentsData.length === 0) {
        studentsList = MOCK_STUDENTS;
      } else {
        studentsList = studentsData;
      }
      setStudents(studentsList);

      // Charger les notes existantes
      const { data: gradesData, error: gradesError } = await getGradesByCourse(courseId);

      if (!gradesError && gradesData && gradesData.length > 0) {
        setExistingGrades(gradesData);

        // Transformer les notes en format tableur { studentId: { evalType: note } }
        const gradesMap = {};
        gradesData.forEach(g => {
          if (!gradesMap[g.etudiant?.id]) {
            gradesMap[g.etudiant?.id] = {};
          }
          gradesMap[g.etudiant.id][g.type_evaluation] = {
            id: g.id,
            note: g.note,
            commentaire: g.commentaire || ''
          };
        });
        setGrades(gradesMap);

        // Détecter les colonnes d'évaluation existantes
        const existingTypes = [...new Set(gradesData.map(g => g.type_evaluation))];
        const detectedColumns = existingTypes.map(type => {
          const evalType = EVALUATION_TYPES.find(e => e.value === type);
          const sample = gradesData.find(g => g.type_evaluation === type);
          return {
            key: type,
            label: evalType?.label || type,
            coefficient: sample?.coefficient || 1,
            maxNote: 20
          };
        });
        if (detectedColumns.length > 0) {
          setEvaluationColumns(detectedColumns);
        }
      } else {
        setGrades({});
        setExistingGrades([]);
      }

      // Charger les statistiques
      const { data: statsData } = await getCourseGradeStats(courseId);
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Erreur chargement données du cours:', err);
      setStudents(MOCK_STUDENTS);
      setGrades({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseData(selectedCourse);
    }
  }, [selectedCourse, loadCourseData]);

  /**
   * Mettre à jour une note dans le tableur
   */
  const handleGradeChange = (studentId, evalKey, value) => {
    const numValue = value === '' ? '' : parseFloat(value);
    if (numValue !== '' && (isNaN(numValue) || numValue < 0 || numValue > 20)) return;

    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [evalKey]: {
          ...prev[studentId]?.[evalKey],
          note: numValue
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  /**
   * Mettre à jour le commentaire d'un étudiant
   */
  const handleCommentChange = (studentId, evalKey, comment) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [evalKey]: {
          ...prev[studentId]?.[evalKey],
          commentaire: comment
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  /**
   * Calculer la moyenne pondérée d'un étudiant
   */
  const calculateAverage = (studentId) => {
    const studentGrades = grades[studentId];
    if (!studentGrades) return null;

    let totalWeighted = 0;
    let totalCoef = 0;

    evaluationColumns.forEach(col => {
      const gradeData = studentGrades[col.key];
      if (gradeData && gradeData.note !== '' && gradeData.note !== undefined) {
        totalWeighted += gradeData.note * col.coefficient;
        totalCoef += col.coefficient;
      }
    });

    if (totalCoef === 0) return null;
    return Math.round((totalWeighted / totalCoef) * 100) / 100;
  };

  /**
   * Obtenir la mention selon la moyenne
   */
  const getMention = (average) => {
    if (average === null) return { label: '-', color: 'default' };
    if (average >= 16) return { label: 'Très Bien', color: 'success' };
    if (average >= 14) return { label: 'Bien', color: 'info' };
    if (average >= 12) return { label: 'Assez Bien', color: 'primary' };
    if (average >= 10) return { label: 'Passable', color: 'warning' };
    return { label: 'Insuffisant', color: 'error' };
  };

  /**
   * Ajouter une colonne d'évaluation
   */
  const handleAddColumn = () => {
    if (!newColumnType) return;
    const evalType = EVALUATION_TYPES.find(e => e.value === newColumnType);
    if (!evalType) return;

    // Vérifier si la colonne existe déjà
    if (evaluationColumns.find(c => c.key === newColumnType)) {
      setError('Ce type d\'évaluation existe déjà.');
      return;
    }

    setEvaluationColumns(prev => [
      ...prev,
      { key: newColumnType, label: evalType.label, coefficient: newColumnCoef, maxNote: 20 }
    ]);
    setNewColumnDialog(false);
    setNewColumnType('');
    setNewColumnCoef(1);
  };

  /**
   * Supprimer une colonne d'évaluation
   */
  const handleRemoveColumn = (key) => {
    setEvaluationColumns(prev => prev.filter(c => c.key !== key));
    // Supprimer les notes associées
    setGrades(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(studentId => {
        if (updated[studentId]?.[key]) {
          delete updated[studentId][key];
        }
      });
      return updated;
    });
  };

  /**
   * Sauvegarder les notes (brouillon)
   */
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const gradesToSave = [];

      students.forEach(({ etudiant }) => {
        evaluationColumns.forEach(col => {
          const gradeData = grades[etudiant.id]?.[col.key];
          if (gradeData && gradeData.note !== '' && gradeData.note !== undefined) {
            gradesToSave.push({
              ...(gradeData.id ? { id: gradeData.id } : {}),
              etudiant_id: etudiant.id,
              cours_id: selectedCourse,
              type_evaluation: col.key,
              note: gradeData.note,
              coefficient: col.coefficient,
              commentaire: gradeData.commentaire || null,
              date_evaluation: new Date().toISOString().split('T')[0],
              professeur_id: authState.user?.id
            });
          }
        });
      });

      if (gradesToSave.length === 0) {
        setError('Aucune note à sauvegarder.');
        setSaving(false);
        return false;
      }

      const { error: saveError } = await batchUpsertGrades(gradesToSave);
      if (saveError) throw saveError;

      setSuccessMessage(`${gradesToSave.length} note(s) sauvegardée(s) avec succès.`);
      setHasUnsavedChanges(false);

      // Recharger les données
      await loadCourseData(selectedCourse);
      return true;
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError('Erreur lors de la sauvegarde des notes: ' + (err.message || 'Erreur inconnue'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Publier les notes déjà sauvegardées.
   */
  const handlePublish = async () => {
    setPublishing(true);
    setError(null);

    try {
      const evaluationKeys = evaluationColumns.map((column) => column.key);
      const { error: publishError } = await publishGrades(
        selectedCourse,
        evaluationKeys,
        authState.profile?.id || authState.user?.id
      );

      if (publishError) throw publishError;

      setSuccessMessage('Notes publiées avec succès. Les étudiants concernés ont été notifiés.');
      await loadCourseData(selectedCourse);
    } catch (err) {
      console.error('Erreur publication notes:', err);
      setError('Erreur lors de la publication des notes: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setPublishing(false);
    }
  };

  /**
   * Exporter les notes en CSV
   */
  const handleExportCSV = () => {
    const course = courses.find(c => c.id === selectedCourse);
    const headers = ['Nom', 'Prénom', ...evaluationColumns.map(c => `${c.label} (Coef ${c.coefficient})`), 'Moyenne', 'Mention'];

    const rows = students.map(({ etudiant }) => {
      const avg = calculateAverage(etudiant.id);
      const mention = getMention(avg);
      return [
        etudiant.last_name,
        etudiant.first_name,
        ...evaluationColumns.map(col => grades[etudiant.id]?.[col.key]?.note ?? ''),
        avg !== null ? avg.toFixed(2) : '',
        mention.label
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_${course?.code || 'cours'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Importer des notes depuis un fichier CSV
   */
  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          setError('Le fichier CSV est vide ou mal formaté.');
          return;
        }

        // Ignorer la première ligne (headers)
        const dataLines = lines.slice(1);
        let importedCount = 0;

        dataLines.forEach(line => {
          const cols = line.split(';').map(c => c.trim());
          if (cols.length < 3) return;

          const lastName = cols[0];
          const firstName = cols[1];

          // Trouver l'étudiant correspondant
          const student = students.find(s =>
            s.etudiant.last_name.toLowerCase() === lastName.toLowerCase() &&
            s.etudiant.first_name.toLowerCase() === firstName.toLowerCase()
          );

          if (student) {
            evaluationColumns.forEach((col, idx) => {
              const value = parseFloat(cols[idx + 2]);
              if (!isNaN(value) && value >= 0 && value <= 20) {
                handleGradeChange(student.etudiant.id, col.key, value);
                importedCount++;
              }
            });
          }
        });

        setSuccessMessage(`${importedCount} note(s) importée(s) depuis le fichier CSV.`);
      } catch (err) {
        setError('Erreur lors de l\'import du fichier CSV.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  /**
   * Rendu du tableau de saisie des notes
   */
  const renderGradesTable = () => (
    <TableContainer component={Paper} elevation={2} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', minWidth: 50, bgcolor: '#003366', color: 'white', position: 'sticky', left: 0, zIndex: 3 }}>
              #
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', minWidth: 200, bgcolor: '#003366', color: 'white', position: 'sticky', left: 50, zIndex: 3 }}>
              Étudiant
            </TableCell>
            {evaluationColumns.map(col => (
              <TableCell
                key={col.key}
                align="center"
                sx={{ fontWeight: 'bold', minWidth: 120, bgcolor: '#003366', color: 'white' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  {col.label}
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    (×{col.coefficient})
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveColumn(col.key)}
                    sx={{ color: 'rgba(255,255,255,0.7)', p: 0.25 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 100, bgcolor: '#003366', color: 'white' }}>
              Moyenne
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 120, bgcolor: '#003366', color: 'white' }}>
              Mention
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map(({ etudiant }, index) => {
            const avg = calculateAverage(etudiant.id);
            const mention = getMention(avg);

            return (
              <TableRow
                key={etudiant.id}
                hover
                sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}
              >
                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'inherit', zIndex: 1 }}>
                  {index + 1}
                </TableCell>
                <TableCell sx={{ position: 'sticky', left: 50, bgcolor: 'inherit', zIndex: 1, fontWeight: 500 }}>
                  {etudiant.last_name} {etudiant.first_name}
                </TableCell>
                {evaluationColumns.map(col => (
                  <TableCell key={col.key} align="center" sx={{ p: 0.5 }}>
                    <TextField
                      type="number"
                      size="small"
                      variant="outlined"
                      value={grades[etudiant.id]?.[col.key]?.note ?? ''}
                      onChange={(e) => handleGradeChange(etudiant.id, col.key, e.target.value)}
                      inputProps={{ min: 0, max: 20, step: 0.25, style: { textAlign: 'center', padding: '6px 8px' } }}
                      sx={{
                        width: 80,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'grey.300' },
                          '&:hover fieldset': { borderColor: 'primary.main' },
                        }
                      }}
                    />
                  </TableCell>
                ))}
                <TableCell align="center">
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={avg !== null && avg < 10 ? 'error.main' : 'success.main'}
                  >
                    {avg !== null ? `${avg.toFixed(2)}/20` : '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={mention.label}
                    color={mention.color}
                    size="small"
                    variant={mention.label === '-' ? 'outlined' : 'filled'}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  /**
   * Rendu des statistiques de la promotion
   */
  const renderStats = () => {
    // Calculer les stats locales à partir des notes saisies
    const averages = students
      .map(s => calculateAverage(s.etudiant.id))
      .filter(a => a !== null);

    if (averages.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucune note saisie pour le moment. Les statistiques apparaîtront après la saisie.
        </Alert>
      );
    }

    const classAvg = averages.reduce((a, b) => a + b, 0) / averages.length;
    const classMin = Math.min(...averages);
    const classMax = Math.max(...averages);
    const passCount = averages.filter(a => a >= 10).length;
    const passRate = Math.round((passCount / averages.length) * 100);

    const distribution = {
      'Très Bien (≥16)': averages.filter(a => a >= 16).length,
      'Bien (14-16)': averages.filter(a => a >= 14 && a < 16).length,
      'Assez Bien (12-14)': averages.filter(a => a >= 12 && a < 14).length,
      'Passable (10-12)': averages.filter(a => a >= 10 && a < 12).length,
      'Insuffisant (<10)': averages.filter(a => a < 10).length,
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Moyenne de classe</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  {classAvg.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Taux de réussite</Typography>
                <Typography variant="h5" fontWeight="bold" color={passRate >= 50 ? 'success.main' : 'error.main'}>
                  {passRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Note min</Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  {classMin.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Note max</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {classMax.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Distribution des mentions */}
        <Paper elevation={2} sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Répartition par mention
          </Typography>
          {Object.entries(distribution).map(([label, count]) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ minWidth: 160 }}>{label}</Typography>
              <Box sx={{ flexGrow: 1, mx: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={averages.length > 0 ? (count / averages.length) * 100 : 0}
                  sx={{ height: 12, borderRadius: 6 }}
                />
              </Box>
              <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 60, textAlign: 'right' }}>
                {count} ({averages.length > 0 ? Math.round((count / averages.length) * 100) : 0}%)
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>
    );
  };

  // Écran de chargement initial
  if (loading && courses.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <GradingIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">
          Gestion des Notes
        </Typography>
      </Box>

      {/* Sélection du cours */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Sélectionner un cours</InputLabel>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                label="Sélectionner un cours"
              >
                {courses.map(course => (
                  <MenuItem key={course.id} value={course.id}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">{course.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {course.code} — {course.niveaux?.name} {course.niveaux?.filieres?.name} — {course.credits} crédits
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            {selectedCourseData && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`${students.length} étudiants`} color="primary" variant="outlined" />
                <Chip label={`${evaluationColumns.length} évaluations`} color="secondary" variant="outlined" />
                {hasUnsavedChanges && (
                  <Chip icon={<WarningIcon />} label="Modifications non sauvegardées" color="warning" />
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />

      {/* Contenu principal */}
      {selectedCourse && (
        <>
          {/* Onglets */}
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab icon={<EditIcon />} label="Saisie des notes" iconPosition="start" />
            <Tab icon={<AssessmentIcon />} label="Statistiques" iconPosition="start" />
          </Tabs>

          {/* Onglet Saisie */}
          {tabValue === 0 && (
            <>
              {/* Barre d'outils */}
              <Paper elevation={1} sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setNewColumnDialog(true)}
                >
                  Ajouter une évaluation
                </Button>
                <Divider orientation="vertical" flexItem />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || !hasUnsavedChanges}
                  color="primary"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PublishIcon />}
                  onClick={() => setPublishDialog(true)}
                  color="success"
                  disabled={hasUnsavedChanges || saving || publishing || students.length === 0}
                >
                  {publishing ? 'Publication...' : 'Publier les notes'}
                </Button>
                <Divider orientation="vertical" flexItem />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCSV}
                >
                  Exporter CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  component="label"
                >
                  Importer CSV
                  <input type="file" accept=".csv" hidden onChange={handleImportCSV} />
                </Button>
              </Paper>

              {/* Tableau des notes */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : students.length === 0 ? (
                <Alert severity="info">Aucun étudiant inscrit pour ce cours.</Alert>
              ) : (
                renderGradesTable()
              )}
            </>
          )}

          {/* Onglet Statistiques */}
          {tabValue === 1 && renderStats()}
        </>
      )}

      {!selectedCourse && (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <GradingIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Sélectionnez un cours pour commencer la saisie des notes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Vous pouvez saisir les notes de contrôle continu, d'examen final et calculer les moyennes automatiquement.
          </Typography>
        </Paper>
      )}

      {/* Dialog: Ajouter une colonne d'évaluation */}
      <Dialog open={newColumnDialog} onClose={() => setNewColumnDialog(false)}>
        <DialogTitle>Ajouter une évaluation</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Type d'évaluation</InputLabel>
            <Select
              value={newColumnType}
              onChange={(e) => setNewColumnType(e.target.value)}
              label="Type d'évaluation"
            >
              {EVALUATION_TYPES
                .filter(t => !evaluationColumns.find(c => c.key === t.value))
                .map(type => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Coefficient"
            type="number"
            fullWidth
            sx={{ mt: 2 }}
            value={newColumnCoef}
            onChange={(e) => setNewColumnCoef(parseFloat(e.target.value) || 1)}
            inputProps={{ min: 0.5, max: 10, step: 0.5 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewColumnDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddColumn} disabled={!newColumnType}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Confirmation de publication */}
      <Dialog open={publishDialog} onClose={() => setPublishDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PublishIcon color="warning" />
          Publier les notes
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>Attention :</strong> La publication des notes les rend visibles par tous les étudiants concernés.
            Cette action est <strong>irréversible</strong> sauf correction administrative.
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Cours :</strong> {selectedCourseData?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Étudiants :</strong> {students.length}
            </Typography>
            <Typography variant="body2">
              <strong>Évaluations :</strong> {evaluationColumns.map(c => c.label).join(', ')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            color="success"
            onClick={async () => {
              setPublishDialog(false);
              await handlePublish();
            }}
            disabled={publishing}
          >
            {publishing ? 'Publication...' : 'Confirmer la publication'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GradesManagementPage;
