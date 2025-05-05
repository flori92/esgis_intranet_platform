import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Grid,
  Paper
} from '@mui/material';

// Types d'examen disponibles
const examTypes = [
  { value: 'midterm', label: 'Partiel' },
  { value: 'final', label: 'Final' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'project', label: 'Projet' },
  { value: 'oral', label: 'Oral' },
  { value: 'practical', label: 'TP' }
];

/**
 * Composant pour les informations de base d'un examen
 * Gère le titre, la description, le cours associé, le type d'examen et les points
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de l'examen
 * @param {Function} props.setTitle - Fonction pour mettre à jour le titre
 * @param {string} props.description - Description de l'examen
 * @param {Function} props.setDescription - Fonction pour mettre à jour la description
 * @param {number|null} props.courseId - ID du cours associé
 * @param {Function} props.setCourseId - Fonction pour mettre à jour l'ID du cours
 * @param {string} props.examType - Type d'examen
 * @param {Function} props.setExamType - Fonction pour mettre à jour le type d'examen
 * @param {number} props.totalPoints - Nombre total de points
 * @param {Function} props.setTotalPoints - Fonction pour mettre à jour le nombre total de points
 * @param {number} props.passingGrade - Seuil de réussite
 * @param {Function} props.setPassingGrade - Fonction pour mettre à jour le seuil de réussite
 * @param {Array<Object>} props.courses - Liste des cours disponibles
 * @param {Object} props.errors - Erreurs de validation
 * @returns {JSX.Element} Composant d'informations de base d'un examen
 */
const ExamBasicInfo = ({
  title,
  setTitle,
  description,
  setDescription,
  courseId,
  setCourseId,
  examType,
  setExamType,
  totalPoints,
  setTotalPoints,
  passingGrade,
  setPassingGrade,
  courses,
  errors
}) => {
  /**
   * Gestionnaire pour les champs numériques
   * @param {Function} setter - Fonction setter pour mettre à jour la valeur
   * @returns {Function} Gestionnaire d'événement pour le champ
   */
  const handleNumberChange = (setter) => (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setter(value);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Informations générales
      </Typography>
      
      <Grid container spacing={3}>
        {/* Titre de l'examen */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Titre de l'examen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            error={!!errors.title}
            helperText={errors.title || 'Ex: Examen final de Mathématiques'}
          />
        </Grid>
        
        {/* Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            helperText="Description optionnelle de l'examen, instructions générales, etc."
          />
        </Grid>
        
        {/* Cours associé */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.courseId}>
            <InputLabel>Cours</InputLabel>
            <Select
              value={courseId === null ? '' : courseId}
              onChange={(e) => setCourseId(e.target.value === '' ? null : Number(e.target.value))}
              label="Cours"
            >
              <MenuItem value="" disabled>
                <em>Sélectionnez un cours</em>
              </MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </MenuItem>
              ))}
            </Select>
            {errors.courseId && <FormHelperText>{errors.courseId}</FormHelperText>}
          </FormControl>
        </Grid>
        
        {/* Type d'examen */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.examType}>
            <InputLabel>Type d'examen</InputLabel>
            <Select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              label="Type d'examen"
            >
              <MenuItem value="" disabled>
                <em>Sélectionnez un type</em>
              </MenuItem>
              {examTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
            {errors.examType && <FormHelperText>{errors.examType}</FormHelperText>}
          </FormControl>
        </Grid>
        
        {/* Points totaux */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Points totaux"
            type="number"
            InputProps={{ inputProps: { min: 1 } }}
            value={totalPoints}
            onChange={handleNumberChange(setTotalPoints)}
            required
            error={!!errors.totalPoints}
            helperText={errors.totalPoints || 'Nombre total de points de l\'examen'}
          />
        </Grid>
        
        {/* Seuil de réussite */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Seuil de réussite"
            type="number"
            InputProps={{ inputProps: { min: 0, max: totalPoints } }}
            value={passingGrade}
            onChange={handleNumberChange(setPassingGrade)}
            required
            error={!!errors.passingGrade}
            helperText={errors.passingGrade || 'Nombre de points minimum pour réussir l\'examen'}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ExamBasicInfo;
