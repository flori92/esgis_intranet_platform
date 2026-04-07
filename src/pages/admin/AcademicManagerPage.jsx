import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Divider,
  List, ListItem, ListItemText, ListItemIcon, Button, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, TextField,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Tooltip, Stack, Tab, Tabs
} from '@mui/material';
import {
  AccountBalance as DeptIcon,
  School as FiliereIcon,
  CalendarToday as PromoIcon,
  MenuBook as CourseIcon,
  Person as ProfIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowIcon,
  MoreVert as MoreIcon,
  Assignment as MaquetteIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { 
  getDepartmentsList, 
  getFilieres, 
  getPromotions, 
  getCurriculumTemplates,
  createCurriculumTemplate,
  deleteCurriculumTemplate,
  getCoursesWithDepartments,
  getProfessorsList,
  assignRoleToUser
} from '@/api/admin';
import notificationService from '@/services/NotificationService';

const AcademicManagerPage = () => {
  // Données
  const [departments, setDepartments] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [maquettes, setMaquettes] = useState([]);
  
  // Sélection
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedFiliere, setSelectedFiliere] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Maquette, 1: Promotions
  
  // États UI
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setUploadDialogOpen] = useState(false);
  const [newCourseToMaquette, setNewCourseToMaquette] = useState({
    course_id: '',
    level_code: 'L1',
    semester_code: 'S1',
    credits: 3,
    coefficient: 1
  });

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const [deptsRes, filieresRes, promoRes, coursesRes, maquettesRes] = await Promise.all([
        getDepartmentsList(),
        getFilieres(),
        getPromotions(),
        getCoursesWithDepartments(),
        getCurriculumTemplates()
      ]);
      
      setDepartments(deptsRes.data || []);
      setFilieres(filieresRes.data || []);
      setPromotions(promoRes.data || []);
      setCourses(coursesRes.data || []);
      setMaquettes(maquettesRes.data || []);
    } catch (err) {
      console.error('Error loading academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourseToMaquette = async () => {
    try {
      const payload = {
        ...newCourseToMaquette,
        filiere_id: selectedFiliere.id
      };
      
      const { error } = await createCurriculumTemplate(payload);
      if (error) throw error;
      
      notificationService.success('Cours ajouté à la maquette');
      setUploadDialogOpen(false);
      loadBaseData();
    } catch (err) {
      notificationService.error('Erreur: ' + err.message);
    }
  };

  const handleDeleteFromMaquette = async (id) => {
    if (!window.confirm('Retirer ce cours de la maquette ?')) return;
    try {
      await deleteCurriculumTemplate(id);
      loadBaseData();
    } catch (err) {
      notificationService.error('Erreur lors de la suppression');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Ingénierie Pédagogique
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Gérez l'arborescence des formations, les maquettes de cours et les promotions de l'ESGIS.
      </Typography>

      <Grid container spacing={3}>
        {/* Colonne 1: Départements & Filières */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#003366', color: 'white' }}>
              <Typography variant="h6" display="flex" alignItems="center">
                <DeptIcon sx={{ mr: 1 }} /> Formations
              </Typography>
            </Box>
            <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
              {departments.map((dept) => (
                <React.Fragment key={dept.id}>
                  <ListItem sx={{ bgcolor: alpha('#003366', 0.05) }}>
                    <ListItemText 
                      primary={dept.name} 
                      primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.9rem' }} 
                    />
                  </ListItem>
                  {filieres.filter(f => f.department_id === dept.id).map(filiere => (
                    <ListItem 
                      button 
                      key={filiere.id}
                      selected={selectedFiliere?.id === filiere.id}
                      onClick={() => { setSelectedFiliere(filiere); setSelectedDept(dept); }}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon><FiliereIcon color={selectedFiliere?.id === filiere.id ? 'primary' : 'inherit'} /></ListItemIcon>
                      <ListItemText primary={filiere.name} />
                      <ArrowIcon fontSize="small" color="disabled" />
                    </ListItem>
                  ))}
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Colonne 2: Détails (Maquette ou Promotions) */}
        <Grid item xs={12} md={8}>
          {!selectedFiliere ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '2px dashed #ccc' }}>
              <FiliereIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Sélectionnez une filière pour gérer sa configuration
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {/* Header Filière */}
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'white', borderLeft: '6px solid #003366' }}>
                <Typography variant="overline" color="text.secondary">{selectedDept?.name}</Typography>
                <Typography variant="h5" fontWeight="bold">{selectedFiliere.name}</Typography>
                
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mt: 2 }}>
                  <Tab icon={<MaquetteIcon />} label="Maquette Pédagogique" iconPosition="start" />
                  <Tab icon={<PromoIcon />} label="Promotions & Instances" iconPosition="start" />
                </Tabs>
              </Paper>

              {/* Contenu Maquette */}
              {activeTab === 0 && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardHeader 
                    title="Maquette de cours" 
                    subheader="Définition des cours par niveau pour cette filière"
                    action={
                      <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setUploadDialogOpen(true)}>
                        Ajouter un cours
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent sx={{ p: 0 }}>
                    {['L1', 'L2', 'L3', 'M1', 'M2'].map((lvl) => {
                      const levelMaquette = maquettes.filter(m => m.filiere_id === selectedFiliere.id && m.level_code === lvl);
                      if (levelMaquette.length === 0) return null;
                      
                      return (
                        <Box key={lvl} sx={{ mb: 2 }}>
                          <Box sx={{ p: 1.5, bgcolor: alpha('#003366', 0.03), display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight="bold">{lvl}</Typography>
                            <Chip label={`${levelMaquette.reduce((sum, c) => sum + (c.credits || 0), 0)} Crédits`} size="small" variant="outlined" />
                          </Box>
                          <List dense>
                            {levelMaquette.map((item) => (
                              <ListItem 
                                key={item.id}
                                secondaryAction={
                                  <IconButton edge="end" size="small" onClick={() => handleDeleteFromMaquette(item.id)}>
                                    <DeleteIcon fontSize="small" color="error" />
                                  </IconButton>
                                }
                              >
                                <ListItemIcon><CourseIcon fontSize="small" /></ListItemIcon>
                                <ListItemText 
                                  primary={item.course?.name} 
                                  secondary={`S${item.semester_code} • Coeff: ${item.coefficient} • ${item.credits} Crédits`} 
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      );
                    })}
                    {maquettes.filter(m => m.filiere_id === selectedFiliere.id).length === 0 && (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Aucun cours défini dans la maquette pour cette filière.</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contenu Promotions */}
              {activeTab === 1 && (
                <Grid container spacing={2}>
                  {promotions.filter(p => p.filiere_id === selectedFiliere.id).map((promo) => (
                    <Grid item xs={12} sm={6} key={promo.id}>
                      <Card sx={{ borderRadius: 3, border: '1px solid #eee' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Chip label={promo.academic_year} size="small" color="primary" />
                            <Chip label={promo.level} size="small" variant="outlined" />
                          </Box>
                          <Typography variant="h6" fontWeight="bold">{promo.name}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <Button size="small" variant="outlined" startIcon={<GroupIcon />}>Étudiants</Button>
                            <Button size="small" variant="outlined" startIcon={<ProfIcon />}>Équipe</Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  <Grid item xs={12} sm={6}>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      sx={{ height: '100%', minHeight: 120, borderRadius: 3, borderStyle: 'dashed' }}
                      startIcon={<AddIcon />}
                    >
                      Nouvelle Promotion
                    </Button>
                  </Grid>
                </Grid>
              )}
            </Stack>
          )}
        </Grid>
      </Grid>

      {/* Dialog Ajout Cours */}
      <Dialog open={dialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ajouter un cours à la maquette</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Choisir le cours</InputLabel>
              <Select
                value={newCourseToMaquette.course_id}
                label="Choisir le cours"
                onChange={(e) => setNewCourseToMaquette({...newCourseToMaquette, course_id: e.target.value})}
              >
                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name} ({c.code})</MenuItem>)}
              </Select>
            </FormControl>
            
            <Stack direction="row" spacing={2}>
              <TextField 
                select label="Niveau" fullWidth
                value={newCourseToMaquette.level_code}
                onChange={(e) => setNewCourseToMaquette({...newCourseToMaquette, level_code: e.target.value})}
              >
                {['L1', 'L2', 'L3', 'M1', 'M2'].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </TextField>
              <TextField 
                select label="Semestre" fullWidth
                value={newCourseToMaquette.semester_code}
                onChange={(e) => setNewCourseToMaquette({...newCourseToMaquette, semester_code: e.target.value})}
              >
                {['S1', 'S2'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField 
                label="Crédits" type="number" fullWidth
                value={newCourseToMaquette.credits}
                onChange={(e) => setNewCourseToMaquette({...newCourseToMaquette, credits: e.target.value})}
              />
              <TextField 
                label="Coefficient" type="number" fullWidth
                value={newCourseToMaquette.coefficient}
                onChange={(e) => setNewCourseToMaquette({...newCourseToMaquette, coefficient: e.target.value})}
              />
            </Stack>

            <Button variant="contained" onClick={handleAddCourseToMaquette} fullWidth>
              Enregistrer dans la maquette
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

const alpha = (color, opacity) => {
  return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
};

export default AcademicManagerPage;
