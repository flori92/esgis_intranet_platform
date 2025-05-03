/* 
 * REFACTORISATION: Ce fichier a été mis à jour pour utiliser les nouveaux types
 * et fonctions d'adaptation de données provenant de l'API Supabase.
 * 
 * Les précédentes incompatibilités de type ont été résolues en:
 * 1. Utilisant les types définis dans src/types/supabase.types.ts
 * 2. Utilisant les fonctions d'adaptation dans src/utils/supabase-adapters.ts
 * 3. Corrigeant les conversions de types et les valeurs par défaut
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

import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase';
import { adaptExamResult } from '../../utils/supabase-adapters';
import { ExamResultWithUI, CourseAverage, SemesterAverage, CourseStatus } from '../../types/supabase.types';

export default function GradesPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<ExamResultWithUI[]>([]);
  const [courseAverages, setCourseAverages] = useState<CourseAverage[]>([]);
  const [semesterAverages, setSemesterAverages] = useState<SemesterAverage[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-2025');
  const [academicYears] = useState<string[]>(['2024-2025']);

  // Fonction pour gérer le changement d'année académique
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleYearChange = (event: any) => {
    // Utilisation directe de la valeur sécurisée
    setSelectedAcademicYear(String(event.target.value));
  };

  // Fonction pour gérer le changement de semestre
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSemesterChange = (event: any) => {
    // Utilisation directe de la valeur sécurisée
    setSelectedSemester(String(event.target.value));
  };

  // Calculer les moyennes par cours et par semestre
  const calculateAveragesRef = useRef((results: ExamResultWithUI[]) => {
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
    }, {} as Record<number, ExamResultWithUI[]>);

    // Calculer les moyennes par cours
    const coursesAvg: CourseAverage[] = Object.keys(courseGroups).map(courseIdStr => {
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
      const status: CourseStatus = average !== null && average >= 10 ? 'passed' : 'pending';

      return {
        course_id: courseId,
        course_name: firstResult.course_name,
        course_code: firstResult.course_code,
        semester: firstResult.semester,
        average,
        status
      };
    });

    // Regrouper par semestre
    const semesterGroups = coursesAvg.reduce((groups, course) => {
      const semesterKey = `${selectedAcademicYear}-${course.semester}`;
      if (!groups[semesterKey]) {
        groups[semesterKey] = [];
      }
      groups[semesterKey].push(course);
      return groups;
    }, {} as Record<string, CourseAverage[]>);

    // Calculer les moyennes par semestre
    const semestersAvg: SemesterAverage[] = Object.keys(semesterGroups).map(semesterKey => {
      const [academicYear, semesterStr] = semesterKey.split('-');
      const semester = Number(semesterStr);
      const courses = semesterGroups[semesterKey];
      
      let totalCredits = 0;
      let validatedCredits = 0;
      let weightedSum = 0;
      
      courses.forEach(course => {
        // Simuler des crédits basés sur le semestre (en réalité, cela viendrait de la base de données)
        const credits = 3;
        totalCredits += credits;
        
        if (course.average !== null) {
          weightedSum += course.average * credits;
          if (course.average >= 10) {
            validatedCredits += credits;
          }
        }
      });

      const average = totalCredits > 0 ? weightedSum / totalCredits : null;
      // Utiliser les valeurs du type CourseStatus
      const status: CourseStatus = validatedCredits >= totalCredits * 0.75 ? 'passed' : 'pending';

      return {
        academic_year: academicYear,
        semester,
        average,
        status,
        total_credits: totalCredits,
        validated_credits: validatedCredits
      };
    });

    // Mettre à jour les états
    setCourseAverages(coursesAvg);
    setSemesterAverages(semestersAvg);
  });

  // Utiliser useRef pour maintenir une référence stable à la fonction
  const handleFetchExamsRef = useRef(async () => {
    if (!authState?.student?.id) {
      setError("Vous devez être connecté pour voir vos notes");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: examResults, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_id', authState.student.id);

      if (error) throw error;
      if (!examResults) throw new Error('Aucun résultat trouvé');

      const adaptedResults = examResults.map(adaptExamResult);
      setExamResults(adaptedResults);
      // Calculer les moyennes après avoir chargé les résultats
      if (calculateAveragesRef.current) {
        calculateAveragesRef.current(adaptedResults);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des examens:', error);
      setError('Impossible de charger les résultats des examens');
    } finally {
      setLoading(false);
    }
  });

  // Mettre à jour la référence lorsque authState.student?.id change
  useEffect(() => {
    handleFetchExamsRef.current = async () => {
      if (!authState?.student?.id) {
        setError("Vous devez être connecté pour voir vos notes");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: examResults, error } = await supabase
          .from('exam_results')
          .select('*')
          .eq('student_id', authState.student.id);

        if (error) throw error;
        if (!examResults) throw new Error('Aucun résultat trouvé');

        const adaptedResults = examResults.map(adaptExamResult);
        setExamResults(adaptedResults);
        // Calculer les moyennes après avoir chargé les résultats
        if (calculateAveragesRef.current) {
          calculateAveragesRef.current(adaptedResults);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des examens:', error);
        setError('Impossible de charger les résultats des examens');
      } finally {
        setLoading(false);
      }
    };
  }, [authState.student?.id]);

  // Appeler la fonction de récupération des examens uniquement au premier rendu
  useEffect(() => {
    const fetchExams = handleFetchExamsRef.current;
    if (fetchExams) {
      fetchExams();
    }
  }, []);

  // Filtrer les résultats en fonction du semestre et de l'année sélectionnés
  const filteredResults = examResults.filter(result => {
    const semesterMatch = selectedSemester === 'all' || result.semester.toString() === selectedSemester;
    // Note: Normalement, nous filtrerions également sur l'année académique, mais nous n'avons pas cette information dans le modèle actuel
    return semesterMatch;
  });

  // Rendu de l'en-tête du tableau
  const renderTableHeader = () => (
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ fontSize: '1.1rem' }}>
          Notes et résultats
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Cours</TableCell>
        <TableCell>Examen</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Date</TableCell>
        <TableCell>Coefficient</TableCell>
        <TableCell>Note</TableCell>
        <TableCell>Statut</TableCell>
      </TableRow>
    </TableHead>
  );

  // Fonction utilitaire pour afficher une note sur 20
  const formatGrade = (grade: number | null): string => {
    if (grade === null) return '-';
    return grade.toFixed(2) + '/20';
  };

  // Fonction pour afficher une barre de progression avec couleur selon la valeur
  const renderProgressBar = (value: number | null) => {
    if (value === null) return <Typography color="text.secondary">Non évalué</Typography>;
    
    const normalizedValue = Math.min(Math.max(value, 0), 20); // Limiter entre 0 et 20
    const percentage = (normalizedValue / 20) * 100; // Convertir en pourcentage
    
    let color: 'error' | 'success' | 'info' | 'warning' = 'error';
    if (normalizedValue >= 16) color = 'success';
    else if (normalizedValue >= 12) color = 'info';
    else if (normalizedValue >= 10) color = 'warning';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            color={color}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{normalizedValue.toFixed(2)}</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mes notes
      </Typography>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
          <Box sx={{ mb: 3 }}>
            <FormControl sx={{ mr: 2, minWidth: 200 }}>
              <InputLabel id="academic-year-label">Année académique</InputLabel>
              <Select
                labelId="academic-year-label"
                value={selectedAcademicYear}
                label="Année académique"
                onChange={handleYearChange}
              >
                {academicYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="semester-label">Semestre</InputLabel>
              <Select
                labelId="semester-label"
                value={selectedSemester}
                label="Semestre"
                onChange={handleSemesterChange}
              >
                <MenuItem value="all">Tous les semestres</MenuItem>
                <MenuItem value="1">Semestre 1</MenuItem>
                <MenuItem value="2">Semestre 2</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab icon={<AssignmentIcon />} label="Notes détaillées" />
              <Tab icon={<SchoolIcon />} label="Moyennes" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <TableContainer component={Paper}>
              <Table>
                {renderTableHeader()}
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>{result.course_code}</TableCell>
                      <TableCell>{result.exam_title}</TableCell>
                      <TableCell>{result.exam_type}</TableCell>
                      <TableCell>
                        {result.exam_date ? new Date(result.exam_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{result.exam_weight}</TableCell>
                      <TableCell>
                        {result.grade !== null ? (
                          <Chip 
                            label={`${result.grade}/${result.max_grade}`}
                            color={result.grade >= result.max_grade * 0.6 ? "success" : "error"}
                          />
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={result.status}
                          color={result.status === 'graded' ? "success" : "warning"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <Box>
              {/* Moyennes Semestrielles */}
              <Typography variant="h6" gutterBottom>
                Moyennes semestrielles
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {semesterAverages.length > 0 ? (
                  semesterAverages.map((semester, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {`Semestre ${semester.semester} (${semester.academic_year})`}
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
                        <TableCell align="center" sx={{ padding: 3 }}>
                          Aucune donnée disponible pour ce semestre.
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell />
                        <TableCell />
                        <TableCell />
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
