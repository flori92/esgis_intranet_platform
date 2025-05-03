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
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../utils/supabase';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface StudentExam {
  id: number;
  exam_id: number;
  student_id: number;
  seat_number: string | null;
  attendance_status: 'present' | 'absent' | 'late' | null;
  attempt_status: 'not_started' | 'in_progress' | 'submitted' | null;
  created_at: string;
  updated_at: string | null;
}

interface Exam {
  id: number;
  title: string;
  course_id: number;
  course_name: string;
  course_code: string;
  professor_id: number;
  professor_name: string;
  date: string;
  duration: number;
  type: string;
  room: string | null;
  total_points: number;
  passing_grade: number;
  status: string;
  description: string | null;
}

/**
 * Composant affichant la liste des examens d'un étudiant
 */
const StudentExamsList: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  // États
  const [exams, setExams] = useState<Array<StudentExam & Exam>>([]);
  const [filteredExams, setFilteredExams] = useState<Array<StudentExam & Exam>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!authState.student) {
        throw new Error('Données d\'étudiant non disponibles');
      }
      
      const studentId = authState.student.id;
      
      // Récupérer les examens de l'étudiant avec les détails
      const { data, error: fetchError } = await supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          student_id,
          seat_number,
          attendance_status,
          attempt_status,
          created_at,
          updated_at,
          exams:exam_id (
            id,
            title,
            course_id,
            courses:course_id (name, code),
            professor_id,
            professors:professor_id (profiles:profile_id(full_name)),
            date,
            duration,
            type,
            room,
            total_points,
            passing_grade,
            status,
            description
          )
        `)
        .eq('student_id', studentId)
        .order('exams(date)', { ascending: true });
      
      if (fetchError) throw fetchError;
      
      if (!data) {
        setExams([]);
        setFilteredExams([]);
        return;
      }
      
      // Transformer les données
      const transformedData = data.map(item => ({
        id: item.id,
        exam_id: item.exam_id,
        student_id: item.student_id,
        seat_number: item.seat_number,
        attendance_status: item.attendance_status,
        attempt_status: item.attempt_status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        ...item.exams,
        course_name: item.exams.courses?.name || 'Inconnu',
        course_code: item.exams.courses?.code || 'Inconnu',
        professor_name: item.exams.professors?.profiles?.full_name || 'Inconnu'
      }));
      
      setExams(transformedData);
      setFilteredExams(transformedData);
    } catch (err) {
      console.error('Erreur lors du chargement des examens:', err);
      setError('Une erreur est survenue lors du chargement de vos examens.');
    } finally {
      setLoading(false);
    }
  });
  
  // Charger les données au montage du composant
  useEffect(() => {
    fetchDataRef.current();
  }, []);
  
  // Filtrer les examens lors du changement d'onglet ou de recherche
  useEffect(() => {
    let filtered = [...exams];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(exam => 
        exam.title.toLowerCase().includes(searchLower) || 
        exam.course_name.toLowerCase().includes(searchLower) ||
        exam.course_code.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtrer par onglet
    const now = new Date();
    
    if (tabValue === 0) { // Tous
      // Pas de filtre supplémentaire
    } else if (tabValue === 1) { // À venir
      filtered = filtered.filter(exam => {
        const examDate = parseISO(exam.date);
        return isAfter(examDate, now) && exam.status !== 'cancelled';
      });
    } else if (tabValue === 2) { // Passés
      filtered = filtered.filter(exam => {
        const examDate = parseISO(exam.date);
        return isBefore(examDate, now) || exam.status === 'completed' || exam.status === 'grading';
      });
    }
    
    setFilteredExams(filtered);
  }, [exams, tabValue, searchTerm]);
  
  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Naviguer vers la page de passage d'examen
  const handleTakeExam = (examId: number) => {
    navigate(`/student/exams/${examId}`);
  };
  
  // Naviguer vers la page de résultats
  const handleViewResults = (examId: number) => {
    navigate(`/student/exams/${examId}/results`);
  };
  
  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return 'Date indisponible';
    }
  };
  
  // Obtenir la puce de statut pour un examen
  const getStatusChip = (exam: StudentExam & Exam) => {
    const now = new Date();
    const examDate = parseISO(exam.date);
    const examEndTime = new Date(examDate.getTime() + exam.duration * 60000);
    
    if (exam.status === 'cancelled') {
      return <Chip label="Annulé" color="error" size="small" />;
    }
    
    if (exam.attempt_status === 'submitted') {
      return <Chip label="Terminé" color="success" size="small" />;
    }
    
    if (exam.attempt_status === 'in_progress') {
      return <Chip label="En cours" color="warning" size="small" />;
    }
    
    if (isAfter(now, examEndTime)) {
      return <Chip label="Manqué" color="error" size="small" />;
    }
    
    if (isAfter(now, examDate) && isBefore(now, examEndTime)) {
      return <Chip label="Disponible maintenant" color="success" size="small" />;
    }
    
    return <Chip label="À venir" color="info" size="small" />;
  };
  
  // Obtenir la puce pour le type d'examen
  const getExamTypeChip = (type: string) => {
    switch (type) {
      case 'midterm':
        return <Chip label="Partiel" color="warning" variant="outlined" size="small" />;
      case 'final':
        return <Chip label="Final" color="error" variant="outlined" size="small" />;
      case 'quiz':
        return <Chip label="Quiz" color="info" variant="outlined" size="small" />;
      case 'project':
        return <Chip label="Projet" color="success" variant="outlined" size="small" />;
      case 'oral':
        return <Chip label="Oral" color="secondary" variant="outlined" size="small" />;
      case 'practical':
        return <Chip label="TP" color="primary" variant="outlined" size="small" />;
      default:
        return <Chip label={type} variant="outlined" size="small" />;
    }
  };
  
  // Vérifier si l'utilisateur est étudiant
  if (!authState.isStudent) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mes examens
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label="Tous" />
            <Tab label="À venir" />
            <Tab label="Passés" />
          </Tabs>
        </Box>
        
        <TextField
          fullWidth
          placeholder="Rechercher un examen par titre ou cours..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredExams.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              Aucun examen {tabValue === 1 ? 'à venir' : tabValue === 2 ? 'passé' : ''} trouvé
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredExams.map(exam => {
              const examDate = parseISO(exam.date);
              const now = new Date();
              const isExamAvailable = isAfter(now, examDate) && 
                                     isBefore(now, new Date(examDate.getTime() + exam.duration * 60000)) &&
                                     exam.status !== 'cancelled' &&
                                     exam.attempt_status !== 'submitted';
              
              const isExamCompleted = exam.attempt_status === 'submitted' || exam.status === 'grading' || exam.status === 'completed';
              
              return (
                <Grid item xs={12} md={6} lg={4} key={exam.id}>
                  <Card elevation={3}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                          {exam.title}
                        </Typography>
                        {getStatusChip(exam)}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {getExamTypeChip(exam.type)}
                        <Chip 
                          icon={<SchoolIcon fontSize="small" />} 
                          label={`${exam.course_code}`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>
                      
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon fontSize="small" color="primary" />
                                <Typography variant="body2">
                                  {formatDate(exam.date)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon fontSize="small" color="primary" />
                                <Typography variant="body2">
                                  Durée: {exam.duration} minutes
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        
                        {exam.room && (
                          <ListItem>
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <RoomIcon fontSize="small" color="primary" />
                                  <Typography variant="body2">
                                    Salle: {exam.room}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                        
                        {exam.seat_number && (
                          <ListItem>
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AssignmentIcon fontSize="small" color="primary" />
                                  <Typography variant="body2">
                                    Place: {exam.seat_number}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions>
                      {isExamAvailable && (
                        <Button 
                          fullWidth 
                          variant="contained" 
                          color="primary"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleTakeExam(exam.exam_id)}
                        >
                          Commencer l'examen
                        </Button>
                      )}
                      
                      {isExamCompleted && (
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          color="primary"
                          startIcon={<DescriptionIcon />}
                          onClick={() => handleViewResults(exam.exam_id)}
                        >
                          Voir les résultats
                        </Button>
                      )}
                      
                      {!isExamAvailable && !isExamCompleted && (
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          disabled
                        >
                          {isAfter(examDate, now) ? "Pas encore disponible" : "Examen manqué"}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default StudentExamsList;
