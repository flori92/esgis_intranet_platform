/* 
 * REFACTORISATION: Ce fichier a été mis à jour pour utiliser les nouveaux types
 * et fonctions d'adaptation de données provenant de l'API Supabase.
 * 
 * Les précédentes incompatibilités de type ont été résolues en:
 * 1. Utilisant les commentaires JSDoc pour documenter les structures de données
 * 2. Corrigeant les conversions de types et les valeurs par défaut
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  LinearProgress
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';

import { useAuth } from '@/hooks/useAuth';
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';

/**
 * @typedef {Object} ExamResultWithUI
 * @property {number} id - ID du résultat d'examen
 * @property {number} exam_id - ID de l'examen
 * @property {string} exam_title - Titre de l'examen
 * @property {number} course_id - ID du cours
 * @property {string} course_name - Nom du cours
 * @property {string} course_code - Code du cours
 * @property {number} student_id - ID de l'étudiant
 * @property {string} student_name - Nom de l'étudiant
 * @property {number|null} grade - Note obtenue
 * @property {number} max_grade - Note maximale possible
 * @property {number} exam_weight - Coefficient de l'examen
 * @property {string} date - Date de l'examen
 * @property {string} type - Type d'examen
 * @property {string} status - Statut du résultat
 * @property {number} semester - Semestre du cours
 * @property {string} academic_year - Année académique
 */

/**
 * @typedef {'passed'|'pending'} CourseStatus
 */

/**
 * @typedef {Object} CourseAverage
 * @property {number} course_id - ID du cours
 * @property {string} course_name - Nom du cours
 * @property {string} course_code - Code du cours
 * @property {number|null} average - Moyenne du cours
 * @property {number} semester - Semestre du cours
 * @property {CourseStatus} status - Statut du cours
 * @property {number} credits - Crédits du cours
 */

/**
 * @typedef {Object} SemesterAverage
 * @property {number} semester - Numéro du semestre
 * @property {number|null} average - Moyenne du semestre
 * @property {number} validated_credits - Crédits validés
 * @property {number} total_credits - Total des crédits
 * @property {CourseStatus} status - Statut du semestre
 */

/**
 * Adapte les données brutes de résultat d'examen au format utilisé par l'UI
 * @param {Object} rawResult - Résultat brut de l'API
 * @returns {ExamResultWithUI} Résultat adapté pour l'UI
 */
function adaptExamResult(rawResult) {
  return {
    id: rawResult.id,
    exam_id: rawResult.exam_id,
    exam_title: rawResult.exams?.title || 'Examen inconnu',
    course_id: rawResult.exams?.course_id || 0,
    course_name: rawResult.exams?.courses?.name || 'Cours inconnu',
    course_code: rawResult.exams?.courses?.code || 'CODE',
    student_id: rawResult.student_id,
    student_name: rawResult.student?.full_name || rawResult.users?.full_name || 'Étudiant inconnu',
    grade: rawResult.grade,
    max_grade: rawResult.exam?.total_points || rawResult.exams?.total_points || 20,
    exam_weight: rawResult.exam?.weight || rawResult.exams?.weight || 1,
    date: rawResult.exam?.date || rawResult.exams?.date || new Date().toISOString(),
    type: rawResult.exam?.type || rawResult.exams?.type || 'unknown',
    status: rawResult.status || 'pending',
    semester: rawResult.exams?.courses?.semester || 1,
    academic_year: rawResult.exams?.exam_sessions?.academic_year || '2024-2025'
  };
}

/**
 * Page d'affichage des notes et moyennes pour un étudiant
 * @returns {JSX.Element} Composant de la page des notes
 */
