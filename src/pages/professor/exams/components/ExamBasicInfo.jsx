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

/**
 * Composant pour les informations de base d'un examen
 * Gère le titre, la description, le cours associé, le type d'examen et les points
 * 
 * @param {Object} props Les propriétés du composant
 * @param {string} props.title Titre de l'examen
 * @param {Function} props.setTitle Fonction pour mettre à jour le titre
 * @param {string} props.description Description de l'examen
 * @param {Function} props.setDescription Fonction pour mettre à jour la description
 * @param {number|null} props.courseId ID du cours associé
 * @param {Function} props.setCourseId Fonction pour mettre à jour l'ID du cours
 * @param {string} props.examType Type d'examen (midterm, final, quiz)
 * @param {Function} props.setExamType Fonction pour mettre à jour le type d'examen
 * @param {number} props.totalPoints Points totaux de l'examen
 * @param {Function} props.setTotalPoints Fonction pour mettre à jour les points totaux
 * @param {number} props.passingGrade Note de passage de l'examen
 * @param {Function} props.setPassingGrade Fonction pour mettre à jour la note de passage
 * @param {Array} props.courses Liste des cours disponibles
 * @param {Object} props.errors Erreurs de validation du formulaire
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
  const handleCourseChange = (event) => {
    setCourseId(event.target.value);
  };

  const handleExamTypeChange = (event) => {
    setExamType(event.target.value);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Informations de base
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Titre de l'examen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.courseId}>
            <InputLabel>Cours</InputLabel>
            <Select
              value={courseId || ''}
              onChange={handleCourseChange}
              label="Cours"
              required
            >
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </MenuItem>
              ))}
            </Select>
            {errors.courseId && (
              <FormHelperText>{errors.courseId}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.examType}>
            <InputLabel>Type d'examen</InputLabel>
            <Select
              value={examType}
              onChange={handleExamTypeChange}
              label="Type d'examen"
              required
            >
              <MenuItem value="midterm">Mi-semestre</MenuItem>
              <MenuItem value="final">Final</MenuItem>
              <MenuItem value="quiz">Quiz</MenuItem>
            </Select>
            {errors.examType && (
              <FormHelperText>{errors.examType}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Points totaux"
            value={totalPoints}
            onChange={(e) => setTotalPoints(Number(e.target.value))}
            error={!!errors.totalPoints}
            helperText={errors.totalPoints}
            required
            inputProps={{ min: 0 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Note de passage"
            value={passingGrade}
            onChange={(e) => setPassingGrade(Number(e.target.value))}
            error={!!errors.passingGrade}
            helperText={errors.passingGrade}
            required
            inputProps={{ min: 0, max: totalPoints }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ExamBasicInfo;
