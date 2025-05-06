import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';

/**
 * Composant de formulaire pour créer ou modifier un groupe de TP
 */
const GroupForm = ({
  onSubmit,
  loading,
  error,
  success,
  group = null,
  courses = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    course_id: '',
    max_students: '',
    is_active: true
  });

  // Initialiser le formulaire avec les données du groupe si disponibles
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        course_id: group.course_id || '',
        max_students: group.max_students || '',
        is_active: group.is_active !== undefined ? group.is_active : true
      });
    }
  }, [group]);

  // Gérer le changement des champs du formulaire
  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_active' ? checked : value
    }));
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Convertir max_students en nombre si présent
    const formattedData = {
      ...formData,
      max_students: formData.max_students ? parseInt(formData.max_students, 10) : null
    };
    
    onSubmit(formattedData, group?.id);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {group ? 'Modifier le groupe' : 'Créer un nouveau groupe'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {group ? 'Groupe modifié avec succès !' : 'Groupe créé avec succès !'}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Nom du groupe"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />

            {courses.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Cours associé</InputLabel>
                <Select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  label="Cours associé"
                  required
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Nombre maximum d'étudiants"
              name="max_students"
              type="number"
              value={formData.max_students}
              onChange={handleChange}
              fullWidth
              InputProps={{ inputProps: { min: 1 } }}
              helperText="Laissez vide pour un nombre illimité"
            />

            <FormControlLabel
              control={
                <Switch
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Groupe actif"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={24} /> : null}
            >
              {loading ? 'Enregistrement...' : group ? 'Mettre à jour' : 'Créer'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
};

GroupForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.bool,
  group: PropTypes.object,
  courses: PropTypes.array
};

export default GroupForm;
