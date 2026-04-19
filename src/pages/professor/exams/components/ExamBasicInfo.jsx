import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Grid,
  Paper,
  Alert,
  Button,
  Divider,
  Chip,
  Stack,
  FormControlLabel,
  Switch
} from '@mui/material';
import { formatExamAccessCode } from '@/utils/examSecurityUtils';

/**
 * Composant pour les informations de base d'un examen
 * Gère le titre, la description, le cours associé, le type d'examen et les points
 * 
 * @param {Object} props Les propriétés du composant
 * @param {string} props.title Titre de l'examen
 * @param {Function} props.setTitle Fonction pour mettre à jour le titre
 * @param {string} props.description Description de l'examen
 * @param {Function} props.setDescription Fonction pour mettre à jour la description
 * @param {number|null} props.courseId ID du cours associé
 * @param {Function} props.setCourseId Fonction pour mettre à jour l'ID du cours
 * @param {string} props.examType Type d'examen (midterm, final, quiz)
 * @param {Function} props.setExamType Fonction pour mettre à jour le type d'examen
 * @param {string} props.category Catégorie de l'examen (evaluation, training, mock_exam)
 * @param {Function} props.setCategory Fonction pour mettre à jour la catégorie
 * @param {number|null} props.parentExamId ID de l'examen parent
 * @param {Function} props.setParentExamId Fonction pour mettre à jour l'ID de l'examen parent
 * @param {boolean} props.isPractice Indique si c'est un examen d'entraînement
 * @param {Function} props.setIsPractice Fonction pour mettre à jour l'état d'entraînement
 * @param {number} props.totalPoints Points totaux de l'examen
 * @param {Function} props.setTotalPoints Fonction pour mettre à jour les points totaux
 * @param {number} props.passingGrade Note de passage de l'examen
 * @param {Function} props.setPassingGrade Fonction pour mettre à jour la note de passage
 * @param {Array} props.courses Liste des cours disponibles
 * @param {Array} props.allExams Liste de tous les examens (pour parent)
 * @param {string} props.shareToken Jeton de partage de l'examen
 * @param {Object} props.errors Erreurs de validation du formulaire
 */