export default function GradesPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [courseAverages, setCourseAverages] = useState([]);
  const [semesterAverages, setSemesterAverages] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025');
  const [academicYears] = useState(['2024-2025']);

  /**
   * Fonction pour gérer le changement d'année académique
   * @param {Object} event - Événement de changement
   */
  const handleYearChange = (event) => {
    // Utilisation directe de la valeur sécurisée
    setSelectedAcademicYear(String(event.target.value));
  };

  /**
   * Fonction pour gérer le changement de semestre
   * @param {Object} event - Événement de changement
   */
  const handleSemesterChange = (event) => {
    // Utilisation directe de la valeur sécurisée
    setSelectedSemester(String(event.target.value));
  };

  /**
   * Calculer les moyennes par cours et par semestre
   * @param {Array<ExamResultWithUI>} results - Résultats d'examens
   */
  const calculateAveragesRef = useRef((results) => {
    // Filtrer les résultats pour ne garder que ceux avec des notes
    const gradedResults = results.filter(result => 
      result.grade !== null && result.status === 'graded'
    );

    // Regrouper les résultats par cours
    const courseGroups = gradedResults.reduce((groups, result) => {
      const courseId = result.course_id;
      if (!groups[courseId]) {
        groups[courseId] = [];
      }
      groups[courseId].push(result);
      return groups;
    }, {});

    // Calculer les moyennes par cours
    const coursesAvg = Object.keys(courseGroups).map(courseIdStr => {
      const courseId = Number(courseIdStr);
      const courseResults = courseGroups[courseId];
      const firstResult = courseResults[0]; // Pour obtenir les informations du cours

      let weightSum = 0;
      let weightedGradeSum = 0;
      
      courseResults.forEach(result => {
        if (result.grade !== null) {
          const normalizedGrade = (result.grade / result.max_grade) * 20; // Normaliser sur 20
          weightSum += result.exam_weight;
          weightedGradeSum += normalizedGrade * result.exam_weight;
        }
      });

      const average = weightSum > 0 ? weightedGradeSum / weightSum : null;
      // Utiliser les valeurs du type CourseStatus
      const status = average !== null && average >= 10 ? 'passed' : 'pending';

      return {
        course_id: courseId,
        course_name: firstResult.course_name,
        course_code: firstResult.course_code,
        average: average,
        semester: firstResult.semester,
        status: status,
        credits: 3 // Valeur par défaut, à remplacer par la vraie valeur quand disponible
      };
    });

    // Regrouper les cours par semestre
    const semesterGroups = coursesAvg.reduce((groups, course) => {
      const { semester } = course;
      if (!groups[semester]) {
        groups[semester] = [];
      }
      groups[semester].push(course);
      return groups;
    }, {});

    // Calculer les moyennes par semestre
    const semestersAvg = Object.keys(semesterGroups).map(semesterStr => {
      const semester = Number(semesterStr);
      const semesterCourses = semesterGroups[semester];
      
      let totalCredits = 0;
      let validatedCredits = 0;
      let weightedSum = 0;
      
      semesterCourses.forEach(course => {
        const { credits } = course;
        totalCredits += credits;
        
        if (course.status === 'passed') {
          validatedCredits += credits;
        }
        
        if (course.average !== null) {
          weightedSum += course.average * credits;
        }
      });
      
      const average = totalCredits > 0 ? weightedSum / totalCredits : null;
      const status = validatedCredits >= totalCredits * 0.8 ? 'passed' : 'pending';
      
      return {
        semester,
        average,
        validated_credits: validatedCredits,
        total_credits: totalCredits,
        status
      };
    });

    // Trier les moyennes par semestre
    semestersAvg.sort((a, b) => a.semester - b.semester);
    
    // Mettre à jour les états
    setCourseAverages(coursesAvg);
    setSemesterAverages(semestersAvg);
  });

  // Charger les résultats d'examens au chargement de la page
  useEffect(() => {
    const fetchExamResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!authState?.user?.id) {
          throw new Error("Vous devez être connecté pour accéder à vos notes");
        }
        
        // Récupérer les résultats d'examens de l'étudiant
        const { data, error: fetchError } = await supabase
          .from('exam_results')
          .select(`
            id,
            exam_id,
            student_id,
            grade,
            status,
            created_at,
            updated_at,
            exams:exams(
              id, 
              title, 
              date, 
              type, 
              total_points, 
              passing_grade,
              course_id,
              weight,
              courses(
                id,
                name,
                code,
                semester
              )
            ),
            profiles:student_id(
              id, 
              email, 
              full_name
            )
          `)
          .eq('student_id', authState.user.id);
        
        if (fetchError) {
          throw fetchError;
        }
        
        // Adapter les données pour l'UI
        const adaptedResults = data.map(result => adaptExamResult(result));
        
        setExamResults(adaptedResults);
        
        // Calculer les moyennes
        calculateAveragesRef.current(adaptedResults);
      } catch (err) {
        console.error('Erreur lors du chargement des notes:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement des notes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExamResults();
  }, [authState?.user?.id]);

  /**
   * Fonction pour gérer le changement d'onglet
   * @param {Object} _event - Événement de changement
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Filtrer les résultats d'examens selon les critères sélectionnés
   * @returns {Array<ExamResultWithUI>} Résultats filtrés
   */
  const current = () => {
    return examResults
      .filter(result => {
        // Filtrer par année académique
        if (selectedAcademicYear !== 'all' && result.academic_year !== selectedAcademicYear) {
          return false;
        }
        
        // Filtrer par semestre
        if (selectedSemester !== 'all' && result.semester.toString() !== selectedSemester) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Trier par date (plus récent d'abord)
        return new Date(b.date) - new Date(a.date);
      });
  };

  /**
   * Rendu de l'en-tête du tableau
   * @returns {JSX.Element} En-tête du tableau
   */
  const renderTableHeader = () => {
    return (
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Cours</TableCell>
          <TableCell>Examen</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Note</TableCell>
          <TableCell>Statut</TableCell>
        </TableRow>
      </TableHead>
    );
  };

  /**
   * Fonction utilitaire pour afficher une note sur 20
   * @param {number|null} grade - Note à formater
   * @returns {string} Note formatée
   */
  const formatGrade = (grade) => {
    return grade !== null ? `${grade.toFixed(2)}/20` : 'N/A';
  };

  /**
   * Fonction pour afficher une barre de progression avec couleur selon la valeur
   * @param {number|null} value - Valeur de la progression
   * @returns {JSX.Element} Barre de progression
   */
  const renderProgressBar = (value) => {
    if (value === null) {
      return (
        <Box sx={{ width: '100%' }}>
          <LinearProgress variant="determinate" value={0} sx={{ height: 10, borderRadius: 5 }} />
          <Typography variant="caption" color="text.secondary">
            Non évalué
          </Typography>
        </Box>
      );
    }
    
    // Déterminer la couleur en fonction de la valeur
    let color = 'error';
    if (value >= 16) {
      color = 'success';
    } else if (value >= 14) {
      color = 'info';
    } else if (value >= 10) {
      color = 'warning';
    }
    
    const normalizedValue = Math.min(value * 5, 100); // Convertir note/20 en pourcentage (max 100%)
    
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress 
          variant="determinate" 
          value={normalizedValue} 
          color={color}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="caption" color="text.secondary">
          {normalizedValue.toFixed(0)}%
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mes notes et moyennes
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Filtres */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                <InputLabel id="academic-year-label">Année académique</InputLabel>
                <Select
                  labelId="academic-year-label"
                  value={selectedAcademicYear}
                  onChange={handleYearChange}
                  label="Année académique"
                >
                  {academicYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                <InputLabel id="semester-label">Semestre</InputLabel>
                <Select
                  labelId="semester-label"
                  value={selectedSemester}
                  onChange={handleSemesterChange}
                  label="Semestre"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="1">Semestre 1</MenuItem>
                  <MenuItem value="2">Semestre 2</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
          
          {/* Onglets */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Résultats détaillés" icon={<AssignmentIcon />} iconPosition="start" />
              <Tab label="Moyennes" icon={<SchoolIcon />} iconPosition="start" />
            </Tabs>
          </Box>
          
          {/* Contenu des onglets */}
          {tabValue === 0 ? (
            <TableContainer component={Paper}>
              <Table>
                {renderTableHeader()}
                <TableBody>
                  {current().length > 0 ? (
                    current().map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          {new Date(result.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {result.course_code}
                          </Typography>
                          {result.course_name || 'Cours inconnu'}
                        </TableCell>
                        <TableCell>{result.exam_title || 'Examen inconnu'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={result.type === 'midterm' ? 'Partiel' : 
                                  result.type === 'final' ? 'Final' : 
                                  result.type === 'quiz' ? 'Quiz' : 
                                  result.type === 'project' ? 'Projet' : 
                                  result.type === 'practical' ? 'TP' : 
                                  result.type}
                            size="small"
                            color={result.type === 'midterm' ? 'primary' : 
                                  result.type === 'final' ? 'secondary' : 
                                  'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {result.grade !== null ? (
                            <Typography>
                              {result.grade}/{result.max_grade}
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                ({((result.grade / result.max_grade) * 20).toFixed(2)}/20)
                              </Typography>
                            </Typography>
                          ) : (
                            <Typography color="text.secondary">
                              Non noté
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={result.status === 'graded' ? 'Noté' : 
                                  result.status === 'pending' ? 'En attente' : 
                                  result.status === 'absent' ? 'Absent' : 
                                  result.status}
                            color={result.status === 'graded' ? 'success' : 
                                  result.status === 'pending' ? 'warning' : 
                                  result.status === 'absent' ? 'error' : 
                                  'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          Aucun résultat trouvé pour les critères sélectionnés.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box>
              {/* Moyennes par Semestre */}
              <Typography variant="h6" gutterBottom>
                Moyennes par semestre
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {semesterAverages.length > 0 ? (
                  semesterAverages
                    // Filtrer par semestre si nécessaire
                    .filter(semester => selectedSemester === 'all' || semester.semester.toString() === selectedSemester)
                    .map((semester) => (
                    <Grid item xs={12} md={6} lg={4} key={semester.semester}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Semestre {semester.semester}
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Moyenne générale
                            </Typography>
                            <Typography variant="h5">
                              {formatGrade(semester.average)}
                            </Typography>
                            {renderProgressBar(semester.average)}
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography>
                              Crédits validés: {semester.validated_credits}/{semester.total_credits}
                            </Typography>
                            <Chip 
                              label={semester.status === 'passed' ? 'Validé' : 'En cours'} 
                              color={semester.status === 'passed' ? 'success' : 'warning'}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Aucune donnée disponible pour ce semestre.
                    </Alert>
                  </Grid>
                )}
              </Grid>

              {/* Moyennes par Cours */}
              <Typography variant="h6" gutterBottom>
                Moyennes par cours
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Cours</TableCell>
                      <TableCell>Semestre</TableCell>
                      <TableCell>Moyenne</TableCell>
                      <TableCell>Progression</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courseAverages.length > 0 ? (
                      courseAverages
                        // Filtrer par semestre si nécessaire
                        .filter(course => selectedSemester === 'all' || course.semester.toString() === selectedSemester)
                        .map((course) => (
                        <TableRow key={course.course_id}>
                          <TableCell>{course.course_code}</TableCell>
                          <TableCell>{course.course_name}</TableCell>
                          <TableCell>{course.semester}</TableCell>
                          <TableCell>{formatGrade(course.average)}</TableCell>
                          <TableCell sx={{ width: '30%' }}>{renderProgressBar(course.average)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={course.status === 'passed' ? 'Validé' : 'En cours'} 
                              color={course.status === 'passed' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ padding: 3 }}>
                          Aucune donnée disponible pour ce semestre.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
