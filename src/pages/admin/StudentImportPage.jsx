import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/supabase';
import Papa from 'papaparse';

/**
 * Page Admin pour importer les étudiants via fichier CSV
 */
const StudentImportPage = () => {
  const { authState } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    success: 0,
    failed: 0,
    warning: 0,
  });

  const EXPECTED_COLUMNS = [
    'student_id',
    'full_name',
    'email',
    'phone',
    'level',
    'department_id',
  ];

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreview([]);

    // Parser le CSV pour aperçu
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Valider les colonnes
        if (results.data.length === 0) {
          setError('Le fichier est vide');
          return;
        }

        const fileColumns = Object.keys(results.data[0]);
        const missingColumns = EXPECTED_COLUMNS.filter(
          col => !fileColumns.includes(col),
        );

        if (missingColumns.length > 0) {
          setError(
            `Colonnes manquantes: ${missingColumns.join(', ')}`,
          );
          return;
        }

        setPreview(results.data.slice(0, 5)); // Aperçu 5 lignes
      },
      error: (error) => {
        setError(`Erreur parsing CSV: ${error.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const students = results.data;
          const importResults = {
            success: [],
            failed: [],
            warnings: [],
          };

          // Pour chaque étudiant
          for (const student of students) {
            try {
              // Valider les données
              if (!student.student_id || !student.email) {
                importResults.failed.push({
                  ...student,
                  error: 'ID étudiant ou email manquant',
                });
                continue;
              }

              // Vérifier si l'étudiant existe déjà
              const { data: existing } = await supabase
                .from('students')
                .select('id')
                .eq('student_id', student.student_id)
                .single();

              if (existing) {
                importResults.warnings.push({
                  ...student,
                  warning: 'Étudiant déjà existant',
                });
                continue;
              }

              // Créer le profil
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .insert({
                  full_name: student.full_name,
                  email: student.email,
                  phone: student.phone,
                  email_notifications: true,
                });

              if (profileError) throw profileError;
              // @ts-ignore - Null check is done, profile is not null after this line
              const profileId = profile?.[0]?.id;
              if (!profileId) throw new Error('Profile creation failed');

              // Créer l'étudiant
              const { data: newStudent, error: studentError } = await supabase
                .from('students')
                .insert({
                  profile_id: profileId,
                  student_id: student.student_id,
                  level: parseInt(student.level) || 1,
                  department_id: parseInt(student.department_id) || null,
                  status: 'actif',
                });

              if (studentError) throw studentError;

              importResults.success.push(student);
            } catch (err) {
              console.error('Erreur import étudiant:', err);
              importResults.failed.push({
                ...student,
                error: err.message,
              });
            }
          }

          setResults(importResults);
          setStats({
            success: importResults.success.length,
            failed: importResults.failed.length,
            warning: importResults.warnings.length,
          });

          setDialogOpen(true);
        },
        error: (error) => {
          setError(`Erreur parsing CSV: ${error.message}`);
        },
      });
    } catch (err) {
      console.error('Erreur import:', err);
      setError('Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      EXPECTED_COLUMNS.join(','),
      '123456,Dupont Jean,jean.dupont@esgis.net,+33612345678,1,1',
      '123457,Martin Alice,alice.martin@esgis.net,+33612345679,2,1',
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(template),
    );
    element.setAttribute('download', 'template_import_etudiants.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Import d'Étudiants
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Section Upload */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Fichier d'Import
            </Typography>

            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                mb: 2,
                cursor: 'pointer',
                backgroundColor: file ? '#f0f7ff' : '#f9f9f9',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: '#1976d2',
                  backgroundColor: '#f0f7ff',
                },
              }}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <UploadIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
                <Typography variant="body1">
                  {file ? file.name : 'Cliquez pour sélectionner ou déposez un fichier CSV'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Formats acceptés: CSV
                </Typography>
              </label>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={!file || importing}
                startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {importing ? 'Import en cours...' : 'Importer'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleDownloadTemplate}
                startIcon={<DownloadIcon />}
              >
                Télécharger Template
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Section Format */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Format Attendu
            </Typography>

            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Le fichier CSV doit contenir les colonnes suivantes:
            </Typography>

            <List dense>
              {EXPECTED_COLUMNS.map(col => (
                <ListItem key={col}>
                  <ListItemIcon>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={col}
                    secondary={
                      col === 'level'
                        ? '1-5 (L1-M2)'
                        : col === 'department_id'
                        ? 'ID du département'
                        : undefined
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Exemple:
                </Typography>
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem' }}>
{`student_id,full_name,email,phone,level,department_id
123456,Dupont Jean,jean@esgis.net,+33612345678,1,1
123457,Martin Alice,alice@esgis.net,+33612345679,2,1`}
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>

      {/* Aperçu du fichier */}
      {preview.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Aperçu ({preview.length} lignes)
          </Typography>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  {EXPECTED_COLUMNS.map(col => (
                    <TableCell key={col}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.map((row, idx) => (
                  <TableRow key={idx}>
                    {EXPECTED_COLUMNS.map(col => (
                      <TableCell key={col}>{row[col] || '-'}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Résultats Import */}
      {results && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Résultats de l'Import</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Succès
                      </Typography>
                      <Typography variant="h6">{stats.success}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {stats.warning > 0 && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Avertissements
                        </Typography>
                        <Typography variant="h6">{stats.warning}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {stats.failed > 0 && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Erreurs
                        </Typography>
                        <Typography variant="h6">{stats.failed}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {results.failed.length > 0 && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Erreurs:
                  </Typography>
                  <List dense>
                    {results.failed.map((item, idx) => (
                      <ListItem key={idx}>
                        <ErrorIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {item.student_id}: {item.error}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default StudentImportPage;
