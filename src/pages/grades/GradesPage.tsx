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
  Alert
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';

import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabase';
import { adaptExamResult } from '../../utils/supabase-adapters';
import { ExamResultWithUI } from '../../types/supabase.types';

export default function GradesPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<ExamResultWithUI[]>([]);
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
      } catch (error) {
        console.error('Erreur lors de la récupération des examens:', error);
        setError('Impossible de charger les résultats des examens');
      } finally {
        setLoading(false);
      }
    };
  }, [authState.student?.id]);

  // Effet pour charger les examens au chargement du composant
  useEffect(() => {
    // Assurer que handleFetchExamsRef.current est défini avant d'appeler
    const fetchExams = handleFetchExamsRef.current;
    if (fetchExams) {
      fetchExams();
    }
  }, []);

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
                  {examResults.map((result) => (
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
              <Typography variant="h6" gutterBottom>
                Moyennes par cours
              </Typography>
              {/* TODO: Implémenter l'affichage des moyennes */}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
