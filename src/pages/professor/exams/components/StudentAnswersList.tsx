import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as GradedIcon,
  Report as UngradedIcon,
  ArrowForward as ViewIcon,
  Warning as WarningIcon,
  Sort as SortIcon
} from '@mui/icons-material';

// Types
interface Student {
  id: number;
  name: string;
  email: string;
  profile_image?: string | null;
}

interface StudentExam {
  id: number;
  student_id: number;
  exam_id: number;
  start_time: string;
  end_time: string;
  status: string;
  graded: boolean;
  cheating_attempts: number;
  has_incidents: boolean;
  score?: number | null;
  max_score?: number | null;
  grade_letter?: string | null;
}

interface StudentWithExam {
  student: Student;
  studentExam: StudentExam;
}

interface StudentAnswersListProps {
  examId: number;
  onStudentSelect: (studentId: number, studentExamId: number) => void;
  selectedStudentId?: number;
  onGradeStatusChange?: (studentId: number, isGraded: boolean) => void;
}

/**
 * Composant pour afficher la liste des étudiants qui ont passé un examen
 */
const StudentAnswersList: React.FC<StudentAnswersListProps> = ({
  examId,
  onStudentSelect,
  selectedStudentId,
  onGradeStatusChange
}) => {
  // États
  const [students, setStudents] = useState<StudentWithExam[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithExam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterGraded, setFilterGraded] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Chargement des données
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Importer supabase
        const { supabase } = await import('../../../../utils/supabase');
        
        // Récupérer les examens des étudiants
        const { data: studentExams, error: examError } = await supabase
          .from('student_exams')
          .select('*')
          .eq('exam_id', examId);
        
        if (examError) throw examError;
        
        if (!studentExams || studentExams.length === 0) {
          setStudents([]);
          setFilteredStudents([]);
          setLoading(false);
          return;
        }
        
        // Récupérer les informations des étudiants
        const studentIds = studentExams.map(exam => exam.student_id);
        
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id, profiles:profile_id(full_name, email, avatar_url)')
          .in('id', studentIds);
        
        if (studentError) throw studentError;
        
        if (!studentData) {
          throw new Error('Aucune donnée étudiant trouvée');
        }
        
        // Combiner les données
        const studentsWithExams: StudentWithExam[] = studentExams.map(exam => {
          const student = studentData.find(s => s.id === exam.student_id);
          
          return {
            student: {
              id: student?.id || 0,
              name: student?.profiles?.full_name || 'Étudiant inconnu',
              email: student?.profiles?.email || '',
              profile_image: student?.profiles?.avatar_url || null
            },
            studentExam: exam
          };
        });
        
        setStudents(studentsWithExams);
        setFilteredStudents(studentsWithExams);
      } catch (err) {
        console.error('Erreur lors du chargement des étudiants:', err);
        setError((err as Error).message || 'Une erreur est survenue lors du chargement des étudiants');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [examId]);
  
  // Mise à jour du statut de notation d'un étudiant
  useEffect(() => {
    if (onGradeStatusChange) {
      const subscription = {
        supabase: null,
        subscribe: async () => {
          const { supabase } = await import('../../../../utils/supabase');
          
          subscription.supabase = supabase
            .channel('student_exams_changes')
            .on('postgres_changes', 
              { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'student_exams',
                filter: `exam_id=eq.${examId}`
              }, 
              (payload) => {
                const updatedExam = payload.new as StudentExam;
                
                // Mettre à jour l'état local
                setStudents(prevStudents => {
                  const newStudents = [...prevStudents];
                  const index = newStudents.findIndex(s => s.studentExam.id === updatedExam.id);
                  
                  if (index !== -1) {
                    newStudents[index] = {
                      ...newStudents[index],
                      studentExam: updatedExam
                    };
                    
                    // Appeler le callback pour notifier du changement de statut
                    if (newStudents[index].studentExam.graded !== updatedExam.graded) {
                      onGradeStatusChange(newStudents[index].student.id, updatedExam.graded);
                    }
                  }
                  
                  return newStudents;
                });
                
                // Appliquer les filtres et tris
                applyFiltersAndSort();
              }
            )
            .subscribe();
        },
        unsubscribe: async () => {
          if (subscription.supabase) {
            await subscription.supabase.unsubscribe();
          }
        }
      };
      
      subscription.subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [examId, onGradeStatusChange]);
  
  // Appliquer les filtres et les tris
  const applyFiltersAndSort = () => {
    let result = [...students];
    
    // Appliquer le filtre de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        s => s.student.name.toLowerCase().includes(searchLower) || 
             s.student.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Appliquer le filtre de notation
    if (filterGraded !== null) {
      result = result.filter(s => s.studentExam.graded === filterGraded);
    }
    
    // Appliquer le tri
    result.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (sortField) {
        case 'name':
          valueA = a.student.name;
          valueB = b.student.name;
          break;
        case 'status':
          valueA = a.studentExam.status;
          valueB = b.studentExam.status;
          break;
        case 'score':
          valueA = a.studentExam.score || 0;
          valueB = b.studentExam.score || 0;
          break;
        case 'incidents':
          valueA = a.studentExam.cheating_attempts;
          valueB = b.studentExam.cheating_attempts;
          break;
        default:
          valueA = a.student.name;
          valueB = b.student.name;
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredStudents(result);
  };
  
  // Gérer le changement de recherche
  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, filterGraded, sortField, sortDirection, students]);
  
  // Changer le filtre de notation
  const toggleGradedFilter = () => {
    if (filterGraded === null) {
      setFilterGraded(true);
    } else if (filterGraded === true) {
      setFilterGraded(false);
    } else {
      setFilterGraded(null);
    }
  };
  
  // Changer le tri
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'not_started':
        return 'default';
      case 'timed_out':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'not_started':
        return 'Non commencé';
      case 'timed_out':
        return 'Temps écoulé';
      default:
        return status;
    }
  };
  
  // Obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Rendu pour le chargement
  if (loading) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} sx={{ mr: 2 }} />
        <Typography>Chargement des données des étudiants...</Typography>
      </Box>
    );
  }
  
  // Rendu pour les erreurs
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  // Rendu principal
  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Étudiants ({filteredStudents.length})
        </Typography>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher un étudiant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          sx={{ mb: 1 }}
        />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Tooltip title="Filtrer par statut de notation">
            <Chip
              icon={<FilterIcon />}
              label={filterGraded === null ? 'Tous' : filterGraded ? 'Notés' : 'Non notés'}
              onClick={toggleGradedFilter}
              color={filterGraded === null ? 'default' : filterGraded ? 'success' : 'warning'}
              variant="outlined"
            />
          </Tooltip>
          
          <Tooltip title="Trier par nom">
            <Chip
              icon={<SortIcon />}
              label="Nom"
              onClick={() => toggleSort('name')}
              color={sortField === 'name' ? 'primary' : 'default'}
              variant="outlined"
            />
          </Tooltip>
          
          <Tooltip title="Trier par score">
            <Chip
              icon={<SortIcon />}
              label="Score"
              onClick={() => toggleSort('score')}
              color={sortField === 'score' ? 'primary' : 'default'}
              variant="outlined"
            />
          </Tooltip>
          
          <Tooltip title="Trier par incidents">
            <Chip
              icon={<SortIcon />}
              label="Incidents"
              onClick={() => toggleSort('incidents')}
              color={sortField === 'incidents' ? 'primary' : 'default'}
              variant="outlined"
            />
          </Tooltip>
          
          {sortField && (
            <Chip
              label={sortDirection === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
              size="small"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              color="primary"
            />
          )}
        </Box>
      </Box>
      
      <List sx={{ 
        overflowY: 'auto', 
        flexGrow: 1, 
        '& .MuiListItem-root': { borderBottom: '1px solid', borderColor: 'divider' }
      }}>
        {filteredStudents.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Aucun étudiant ne correspond aux critères de recherche
            </Typography>
          </Box>
        ) : (
          filteredStudents.map((item) => {
            const { student, studentExam } = item;
            const isSelected = selectedStudentId === student.id;
            
            return (
              <ListItemButton
                key={student.id}
                selected={isSelected}
                onClick={() => onStudentSelect(student.id, studentExam.id)}
                sx={{
                  transition: 'all 0.2s',
                  borderLeft: isSelected ? '4px solid' : '4px solid transparent',
                  borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                  bgcolor: isSelected ? 'action.selected' : 'inherit',
                  '&:hover': {
                    bgcolor: isSelected ? 'action.selected' : 'action.hover',
                  }
                }}
              >
                <ListItemAvatar>
                  {studentExam.has_incidents ? (
                    <Badge
                      badgeContent={studentExam.cheating_attempts}
                      color="error"
                      overlap="circular"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                    >
                      <Avatar 
                        src={student.profile_image || undefined}
                        alt={student.name}
                        sx={{ bgcolor: studentExam.graded ? 'success.main' : 'grey.400' }}
                      >
                        {student.profile_image ? null : getInitials(student.name)}
                      </Avatar>
                    </Badge>
                  ) : (
                    <Avatar 
                      src={student.profile_image || undefined}
                      alt={student.name}
                      sx={{ bgcolor: studentExam.graded ? 'success.main' : 'grey.400' }}
                    >
                      {student.profile_image ? null : getInitials(student.name)}
                    </Avatar>
                  )}
                </ListItemAvatar>
                
                <ListItemText
                  primary={student.name}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        size="small"
                        label={getStatusText(studentExam.status)}
                        color={getStatusColor(studentExam.status)}
                        variant="outlined"
                      />
                      
                      {studentExam.graded ? (
                        <Chip
                          size="small"
                          icon={<GradedIcon />}
                          label={studentExam.score !== null ? `${studentExam.score}/${studentExam.max_score}` : 'Noté'}
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          size="small"
                          icon={<UngradedIcon />}
                          label="Non noté"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      
                      {studentExam.has_incidents && (
                        <Tooltip title={`${studentExam.cheating_attempts} tentative(s) de triche détectée(s)`}>
                          <Chip
                            size="small"
                            icon={<WarningIcon />}
                            label="Triche"
                            color="error"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => onStudentSelect(student.id, studentExam.id)}
                    color={isSelected ? 'primary' : 'default'}
                  >
                    <ViewIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItemButton>
            );
          })
        )}
      </List>
    </Paper>
  );
};

export default StudentAnswersList;
