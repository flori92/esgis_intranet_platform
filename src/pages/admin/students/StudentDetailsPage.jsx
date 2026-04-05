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
  Avatar,
  Snackbar
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
  Badge as BadgeIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../../supabase';
import { sendAccessInvitation } from '../../../api/auth';

// Composant Tab Panel
const TabPanel = (props) => {
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

const StudentDetailsPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [courses, setStudentCourses] = useState([]);
  const [exams, setStudentExams] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [documentsList, setDocumentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    setLoading(true);
    setError(null);
    
    // Helper pour extraire les objets des requêtes Supabase qui peuvent retourner des tableaux
    const getRelation = (value) => (Array.isArray(value) ? value[0] : value);
    
    try {
      if (!id) {
        throw new Error('ID de l\'étudiant manquant');
      }
      
      // Récupérer les informations de l'étudiant
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          profiles(id, full_name, email, gender, date_of_birth, phone_number, address),
          student_number,
          departments(id, name, code),
          level,
          academic_year,
          status,
          created_at
        `)
        .eq('id', parseInt(id))
        .single();
      
      if (studentError) {
        throw studentError;
      }
      
      if (!studentData) {
        throw new Error('Étudiant non trouvé');
      }
      
      // Transformer les données de l'étudiant
      const profile = getRelation(studentData.profiles);
      const department = getRelation(studentData.departments);
      
      const transformedStudent = {
        id: studentData.id,
        profile_id: profile?.id || '',
        student_id: studentData.student_number,
        full_name: profile?.full_name || 'Nom inconnu',
        email: profile?.email || 'Email inconnu',
        gender: profile?.gender || '',
        date_of_birth: profile?.date_of_birth || null,
        phone_number: profile?.phone_number || '',
        address: profile?.address || '',
        department_id: department?.id || null,
        department_name: department?.name || 'Département inconnu',
        department_code: department?.code || '',
        level: studentData.level || '',
        academic_year: studentData.academic_year || '',
        status: studentData.status || '',
        created_at: studentData.created_at
      };
      
      setStudent(transformedStudent);
      const studentProfileId = profile?.id;
      
      // Fetch payments (integer ID)
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', parseInt(id))
        .order('payment_date', { ascending: false });
      setPaymentsList(paymentsData || []);

      // Fetch documents (UUID profile_id)
      const { data: docsData } = await supabase
        .from('generated_documents')
        .select(`
          id,
          file_path,
          status,
          created_at,
          document_templates(name, type)
        `)
        .eq('student_id', studentProfileId)
        .order('created_at', { ascending: false });
      setDocumentsList(docsData || []);
      
      // Récupérer les cours de l'étudiant (UUID profile_id)
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
          courses(
            id, 
            name, 
            code, 
            credits,
            professor_courses(
              professor_id,
              professors(id, profiles(full_name))
            )
          )
        `)
        .eq('student_id', studentProfileId)
        .order('academic_year', { ascending: false });
      
      if (coursesError) {
        throw coursesError;
      }
      
      // Transformer les données des cours
      const transformedCourses = (coursesData || []).map(item => {
        const courseRef = getRelation(item.courses);
        
        // Trouver le professeur pour cette année académique spécifique
        const profCourse = (courseRef?.professor_courses || []).find(
          pc => pc.academic_year === item.academic_year || !pc.academic_year
        ) || (courseRef?.professor_courses?.[0]);

        const profRef = getRelation(profCourse?.professors);
        const profProfile = getRelation(profRef?.profiles);

        return {
          id: item.id,
          student_id: item.student_id,
          course_id: item.course_id,
          academic_year: item.academic_year,
          semester: item.semester,
          enrollment_date: item.enrollment_date,
          status: item.status,
          course_name: courseRef?.name || 'Cours inconnu',
          course_code: courseRef?.code || '',
          credits: courseRef?.credits || 0,
          professor_name: profProfile?.full_name || null
        };
      });
      
      setStudentCourses(transformedCourses);
      
      // Récupérer les examens de l'étudiant (UUID profile_id)
      const { data: examsData, error: examsError } = await supabase
        .from('student_exams')
        .select(`
          id,
          exam_id,
          student_id,
          course_id,
          grade,
          status,
          exams(id, date, type),
          courses(id, name, code)
        `)
        .eq('student_id', studentProfileId)
        .order('exams(date)', { ascending: false });
      
      if (examsError) {
        throw examsError;
      }
      
      // Transformer les données des examens
      const transformedExams = (examsData || []).map(exam => {
        const examRef = getRelation(exam.exams);
        const courseRef = getRelation(exam.courses);
        return {
          id: exam.id,
          exam_id: exam.exam_id,
          student_id: exam.student_id,
          course_id: exam.course_id,
          grade: exam.grade,
          status: exam.status,
          exam_date: examRef?.date || '',
          exam_type: examRef?.type || 'Inconnu',
          course_name: courseRef?.name || 'Cours inconnu',
          course_code: courseRef?.code || ''
        };
      });
      
      setStudentExams(transformedExams);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(`Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  });

  // Charger les données au montage du composant
  useEffect(() => {
    if (id) {
      fetchDataRef.current();
    }
  }, [id]);

  /**
   * Envoyer une invitation d'accès par email
   */
  const handleSendInvitation = async () => {
    if (!student?.email) return;
    
    setInviting(true);
    try {
      const { success, error: invError } = await sendAccessInvitation(student.email);
      if (success) {
        setSuccessMessage(`Invitation envoyée avec succès à ${student.email}`);
      } else {
        throw invError;
      }
    } catch (err) {
      setError(`Erreur lors de l'envoi de l'invitation : ${err.message}`);
    } finally {
      setInviting(false);
    }
  };

  // Changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Navigation vers la page d'édition
  const handleEdit = () => {
    navigate(`/admin/students/edit/${id}`);
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
      // Supprimer l'étudiant
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', parseInt(id));
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Redirection vers la liste des étudiants
      navigate('/admin/students', { 
        state: { 
          successMessage: `Étudiant ${student.full_name} supprimé avec succès.` 
        } 
      });
      
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'étudiant:', err);
      setError(`Erreur lors de la suppression : ${err.message}`);
      handleCloseDeleteDialog();
    } finally {
      setLoading(false);
    }
  };

  // Retour à la liste des étudiants
  const handleBack = () => {
    navigate('/admin/students');
  };

  // Fonction pour formater une date
  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Non spécifié';
    }
    
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  // Génération des initiales pour l'avatar
  const getInitials = (name) => {
    if (!name) {
      return '?';
    }
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Afficher un spinner pendant le chargement
  if (loading && !student) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Afficher un message d'erreur si l'étudiant n'a pas été trouvé
  if (error && !student) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Retour à la liste
        </Button>
      </Box>
    );
  }

  // Si l'étudiant n'a pas été chargé, ne rien afficher
  if (!student) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={() => setSuccessMessage(null)}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Fil d'Ariane */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/admin" color="inherit">
          Administration
        </Link>
        <Link component={RouterLink} to="/admin/students" color="inherit">
          Étudiants
        </Link>
        <Typography color="text.primary">{student.full_name}</Typography>
      </Breadcrumbs>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* En-tête avec informations principales */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.main',
                fontSize: '1.5rem'
              }}
            >
              {getInitials(student.full_name)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              {student.full_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BadgeIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body1">
                {student.student_id} • {student.department_name} • {student.level}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                label={student.status} 
                color={
                  student.status === 'active' ? 'success' : 
                  student.status === 'graduated' ? 'info' :
                  student.status === 'suspended' ? 'error' :
                  'default'
                }
                size="small"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Inscrit depuis le {formatDate(student.created_at)}
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                startIcon={<VpnKeyIcon />}
                onClick={handleSendInvitation}
                disabled={inviting}
              >
                {inviting ? 'Envoi...' : 'Inviter'}
              </Button>
              <Button
                variant="contained"
                color="primary"
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
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Onglets d'information */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="student tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Informations personnelles" />
          <Tab label="Cours" />
          <Tab label="Examens" />
          <Tab label="Paiements" />
          <Tab label="Documents / Dépôt" />
        </Tabs>
        
        {/* Onglet Informations personnelles */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">Email</Typography>
                      </Box>
                    }
                    secondary={student.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">Téléphone</Typography>
                      </Box>
                    }
                    secondary={student.phone_number || 'Non spécifié'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HomeIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">Adresse</Typography>
                      </Box>
                    }
                    secondary={student.address || 'Non spécifiée'}
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Informations académiques
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">Genre</Typography>
                      </Box>
                    }
                    secondary={
                      student.gender === 'male' ? 'Masculin' :
                      student.gender === 'female' ? 'Féminin' :
                      'Non spécifié'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">Date de naissance</Typography>
                      </Box>
                    }
                    secondary={formatDate(student.date_of_birth)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1">Année académique</Typography>
                      </Box>
                    }
                    secondary={student.academic_year}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Onglet Cours */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Cours inscrits
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Nom du cours</TableCell>
                  <TableCell>Crédits</TableCell>
                  <TableCell>Professeur</TableCell>
                  <TableCell>Année académique</TableCell>
                  <TableCell>Semestre</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date d'inscription</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Aucun cours trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.course_code}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{course.professor_name || 'Non assigné'}</TableCell>
                      <TableCell>{course.academic_year}</TableCell>
                      <TableCell>{course.semester}</TableCell>
                      <TableCell>
                        <Chip
                          label={course.status}
                          color={
                            course.status === 'active' ? 'success' :
                            course.status === 'completed' ? 'info' :
                            course.status === 'dropped' ? 'error' :
                            'default'
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
            Historique des paiements ({paymentsList.length})
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Méthode</TableCell>
                  <TableCell>Référence</TableCell>
                  <TableCell>Année/Semestre</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Aucun paiement enregistré pour cet étudiant.
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentsList.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{new Intl.NumberFormat('fr-FR').format(payment.amount)} XOF</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>{payment.reference_number || '-'}</TableCell>
                      <TableCell>{payment.academic_year} - S{payment.semester}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Onglet Documents */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Documents et Relevés ({documentsList.length})
            </Typography>
            <Button variant="contained" size="small" onClick={() => alert('Dépôt manuel disponible prochainement via API.')}>Dépôt manuel</Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date de génération</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Aucun document dans le dossier.
                    </TableCell>
                  </TableRow>
                ) : (
                  documentsList.map((doc) => {
                    const templateName = doc.document_templates?.name || (doc.file_path.includes('bulletins') ? 'Bulletin' : 'Document');
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                           <strong>{templateName}</strong>
                           <Typography variant="caption" display="block" color="text.secondary">{doc.file_path}</Typography>
                        </TableCell>
                        <TableCell><Chip label={doc.status} size="small" color="primary" variant="outlined" /></TableCell>
                        <TableCell>{formatDate(doc.created_at)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
