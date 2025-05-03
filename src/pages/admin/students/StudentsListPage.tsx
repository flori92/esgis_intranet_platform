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
import { supabase } from '../../../utils/supabase';
import { useNavigate } from 'react-router-dom';

// Types
interface Student {
  id: number;
  profile_id: string;
  student_id: string;
  full_name: string;
  email: string;
  gender: string;
  date_of_birth: string;
  phone_number: string;
  address: string;
  department_id: number;
  department_name: string;
  level: string;
  academic_year: string;
  status: string;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

const StudentsListPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filtres
  const [filterDepartment, setFilterDepartment] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all');

  // Dialogue de confirmation de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

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
          email: student.profiles?.email || '',
          gender: student.profiles?.gender || '',
          date_of_birth: student.profiles?.date_of_birth || '',
          phone_number: student.profiles?.phone_number || '',
          address: student.profiles?.address || '',
          department_id: student.department_id,
          department_name: department?.name || 'Non assigné',
          level: student.level,
          academic_year: student.academic_year,
          status: student.status,
          created_at: student.created_at
        };
      });
      
      setDepartments(departmentsData || []);
      setStudents(transformedStudents);
      setFilteredStudents(transformedStudents);
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
  }, []);

  // Filtrer les étudiants en fonction des critères
  useEffect(() => {
    let result = [...students];
    
    // Filtre par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        student => 
          student.full_name.toLowerCase().includes(searchLower) ||
          student.student_id.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtre par département
    if (filterDepartment !== null) {
      result = result.filter(student => student.department_id === filterDepartment);
    }
    
    // Filtre par niveau
    if (filterLevel !== 'all') {
      result = result.filter(student => student.level === filterLevel);
    }
    
    // Filtre par statut
    if (filterStatus !== 'all') {
      result = result.filter(student => student.status === filterStatus);
    }
    
    // Filtre par année académique
    if (filterAcademicYear !== 'all') {
      result = result.filter(student => student.academic_year === filterAcademicYear);
    }
    
    setFilteredStudents(result);
    setPage(0); // Réinitialiser la pagination lors du filtrage
  }, [students, searchTerm, filterDepartment, filterLevel, filterStatus, filterAcademicYear]);

  // Gestion de la pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setFilterDepartment(null);
    setFilterLevel('all');
    setFilterStatus('all');
    setFilterAcademicYear('all');
    setSearchTerm('');
  };

  // Ouvrir le dialogue de confirmation de suppression
  const handleOpenDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  // Fermer le dialogue de confirmation de suppression
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
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
      
      // Succès
      setSuccessMessage(`L'étudiant ${studentToDelete.full_name} a été supprimé avec succès.`);
      
      // Rafraîchir les données
      await fetchDataRef.current();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'étudiant:', err);
      setError('Une erreur est survenue lors de la suppression de l\'étudiant.');
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
    }
  };

  // Naviguer vers la page de création d'un nouvel étudiant
  const handleAddStudent = () => {
    navigate('/admin/students/create');
  };

  // Naviguer vers la page de détails d'un étudiant
  const handleViewStudent = (id: number) => {
    navigate(`/admin/students/${id}`);
  };

  // Naviguer vers la page d'édition d'un étudiant
  const handleEditStudent = (id: number) => {
    navigate(`/admin/students/${id}/edit`);
  };

  // Exporter la liste d'étudiants actuelle au format CSV
  const handleExportStudents = () => {
    // Convertir les données en CSV
    const headers = ['ID', 'Matricule', 'Nom complet', 'Email', 'Département', 'Niveau', 'Année académique', 'Statut'];
    const csvData = [
      headers.join(','),
      ...filteredStudents.map(student => 
        [
          student.id,
          student.student_id,
          `"${student.full_name}"`,
          student.email,
          `"${student.department_name}"`,
          student.level,
          student.academic_year,
          student.status
        ].join(',')
      )
    ].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `etudiants_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Étudiants
      </Typography>

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

      {/* Filtres et barre de recherche */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
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
              <FormControl size="small" sx={{ minWidth: 120 }}>
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
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Statut"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="active">Actif</MenuItem>
                  <MenuItem value="inactive">Inactif</MenuItem>
                  <MenuItem value="graduated">Diplômé</MenuItem>
                  <MenuItem value="suspended">Suspendu</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Année Académique</InputLabel>
                <Select
                  value={filterAcademicYear}
                  onChange={(e) => setFilterAcademicYear(e.target.value)}
                  label="Année Académique"
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  {academicYears.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
              >
                Réinitialiser
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={handleExportStudents}
              disabled={filteredStudents.length === 0}
            >
              Exporter
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddStudent}
            >
              Ajouter
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Tableau des étudiants */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && students.length === 0 ? (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Matricule</TableCell>
                    <TableCell>Nom complet</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Département</TableCell>
                    <TableCell>Niveau</TableCell>
                    <TableCell>Année</TableCell>
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
