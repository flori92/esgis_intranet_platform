import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Divider,
  Grid,
  Slider,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Check as CheckIcon,
  Save as SaveIcon 
} from '@mui/icons-material';
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';

/**
 * Composant pour noter une question d'examen
 * 
 * @typedef {Object} Option Option de question
 * @property {number} id ID de l'option
 * @property {string} text Texte de l'option
 * 
 * @typedef {Object} Question Question d'examen
 * @property {number} id ID de la question
 * @property {number} question_number Numéro de la question
 * @property {string} question_text Texte de la question
 * @property {string} question_type Type de question
 * @property {Option[]} [options] Options pour les QCM
 * @property {*} [correct_answer] Réponse correcte
 * @property {number} points Points attribués
 * 
 * @typedef {Object} StudentAnswer Réponse d'un étudiant
 * @property {number} id ID de la réponse
 * @property {number} question_id ID de la question
 * @property {*} answer_value Valeur de la réponse
 * @property {boolean} [is_correct] Indique si la réponse est correcte
 * @property {number} [grade] Note attribuée
 * @property {string} [feedback] Commentaire de notation
 * 
 * @param {Object} props Les propriétés du composant
 * @param {Question} props.question Question à noter
 * @param {StudentAnswer|null} props.studentAnswer Réponse de l'étudiant
 * @param {Function} props.onGraded Fonction appelée après notation
 */
const GradeQuestionItem = ({ 
  question, 
  studentAnswer, 
  onGraded 
}) => {
  // États
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [edited, setEdited] = useState(false);
  
  // Références pour détecter les changements
  const initialValuesRef = useRef({
    grade: 0,
    feedback: '',
    isCorrect: false
  });
  
  // Initialiser les valeurs lors du montage ou lors d'un changement de réponse
  useEffect(() => {
    if (studentAnswer) {
      const currentGrade = typeof studentAnswer.grade === 'number' ? studentAnswer.grade : 0;
      const currentFeedback = studentAnswer.feedback || '';
      const currentIsCorrect = studentAnswer.is_correct === true;
      
      setGrade(currentGrade);
      setFeedback(currentFeedback);
      setIsCorrect(currentIsCorrect);
      
      initialValuesRef.current = {
        grade: currentGrade,
        feedback: currentFeedback,
        isCorrect: currentIsCorrect
      };
      
      setEdited(false);
    }
  }, [studentAnswer]);
  
  // Vérifier si des modifications ont été apportées
  useEffect(() => {
    if (studentAnswer && initialValuesRef.current) {
      const isChanged = 
        grade !== initialValuesRef.current.grade ||
        feedback !== initialValuesRef.current.feedback ||
        isCorrect !== initialValuesRef.current.isCorrect;
      
      setEdited(isChanged);
    }
  }, [grade, feedback, isCorrect, studentAnswer]);
  
  /**
   * Sauvegarder les modifications
   */
  const handleSaveGrading = async () => {
    if (!studentAnswer) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('student_answers')
        .update({
          grade,
          feedback,
          is_correct: isCorrect
        })
        .eq('id', studentAnswer.id);
      
      if (error) throw error;
      
      // Mettre à jour les valeurs initiales
      initialValuesRef.current = {
        grade,
        feedback,
        isCorrect
      };
      
      setEdited(false);
      
      // Notifier le composant parent
      onGraded(studentAnswer.id, grade, feedback, isCorrect);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la notation:', err);
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  
  /**
   * Rendre les boutons de sauvegarde
   */
  const renderSaveButton = () => {
    return (
      <Button
        variant="contained"
        color="primary"
        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
        onClick={handleSaveGrading}
        disabled={saving || !edited || !studentAnswer}
        sx={{ mt: 'auto', alignSelf: 'flex-end' }}
      >
        Enregistrer la notation
      </Button>
    );
  };
  
  /**
   * Formater la réponse de l'étudiant pour l'affichage
   */
  const renderStudentAnswer = () => {
    if (!studentAnswer) {
      return <Typography variant="body2" color="text.secondary">Pas de réponse</Typography>;
    }
    
    if (question.question_type === 'multiple_choice' && question.options && question.options.length > 0) {
      const selectedOption = question.options.find(
        opt => opt.text === studentAnswer.answer_value
      );
      
      if (selectedOption) {
        return <Typography variant="body1">{selectedOption.text}</Typography>;
      }
    }
    
    if (question.question_type === 'true_false') {
      const boolValue = 
        studentAnswer.answer_value === true || 
        studentAnswer.answer_value === 'true';
      
      return <Typography variant="body1">{boolValue ? 'Vrai' : 'Faux'}</Typography>;
    }
    
    return <Typography variant="body1">{String(studentAnswer.answer_value || '')}</Typography>;
  };
  
  /**
   * Afficher la réponse correcte pour les QCM
   */
  const renderCorrectAnswer = () => {
    if (question.question_type === 'multiple_choice' && question.options && question.options.length > 0) {
      const correctOption = question.options.find(
        opt => opt.text === question.correct_answer
      );
      
      if (correctOption) {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="success.main">
              Réponse correcte: {correctOption.text}
            </Typography>
          </Box>
        );
      }
    }
    
    if (question.question_type === 'true_false' && question.correct_answer !== undefined) {
      const correctValue = 
        question.correct_answer === true || 
        question.correct_answer === 'true';
      
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="success.main">
            Réponse correcte: {correctValue ? 'Vrai' : 'Faux'}
          </Typography>
        </Box>
      );
    }
    
    return null;
  };
  
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Grille de notation
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Réponse de l'étudiant:
        </Typography>
        
        <Box sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
          {renderStudentAnswer()}
          {renderCorrectAnswer()}
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography id="points-slider-label" gutterBottom>
            Points attribués: <strong>{grade}</strong> / {question.points}
          </Typography>
          
          <Slider
            value={grade}
            onChange={(_event, newValue) => setGrade(Array.isArray(newValue) ? newValue[0] : newValue)}
            aria-labelledby="points-slider-label"
            valueLabelDisplay="auto"
            step={0.5}
            marks
            min={0}
            max={question.points}
            sx={{ mb: 3 }}
          />
          
          <TextField
            label="Commentaire de notation"
            multiline
            rows={3}
            value={feedback}
            onChange={(e) => {
              const target = e.target;
              setFeedback(target.value);
            }}
            fullWidth
            placeholder="Ajouter un commentaire pour l'étudiant concernant cette réponse..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Évaluation</FormLabel>
              <RadioGroup
                value={isCorrect ? 'correct' : 'incorrect'}
                onChange={(e) => {
                  const target = e.target;
                  setIsCorrect(target.value === 'correct');
                }}
                name="answer-evaluation"
              >
                <FormControlLabel
                  value="correct"
                  control={<Radio color="success" />}
                  label="Correcte"
                />
                <FormControlLabel
                  value="incorrect"
                  control={<Radio color="error" />}
                  label="Incorrecte"
                />
              </RadioGroup>
            </FormControl>
            
            {question.question_type === 'multiple_choice' || question.question_type === 'true_false' ? (
              <Chip 
                label="Notation automatique possible" 
                color="primary" 
                size="small" 
                sx={{ alignSelf: 'flex-start', mb: 2 }} 
                icon={<CheckIcon />}
              />
            ) : null}
            
            {renderSaveButton()}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GradeQuestionItem;
