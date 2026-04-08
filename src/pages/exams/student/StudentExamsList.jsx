import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  Room as RoomIcon,
  School as SchoolIcon,
  PlayArrow as PlayArrowIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStudentExamsListData } from '@/api/exams';

/**
 * @typedef {Object} ExamData
 * @property {number} id - ID de l'examen
 * @property {string} title - Titre de l'examen
 * @property {number} course_id - ID du cours associé (optionnel)
 * @property {string} date - Date de l'examen
 * @property {number} duration - Durée de l'examen en minutes
 * @property {string} type - Type d'examen (quiz, partiel, etc.)
 * @property {string} room - Salle ou lieu de l'examen
 * @property {number} total_points - Nombre total de points possibles
 * @property {number} passing_grade - Nombre de points requis pour réussir
 * @property {string} status - Statut de l'examen
 * @property {string} description - Description de l'examen
 * @property {Object} [courses] - Informations du cours associé (optionnel)
 */

/**
 * @typedef {Object} StudentExam
 * @property {number} id - Identifiant de l'inscription à l'examen
 * @property {number} exam_id - Identifiant de l'examen
 * @property {number} student_id - Identifiant de l'étudiant
 * @property {string|null} seat_number - Numéro de place assigné
 * @property {'present'|'absent'|'late'|null} attendance_status - Statut de présence
 * @property {'not_started'|'in_progress'|'submitted'|null} attempt_status - Statut de la tentative
 * @property {string} created_at - Date de création
 * @property {string|null} updated_at - Date de mise à jour
 */

/**
 * @typedef {Object} Exam
 * @property {number} id - Identifiant de l'examen
 * @property {string} title - Titre de l'examen
 * @property {number} course_id - Identifiant du cours
 * @property {number} professor_id - Identifiant du professeur
 * @property {string} date - Date de l'examen
 * @property {number} duration - Durée en minutes
 * @property {string} type - Type d'examen (midterm, final, etc.)
 * @property {string} room - Salle d'examen
 * @property {number} total_points - Points totaux
 * @property {number} passing_grade - Note de passage
 * @property {string} status - Statut de l'examen
 * @property {string|null} description - Description de l'examen
 */

