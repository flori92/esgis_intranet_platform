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
} from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getProfileById } from '@/api/profile';
import { getRoleEntities } from '@/api/users';
import { getStudentPublishedGrades } from '@/api/grades';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Page affichant la relève de notes officielbde l'étudiant
 * Peut être téléchargée en PDF
 */
const TranscriptPage = () => {
  const { authState } = useAuth();
  const [grades, setGrades] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCredits: 0,
    earnedCredits: 0,
    gpa: '0.00',
    averageGrade: '0.00',
  });

  // Charger les données
  useEffect(() => {
    if (authState?.user?.id) {
      loadTranscript();
    }
  }, [authState?.user?.id]);

  const loadTranscript = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'info étudiant
      const { profile: profileData } = await getProfileById(authState.user.id);

      const { studentEntity: studentData } = await getRoleEntities(authState.user.id);

      setStudentInfo({
        ...profileData,
        student_id: studentData?.student_id,
        level: studentData?.level,
      });

      // Charger les notes publiées avec cours
      const { data: gradesData, error: gradesError } = await getStudentPublishedGrades(studentData?.id || authState.user.id);

      if (gradesError) throw gradesError;

      setGrades(gradesData || []);

      // Calculer statistiques
      calculateStats(gradesData || []);
    } catch (err) {
      console.error('Erreur chargement relève:', err);
      setError('Impossible de charger la relève de notes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (gradesData) => {
    if (!gradesData.length) {
      setStats({
        totalCredits: 0,
        earnedCredits: 0,
        gpa: '0.00',
        averageGrade: '0.00',
      });
      return;
    }

    let totalCredits = 0;
    let earnedCredits = 0;
    let totalScore = 0;

    gradesData.forEach(g => {
      const credits = g.course?.credits || 3;
      totalCredits += credits;

      if (g.is_published && g.score >= 10) {
        // Hypothèse: 10/20 est minimum pour valider
        earnedCredits += credits;
      }

      if (g.score) {
        totalScore += g.score;
      }
    });

    const averageGrade = totalScore / gradesData.length;
    const gpa = (averageGrade / 20) * 4.0; // Conversion en GPA

    setStats({
      totalCredits,
      earnedCredits,
      gpa: gpa.toFixed(2),
      averageGrade: averageGrade.toFixed(2),
    });
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = margin;

      // En-tête
      doc.setFontSize(20);
      doc.text('RELEVÉ DE NOTES OFFICIEL', margin, yPosition);
      yPosition += 15;

      // Informations étudiant
      doc.setFontSize(11);
      doc.text(`Étudiant: ${studentInfo?.full_name || 'N/A'}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Numéro étudiant: ${studentInfo?.student_id || 'N/A'}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Niveau: ${studentInfo?.level || 'N/A'}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Date d'édition: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition);
      yPosition += 15;

      // Tableau des notes
      const tableData = grades.map(g => [
        g.course?.code || 'N/A',
        g.course?.name || 'N/A',
        (g.score || 0).toFixed(2),
        (g.course?.credits || 3).toString(),
        g.score >= 10 ? 'Validé' : 'Échoué',
      ]);

      // @ts-ignore
      doc.autoTable({
        head: [['Code', 'Matière', 'Note/20', 'Crédits', 'Statut']],
        body: tableData,
        startY: yPosition,
        margin: margin,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // @ts-ignore
      yPosition = doc.lastAutoTable.finalY + 10;

      // Résumé statistiques
      doc.setFontSize(12);
      doc.text('RÉSUMÉ', margin, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.text(`Moyenne générale: ${stats.averageGrade}/20`, margin, yPosition);
      yPosition += 6;
      doc.text(`GPA: ${stats.gpa}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Crédits obtenus: ${stats.earnedCredits}/${stats.totalCredits}`, margin, yPosition);

      // Pied de page
      doc.setFontSize(8);
      doc.text(
        `Généré le ${new Date().toLocaleString('fr-FR')}`,
        margin,
        pageHeight - margin,
      );

      doc.save(`releve_notes_${studentInfo?.student_id || 'etudiant'}.pdf`);
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
        Relevé de Notes Officiel
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Moyenne
              </Typography>
              <Typography variant="h5">{stats.averageGrade}/20</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                GPA
              </Typography>
              <Typography variant="h5">{stats.gpa}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Crédits Validés
              </Typography>
              <Typography variant="h5">
                {stats.earnedCredits}/{stats.totalCredits}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Taux Validation
              </Typography>
              <Typography variant="h5">
                {stats.totalCredits > 0
                  ? ((stats.earnedCredits / stats.totalCredits) * 100).toFixed(0)
                  : 0}
                %
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Tableau des notes */}
      <Typography variant="h6" gutterBottom>
        Détail des Notes par Matière
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Code</TableCell>
              <TableCell>Matière</TableCell>
              <TableCell align="right">Note/20</TableCell>
              <TableCell align="right">Crédits</TableCell>
              <TableCell>Semestre</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucune note publiée
                </TableCell>
              </TableRow>
            ) : (
              grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell>{grade.course?.code || 'N/A'}</TableCell>
                  <TableCell>{grade.course?.name || 'N/A'}</TableCell>
                  <TableCell align="right">{(grade.score || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{grade.course?.credits || 3}</TableCell>
                  <TableCell>S{grade.course?.semester || 'N/A'}</TableCell>
                  <TableCell>
                    {grade.score >= 10 ? (
                      <Typography sx={{ color: 'green', fontWeight: 'bold' }}>
                        Validé
                      </Typography>
                    ) : (
                      <Typography sx={{ color: 'red', fontWeight: 'bold' }}>
                        Échoué
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={generatePDF}
          disabled={grades.length === 0}
        >
          Télécharger PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
          disabled={grades.length === 0}
        >
          Imprimer
        </Button>
      </Box>
    </Box>
  );
};

export default TranscriptPage;
