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
import { supabase } from '../../../services/supabase';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

const StudentFormPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  // État du formulaire
  const initialStudentState = {
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
  
  const [student, setStudent] = useState(initialStudentState);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
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
      
      if (departmentsError) {
        throw departmentsError;
      }
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
        
        if (studentError) {
          throw studentError;
        }
        
        if (studentData) {
          setStudent({
            id: studentData.id,
            profile_id: studentData.profiles?.id,
            student_id: studentData.student_id,
            full_name: studentData.profiles?.full_name || '',
            email: studentData.profiles?.email || '',
            gender: studentData.profiles?.gender || '',
            date_of_birth: studentData.profiles?.date_of_birth || null,
            phone_number: studentData.profiles?.phone_number || '',
            address: studentData.profiles?.address || '',
            department_id: studentData.department_id,
            level: studentData.level,
            academic_year: studentData.academic_year,
            status: studentData.status
          });
        }
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(`Erreur : ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  });
  
  // Charger les données au montage du composant
  useEffect(() => {
    fetchDataRef.current();
  }, []);
  
  const fetchData = async () => {
    if (fetchDataRef.current) {
      await fetchDataRef.current();
    }
  };
  
  // Gestion des changements de valeur des champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudent({
      ...student,
      [name]: value
    });
    
    // Supprimer l'erreur pour ce champ si elle existe
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: undefined });
    }
  };
  
  // Gestion des changements de valeur des champs select
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setStudent({
      ...student,
      [name]: value === '' ? null : (name === 'department_id' ? Number(value) : value)
    });
    
    // Supprimer l'erreur pour ce champ si elle existe
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: undefined });
    }
  };
  
  // Gestion du changement de date de naissance
  const handleDateChange = (date) => {
    // Convertir la date en format ISO ou null si pas de date
    const isoDate = date ? date.toISOString() : null;
    
    setStudent({
      ...student,
      date_of_birth: isoDate
    });
    
    // Supprimer l'erreur pour ce champ si elle existe
    if (formErrors.date_of_birth) {
      setFormErrors({ ...formErrors, date_of_birth: undefined });
    }
  };
  
  // Validation du formulaire
  const validateForm = () => {
    const errors = {};
    
    // Validation du numéro étudiant
    if (!student.student_id.trim()) {
      errors.student_id = 'Le numéro étudiant est requis';
    } else if (!/^[A-Za-z0-9-]+$/.test(student.student_id)) {
      errors.student_id = 'Le numéro étudiant doit contenir uniquement des lettres, des chiffres et des tirets';
    }
    
    // Validation du nom complet
    if (!student.full_name.trim()) {
      errors.full_name = 'Le nom complet est requis';
    }
    
    // Validation de l'email
    if (!student.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      errors.email = 'L\'email n\'est pas valide';
    }
    
    // Validation du genre
    if (!student.gender) {
      errors.gender = 'Le genre est requis';
    }
    
    // Validation du département
    if (!student.department_id) {
      errors.department_id = 'Le département est requis';
    }
    
    // Validation du niveau
    if (!student.level) {
      errors.level = 'Le niveau est requis';
    }
    
    // Validation de l'année académique
    if (!student.academic_year) {
      errors.academic_year = 'L\'année académique est requise';
    }
    
    // Validation du statut
    if (!student.status) {
      errors.status = 'Le statut est requis';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Si le formulaire n'est pas valide, afficher un message d'erreur
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Préparer les données du profil
      const profileData = {
        full_name: student.full_name,
        email: student.email,
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        phone_number: student.phone_number,
        address: student.address
      };
      
      let profileId = student.profile_id;
      
      // Si en mode création ou si le profil n'existe pas encore
      if (!isEditMode || !profileId) {
        // Créer un profil
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select();
        
        if (profileError) {
          throw profileError;
        }
        
        profileId = newProfile[0].id;
      } else {
        // Mettre à jour le profil existant
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', profileId);
        
        if (profileError) {
          throw profileError;
        }
      }
      
      // Préparer les données de l'étudiant
      const studentData = {
        profile_id: profileId,
        student_id: student.student_id,
        department_id: student.department_id,
        level: student.level,
        academic_year: student.academic_year,
        status: student.status
      };
      
      if (isEditMode) {
        // Mettre à jour l'étudiant existant
        const { error: studentError } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', parseInt(id));
        
        if (studentError) {
          throw studentError;
        }
        
        setSuccessMessage('Étudiant mis à jour avec succès');
      } else {
        // Créer un nouvel étudiant
        const { error: studentError } = await supabase
          .from('students')
          .insert([studentData]);
        
        if (studentError) {
          throw studentError;
        }
        
        setSuccessMessage('Étudiant créé avec succès');
      }
      
      // Rediriger vers la liste des étudiants avec un message de succès
      navigate('/admin/students', { 
        state: { 
          successMessage: isEditMode ? 
            `Étudiant ${student.full_name} mis à jour avec succès` : 
            `Étudiant ${student.full_name} créé avec succès` 
        } 
      });
      
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError(`Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Annuler et retourner à la liste
  const handleCancel = () => {
    navigate('/admin/students');
  };
  
  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Fil d'Ariane */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/admin" color="inherit">
          Administration
        </Link>
        <Link component={RouterLink} to="/admin/students" color="inherit">
          Étudiants
        </Link>
        <Typography color="text.primary">
          {isEditMode ? `Modifier ${student.full_name}` : 'Nouvel étudiant'}
        </Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          color="inherit" 
          onClick={handleCancel}
          sx={{ mr: 2 }}
          aria-label="Retour"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEditMode ? 'Modifier un étudiant' : 'Ajouter un nouvel étudiant'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informations de base */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations personnelles
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Numéro étudiant"
                name="student_id"
                value={student.student_id}
                onChange={handleChange}
                error={!!formErrors.student_id}
                helperText={formErrors.student_id}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Nom complet"
                name="full_name"
                value={student.full_name}
                onChange={handleChange}
                error={!!formErrors.full_name}
                helperText={formErrors.full_name}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Email"
                name="email"
                type="email"
                value={student.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" error={!!formErrors.gender} required fullWidth>
                <FormLabel component="legend">Genre</FormLabel>
                <RadioGroup
                  name="gender"
                  value={student.gender}
                  onChange={handleChange}
                  row
                >
                  <FormControlLabel value="male" control={<Radio />} label="Masculin" />
                  <FormControlLabel value="female" control={<Radio />} label="Féminin" />
                  <FormControlLabel value="other" control={<Radio />} label="Autre" />
                </RadioGroup>
                {formErrors.gender && <FormHelperText>{formErrors.gender}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date de naissance"
                  value={student.date_of_birth ? new Date(student.date_of_birth) : null}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!formErrors.date_of_birth}
                      helperText={formErrors.date_of_birth}
                    />
                  )}
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
