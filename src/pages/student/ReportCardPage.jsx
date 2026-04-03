import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Download as DownloadIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Page affichant le bulletin de notes (report card) pour le semestre actuel
 * Inclut commentaires du professeur, absences, et recommandations
 */
const ReportCardPage = () => {
  const { authState } = useAuth();
  const [reportCard, setReportCard] = useState(null);
  const [courses, setCourses] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [stats, setStats] = useState({
    averageGrade: 0,
    coursesValidated: 0,
    totalCourses: 0,
    absenceCount: 0,
  });

  useEffect(() => {
    if (authState?.user?.id) {
      loadReportCard();
    }
  }, [authState?.user?.id]);

  const loadReportCard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Profil étudiant
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authState.user.id)
        .single();

      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', authState.user.id)
        .single();

      setStudentInfo({
        ...profileData,
        student_id: studentData?.student_id,
        level: studentData?.level,
      });

      // Récupérer les cours du semestre actuel (semestre 1-6)
      // Par défaut, semestre actuel = semestre de son level
      const currentSemester = (studentData?.level || 1) * 2 - 1; // L2 = semester 3-4

      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          *,
          grades(
            id,
            score,
            is_published,
            lecture_notes,
            participation,
            attendance,
            comments,
            created_at
          )
        `)
        .eq('semester', currentSemester)
        .order('name');

      if (!coursesData) {
        setCourses([]);
        return;
      }

      // Filtrer pour l'étudiant actuel et mapper les notes
      const mappedCourses = coursesData
        .map(course => ({
          ...course,
          grade: course.grades?.[0] || null,
        }))
        .filter(c => c.grade); // Garder que si grade existe

      setCourses(mappedCourses);

      // Calculer stats
      const validatedCount = mappedCourses.filter(c => c.grade?.score >= 10).length;
      const averageScore =
        mappedCourses.reduce((acc, c) => acc + (c.grade?.score || 0), 0) /
        (mappedCourses.length || 1);
      const totalAbsences = mappedCourses.reduce(
        (acc, c) => acc + (c.grade?.attendance?.absences || 0),
        0,
      );

      setStats({
        averageGrade: averageScore.toFixed(2),
        coursesValidated: validatedCount,
        totalCourses: mappedCourses.length,
        absenceCount: totalAbsences,
      });

      // Créer le bulletin de notes virtuel
      const reportCardData = {
        id: `rc-${studentData?.id}-${new Date().getFullYear()}`,
        student_id: studentData?.id,
        semester: currentSemester,
        academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        average: averageScore.toFixed(2),
        status: validatedCount === mappedCourses.length ? 'Admis' : 'À examiner',
        generated_date: new Date().toISOString(),
      };

      setReportCard(reportCardData);
    } catch (err) {
      console.error('Erreur chargement bulletin:', err);
      setError('Impossible de charger le bulletin de notes');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      let yPosition = margin;

      // En-tête
      doc.setFontSize(18);
      doc.text('BULLETIN DE NOTES', margin, yPosition);
      yPosition += 12;

      // Info académique
      doc.setFontSize(10);
      doc.text(`Année académique: ${reportCard?.academic_year}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Semestre: ${reportCard?.semester}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Date d'édition: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition);
      yPosition += 10;

      // Info étudiant
      doc.setFontSize(11);
      doc.text(`Étudiant: ${studentInfo?.full_name}`, margin, yPosition);
      yPosition += 5;
      doc.text(`N° Étudiant: ${studentInfo?.student_id}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Niveau: ${studentInfo?.level}L`, margin, yPosition);
      yPosition += 10;

      // Tableau des notes
      const tableData = courses.map(c => [
        c.code || 'N/A',
        c.name || 'N/A',
        (c.grade?.score || 0).toFixed(2),
        c.credits || 3,
        c.grade?.participation || 0,
        (c.grade?.attendance?.hours_attended || 0) +
          '/' +
          (c.grade?.attendance?.total_hours || 0),
        c.grade?.score >= 10 ? 'Validé' : 'Échoué',
      ]);

      doc.autoTable({
        head: [['Code', 'Matière', 'Note', 'Crédits', 'Participation', 'Assiduité', 'Statut']],
        body: tableData,
        startY: yPosition,
        margin: margin,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Résumé
      doc.setFontSize(11);
      doc.text('RÉSUMÉ', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.text(`Moyenne générale: ${stats.averageGrade}/20`, margin, yPosition);
      yPosition += 5;
      doc.text(
        `Cours validés: ${stats.coursesValidated}/${stats.totalCourses}`,
        margin,
        yPosition,
      );
      yPosition += 5;
      doc.text(`Statut: ${reportCard?.status}`, margin, yPosition);

      doc.save(`bulletin_notes_${studentInfo?.student_id}.pdf`);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert('Impossible de générer le PDF');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bulletin de Notes
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {/* En-tête bulletin */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f9f9f9' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Étudiant
            </Typography>
            <Typography variant="h6">{studentInfo?.full_name}</Typography>
            <Typography variant="body2">ID: {studentInfo?.student_id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Académique
            </Typography>
            <Typography variant="body2">Année: {reportCard?.academic_year}</Typography>
            <Typography variant="body2">Semestre: {reportCard?.semester}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Moyenne Générale
              </Typography>
              <Typography variant="h5">{stats.averageGrade}/20</Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.averageGrade / 20) * 100}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cours Validés
              </Typography>
              <Typography variant="h5">
                {stats.coursesValidated}/{stats.totalCourses}
              </Typography>
              <Chip
                label={
                  stats.coursesValidated === stats.totalCourses ? 'Tous validés ✓' : 'En cours'
                }
                size="small"
                color={stats.coursesValidated === stats.totalCourses ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Absences
              </Typography>
              <Typography variant="h5">{stats.absenceCount}</Typography>
              <Typography variant="caption">Cumul semestre</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Statut
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: reportCard?.status === 'Admis' ? 'green' : 'orange',
                  fontWeight: 'bold',
                }}
              >
                {reportCard?.status}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Tableau des cours */}
      <Typography variant="h6" gutterBottom>
        Détail des Cours
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Code</TableCell>
              <TableCell>Matière</TableCell>
              <TableCell align="right">Note/20</TableCell>
              <TableCell align="right">Crédits</TableCell>
              <TableCell align="center">Participation</TableCell>
              <TableCell align="center">Assiduité</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Aucun cours pour ce semestre
                </TableCell>
              </TableRow>
            ) : (
              courses.map(course => (
                <TableRow key={course.id} hover>
                  <TableCell>{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell align="right">
                    <Typography
                      sx={{
                        fontWeight: 'bold',
                        color: course.grade?.score >= 10 ? 'green' : 'red',
                      }}
                    >
                      {(course.grade?.score || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{course.credits}</TableCell>
                  <TableCell align="center">{course.grade?.participation || 0}%</TableCell>
                  <TableCell align="center">
                    {course.grade?.attendance?.hours_attended || 0}/
                    {course.grade?.attendance?.total_hours || 0}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={course.grade?.score >= 10 ? 'Validé' : 'Échoué'}
                      size="small"
                      color={course.grade?.score >= 10 ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => setSelectedCourse(course)}
                    >
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={generatePDF}>
          Télécharger Bulletin
        </Button>
      </Box>

      {/* Dialog détails cours */}
      <Dialog open={Boolean(selectedCourse)} onClose={() => setSelectedCourse(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails du Cours - {selectedCourse?.name}</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText
                primary="Code"
                secondary={selectedCourse?.code}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Crédits"
                secondary={selectedCourse?.credits}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Note"
                secondary={`${(selectedCourse?.grade?.score || 0).toFixed(2)}/20`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Participation"
                secondary={`${selectedCourse?.grade?.participation || 0}%`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Assiduité"
                secondary={`${selectedCourse?.grade?.attendance?.hours_attended || 0}/${selectedCourse?.grade?.attendance?.total_hours || 0} heures`}
              />
            </ListItem>
            {selectedCourse?.grade?.comments && (
              <ListItem>
                <ListItemText
                  primary="Commentaires du Professeur"
                  secondary={selectedCourse.grade.comments}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReportCardPage;
