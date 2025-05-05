import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '@/services/supabase';
import { useNavigate } from 'react-router-dom';

const StudentsListPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Filtres
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState('all');

  // Dialogue de confirmation de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

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
    setLoading(true);
    setError(null);
    try {
      // Récupérer les départements
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');
      
      if (departmentsError) throw departmentsError;
      
      // Récupérer les étudiants
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          profiles:profile_id(id, full_name, email, gender, date_of_birth, phone_number, address),
          student_id,
          department_id,
          level,
          academic_year,
          status,
          created_at
        `)
        .order('id');
      
      if (studentsError) throw studentsError;
      
      // Transformer les données des étudiants
      const transformedStudents = studentsData.map(student => {
        const department = departmentsData?.find(d => d.id === student.department_id);
        return {
          id: student.id,
          profile_id: student.profiles?.id || '',
          student_id: student.student_id,
          full_name: student.profiles?.full_name || 'Nom inconnu',
          email: student.profiles?.email || 'Email inconnu',
          gender: student.profiles?.gender || '',
          date_of_birth: student.profiles?.date_of_birth || '',
          phone_number: student.profiles?.phone_number || '',
          address: student.profiles?.address || '',
          department_id: student.department_id,
          department_name: department ? department.name : 'Département inconnu',
          level: student.level,
          academic_year: student.academic_year,
          status: student.status,
          created_at: student.created_at
        };
      });
      
      setStudents(transformedStudents);
      setFilteredStudents(transformedStudents); // Initialiser la liste filtrée
      setDepartments(departmentsData || []);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  });

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchDataRef.current();
  }, []);

  // Mettre à jour les étudiants filtrés lorsque les filtres changent
  useEffect(() => {
    if (!students) return;
    
    const filtered = students.filter(student => {
      // Filtre par terme de recherche
      const searchMatches = searchTerm === '' || 
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre par département
      const departmentMatches = !filterDepartment || student.department_id === filterDepartment;
      
      // Filtre par niveau
      const levelMatches = filterLevel === 'all' || student.level === filterLevel;
      
      // Filtre par statut
      const statusMatches = filterStatus === 'all' || student.status === filterStatus;
      
      // Filtre par année académique
      const yearMatches = filterAcademicYear === 'all' || student.academic_year === filterAcademicYear;
      
      return searchMatches && departmentMatches && levelMatches && statusMatches && yearMatches;
    });
    
    setFilteredStudents(filtered);
    // Réinitialiser la pagination
    setPage(0);
  }, [searchTerm, filterDepartment, filterLevel, filterStatus, filterAcademicYear, students]);

  const fetchData = async () => {
    if (fetchDataRef.current) {
      await fetchDataRef.current();
    }
  };

  // Gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDepartment(null);
    setFilterLevel('all');
    setFilterStatus('all');
    setFilterAcademicYear('all');
  };

  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  // Fermer le dialogue de confirmation de suppression
  const handleCloseDeleteDialog = () => {
    setStudentToDelete(null);
    setDeleteDialogOpen(false);
  };

  // Supprimer un étudiant
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    setLoading(true);
    try {
      // Supprimer l'étudiant
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete.id);
      
      if (error) throw error;
      
      // Mettre à jour la liste des étudiants
      setStudents(students.filter(s => s.id !== studentToDelete.id));
      
      // Afficher un message de succès
      setSuccessMessage(`Étudiant "${studentToDelete.full_name}" supprimé avec succès.`);
      
      // Fermer le dialogue
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'étudiant:', err);
      setError(`Erreur lors de la suppression : ${err.message || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };

  // Naviguer vers la page de création d'un nouvel étudiant
  const handleAddStudent = () => {
    navigate('/admin/students/new');
  };

  // Naviguer vers la page de détails d'un étudiant
  const handleViewStudent = (id) => {
    navigate(`/admin/students/${id}`);
  };

  // Naviguer vers la page d'édition d'un étudiant
  const handleEditStudent = (id) => {
    navigate(`/admin/students/${id}/edit`);
  };

  // Exporter la liste d'étudiants actuelle au format CSV
  const handleExportStudents = () => {
    if (filteredStudents.length === 0) {
      setError('Aucune donnée à exporter.');
      return;
    }
    
    try {
      // Préparer les données pour l'export
      const headers = ['Numéro', 'Nom complet', 'Email', 'Département', 'Niveau', 'Année académique', 'Statut'];
      
      // Créer les lignes du CSV
      const csvRows = [
        headers.join(','),
        ...filteredStudents.map(student => [
          student.student_id,
          `"${student.full_name}"`, // Guillemets pour échapper les virgules dans les noms
          `"${student.email}"`,
          `"${student.department_name}"`,
          student.level,
          student.academic_year,
          student.status
        ].join(','))
      ];
      
      // Joindre les lignes avec des sauts de ligne
      const csvContent = csvRows.join('\n');
      
      // Créer un blob et un lien de téléchargement
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `etudiants_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      link.click();
      
      // Nettoyer
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      setError('Une erreur est survenue lors de l\'export des données.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des étudiants
      </Typography>

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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Rechercher un étudiant"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              placeholder="Nom, email ou numéro..."
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Département</InputLabel>
              <Select
                value={filterDepartment || ''}
                onChange={(e) => setFilterDepartment(e.target.value === '' ? null : Number(e.target.value))}
                label="Département"
              >
                <MenuItem value="">Tous</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Niveau</InputLabel>
              <Select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                label="Niveau"
              >
                <MenuItem value="all">Tous</MenuItem>
                {levels.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Statut"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="active">Actif</MenuItem>
                <MenuItem value="inactive">Inactif</MenuItem>
                <MenuItem value="suspended">Suspendu</MenuItem>
                <MenuItem value="graduated">Diplômé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Année académique</InputLabel>
              <Select
                value={filterAcademicYear}
                onChange={(e) => setFilterAcademicYear(e.target.value)}
                label="Année académique"
              >
                <MenuItem value="all">Toutes</MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
              >
                Réinitialiser
              </Button>
              
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownloadIcon />}
                  onClick={handleExportStudents}
                  sx={{ mr: 1 }}
                >
                  Exporter en CSV
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddStudent}
                >
                  Nouvel étudiant
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Numéro</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Niveau</TableCell>
                    <TableCell>Année académique</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Aucun étudiant trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.student_id}</TableCell>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.department_name}</TableCell>
                          <TableCell>{student.level}</TableCell>
                          <TableCell>{student.academic_year}</TableCell>
                          <TableCell>
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
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="primary"
                              onClick={() => handleViewStudent(student.id)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton
                              color="secondary"
                              onClick={() => handleEditStudent(student.id)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDeleteDialog(student)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredStudents.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page :"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </>
        )}
      </Paper>

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmation de suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'étudiant <strong>{studentToDelete?.full_name}</strong> ?
            Cette action est irréversible.
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

export default StudentsListPage;
