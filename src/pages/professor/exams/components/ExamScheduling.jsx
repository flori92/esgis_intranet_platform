import React, { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Grid,
  MenuItem,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  Paper
} from '@mui/material';
// Import des modules date-pickers
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { fr } from 'date-fns/locale';
import { parseISO } from 'date-fns';

/**
 * Composant pour gérer la planification des examens
 * 
 * @param {Object} props Les propriétés du composant
 * @param {string} props.examDate Date de l'examen (format ISO)
 * @param {number} props.duration Durée de l'examen en minutes
 * @param {string} props.timeframeStart Date de début de la plage horaire (format ISO)
 * @param {string} props.timeframeEnd Date de fin de la plage horaire (format ISO)
 * @param {string} props.lateSubmission Politique de soumission tardive
 * @param {Function} props.onExamDateChange Fonction pour mettre à jour la date d'examen
 * @param {Function} props.onDurationChange Fonction pour mettre à jour la durée
 * @param {Function} props.onTimeframeStartChange Fonction pour mettre à jour la date de début
 * @param {Function} props.onTimeframeEndChange Fonction pour mettre à jour la date de fin
 * @param {Function} props.onLateSubmissionChange Fonction pour mettre à jour la politique de soumission tardive
 */
const ExamScheduling = ({
  examDate,
  duration,
  timeframeStart,
  timeframeEnd,
  lateSubmission,
  onExamDateChange,
  onDurationChange,
  onTimeframeStartChange,
  onTimeframeEndChange,
  onLateSubmissionChange
}) => {
  const [errors, setErrors] = useState({});
  
  /**
   * Convertir les chaînes de date en objets Date
   * @param {string} dateString Chaîne de date au format ISO
   * @returns {Date|null} Objet Date ou null en cas d'erreur
   */
  const parseDateString = (dateString) => {
    if (!dateString) return null;
    try {
      return parseISO(dateString);
    } catch (error) {
      console.error('Erreur lors de l\'analyse de la date:', error);
      return null;
    }
  };
  
  /**
   * Gérer le changement de durée
   * @param {Object} event Événement de changement
   */
  const handleDurationChange = (event) => {
    const inputElement = event.target;
    const value = parseInt(inputElement.value, 10);
    if (!isNaN(value) && value > 0) {
      onDurationChange(value);
      
      // Enlever l'erreur si elle existe
      if (errors.duration) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.duration;
          return newErrors;
        });
      }
    } else {
      setErrors(prev => ({
        ...prev,
        duration: 'La durée doit être un nombre positif'
      }));
    }
  };
  
  // Validation des champs
  useEffect(() => {
    const validateFields = () => {
      const newErrors = {};
      
      // Valider la date d'examen
      if (!examDate) {
        newErrors.examDate = 'La date d\'examen est requise';
      }
      
      // Valider la durée
      if (!duration || duration <= 0) {
        newErrors.duration = 'La durée doit être un nombre positif';
      }
      
      // Valider la plage horaire
      if (timeframeStart && timeframeEnd) {
        const start = parseDateString(timeframeStart);
        const end = parseDateString(timeframeEnd);
        
        if (start && end && start >= end) {
          newErrors.timeframe = 'La date de fin doit être postérieure à la date de début';
        }
      }
      
      setErrors(newErrors);
    };
    
    validateFields();
  }, [examDate, duration, timeframeStart, timeframeEnd]);
  
  /**
   * Gérer le changement de politique de soumission tardive
   * @param {Object} event Événement de changement
   */
  const handleLateSubmissionChange = (event) => {
    const target = event.target;
    onLateSubmissionChange(target.value);
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Planification de l'examen
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <DateTimePicker
              label="Date et heure de l'examen"
              value={parseDateString(examDate)}
              onChange={(date) => {
                onExamDateChange(date ? date.toISOString() : '');
              }}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  fullWidth: true,
                  error: !!errors.examDate,
                  helperText: errors.examDate
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Durée (minutes)"
            type="number"
            value={duration || ''}
            onChange={handleDurationChange}
            fullWidth
            variant="outlined"
            error={!!errors.duration}
            helperText={errors.duration}
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Plage horaire de disponibilité (optionnel)
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Définir une période pendant laquelle l'examen sera disponible pour les étudiants.
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <DateTimePicker
              label="Début de la période"
              value={parseDateString(timeframeStart)}
              onChange={(date) => {
                onTimeframeStartChange(date ? date.toISOString() : '');
              }}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
            <DateTimePicker
              label="Fin de la période"
              value={parseDateString(timeframeEnd)}
              onChange={(date) => {
                onTimeframeEndChange(date ? date.toISOString() : '');
              }}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  fullWidth: true,
                  error: !!errors.timeframe,
                  helperText: errors.timeframe
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.lateSubmission}>
            <InputLabel id="late-submission-label">Soumission tardive</InputLabel>
            <Select
              labelId="late-submission-label"
              value={lateSubmission}
              onChange={handleLateSubmissionChange}
              label="Soumission tardive"
            >
              <MenuItem value="allowed">Autorisée (applique des pénalités)</MenuItem>
              <MenuItem value="not_allowed">Non autorisée</MenuItem>
            </Select>
            <FormHelperText>
              {errors.lateSubmission || 'Définir si les étudiants peuvent soumettre après la date limite'}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ExamScheduling;
