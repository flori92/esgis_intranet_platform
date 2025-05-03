import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../utils/supabase';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface Student {
  id: number;
  profile_id: string;
  student_id: string;
  full_name: string;
  email: string;
  gender: string;
  date_of_birth: string | null;
  phone_number: string;
  address: string;
  department_id: number;
  department_name: string;
  department_code: string;
  level: string;
  academic_year: string;
  status: string;
  created_at: string;
}

interface StudentCourse {
  id: number;
  student_id: number;
  course_id: number;
  academic_year: string;
  semester: number;
  enrollment_date: string;
  status: string;
  course_name: string;
  course_code: string;
  credits: number;
  professor_name: string | null;
}

interface StudentExam {
  id: number;
  exam_id: number;
  student_id: number;
  course_id: number;
  grade: number | null;
  status: string;
  exam_date: string;
  exam_type: string;
  course_name: string;
  course_code: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant Tab Panel
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const StudentDetailsPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [exams, setStudentExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!id) {
        throw new Error('ID de l\'étudiant manquant');
      }
      
      // Récupérer les informations de l'étudiant
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          profiles:profile_id(id, full_name, email, gender, date_of_birth, phone_number, address),
          student_id,
          departments:department_id(id, name, code),
          level,
          academic_year,
          status,
          created_at
        `)
        .eq('id', parseInt(id))
        .single();
      
      if (studentError) throw studentError;
      
      if (!studentData) {
        throw new Error('Étudiant non trouvé');
      }
      
      // Transformer les données de l'étudiant
      const transformedStudent: Student = {
        id: studentData.id,
        profile_id: studentData.profiles?.id || '',
        student_id: studentData.student_id,
        full_name: studentData.profiles?.full_name || 'Nom inconnu',
        email: studentData.profiles?.email || '',
        gender: studentData.profiles?.gender || '',
        date_of_birth: studentData.profiles?.date_of_birth,
        phone_number: studentData.profiles?.phone_number || '',
        address: studentData.profiles?.address || '',
        department_id: studentData.departments?.id || 0,
        department_name: studentData.departments?.name || 'Non assigné',
        department_code: studentData.departments?.code || '',
        level: studentData.level,
        academic_year: studentData.academic_year,
        status: studentData.status,
        created_at: studentData.created_at
      };
      
      setStudent(transformedStudent);
      
      // Récupérer les cours de l'étudiant
      const { data: coursesData, error: coursesError } = await supabase
        .from('student_courses')
        .select(`
          id,
          student_id,
          course_id,
          academic_year,
          semester,
          enrollment_date,
          status,
          courses:course_id(id, name, code, credits, professor_id),
          professors:courses(professors:professor_id(profiles:profile_id(full_name)))
        `)
        .eq('student_id', parseInt(id));
      
      if (coursesError) throw coursesError;
      
      // Transformer les données des cours
      const transformedCourses: StudentCourse[] = coursesData?.map(course => ({
        id: course.id,
        student_id: course.student_id,
        course_id: course.course_id,
        academic_year: course.academic_year,
        semester: course.semester,
        enrollment_date: course.enrollment_date,
        status: course.status,
        course_name: course.courses?.name || 'Cours inconnu',
        course_code: course.courses?.code || '',
        credits: course.courses?.credits || 0,
        professor_name: course.professors?.professors?.profiles?.full_name || null
      })) || [];
      
      setStudentCourses(transformedCourses);
      
      // Récupérer les examens de l'étudiant
      const { data: examsData, error: examsError } = await supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          student_id,
          course_id,
          grade,
          status,
          exams:exam_id(date, type),
          courses:course_id(name, code)
        `)
        .eq('student_id', parseInt(id));
      
      if (examsError) throw examsError;
      
      // Transformer les données des examens
      const transformedExams: StudentExam[] = examsData?.map(exam => ({
        id: exam.id,
        exam_id: exam.exam_id,
        student_id: exam.student_id,
        course_id: exam.course_id,
        grade: exam.grade,
        status: exam.status,
        exam_date: exam.exams?.date || '',
        exam_type: exam.exams?.type || '',
        course_name: exam.courses?.name || 'Cours inconnu',
        course_code: exam.courses?.code || ''
      })) || [];
      
      setStudentExams(transformedExams);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  });
  
  useEffect(() => {
    const fetchData = async () => {
      if (fetchDataRef.current) {
        await fetchDataRef.current();
      }
    };
    fetchData();
  }, [id]);
  
  // Changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Navigation vers la page d'édition
  const handleEdit = () => {
    navigate(`/admin/students/${id}/edit`);
  };
  
  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  // Fermer le dialogue de confirmation de suppression
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  // Supprimer l'étudiant
  const handleDeleteStudent = async () => {
    setLoading(true);
    try {
      if (!id) return;
      
      // Supprimer l'étudiant
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', parseInt(id));
      
      if (error) throw error;
      
      // Rediriger vers la liste des étudiants
      navigate('/admin/students', { replace: true });
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'étudiant:', err);
      setError('Une erreur est survenue lors de la suppression de l\'étudiant.');
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };
  
  // Retour à la liste des étudiants
  const handleBack = () => {
    navigate('/admin/students');
  };

  // Fonction pour formater une date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non spécifiée';
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Génération des initiales pour l'avatar
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!authState.isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </Alert>
      </Box>
    );
  }
  
  if (loading && !student) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Étudiant non trouvé
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Retour à la liste
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Fil d'Ariane */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          to="/admin"
          underline="hover"
          color="inherit"
        >
          Administration
        </Link>
        <Link
          component={RouterLink}
          to="/admin/students"
          underline="hover"
          color="inherit"
        >
          Étudiants
        </Link>
        <Typography color="text.primary">
          {student.full_name}
        </Typography>
      </Breadcrumbs>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* En-tête avec infos rapides et boutons d'action */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={1}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem'
              }}
            >
              {getInitials(student.full_name)}
            </Avatar>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {student.full_name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<BadgeIcon />}
                label={`Matricule: ${student.student_id}`}
                variant="outlined"
              />
              <Chip
                icon={<SchoolIcon />}
                label={`${student.level} - ${student.department_name}`}
                variant="outlined"
              />
              <Chip
                label={student.status}
                color={
                  student.status === 'active'
                    ? 'success'
                    : student.status === 'graduated'
                    ? 'info'
                    : student.status === 'suspended'
                    ? 'error'
                    : 'default'
                }
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Retour
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Modifier
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleOpenDeleteDialog}
            >
              Supprimer
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Onglets d'information */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="onglets étudiant"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Informations" />
            <Tab label="Cours" />
            <Tab label="Examens" />
            <Tab label="Paiements" />
          </Tabs>
        </Box>
        
        {/* Onglet Informations */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Informations personnelles
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Nom complet"
                      secondary={student.full_name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Genre"
                      secondary={student.gender || 'Non spécifié'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Date de naissance"
                      secondary={formatDate(student.date_of_birth)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={
                        <Link href={`mailto:${student.email}`} underline="hover">
                          {student.email}
                        </Link>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Téléphone"
                      secondary={
                        student.phone_number ? (
                          <Link href={`tel:${student.phone_number}`} underline="hover">
                            {student.phone_number}
                          </Link>
                        ) : (
                          'Non spécifié'
                        )
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Adresse"
                      secondary={student.address || 'Non spécifiée'}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Informations académiques
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Matricule"
                      secondary={student.student_id}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Département"
                      secondary={`${student.department_name} (${student.department_code})`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Niveau"
                      secondary={student.level}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Année académique"
                      secondary={student.academic_year}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Statut"
                      secondary={student.status}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Date d'inscription"
                      secondary={formatDate(student.created_at)}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Onglet Cours */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Cours inscrits
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(`/admin/students/${id}/enroll`)}
            >
              Inscrire à un cours
            </Button>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Nom du cours</TableCell>
                  <TableCell>Crédits</TableCell>
                  <TableCell>Semestre</TableCell>
                  <TableCell>Année académique</TableCell>
                  <TableCell>Professeur</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date d'inscription</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Aucun cours inscrit
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.course_code}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{course.semester}</TableCell>
                      <TableCell>{course.academic_year}</TableCell>
                      <TableCell>{course.professor_name || 'Non assigné'}</TableCell>
                      <TableCell>
                        <Chip
                          label={course.status}
                          color={
                            course.status === 'active'
                              ? 'success'
                              : course.status === 'completed'
                              ? 'info'
                              : course.status === 'failed'
                              ? 'error'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(course.enrollment_date)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Onglet Examens */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Résultats d'examens
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cours</TableCell>
                  <TableCell>Type d'examen</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Aucun examen trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>{`${exam.course_code} - ${exam.course_name}`}</TableCell>
                      <TableCell>{exam.exam_type}</TableCell>
                      <TableCell>{formatDate(exam.exam_date)}</TableCell>
                      <TableCell>
                        {exam.grade !== null ? `${exam.grade.toFixed(2)}/20` : 'Non noté'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={exam.status}
                          color={
                            exam.status === 'passed'
                              ? 'success'
                              : exam.status === 'failed'
                              ? 'error'
                              : exam.status === 'pending'
                              ? 'warning'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Onglet Paiements */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Historique des paiements
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Le module de gestion des paiements est en cours de développement.
          </Alert>
          
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              Aucun paiement enregistré pour cet étudiant.
            </Typography>
          </Paper>
        </TabPanel>
      </Paper>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmation de suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'étudiant <strong>{student.full_name}</strong> ?
            Cette action est irréversible et supprimera également toutes les données associées à cet étudiant.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
          <Button
            onClick={handleDeleteStudent}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDetailsPage;
