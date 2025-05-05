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

import { supabase } from '@/services/supabase';

/**
 * Composant pour afficher la liste des étudiants qui ont passé un examen
 * 
 * @typedef {Object} Student Étudiant
 * @property {number} id ID de l'étudiant
 * @property {string} name Nom complet de l'étudiant
 * @property {string} email Email de l'étudiant
 * @property {string|null} [profile_image] URL de l'image de profil
 * 
 * @typedef {Object} StudentExam Examen d'un étudiant
 * @property {number} id ID de l'examen étudiant
 * @property {number} student_id ID de l'étudiant
 * @property {number} exam_id ID de l'examen
 * @property {string} start_time Heure de début
 * @property {string} end_time Heure de fin
 * @property {string} status Statut de l'examen
 * @property {boolean} graded Si l'examen a été noté
 * @property {number} cheating_attempts Nombre de tentatives de triche
 * @property {boolean} has_incidents S'il y a eu des incidents
 * @property {number|null} [score] Score obtenu
 * @property {number|null} [max_score] Score maximum possible
 * @property {string|null} [grade_letter] Note alphabétique
 * 
 * @typedef {Object} StudentWithExam Étudiant avec son examen
 * @property {Student} student Informations de l'étudiant
 * @property {StudentExam} studentExam Informations de l'examen
 * 
 * @param {Object} props Les propriétés du composant
 * @param {number} props.examId ID de l'examen
 * @param {Function} props.onStudentSelect Fonction appelée lors de la sélection d'un étudiant
 * @param {number} [props.selectedStudentId] ID de l'étudiant sélectionné
 * @param {Function} [props.onGradeStatusChange] Fonction appelée lors du changement de statut de notation
 */
const StudentAnswersList = ({
  examId,
  onStudentSelect,
  selectedStudentId,
  onGradeStatusChange
}) => {
  // États
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGraded, setFilterGraded] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // État pour la souscription aux mises à jour
  const [subscription, setSubscription] = useState(null);
  
  /**
   * Chargement des données
   */
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      
      try {
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
        const studentsWithExams = studentExams.map(exam => {
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
        setError("Erreur lors du chargement des étudiants: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
    subscribe();

    // Nettoyage
    return () => {
      unsubscribe();
    };
  }, [examId]);

  /**
   * S'abonner aux mises à jour en temps réel
   */
  const subscribe = () => {
    // Annuler la souscription précédente si elle existe
    if (subscription) {
      subscription.unsubscribe();
    }

    // Créer une nouvelle souscription
    const newSubscription = supabase
      .channel('student-exams-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'student_exams',
        filter: `exam_id=eq.${examId}`
      }, (payload) => {
        // Mise à jour d'un examen étudiant
        const updatedExam = payload.new;
        
        setStudents(currentStudents => {
          return currentStudents.map(item => {
            if (item.studentExam.id === updatedExam.id) {
              return {
                ...item,
                studentExam: updatedExam
              };
            }
            return item;
          });
        });
      })
      .subscribe();

    setSubscription(newSubscription);
  };

  /**
   * Se désabonner des mises à jour en temps réel
   */
  const unsubscribe = () => {
    if (subscription) {
      subscription.unsubscribe();
      setSubscription(null);
    }
  };

  /**
   * Appliquer les filtres quand les données changent
   */
  useEffect(() => {
    applyFiltersAndSort();
  }, [students, searchTerm, filterGraded, sortField, sortDirection]);

  /**
   * Appliquer les filtres et les tris
   */
  const applyFiltersAndSort = () => {
    // Filtrage
    let filtered = [...students];
    
    // Filtre de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(({ student }) => {
        return (
          student.name.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term)
        );
      });
    }
    
    // Filtre de notation
    if (filterGraded !== null) {
      filtered = filtered.filter(({ studentExam }) => {
        return studentExam.graded === filterGraded;
      });
    }
    
    // Tri
    filtered = filtered.sort((a, b) => {
      let comparison = 0;
      
      // Tri par différents champs
      if (sortField === 'name') {
        comparison = a.student.name.localeCompare(b.student.name);
      } else if (sortField === 'status') {
        comparison = a.studentExam.status.localeCompare(b.studentExam.status);
      } else if (sortField === 'score') {
        const scoreA = a.studentExam.score || 0;
        const scoreB = b.studentExam.score || 0;
        comparison = scoreA - scoreB;
      } else if (sortField === 'incidents') {
        comparison = (a.studentExam.has_incidents ? 1 : 0) - (b.studentExam.has_incidents ? 1 : 0);
      }
      
      // Inverser pour le tri descendant
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredStudents(filtered);
  };
  
  /**
   * Changer le filtre de notation
   */
  const toggleGradedFilter = () => {
    if (filterGraded === null) {
      setFilterGraded(true);
    } else if (filterGraded === true) {
      setFilterGraded(false);
    } else {
      setFilterGraded(null);
    }
  };
  
  /**
   * Changer le tri
   * @param {string} field Champ de tri
   */
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  /**
   * Obtenir la couleur du statut
   * @param {string} status Statut de l'examen
   * @returns {string} Couleur du statut pour Material-UI
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'submitted':
        return 'primary';
      case 'abandoned':
        return 'error';
      default:
        return 'default';
    }
  };
  
  /**
   * Obtenir le texte du statut
   * @param {string} status Statut de l'examen
   * @returns {string} Texte correspondant au statut
   */
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'submitted':
        return 'Soumis';
      case 'abandoned':
        return 'Abandonné';
      default:
        return status;
    }
  };
  
  /**
   * Obtenir les initiales d'un nom
   * @param {string} name Nom complet
   * @returns {string} Initiales
   */
  const getInitials = (name) => {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substr(0, 2);
  };

  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Réponses des étudiants
        {!loading && (
          <Chip 
            label={`${filteredStudents.length} étudiant${filteredStudents.length > 1 ? 's' : ''}`} 
            color="primary" 
            size="small" 
            sx={{ ml: 2 }} 
          />
        )}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          placeholder="Rechercher un étudiant..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mr: 1 }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Filtrer par statut de notation">
            <IconButton 
              onClick={toggleGradedFilter}
              color={filterGraded !== null ? 'primary' : 'default'}
            >
              <FilterIcon />
              {filterGraded !== null && (
                <Badge
                  color={filterGraded ? 'success' : 'warning'}
                  variant="dot"
                  overlap="circular"
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Trier les résultats">
            <IconButton 
              onClick={() => toggleSort('name')}
              color={sortField === 'name' ? 'primary' : 'default'}
            >
              <SortIcon sx={{ 
                transform: sortField === 'name' && sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : filteredStudents.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body1" color="textSecondary">
            Aucun étudiant n'a passé cet examen.
          </Typography>
        </Box>
      ) : (
        <List sx={{ 
          overflow: 'auto', 
          flexGrow: 1,
          maxHeight: 'calc(100vh - 250px)'
        }}>
          {filteredStudents.map(({ student, studentExam }) => {
            const isSelected = selectedStudentId === student.id;
            
            return (
              <React.Fragment key={studentExam.id}>
                <ListItemButton
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
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Paper>
  );
};

export default StudentAnswersList;