const StudentExamsList = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  /**
   * Type personnalisé pour les examens d'un étudiant
   * @type {React.MutableRefObject<() => Promise<void>>}
   */
  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!authState.user?.id) {
        throw new Error('Données d\'utilisateur non disponibles');
      }
      
      const { data: mappedExams, error: fetchError } = await getStudentExamsListData(authState.user.id);

      if (fetchError) {
        throw fetchError;
      }

      setExams(mappedExams || []);
      setFilteredExams(mappedExams || []);
    } catch (error) {
      console.error(`SUPABASE_EXAMS_ERROR: ${error?.message || 'Erreur inconnue'}`);
      setError(error);
    } finally {
      setLoading(false);
    }
  });

  // Effet pour charger les données au montage
  useEffect(() => {
    fetchDataRef.current();
  }, []);

  // Effet pour filtrer les examens lors du changement d'onglet
  useEffect(() => {
    if (exams.length === 0) {
      setFilteredExams([]);
      return;
    }

    const now = new Date();
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let nextExams = [...exams];

    if (tabValue === 0) {
      nextExams = nextExams.filter((exam) => new Date(exam.date) >= now && exam.attempt_status !== 'submitted');
    } else if (tabValue === 1) {
      nextExams = nextExams.filter((exam) => new Date(exam.date) < now || exam.attempt_status === 'submitted');
    }
    // tabValue === 2 (Tous) : no filtering by date

    if (normalizedSearch) {
      nextExams = nextExams.filter((exam) => {
        return (
          String(exam.title || '').toLowerCase().includes(normalizedSearch) ||
          String(exam.course_code || '').toLowerCase().includes(normalizedSearch) ||
          String(exam.course_name || '').toLowerCase().includes(normalizedSearch) ||
          String(exam.professor_name || '').toLowerCase().includes(normalizedSearch)
        );
      });
    }

    setFilteredExams(nextExams);
  }, [tabValue, exams, searchTerm]);

  // Gestionnaire de recherche
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Gestionnaire pour afficher les détails d'un examen
  const handleViewExam = (exam) => {
    if (
      exam.attempt_status === 'submitted' ||
      ['passed', 'failed'].includes(exam.result_status) ||
      exam.grade !== null
    ) {
      navigate(`/student/exams/${exam.exam_id}/results`);
      return;
    }

    navigate(`/student/exams/${exam.exam_id}/take`);
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'PPP à HH:mm', { locale: fr });
    } catch (error) {
      return 'Date non disponible';
    }
  };

  // Rendu d'un examen
  const renderExam = (exam) => {
    const isImmediateAccessExam = ['training', 'mock_exam'].includes(exam.category);
    const isPast = new Date(exam?.date || new Date().toISOString()) < new Date();
    const isSubmitted = exam.attempt_status === 'submitted' || ['passed', 'failed'].includes(exam.result_status) || exam.grade !== null;
    const canStart = ['published', 'in_progress'].includes(exam.status) && !isSubmitted;
    const canLaunchNow = canStart && (isImmediateAccessExam || !isPast);
    const statusColor = isSubmitted ? 'primary' : isImmediateAccessExam ? 'success' : isPast ? 'error' : 'success';
    const statusText = isSubmitted ? 'Soumis' : isImmediateAccessExam ? 'Disponible' : isPast ? 'Passé' : 'À venir';

    // Libellé de catégorie
    const categoryLabels = {
      evaluation: 'Évaluation',
      training: 'Entraînement',
      mock_exam: 'Examen Blanc',
      challenge: 'Défi'
    };
    const categoryLabel = categoryLabels[exam.category] || 'Évaluation';
    const categoryColor = exam.category === 'training' ? 'info' : 'secondary';

    return (
      <Card key={exam.id} sx={{ mb: 2, position: 'relative' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" component="div">
                  {exam?.title || 'Examen sans titre'}
                </Typography>
                <Chip label={categoryLabel} size="small" color={categoryColor} variant="outlined" />
              </Box>
              {exam.parent_exam_title && (
                <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                  Relié à : {exam.parent_exam_title}
                </Typography>
              )}
              <Typography color="text.secondary" gutterBottom>
                <SchoolIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                {exam?.course_name || 'Cours inconnu'} ({exam.course_code})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <EventIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                {formatDate(exam?.date || new Date().toISOString())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Durée: {exam.duration} minutes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <RoomIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Salle: {exam.room}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Chip 
                label={statusText} 
                color={statusColor} 
                size="small" 
                sx={{ mb: 1 }} 
              />
              <Typography variant="body2">
                Place: {exam.seat_number || 'Non assignée'}
              </Typography>
              <Typography variant="body2">
                Note de passage: {exam.passing_grade}/{exam.total_points}
              </Typography>
            </Grid>
          </Grid>
          {exam.description && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                <DescriptionIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                {exam.description}
              </Typography>
            </>
          )}
        </CardContent>
        <CardActions>
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<AssignmentIcon />}
            onClick={() => handleViewExam(exam)}
          >
            Détails
          </Button>
          {canStart && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              disabled={!canLaunchNow}
              onClick={() => handleViewExam(exam)}
            >
              {exam.attempt_status === 'in_progress' ? 'Reprendre' : 'Commencer'}
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mes Examens
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => {
            const token = window.prompt('Entrez le code de l\'examen :');
            if (token) navigate(`/student/exams/join/${token.trim()}`);
          }}
        >
          Rejoindre via code
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Rechercher un examen"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} aria-label="exam tabs">
          <Tab label="À venir" />
          <Tab label="Passés" />
          <Tab label="Tous" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">
          Une erreur est survenue: {error.message}
        </Alert>
      ) : filteredExams.length === 0 ? (
        <Alert severity="info">
          Aucun examen trouvé pour cette sélection.
        </Alert>
      ) : (
        <Box>
          {(Array.isArray(filteredExams) ? filteredExams : []).length === 0 ? (
            <Alert severity="info">
              Aucun examen disponible à afficher.
            </Alert>
          ) : (
            (Array.isArray(filteredExams) ? filteredExams : []).map((exam, idx) => {
              try {
                // La fonction renderExam n'attend qu'un seul paramètre
                return renderExam(exam);
              } catch (err) {
                // Utiliser template strings pour éviter l'erreur '0-1 arguments attendus, mais 2 reçus'
                console.error(`Erreur lors du rendu de l'examen: ${JSON.stringify(exam)}. Erreur: ${err.message}`);
                return (
                  <Alert severity="error" key={exam?.id || idx}>
                    Erreur d'affichage pour un examen. Veuillez contacter l'administrateur.
                  </Alert>
                );
              }
            })
          )}
        </Box>
      )}
    </Box>
  );
};

export default StudentExamsList;
