import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Divider,
  Breadcrumbs,
  Link,
  Avatar,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../utils/supabase';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

// Types
interface Student {
  id?: number;
  profile_id?: string;
  student_id: string;
  full_name: string;
  email: string;
  gender: string;
  date_of_birth: string | null;
  phone_number: string;
  address: string;
  department_id: number | null;
  level: string;
  academic_year: string;
  status: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface FormErrors {
  student_id?: string;
  full_name?: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  phone_number?: string;
  department_id?: string;
  level?: string;
  academic_year?: string;
  status?: string;
}

const StudentFormPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // État du formulaire
  const initialStudentState: Student = {
    student_id: '',
    full_name: '',
    email: '',
    gender: '',
    date_of_birth: null,
    phone_number: '',
    address: '',
    department_id: null,
    level: '',
    academic_year: '',
    status: 'active'
  };
  
  const [student, setStudent] = useState<Student>(initialStudentState);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Années académiques
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return `${year}-${year + 1}`;
  });
  
  // Niveaux d'études
  const levels = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'];
  
  // Référence pour éviter les recréations de fonctions
  const fetchDataRef = useRef(async () => {
    if (isEditMode) {
      setLoadingData(true);
    }
    setError(null);
    
    try {
      // Récupérer les départements
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');
      
      if (departmentsError) throw departmentsError;
      setDepartments(departmentsData || []);
      
      // Si en mode édition, récupérer les données de l'étudiant
      if (isEditMode && id) {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            id,
            profiles:profile_id(id, full_name, email, gender, date_of_birth, phone_number, address),
            student_id,
            department_id,
            level,
            academic_year,
            status
          `)
          .eq('id', parseInt(id))
          .single();
        
        if (studentError) throw studentError;
        
        if (studentData) {
          setStudent({
            id: studentData.id,
            profile_id: studentData.profiles?.id,
            student_id: studentData.student_id,
            full_name: studentData.profiles?.full_name || '',
            email: studentData.profiles?.email || '',
            gender: studentData.profiles?.gender || '',
            date_of_birth: studentData.profiles?.date_of_birth,
            phone_number: studentData.profiles?.phone_number || '',
            address: studentData.profiles?.address || '',
            department_id: studentData.department_id,
            level: studentData.level,
            academic_year: studentData.academic_year,
            status: studentData.status
          });
        } else {
          setError('Étudiant non trouvé');
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données.');
    } finally {
      setLoadingData(false);
    }
  });
  
  useEffect(() => {
    const fetchData = async () => {
      if (fetchDataRef.current) {
        await fetchDataRef.current();
      }
    };
    fetchData();
  }, [id, isEditMode]);
  
  // Gestion des changements de valeur des champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStudent(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur si le champ est modifié
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Gestion des changements de valeur des champs select
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as keyof Student;
    const value = e.target.value;
    
    setStudent(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur si le champ est modifié
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Gestion du changement de date de naissance
  const handleDateChange = (date: Date | null) => {
    const formattedDate = date ? format(date, 'yyyy-MM-dd') : null;
    setStudent(prev => ({ ...prev, date_of_birth: formattedDate }));
    
    // Effacer l'erreur si le champ est modifié
    if (formErrors.date_of_birth) {
      setFormErrors(prev => ({ ...prev, date_of_birth: undefined }));
    }
  };
  
  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!student.student_id) {
      errors.student_id = 'Le matricule est requis';
    }
    
    if (!student.full_name) {
      errors.full_name = 'Le nom complet est requis';
    }
    
    if (!student.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(student.email)) {
      errors.email = 'Veuillez entrer une adresse email valide';
    }
    
    if (!student.gender) {
      errors.gender = 'Le genre est requis';
    }
    
    if (!student.department_id) {
      errors.department_id = 'Le département est requis';
    }
    
    if (!student.level) {
      errors.level = 'Le niveau est requis';
    }
    
    if (!student.academic_year) {
      errors.academic_year = 'L\'année académique est requise';
    }
    
    if (!student.status) {
      errors.status = 'Le statut est requis';
    }
    
    if (student.phone_number && !/^\+?[0-9]{10,15}$/.test(student.phone_number)) {
      errors.phone_number = 'Veuillez entrer un numéro de téléphone valide';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isEditMode) {
        // Mettre à jour le profil
        if (student.profile_id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: student.full_name,
              email: student.email,
              gender: student.gender,
              date_of_birth: student.date_of_birth,
              phone_number: student.phone_number,
              address: student.address
            })
            .eq('id', student.profile_id);
          
          if (profileError) throw profileError;
        }
        
        // Mettre à jour l'étudiant
        const { error: studentError } = await supabase
          .from('students')
          .update({
            student_id: student.student_id,
            department_id: student.department_id,
            level: student.level,
            academic_year: student.academic_year,
            status: student.status
          })
          .eq('id', student.id);
        
        if (studentError) throw studentError;
        
        setSuccessMessage('Étudiant mis à jour avec succès');
      } else {
        // Créer un nouveau profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            full_name: student.full_name,
            email: student.email,
            gender: student.gender,
            date_of_birth: student.date_of_birth,
            phone_number: student.phone_number,
            address: student.address,
            role: 'student'
          }])
          .select();
        
        if (profileError) throw profileError;
        
        if (!profileData || profileData.length === 0) {
          throw new Error('Erreur lors de la création du profil');
        }
        
        // Créer un nouvel étudiant
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .insert([{
            profile_id: profileData[0].id,
            student_id: student.student_id,
            department_id: student.department_id,
            level: student.level,
            academic_year: student.academic_year,
            status: student.status
          }])
          .select();
        
        if (studentError) throw studentError;
        
        setSuccessMessage('Étudiant créé avec succès');
        
        // Rediriger vers la page de détails après création
        if (studentData && studentData.length > 0) {
          setTimeout(() => {
            navigate(`/admin/students/${studentData[0].id}`);
          }, 1500);
        } else {
          // Sinon, retour à la liste
          setTimeout(() => {
            navigate('/admin/students');
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError('Une erreur est survenue lors de l\'enregistrement des données.');
    } finally {
      setLoading(false);
    }
  };
  
  // Annuler et retourner à la liste
  const handleCancel = () => {
    navigate('/admin/students');
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
  
  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
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
          {isEditMode ? 'Modifier étudiant' : 'Nouvel étudiant'}
        </Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          color="primary"
          sx={{ mr: 2 }}
          onClick={handleCancel}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEditMode ? 'Modifier un étudiant' : 'Ajouter un nouvel étudiant'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informations de base */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations de base
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Matricule *"
                name="student_id"
                value={student.student_id}
                onChange={handleChange}
                error={!!formErrors.student_id}
                helperText={formErrors.student_id}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom complet *"
                name="full_name"
                value={student.full_name}
                onChange={handleChange}
                error={!!formErrors.full_name}
                helperText={formErrors.full_name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email *"
                name="email"
                type="email"
                value={student.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.gender} required>
                <FormLabel id="gender-label">Genre *</FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="gender-label"
                  name="gender"
                  value={student.gender}
                  onChange={handleChange}
                >
                  <FormControlLabel value="Homme" control={<Radio />} label="Homme" />
                  <FormControlLabel value="Femme" control={<Radio />} label="Femme" />
                  <FormControlLabel value="Autre" control={<Radio />} label="Autre" />
                </RadioGroup>
                {formErrors.gender && <FormHelperText>{formErrors.gender}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date de naissance"
                  value={student.date_of_birth ? parseISO(student.date_of_birth) : null}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!formErrors.date_of_birth,
                      helperText: formErrors.date_of_birth
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="phone_number"
                value={student.phone_number}
                onChange={handleChange}
                error={!!formErrors.phone_number}
                helperText={formErrors.phone_number}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                name="address"
                value={student.address}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            
            {/* Informations académiques */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Informations académiques
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.department_id} required>
                <InputLabel>Département *</InputLabel>
                <Select
                  name="department_id"
                  value={student.department_id || ''}
                  onChange={handleSelectChange}
                  label="Département *"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.department_id && <FormHelperText>{formErrors.department_id}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.level} required>
                <InputLabel>Niveau *</InputLabel>
                <Select
                  name="level"
                  value={student.level}
                  onChange={handleSelectChange}
                  label="Niveau *"
                >
                  {levels.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
                {formErrors.level && <FormHelperText>{formErrors.level}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.academic_year} required>
                <InputLabel>Année académique *</InputLabel>
                <Select
                  name="academic_year"
                  value={student.academic_year}
                  onChange={handleSelectChange}
                  label="Année académique *"
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
                {formErrors.academic_year && <FormHelperText>{formErrors.academic_year}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.status} required>
                <InputLabel>Statut *</InputLabel>
                <Select
                  name="status"
                  value={student.status}
                  onChange={handleSelectChange}
                  label="Statut *"
                >
                  <MenuItem value="active">Actif</MenuItem>
                  <MenuItem value="inactive">Inactif</MenuItem>
                  <MenuItem value="graduated">Diplômé</MenuItem>
                  <MenuItem value="suspended">Suspendu</MenuItem>
                </Select>
                {formErrors.status && <FormHelperText>{formErrors.status}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {/* Boutons d'actions */}
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Mettre à jour' : 'Enregistrer')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default StudentFormPage;
