import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stepper,
  Step,
  StepLabel,
  Tab,
  Tabs
} from '@mui/material';
import { 
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';

/**
 * Page de gestion des stages pour les étudiants
 * @returns {JSX.Element} Composant de page de stages
 */
const StudentInternshipsPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [newInternshipDialogOpen, setNewInternshipDialogOpen] = useState(false);
  const [newInternship, setNewInternship] = useState({
    company_name: '',
    location: '',
    supervisor_name: '',
    supervisor_email: '',
    start_date: '',
    end_date: '',
    description: '',
    type: 'stage'
  });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchInternships();
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      setFilteredInternships(internships);
    } else if (tabValue === 1) {
      setFilteredInternships(internships.filter(internship => internship.status === 'pending'));
    } else if (tabValue === 2) {
      setFilteredInternships(internships.filter(internship => internship.status === 'active'));
    } else if (tabValue === 3) {
      setFilteredInternships(internships.filter(internship => internship.status === 'completed'));
    }
  }, [tabValue, internships]);

  /**
   * Récupérer les stages
   */
  const fetchInternships = async () => {
    setLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté et est un étudiant
      if (!authState.user || !authState.isStudent) {
        throw new Error('Accès non autorisé');
      }

      // Tenter de récupérer les données depuis Supabase
      try {
        const { data, error } = await supabase
          .from('internships')
          .select('*')
          .eq('student_id', authState.user.id)
          .order('start_date', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setInternships(data);
        } else {
          // Si aucune donnée n'est trouvée, utiliser des données fictives
          setInternships([
            {
              id: 1,
              company_name: 'TechSolutions',
              location: 'Lomé, Togo',
              supervisor_name: 'Jean Dupont',
              supervisor_email: 'jean.dupont@techsolutions.com',
              start_date: '2025-06-01',
              end_date: '2025-08-31',
              description: 'Stage de développement web. Missions : développement d\'une application web avec React et Node.js, intégration avec une API REST, tests unitaires.',
              status: 'pending',
              type: 'stage',
              student_id: authState.user.id,
              created_at: '2025-04-15T10:00:00Z',
              updated_at: '2025-04-15T10:00:00Z'
            }
          ]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stages:', error);
        // En cas d'erreur, utiliser des données fictives
        setInternships([
          {
            id: 1,
            company_name: 'TechSolutions',
            location: 'Lomé, Togo',
            supervisor_name: 'Jean Dupont',
            supervisor_email: 'jean.dupont@techsolutions.com',
            start_date: '2025-06-01',
            end_date: '2025-08-31',
            description: 'Stage de développement web. Missions : développement d\'une application web avec React et Node.js, intégration avec une API REST, tests unitaires.',
            status: 'pending',
            type: 'stage',
            student_id: authState.user.id,
            created_at: '2025-04-15T10:00:00Z',
            updated_at: '2025-04-15T10:00:00Z'
          }
        ]);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formater la date pour l'affichage
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return dateString || 'Date non spécifiée';
    }
  };

  /**
   * Obtenir la couleur en fonction du statut
   * @param {string} status - Statut du stage
   * @returns {string} Couleur
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  /**
   * Obtenir le libellé en fonction du statut
   * @param {string} status - Statut du stage
   * @returns {string} Libellé
   */
  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approuvé';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Refusé';
      case 'completed':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  /**
   * Obtenir l'étape actuelle du stage
   * @param {object} internship - Stage
   * @returns {number} Étape actuelle
   */
  const getCurrentStep = (internship) => {
    const now = new Date();
    const startDate = new Date(internship.start_date);
    const endDate = new Date(internship.end_date);
    
    if (internship.status === 'rejected') {
      return -1; // Cas spécial pour les stages refusés
    } else if (now < startDate) {
      return internship.status === 'approved' ? 1 : 0;
    } else if (now >= startDate && now <= endDate) {
      return 2;
    } else {
      return internship.status === 'completed' ? 4 : 3;
    }
  };

  /**
   * Ouvrir le dialogue de détails
   * @param {object} internship - Stage sélectionné
   */
  const handleOpenDialog = (internship) => {
    setSelectedInternship(internship);
    setDialogOpen(true);
  };

  /**
   * Fermer le dialogue de détails
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInternship(null);
  };

  /**
   * Ouvrir le dialogue de nouveau stage
   */
  const handleOpenNewInternshipDialog = () => {
    setNewInternshipDialogOpen(true);
  };

  /**
   * Fermer le dialogue de nouveau stage
   */
  const handleCloseNewInternshipDialog = () => {
    setNewInternshipDialogOpen(false);
    setNewInternship({
      company_name: '',
      location: '',
      supervisor_name: '',
      supervisor_email: '',
      start_date: '',
      end_date: '',
      description: '',
      type: 'stage'
    });
  };

  /**
   * Gérer le changement des champs du nouveau stage
   * @param {object} event - Événement de changement
   */
  const handleNewInternshipChange = (event) => {
    const { name, value } = event.target;
    setNewInternship(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Soumettre un nouveau stage
   */
  const handleSubmitNewInternship = async () => {
    try {
      // Vérifier que tous les champs obligatoires sont remplis
      const requiredFields = ['company_name', 'location', 'supervisor_name', 'supervisor_email', 'start_date', 'end_date', 'description'];
      const missingFields = requiredFields.filter(field => !newInternship[field]);
      
      if (missingFields.length > 0) {
        alert(`Veuillez remplir tous les champs obligatoires: ${missingFields.join(', ')}`);
        return;
      }
      
      // Envoyer le stage via Supabase
      const { error } = await supabase
        .from('internships')
        .insert({
          ...newInternship,
          student_id: authState.user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
      
      // Fermer le dialogue et rafraîchir les stages
      handleCloseNewInternshipDialog();
      fetchInternships();
      
      alert('Demande de stage soumise avec succès');
    } catch (error) {
      console.error('Erreur lors de la soumission du stage:', error);
      alert('Erreur lors de la soumission du stage. Veuillez réessayer.');
    }
  };

  /**
   * Soumettre un rapport de stage
   * @param {object} internship - Stage
   */
  const handleSubmitReport = async (internship) => {
    alert('Fonctionnalité de soumission de rapport en cours de développement');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WorkIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Mes stages
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenNewInternshipDialog}
          >
            Nouvelle demande
          </Button>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Tous" />
          <Tab label="En attente" />
          <Tab label="En cours" />
          <Tab label="Terminés" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredInternships.length > 0 ? (
              filteredInternships.map((internship) => (
                <Grid item xs={12} md={6} key={internship.id}>
                  <Card elevation={3}>
                    <CardHeader
                      title={internship.company_name}
                      subheader={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {internship.location}
                          </Typography>
                        </Box>
                      }
                      action={
                        internship.status === 'pending' && (
                          <Chip 
                            label="En attente" 
                            size="small" 
                            color="warning"
                            sx={{ height: 24 }} 
                          />
                        )
                      }
                    />
                    <Divider />
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Période
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {formatDate(internship.start_date)} - {formatDate(internship.end_date)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Progression
                      </Typography>
                      <Stepper activeStep={getCurrentStep(internship)} alternativeLabel sx={{ mb: 2 }}>
                        <Step>
                          <StepLabel>Soumission</StepLabel>
                        </Step>
                        <Step>
                          <StepLabel>Approbation</StepLabel>
                        </Step>
                        <Step>
                          <StepLabel>En cours</StepLabel>
                        </Step>
                        <Step>
                          <StepLabel>Rapport</StepLabel>
                        </Step>
                        <Step>
                          <StepLabel>Terminé</StepLabel>
                        </Step>
                      </Stepper>
                      
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {internship.description.substring(0, 100)}
                        {internship.description.length > 100 ? '...' : ''}
                      </Typography>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleOpenDialog(internship)}
                      >
                        Voir détails
                      </Button>
                      {internship.status === 'approved' && getCurrentStep(internship) >= 2 && (
                        <Button 
                          size="small" 
                          color="primary"
                          startIcon={<UploadIcon />}
                          onClick={() => handleSubmitReport(internship)}
                        >
                          Soumettre rapport
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                  <WorkIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Aucun stage trouvé
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Vous n'avez pas encore de stage enregistré. Cliquez sur "Nouvelle demande" pour soumettre une demande de stage.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenNewInternshipDialog}
                  >
                    Nouvelle demande
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* Dialogue de détails du stage */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedInternship && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                  {selectedInternship.company_name}
                  {selectedInternship.status === 'pending' && (
                    <Chip 
                      label="En attente" 
                      size="small" 
                      color="warning"
                      sx={{ height: 24, ml: 2 }} 
                    />
                  )}
                  {selectedInternship.status === 'active' && (
                    <Chip 
                      label="En cours" 
                      size="small" 
                      color="info"
                      sx={{ height: 24, ml: 2 }} 
                    />
                  )}
                  {selectedInternship.status === 'completed' && (
                    <Chip 
                      label="Terminé" 
                      size="small" 
                      color="success"
                      sx={{ height: 24, ml: 2 }} 
                    />
                  )}
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Informations générales
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Lieu
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {selectedInternship.location}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Période
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatDate(selectedInternship.start_date)} - {formatDate(selectedInternship.end_date)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body2">
                        {selectedInternship.type === 'stage' ? 'Stage' : 'Alternance'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Maître de stage
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Nom
                      </Typography>
                      <Typography variant="body2">
                        {selectedInternship.supervisor_name}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2">
                        {selectedInternship.supervisor_email}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Description
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedInternship.description}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Fermer</Button>
                {selectedInternship.status === 'approved' && getCurrentStep(selectedInternship) >= 2 && (
                  <Button 
                    color="primary"
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => handleSubmitReport(selectedInternship)}
                  >
                    Soumettre rapport
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Dialogue de nouveau stage */}
        <Dialog
          open={newInternshipDialogOpen}
          onClose={handleCloseNewInternshipDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
              Nouvelle demande de stage
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom de l'entreprise"
                  name="company_name"
                  value={newInternship.company_name}
                  onChange={handleNewInternshipChange}
                  fullWidth
                  required
                  margin="normal"
                />
                <TextField
                  label="Lieu"
                  name="location"
                  value={newInternship.location}
                  onChange={handleNewInternshipChange}
                  fullWidth
                  required
                  margin="normal"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={newInternship.type}
                    onChange={handleNewInternshipChange}
                    label="Type"
                  >
                    <MenuItem value="stage">Stage</MenuItem>
                    <MenuItem value="alternance">Alternance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom du maître de stage"
                  name="supervisor_name"
                  value={newInternship.supervisor_name}
                  onChange={handleNewInternshipChange}
                  fullWidth
                  required
                  margin="normal"
                />
                <TextField
                  label="Email du maître de stage"
                  name="supervisor_email"
                  type="email"
                  value={newInternship.supervisor_email}
                  onChange={handleNewInternshipChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date de début"
                  name="start_date"
                  type="date"
                  value={newInternship.start_date}
                  onChange={handleNewInternshipChange}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date de fin"
                  name="end_date"
                  type="date"
                  value={newInternship.end_date}
                  onChange={handleNewInternshipChange}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description du stage"
                  name="description"
                  value={newInternship.description}
                  onChange={handleNewInternshipChange}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  margin="normal"
                  helperText="Décrivez les missions et objectifs du stage"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNewInternshipDialog}>Annuler</Button>
            <Button 
              onClick={handleSubmitNewInternship} 
              variant="contained" 
              color="primary"
            >
              Soumettre
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default StudentInternshipsPage;
