import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Card, 
  CardContent, CardActions, Chip, Divider, InputAdornment,
  CircularProgress, Alert, List, ListItem, ListItemText,
  ListItemIcon, Tab, Tabs, IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  MenuBook as BookIcon,
  Language as WebIcon,
  Description as FileIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  CollectionsBookmark as LibraryIcon
} from '@mui/icons-material';

import { supabase } from '@/supabase';

/**
 * Page de la Bibliothèque Numérique - ESGIS Campus
 */
const LibraryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        let query = supabase.from('library_resources').select('*').order('title');
        
        if (tabValue === 1) query = query.eq('type', 'book');
        if (tabValue === 2) query = query.eq('type', 'link');
        
        const { data, error } = await query;
        if (error) throw error;
        setResources(data || []);
      } catch (err) {
        console.error('Error fetching library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [tabValue]);

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (res.author && res.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (res.tags && res.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  if (loading && resources.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LibraryIcon color="primary" fontSize="large" />
          Bibliothèque Numérique
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Accédez aux ressources documentaires, ouvrages recommandés et bases de données de recherche.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Rechercher un ouvrage, un auteur, une thématique..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Toutes les ressources" />
        <Tab label="Livres & Manuels" />
        <Tab label="Bases de données" />
        <Tab label="Mes favoris" />
      </Tabs>

      <Grid container spacing={3}>
        {filteredResources.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info">Aucune ressource trouvée pour votre recherche.</Alert>
          </Grid>
        ) : filteredResources.map(res => (
          <Grid item xs={12} sm={6} md={4} key={res.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip 
                    label={res.type.toUpperCase()} 
                    size="small" 
                    icon={res.type === 'link' ? <WebIcon /> : <BookIcon />} 
                    color={res.type === 'link' ? 'secondary' : 'primary'}
                    variant="outlined"
                  />
                  <IconButton size="small"><StarIcon fontSize="small" /></IconButton>
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>{res.title}</Typography>
                <Typography variant="body2" color="text.secondary">{res.author} • {res.year}</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {res.tags.map(tag => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                </Box>
              </CardContent>
              <Divider />
              <CardActions>
                {res.type === 'link' ? (
                  <Button fullWidth startIcon={<WebIcon />} onClick={() => window.open(res.url, '_blank')}>Accéder au site</Button>
                ) : (
                  <Button fullWidth startIcon={<DownloadIcon />}>Télécharger (PDF)</Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LibraryPage;
