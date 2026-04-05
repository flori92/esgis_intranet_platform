import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid,
  FormControl, InputLabel, Select, MenuItem, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Snackbar, Tooltip, Stack, Divider,
  Accordion, AccordionSummary, AccordionDetails, Avatar
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon, School as SchoolIcon,
  AccountBalance as DeptIcon, Class as FiliereIcon,
  MenuBook as SubjectIcon,
  Assignment as ThesisIcon,
  CollectionsBookmark as LibraryIcon,
  Person as PersonIcon,
  Event as CalendarIcon,
  Save as SaveIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { supabase } from '@/supabase';
import { 
  getDepartmentsWithProfessors, createDepartmentAdmin, updateDepartmentAdmin, deleteDepartmentAdmin,
  getFilieres, createFiliere, updateFiliere, deleteFiliere,
  getCoursesWithDepartments, createCourse, updateCourse, deleteCourse,
  getProfessorsList, getAcademicLevels
} from '@/api/admin';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AcademicManagerPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Data
  const [departments, setDepartments] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [levels, setLevels] = useState([]);
  const [theses, setTheses] = useState([]);
  const [library, setLibrary] = useState([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('dept'); // 'dept', 'filiere', 'course', 'thesis', 'library'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptsRes, filieresRes, coursesRes, profsRes, levelsRes, thesesRes, libRes] = await Promise.all([
        getDepartmentsWithProfessors(),
        getFilieres(),
        getCoursesWithDepartments(),
        getProfessorsList(),
        getAcademicLevels(),
        supabase.from('theses').select('*, student:profiles!student_id(full_name, email), supervisor:profiles!supervisor_id(full_name)'),
        supabase.from('library_resources').select('*').order('title')
      ]);

      setDepartments(deptsRes.data || []);
      setFilieres(filieresRes.data || []);
      setCourses(coursesRes.data || []);
      setProfessors(profsRes.data || []);
      setLevels(levelsRes.data || []);
      setTheses(thesesRes.data || []);
      setLibrary(libRes.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des données académiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setEditingItem(item);
    if (item) {
      if (type === 'thesis') {
        setFormData({ ...item, defense_date: item.defense_date ? item.defense_date.substring(0, 16) : '' });
      } else {
        setFormData({ ...item });
      }
    } else {
      if (type === 'dept') setFormData({ name: '', code: '', description: '', head_professor_id: '' });
      if (type === 'filiere') setFormData({ name: '', code: '', description: '', department_id: '' });
      if (type === 'course') setFormData({ name: '', code: '', credits: 3, department_id: '', level: 'L1', semester: 1, filiere_id: '' });
      if (type === 'library') setFormData({ title: '', author: '', type: 'book', category: '', url: '', year: new Date().getFullYear() });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let res = { error: null };
      if (dialogType === 'dept') {
        const payload = { name: formData.name, code: formData.code, description: formData.description, head_professor_id: formData.head_professor_id || null };
        res = editingItem ? await updateDepartmentAdmin(editingItem.id, payload) : await createDepartmentAdmin(payload);
      } else if (dialogType === 'filiere') {
        const payload = { name: formData.name, code: formData.code, description: formData.description, department_id: formData.department_id };
        res = editingItem ? await updateFiliere(editingItem.id, payload) : await createFiliere(payload);
      } else if (dialogType === 'course') {
        const payload = { name: formData.name, code: formData.code, credits: formData.credits, department_id: formData.department_id, level: formData.level, semester: formData.semester, filiere_id: formData.filiere_id || null };
        res = editingItem ? await updateCourse(editingItem.id, payload) : await createCourse(payload);
      } else if (dialogType === 'thesis') {
        const { error: thesisErr } = await supabase.from('theses').update({ supervisor_id: formData.supervisor_id || null, status: formData.status, defense_date: formData.defense_date || null, room: formData.room || '', grade: formData.grade || null }).eq('id', editingItem.id);
        res = { error: thesisErr };
      } else if (dialogType === 'library') {
        const payload = { title: formData.title, author: formData.author, type: formData.type, category: formData.category, url: formData.url, year: formData.year };
        const { error: libErr } = editingItem 
          ? await supabase.from('library_resources').update(payload).eq('id', editingItem.id)
          : await supabase.from('library_resources').insert(payload);
        res = { error: libErr };
      }

      if (res.error) throw res.error;
      setSuccess('Enregistrement réussi');
      setDialogOpen(false);
      await loadData();
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    setLoading(true);
    try {
      let res = { error: null };
      if (type === 'dept') res = await deleteDepartmentAdmin(id);
      else if (type === 'filiere') res = await deleteFiliere(id);
      else if (type === 'course') res = await deleteCourse(id);
      else if (type === 'thesis') { const { error } = await supabase.from('theses').delete().eq('id', id); res = { error }; }
      else if (type === 'library') { const { error } = await supabase.from('library_resources').delete().eq('id', id); res = { error }; }
      
      if (res.error) throw res.error;
      setSuccess('Suppression réussie');
      await loadData();
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const map = { pending: { label: 'En attente', color: 'default' }, validated: { label: 'Validé', color: 'info' }, scheduled: { label: 'Planifié', color: 'warning' }, completed: { label: 'Terminé', color: 'success' }, rejected: { label: 'Rejeté', color: 'error' } };
    const config = map[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
  };

  if (loading && departments.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SchoolIcon color="primary" fontSize="large" />
          Structure Académique
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DeptIcon />} onClick={() => handleOpenDialog('dept')}>Nouv. Département</Button>
          <Button variant="outlined" startIcon={<FiliereIcon />} onClick={() => handleOpenDialog('filiere')}>Nouvelle Filière</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('course')}>Nouvelle Matière</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} message={success} />

      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<DeptIcon />} label="Départements" iconPosition="start" />
          <Tab icon={<FiliereIcon />} label="Filières" iconPosition="start" />
          <Tab icon={<SubjectIcon />} label="Matières (Pool)" iconPosition="start" />
          <Tab icon={<ThesisIcon />} label="Soutenances" iconPosition="start" />
          <Tab icon={<LibraryIcon />} label="Bibliothèque" iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <Grid container spacing={2}>
              {departments.map(dept => (
                <Grid item xs={12} key={dept.id}>
                  <Accordion variant="outlined">
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                        <Chip label={dept.code} color="primary" size="small" />
                        <Typography fontWeight="bold">{dept.name}</Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Typography variant="caption" color="text.secondary">{filieres.filter(f => f.department_id === dept.id).length} filières • {courses.filter(c => c.department_id === dept.id).length} matières</Typography>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDialog('dept', dept); }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete('dept', dept.id); }}><DeleteIcon fontSize="small" /></IconButton>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" gutterBottom>{dept.description || 'Aucune description'}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" gutterBottom>Filières rattachées :</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {filieres.filter(f => f.department_id === dept.id).map(f => (
                          <Chip key={f.id} label={f.name} variant="outlined" size="small" onDelete={() => handleDelete('filiere', f.id)} onClick={() => handleOpenDialog('filiere', f)} />
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
          )}

          {tabValue === 1 && (
            <TableContainer><Table size="small">
              <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Nom de la Filière</TableCell><TableCell>Département</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>{filieres.map(f => (
                <TableRow key={f.id}><TableCell><Chip label={f.code} size="small" /></TableCell><TableCell><Typography fontWeight="bold">{f.name}</Typography></TableCell><TableCell>{f.departments?.name || 'Inconnu'}</TableCell><TableCell align="right"><IconButton size="small" onClick={() => handleOpenDialog('filiere', f)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => handleDelete('filiere', f.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>
              ))}</TableBody>
            </Table></TableContainer>
          )}

          {tabValue === 2 && (
            <TableContainer><Table size="small">
              <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Matière</TableCell><TableCell>Niv/Sem</TableCell><TableCell>Crédits</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>{courses.map(c => (
                <TableRow key={c.id} hover><TableCell>{c.code}</TableCell><TableCell><Typography variant="body2" fontWeight="medium">{c.name}</Typography>{c.filiere_id && <Typography variant="caption" color="primary">Filière: {filieres.find(f => f.id === c.filiere_id)?.name}</Typography>}</TableCell><TableCell>{c.level} / S{c.semester}</TableCell><TableCell>{c.credits}</TableCell><TableCell align="right"><IconButton size="small" onClick={() => handleOpenDialog('course', c)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => handleDelete('course', c.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>
              ))}</TableBody>
            </Table></TableContainer>
          )}

          {tabValue === 3 && (
            <TableContainer><Table size="small">
              <TableHead><TableRow><TableCell>Étudiant</TableCell><TableCell>Sujet</TableCell><TableCell>Encadreur</TableCell><TableCell>Date Soutenance</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>{theses.map(t => (
                <TableRow key={t.id} hover><TableCell><Typography variant="body2" fontWeight="bold">{t.profiles?.full_name}</Typography></TableCell><TableCell sx={{ maxWidth: 200 }}><Typography variant="body2" noWrap>{t.title}</Typography></TableCell><TableCell>{t.supervisor?.full_name || '--'}</TableCell><TableCell>{t.defense_date ? format(new Date(t.defense_date), 'dd/MM/yy HH:mm') : 'À définir'}</TableCell><TableCell>{getStatusChip(t.status)}</TableCell><TableCell align="right"><IconButton size="small" color="primary" onClick={() => handleOpenDialog('thesis', t)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => handleDelete('thesis', t.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>
              ))}</TableBody>
            </Table></TableContainer>
          )}

          {tabValue === 4 && (
            <TableContainer><Table size="small">
              <TableHead><TableRow><TableCell>Titre</TableCell><TableCell>Auteur</TableCell><TableCell>Type</TableCell><TableCell>Catégorie</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>{library.map(res => (
                <TableRow key={res.id} hover>
                  <TableCell><Typography variant="body2" fontWeight="bold">{res.title}</Typography></TableCell>
                  <TableCell>{res.author}</TableCell>
                  <TableCell><Chip label={res.type} size="small" variant="outlined" /></TableCell>
                  <TableCell>{res.category}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog('library', res)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete('library', res.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></TableContainer>
          )}
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Modifier' : 'Ajouter'} {dialogType}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {dialogType === 'library' ? (
              <>
                <Grid item xs={12}><TextField fullWidth label="Titre de l'ouvrage" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Auteur" value={formData.author || ''} onChange={(e) => setFormData({...formData, author: e.target.value})} /></Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth><InputLabel>Type</InputLabel><Select value={formData.type || 'book'} label="Type" onChange={(e) => setFormData({...formData, type: e.target.value})}><MenuItem value="book">Livre</MenuItem><MenuItem value="pdf">Document PDF</MenuItem><MenuItem value="link">Lien externe</MenuItem></Select></FormControl>
                </Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Catégorie" value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Année" type="number" value={formData.year || ''} onChange={(e) => setFormData({...formData, year: e.target.value})} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="URL / Lien" value={formData.url || ''} onChange={(e) => setFormData({...formData, url: e.target.value})} /></Grid>
              </>
            ) : dialogType === 'thesis' ? (
              <>
                <Grid item xs={12}><Typography variant="subtitle2">Étudiant: {formData.profiles?.full_name}</Typography></Grid>
                <Grid item xs={12}><FormControl fullWidth><InputLabel>Encadreur</InputLabel><Select value={formData.supervisor_id || ''} label="Encadreur" onChange={(e) => setFormData({...formData, supervisor_id: e.target.value})}><MenuItem value="">-- Aucun --</MenuItem>{professors.map(p => <MenuItem key={p.id} value={p.profile_id}>{p.profiles?.full_name}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6}><TextField fullWidth type="datetime-local" label="Date" value={formData.defense_date || ''} onChange={(e) => setFormData({...formData, defense_date: e.target.value})} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Salle" value={formData.room || ''} onChange={(e) => setFormData({...formData, room: e.target.value})} /></Grid>
                <Grid item xs={6}><FormControl fullWidth><InputLabel>Statut</InputLabel><Select value={formData.status} label="Statut" onChange={(e) => setFormData({...formData, status: e.target.value})}><MenuItem value="pending">En attente</MenuItem><MenuItem value="validated">Validé</MenuItem><MenuItem value="scheduled">Planifié</MenuItem><MenuItem value="completed">Terminé</MenuItem></Select></FormControl></Grid>
                <Grid item xs={6}><TextField fullWidth label="Note / 20" type="number" value={formData.grade || ''} onChange={(e) => setFormData({...formData, grade: e.target.value})} /></Grid>
              </>
            ) : (
              /* Same logic for dept, filiere, course */
              <>
                <Grid item xs={4}><TextField fullWidth label="Code" value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} /></Grid>
                <Grid item xs={8}><TextField fullWidth label="Nom" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} /></Grid>
                {dialogType === 'dept' && <Grid item xs={12}><FormControl fullWidth><InputLabel>Responsable</InputLabel><Select value={formData.head_professor_id || ''} label="Responsable" onChange={(e) => setFormData({...formData, head_professor_id: e.target.value})}><MenuItem value="">-- Aucun --</MenuItem>{professors.map(p => <MenuItem key={p.id} value={p.profile_id}>{p.profiles?.full_name}</MenuItem>)}</Select></FormControl></Grid>}
                {(dialogType === 'filiere' || dialogType === 'course') && <Grid item xs={12}><FormControl fullWidth><InputLabel>Département</InputLabel><Select value={formData.department_id || ''} label="Département" onChange={(e) => setFormData({...formData, department_id: e.target.value})}>{departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}</Select></FormControl></Grid>}
                <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Sauvegarder</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicManagerPage;
