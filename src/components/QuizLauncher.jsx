import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import Quiz from './Quiz';
import { virtualizationQuizData } from '../data/virtualizationQuizData';

import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';

import {
  AccessTime as AccessTimeIcon,
  School as SchoolIcon,
  QuestionAnswer as QuestionAnswerIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';

/**
 * Composant pour lancer un quiz à partir de la liste des examens
 * Sert de pont entre le système d'examens et le système de quiz
 */
const QuizLauncher = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [started, setStarted] = useState(false);
  
  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Vérifier si c'est le quiz de virtualisation
        if (examId === 'quiz1' || examId.includes('virtualization')) {
          console.log('Chargement du quiz Virtualization Cloud et Datacenter advanced');
          setQuizData(virtualizationQuizData);
          setLoading(false);
          return;
        }
        
        // Sinon, essayer de récupérer les données du quiz depuis Supabase
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .single();
        
        if (examError) {
          throw new Error(`Erreur lors de la récupération de l'examen: ${examError.message}`);
        }
        
        if (!examData) {
          throw new Error(`Examen non trouvé avec l'ID: ${examId}`);
        }
        
        // Vérifier si c'est un quiz
        if (examData.type !== 'quiz') {
          throw new Error(`Cet examen n'est pas un quiz: ${examData.title}`);
        }
        
        // Récupérer les questions du quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', examId);
        
        if (questionsError) {
          throw new Error(`Erreur lors de la récupération des questions: ${questionsError.message}`);
        }
        
        // Formater les données pour le composant Quiz
        const formattedQuizData = {
          title: examData.title,
          description: examData.description,
          duration: examData.duration,
          questions: questionsData.map((q, index) => ({
            id: q.id || `q${index + 1}`,
            text: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer
          }))
        };
        
        setQuizData(formattedQuizData);
      } catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
        setError(error.message);
        
        // Solution de secours: utiliser les données du quiz de virtualisation
        if (examId.toLowerCase().includes('virtual') || examId.toLowerCase().includes('cloud')) {
          console.log('Utilisation des données de secours pour le quiz Virtualization');
          setQuizData(virtualizationQuizData);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [examId]);
  
  const handleStartQuiz = () => {
    setStarted(true);
  };
  
  const handleBackToExams = () => {
    navigate('/student/exams');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !quizData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleBackToExams}>
          Retour aux examens
        </Button>
      </Box>
    );
  }
  
  if (started && quizData) {
    return <Quiz quizData={quizData} />;
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {quizData?.title || 'Quiz'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {quizData?.description || 'Aucune description disponible.'}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <List>
          <ListItem>
            <ListItemIcon>
              <SchoolIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Cours" 
              secondary={quizData?.course_name || 'Virtualization Cloud et Datacenter'} 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <AccessTimeIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Durée" 
              secondary={`${quizData?.duration || 45} minutes`} 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <QuestionAnswerIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Nombre de questions" 
              secondary={quizData?.questions?.length || 0} 
            />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            onClick={handleBackToExams}
          >
            Retour aux examens
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<PlayArrowIcon />}
            onClick={handleStartQuiz}
          >
            Commencer le quiz
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default QuizLauncher;
