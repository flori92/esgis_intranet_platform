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
import { supabase } from '../../../../utils/supabase';

// Types
interface Option {
  id: number;
  text: string;
}

interface Question {
  id: number;
  question_number: number;
  question_text: string;
  question_type: string;
  options?: Option[] | null;
  correct_answer?: unknown;
  points: number;
}

interface StudentAnswer {
  id: number;
  question_id: number;
  answer_value: unknown;
  is_correct?: boolean | null;
  grade?: number | null;
  feedback?: string | null;
}

interface GradeQuestionItemProps {
  question: Question;
  studentAnswer: StudentAnswer | null;
  onGraded: (answerId: number, grade: number, feedback: string, isCorrect: boolean) => void;
}

/**
 * Composant pour noter une question d'examen
 */
const GradeQuestionItem: React.FC<GradeQuestionItemProps> = ({ 
  question, 
  studentAnswer, 
  onGraded 
}) => {
  // États
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [edited, setEdited] = useState<boolean>(false);
  
  // Références pour détecter les changements
  const initialValuesRef = useRef<{
    grade: number;
    feedback: string;
    isCorrect: boolean;
  }>({
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
  
  // Sauvegarder les modifications
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
      setError((err as Error).message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  
  // Rendre les boutons de sauvegarde
  const renderSaveButton = () => {
    return (
      <Button
        variant="contained"
        color="primary"
        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
        onClick={handleSaveGrading}
        disabled={saving || !edited}
        fullWidth
      >
        {saving ? 'Sauvegarde...' : 'Enregistrer la notation'}
      </Button>
    );
  };
  
  // Si aucune réponse n'est fournie
  if (!studentAnswer) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Aucune réponse disponible pour cette question
      </Alert>
    );
  }
  
  // Formater la réponse de l'étudiant pour l'affichage
  const renderStudentAnswer = () => {
    if (studentAnswer.answer_value === null || studentAnswer.answer_value === undefined) {
      return <Typography color="text.secondary" fontStyle="italic">Non répondu</Typography>;
    }
    
    if (question.question_type === 'multiple_choice' && question.options) {
      const selectedOption = question.options.find(o => String(o.id) === String(studentAnswer.answer_value));
      
      return selectedOption 
        ? <Typography>{selectedOption.text}</Typography>
        : <Typography color="error">Réponse invalide</Typography>;
    }
    
    if (question.question_type === 'true_false') {
      const boolValue = 
        studentAnswer.answer_value === true || 
        studentAnswer.answer_value === 'true';
      
      return <Typography>{boolValue ? 'Vrai' : 'Faux'}</Typography>;
    }
    
    if (typeof studentAnswer.answer_value === 'string') {
      return (
        <Paper variant="outlined" sx={{ p: 2, maxHeight: '300px', overflow: 'auto', bgcolor: 'background.default' }}>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {studentAnswer.answer_value}
          </Typography>
        </Paper>
      );
    }
    
    return <Typography>{JSON.stringify(studentAnswer.answer_value)}</Typography>;
  };
  
  // Afficher la réponse correcte pour les QCM
  const renderCorrectAnswer = () => {
    if (question.question_type === 'multiple_choice' && question.options && question.correct_answer) {
      const correctOption = question.options.find(o => String(o.id) === String(question.correct_answer));
      
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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const target = e.target as HTMLTextAreaElement;
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const target = e.target as HTMLInputElement;
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
