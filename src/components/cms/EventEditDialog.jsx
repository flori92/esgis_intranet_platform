import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Typography,
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

/**
 * Composant pour éditer/créer un événement
 */
export const EventEditDialog = ({ open, event, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    event || {
      title: '',
      description: '',
      start_date: new Date(),
      end_date: null,
      location: '',
      category: 'general',
      image_url: '',
      is_published: false
    }
  );

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
    if (!formData.start_date) newErrors.start_date = 'La date de début est requise';
    if (formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = 'La date de fin doit être après la date de début';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
        {event ? 'Éditer l\'événement' : 'Créer un nouvel événement'}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 3 }}>
        <TextField
          fullWidth
          label="Titre"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          placeholder="Titre de l'événement"
        />

        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          multiline
          rows={3}
          placeholder="Description de l'événement"
        />

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          <DateTimePicker
            label="Date et heure de début"
            value={new Date(formData.start_date)}
            onChange={(newValue) => handleChange('start_date', newValue)}
            sx={{ width: '100%' }}
          />

          <DateTimePicker
            label="Date et heure de fin (optionnel)"
            value={formData.end_date ? new Date(formData.end_date) : null}
            onChange={(newValue) => handleChange('end_date', newValue)}
            sx={{ width: '100%' }}
          />
        </LocalizationProvider>

        <TextField
          fullWidth
          label="Lieu"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Lieu de l'événement"
        />

        <FormControl fullWidth>
          <InputLabel>Catégorie</InputLabel>
          <Select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            label="Catégorie"
          >
            <MenuItem value="general">Général</MenuItem>
            <MenuItem value="academique">Académique</MenuItem>
            <MenuItem value="social">Social</MenuItem>
            <MenuItem value="sports">Sports</MenuItem>
            <MenuItem value="culture">Culture</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="URL de l'image"
          value={formData.image_url}
          onChange={(e) => handleChange('image_url', e.target.value)}
          placeholder="https://example.com/image.jpg"
          type="url"
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.is_published}
              onChange={(e) => handleChange('is_published', e.target.checked)}
            />
          }
          label="Publié"
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSave} variant="contained">
          {event ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventEditDialog;