const ExamBasicInfo = ({
  title,
  setTitle,
  description,
  setDescription,
  courseId,
  setCourseId,
  examType,
  setExamType,
  category,
  setCategory,
  parentExamId,
  setParentExamId,
  isPractice,
  setIsPractice,
  practiceQuizId,
  setPracticeQuizId,
  totalPoints,
  setTotalPoints,
  passingGrade,
  setPassingGrade,
  filiereId,
  setFiliereId,
  studentGroupId,
  setStudentGroupId,
  promotionId,
  setPromotionId,
  courses,
  allExams,
  practiceQuizzes,
  filieres,
  studentGroups,
  promotions,
  accessCodeRequired,
  setAccessCodeRequired,
  accessCode,
  setAccessCode,
  hasAccessCode,
  allowDirectJoin,
  setAllowDirectJoin,
  maxCheatingAlerts,
  setMaxCheatingAlerts,
  timerMode,
  setTimerMode,
  onGenerateAccessCode,
  shareToken,
  errors
}) => {
  const handleCourseChange = (event) => {
    setCourseId(event.target.value);
  };

  const handleExamTypeChange = (event) => {
    setExamType(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    // If category is training, automatically set isPractice to true
    if (event.target.value === 'training') {
      setIsPractice(true);
    } else {
      setIsPractice(false);
    }
  };

  const handleParentChange = (event) => {
    setParentExamId(event.target.value || null);
  };

  const handlePracticeQuizChange = (event) => {
    setPracticeQuizId(event.target.value || null);
  };

  const handleFiliereChange = (event) => {
    const val = event.target.value || null;
    setFiliereId(val);
    if (val) {
      setStudentGroupId(null);
      setPromotionId(null);
    }
  };

  const handleGroupChange = (event) => {
    const val = event.target.value || null;
    setStudentGroupId(val);
    if (val) {
      setFiliereId(null);
      setPromotionId(null);
    }
  };

  const handlePromotionChange = (event) => {
    const val = event.target.value || null;
    setPromotionId(val);
    if (val) {
      setFiliereId(null);
      setStudentGroupId(null);
    }
  };

  const shareLink = allowDirectJoin && shareToken
    ? `${window.location.origin}/student/exams/join/${shareToken}`
    : null;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Informations de base
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Titre de l'examen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            required
          />
        </Grid>

        {shareLink && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Lien de partage direct pour les étudiants :</strong>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={shareLink}
                  InputProps={{ readOnly: true }}
                />
                <Button 
                  sx={{ ml: 1 }}
                  variant="outlined" 
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                >
                  Copier
                </Button>
              </Box>
            </Alert>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.courseId}>
            <InputLabel>Cours</InputLabel>
            <Select
              value={courseId || ''}
              onChange={handleCourseChange}
              label="Cours"
              required
            >
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </MenuItem>
              ))}
            </Select>
            {errors.courseId && (
              <FormHelperText>{errors.courseId}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.examType}>
            <InputLabel>Type d'examen</InputLabel>
            <Select
              value={examType}
              onChange={handleExamTypeChange}
              label="Type d'examen"
              required
            >
              <MenuItem value="midterm">Mi-semestre</MenuItem>
              <MenuItem value="final">Final</MenuItem>
              <MenuItem value="quiz">Quiz</MenuItem>
              <MenuItem value="project">Projet</MenuItem>
              <MenuItem value="oral">Oral</MenuItem>
              <MenuItem value="practical">Pratique</MenuItem>
            </Select>
            {errors.examType && (
              <FormHelperText>{errors.examType}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={category || 'evaluation'}
              onChange={handleCategoryChange}
              label="Catégorie"
            >
              <MenuItem value="evaluation">Évaluation (Classique)</MenuItem>
              <MenuItem value="training">Entraînement / Exercice</MenuItem>
              <MenuItem value="mock_exam">Examen Blanc</MenuItem>
              <MenuItem value="challenge">Défi / Compétition</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Examen Parent / Précédent</InputLabel>
            <Select
              value={parentExamId || ''}
              onChange={handleParentChange}
              label="Examen Parent / Précédent"
            >
              <MenuItem value=""><em>Aucun</em></MenuItem>
              {allExams.map((ex) => (
                <MenuItem key={ex.id} value={ex.id}>
                  {ex.title} ({new Date(ex.date).toLocaleDateString()})
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Lier à un examen précédent ou relié</FormHelperText>
          </FormControl>
        </Grid>

        {category === 'training' && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Quiz d'entraînement associé</InputLabel>
              <Select
                value={practiceQuizId || ''}
                onChange={handlePracticeQuizChange}
                label="Quiz d'entraînement associé"
              >
                <MenuItem value=""><em>Aucun</em></MenuItem>
                {practiceQuizzes.map((quiz) => (
                  <MenuItem key={quiz.id} value={quiz.id}>
                    {quiz.title} ({quiz.courses?.code})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Lier cet examen à un quiz de la banque d'entraînement</FormHelperText>
            </FormControl>
          </Grid>
        )}
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Points totaux"
            value={totalPoints}
            onChange={(e) => setTotalPoints(Number(e.target.value))}
            error={!!errors.totalPoints}
            helperText={errors.totalPoints}
            required
            inputProps={{ min: 0 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Note de passage"
            value={passingGrade}
            onChange={(e) => setPassingGrade(Number(e.target.value))}
            error={!!errors.passingGrade}
            helperText={errors.passingGrade}
            required
            inputProps={{ min: 0, max: totalPoints }}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Chip label="Sécurité de l'épreuve" size="small" />
          </Divider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(accessCodeRequired)}
                onChange={(event) => setAccessCodeRequired(event.target.checked)}
              />
            )}
            label="Code d'accès requis au démarrage"
          />
          <FormHelperText>
            Le surveillant donne ce code en salle avant le lancement de l'épreuve.
          </FormHelperText>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={(
              <Switch
                checked={Boolean(allowDirectJoin)}
                onChange={(event) => setAllowDirectJoin(event.target.checked)}
              />
            )}
            label="Autoriser l'inscription par lien"
          />
          <FormHelperText>
            Désactivez cette option pour empêcher l'ajout via simple lien partagé.
          </FormHelperText>
        </Grid>

        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            label="Code d'accès surveillant"
            value={formatExamAccessCode(accessCode)}
            onChange={(event) => setAccessCode(event.target.value)}
            error={!!errors.accessCode}
            helperText={
              errors.accessCode ||
              (hasAccessCode
                ? 'Un code est déjà configuré. Saisissez-en un nouveau uniquement pour le remplacer.'
                : 'Code recommandé: 8 caractères alphanumériques.')
            }
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
            <Button variant="outlined" onClick={onGenerateAccessCode}>
              Générer
            </Button>
            {hasAccessCode && (
              <Chip color="success" size="small" label="Code actif" />
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Alertes anti-triche avant arrêt"
            value={maxCheatingAlerts || 3}
            onChange={(event) => setMaxCheatingAlerts(Number(event.target.value) || 1)}
            inputProps={{ min: 1, max: 5 }}
            helperText="À ce seuil, l'épreuve est stoppée puis soumise automatiquement."
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Mode du minuteur</InputLabel>
            <Select
              value={timerMode || 'individual'}
              onChange={(event) => setTimerMode(event.target.value)}
              label="Mode du minuteur"
            >
              <MenuItem value="individual">Individuel par étudiant</MenuItem>
              <MenuItem value="room">Commun à toute la salle</MenuItem>
            </Select>
            <FormHelperText>
              En mode salle, le temps restant est calculé depuis l&apos;heure officielle de l&apos;épreuve pour tout le monde.
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }}>
            <Chip label="Affectation automatique (Optionnel)" size="small" />
          </Divider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Affecter à une Filière</InputLabel>
            <Select
              value={filiereId || ''}
              onChange={handleFiliereChange}
              label="Affecter à une Filière"
            >
              <MenuItem value=""><em>Aucune (Sélection manuelle)</em></MenuItem>
              {filieres.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Tous les étudiants de cette filière seront inscrits</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Affecter à une Classe / Groupe</InputLabel>
            <Select
              value={studentGroupId || ''}
              onChange={handleGroupChange}
              label="Affecter à une Classe / Groupe"
            >
              <MenuItem value=""><em>Aucun (Sélection manuelle)</em></MenuItem>
              {studentGroups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.academic_year} - {g.courses?.code} - Gr. {g.group_letter}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Tous les membres de ce groupe seront inscrits</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Affecter à une Promotion</InputLabel>
            <Select
              value={promotionId || ''}
              onChange={handlePromotionChange}
              label="Affecter à une Promotion"
            >
              <MenuItem value=""><em>Aucune (Sélection manuelle)</em></MenuItem>
              {promotions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Tous les étudiants de cette promotion seront inscrits</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ExamBasicInfo;
