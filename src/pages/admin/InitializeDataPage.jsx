import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Container, 
  Alert, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { supabase } from '@/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Page d'administration pour initialiser les données de test dans Supabase
 */
const InitializeDataPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Rediriger si l'utilisateur n'est pas administrateur
  React.useEffect(() => {
    if (!authState.isAdmin) {
      navigate('/dashboard');
    }
  }, [authState.isAdmin, navigate]);

  const initializeEntreprises = async () => {
    try {
      const { data, error } = await supabase
        .from('entreprises')
        .insert([
          {
            nom: 'TechInnovate',
            secteur: 'Technologies',
            adresse: '15 rue de l\'Innovation, 75001 Paris',
            telephone: '+33 1 23 45 67 89',
            email: 'contact@techinnovate.fr',
            site_web: 'https://techinnovate.fr',
            description: 'Entreprise spécialisée dans le développement de solutions innovantes',
            logo_url: 'https://example.com/logos/techinnovate.png'
          },
          {
            nom: 'MobilFirst',
            secteur: 'Développement Mobile',
            adresse: '25 avenue des Applications, 69002 Lyon',
            telephone: '+33 4 56 78 90 12',
            email: 'contact@mobilfirst.fr',
            site_web: 'https://mobilfirst.fr',
            description: 'Agence de développement d\'applications mobiles',
            logo_url: 'https://example.com/logos/mobilfirst.png'
          },
          {
            nom: 'DataInsight',
            secteur: 'Analyse de données',
            adresse: '8 boulevard des Données, 33000 Bordeaux',
            telephone: '+33 5 67 89 01 23',
            email: 'contact@datainsight.fr',
            site_web: 'https://datainsight.fr',
            description: 'Entreprise spécialisée dans l\'analyse et la visualisation de données',
            logo_url: 'https://example.com/logos/datainsight.png'
          }
        ])
        .select();

      if (error) {
        throw error;
      }
      
      return {
        success: true,
        data,
        message: `${data?.length || 0} entreprises ajoutées`
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout des entreprises:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Erreur lors de l\'ajout des entreprises'
      };
    }
  };

  const initializeOffres = async (entreprises) => {
    try {
      // Récupérer un département pour les offres
      const { data: departments } = await supabase
        .from('departments')
        .select('id')
        .limit(1);
      
      const departmentId = departments && departments.length > 0 ? departments[0].id : 1;
      
      // Préparation des données d'offres
      const offresData = [
        {
          titre: 'Stage développeur Full-Stack',
          description: 'Nous recherchons un développeur Full-Stack pour participer au développement de notre nouvelle plateforme web.',
          entreprise_id: entreprises[0].id,
          date_debut: new Date('2025-06-01').toISOString(),
          date_fin: new Date('2025-08-31').toISOString(),
          lieu: 'Paris',
          type_stage: 'temps_plein',
          competences_requises: ['JavaScript', 'React', 'Node.js', 'SQL'],
          statut: 'publie',
          department_id: departmentId,
          niveau_requis: 'M1',
          remuneration: 1000,
          created_at: new Date().toISOString()
        },
        {
          titre: 'Stage développeur mobile',
          description: 'Stage de fin d\'études pour participer au développement de notre application mobile innovante.',
          entreprise_id: entreprises[1].id,
          date_debut: new Date('2025-07-01').toISOString(),
          date_fin: new Date('2025-12-31').toISOString(),
          lieu: 'Lyon',
          type_stage: 'temps_plein',
          competences_requises: ['Swift', 'Kotlin', 'Flutter', 'Firebase'],
          statut: 'publie',
          department_id: departmentId,
          niveau_requis: 'M2',
          remuneration: 1200,
          created_at: new Date().toISOString()
        },
        {
          titre: 'Stage data analyst',
          description: 'Rejoignez notre équipe pour analyser et visualiser des données complexes.',
          entreprise_id: entreprises[2].id,
          date_debut: new Date('2025-09-01').toISOString(),
          date_fin: new Date('2026-02-28').toISOString(),
          lieu: 'Bordeaux',
          type_stage: 'temps_plein',
          competences_requises: ['Python', 'R', 'Tableau', 'SQL'],
          statut: 'publie',
          department_id: departmentId,
          niveau_requis: 'L3',
          remuneration: 800,
          created_at: new Date().toISOString()
        }
      ];
      
      const { data, error } = await supabase
        .from('offres_stage')
        .insert(offresData)
        .select();

      if (error) {
        throw error;
      }
      
      return {
        success: true,
        data,
        message: `${data?.length || 0} offres de stage ajoutées`
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout des offres de stage:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Erreur lors de l\'ajout des offres de stage'
      };
    }
  };

  const initializeNews = async () => {
    try {
      const newsData = [
        {
          titre: 'Ouverture de la campagne de stages 2025',
          contenu: 'Nous sommes heureux de vous annoncer l\'ouverture officielle de la campagne de stages pour l\'année académique 2025. De nombreuses entreprises partenaires proposent des stages dans différents domaines.',
          image_url: 'https://example.com/images/news/stages2025.jpg',
          date_publication: new Date().toISOString(),
          categorie: 'general',
          auteur: 'Service des stages',
          visible: true
        },
        {
          titre: 'Conférence sur l\'emploi dans le numérique',
          contenu: 'Une conférence sur les perspectives d\'emploi dans le secteur du numérique sera organisée le 15 mai 2025. Des représentants de grandes entreprises seront présents pour répondre à vos questions.',
          image_url: 'https://example.com/images/news/conference.jpg',
          date_publication: new Date().toISOString(),
          categorie: 'evenement',
          auteur: 'Service communication',
          visible: true
        },
        {
          titre: 'Nouveau partenariat avec TechInnovate',
          contenu: 'Nous sommes fiers d\'annoncer notre nouveau partenariat avec l\'entreprise TechInnovate. Ce partenariat permettra à nos étudiants d\'accéder à des stages de qualité et à des opportunités d\'emploi.',
          image_url: 'https://example.com/images/news/partenariat.jpg',
          date_publication: new Date().toISOString(),
          categorie: 'partenariat',
          auteur: 'Direction des relations entreprises',
          visible: true
        }
      ];
      
      const { data, error } = await supabase
        .from('actualites')
        .insert(newsData)
        .select();

      if (error) {
        throw error;
      }
      
      return {
        success: true,
        data,
        message: `${data?.length || 0} actualités ajoutées`
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout des actualités:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Erreur lors de l\'ajout des actualités'
      };
    }
  };

  const initializeSchedule = async () => {
    try {
      // Récupérer un cours, un professeur et un département pour les emplois du temps
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .limit(3);
      
      const { data: professors } = await supabase
        .from('professors')
        .select('id')
        .limit(3);
      
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id')
        .limit(3);
      
      // Utilisez des identifiants par défaut si les données ne sont pas trouvées
      const defaultCourseId = 1;
      const defaultProfessorId = 1;
      const defaultClassroomId = 1;
      
      // Créer des créneaux pour les trois prochains jours
      const now = new Date();
      const scheduleData = [];
      
      for (let i = 1; i <= 3; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);
        
        // Créer des créneaux du matin et de l'après-midi
        const morningStart = new Date(date);
        morningStart.setHours(9, 0, 0, 0);
        
        const morningEnd = new Date(date);
        morningEnd.setHours(12, 0, 0, 0);
        
        const afternoonStart = new Date(date);
        afternoonStart.setHours(14, 0, 0, 0);
        
        const afternoonEnd = new Date(date);
        afternoonEnd.setHours(17, 0, 0, 0);
        
        // Ajouter le créneau du matin
        scheduleData.push({
          course_id: courses && courses[i-1] ? courses[i-1].id : defaultCourseId,
          professor_id: professors && professors[i-1] ? professors[i-1].id : defaultProfessorId,
          classroom_id: classrooms && classrooms[i-1] ? classrooms[i-1].id : defaultClassroomId,
          start_time: morningStart.toISOString(),
          end_time: morningEnd.toISOString(),
          day_of_week: date.getDay(),
          week_number: Math.ceil((date.getDate() - date.getDay()) / 7) + 1,
          status: 'confirmed',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        });
        
        // Ajouter le créneau de l'après-midi
        scheduleData.push({
          course_id: courses && courses[i-1] ? courses[i-1].id : defaultCourseId,
          professor_id: professors && professors[0] ? professors[0].id : defaultProfessorId,
          classroom_id: classrooms && classrooms[0] ? classrooms[0].id : defaultClassroomId,
          start_time: afternoonStart.toISOString(),
          end_time: afternoonEnd.toISOString(),
          day_of_week: date.getDay(),
          week_number: Math.ceil((date.getDate() - date.getDay()) / 7) + 1,
          status: 'confirmed',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        });
      }
      
      const { data, error } = await supabase
        .from('schedules')
        .insert(scheduleData)
        .select();

      if (error) {
        throw error;
      }
      
      return {
        success: true,
        data,
        message: `${data?.length || 0} emplois du temps ajoutés`
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout des emplois du temps:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Erreur lors de l\'ajout des emplois du temps'
      };
    }
  };

  const handleInitializeData = async () => {
    setLoading(true);
    setResults([]);
    setError(null);

    try {
      // 1. Initialiser les entreprises
      const entreprisesResult = await initializeEntreprises();
      setResults(prev => [...prev, {
        step: 'Ajout des entreprises',
        success: entreprisesResult.success,
        message: entreprisesResult.message
      }]);

      // 2. Initialiser les offres de stage (si les entreprises ont été ajoutées)
      if (entreprisesResult.success && entreprisesResult.data) {
        const offresResult = await initializeOffres(entreprisesResult.data);
        setResults(prev => [...prev, {
          step: 'Ajout des offres de stage',
          success: offresResult.success,
          message: offresResult.message
        }]);
      }

      // 3. Initialiser les actualités
      const newsResult = await initializeNews();
      setResults(prev => [...prev, {
        step: 'Ajout des actualités',
        success: newsResult.success,
        message: newsResult.message
      }]);

      // 4. Initialiser les emplois du temps
      const scheduleResult = await initializeSchedule();
      setResults(prev => [...prev, {
        step: 'Ajout des emplois du temps',
        success: scheduleResult.success,
        message: scheduleResult.message
      }]);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation des données:', error);
      setError(error.message || 'Une erreur est survenue lors de l\'initialisation des données');
    } finally {
      setLoading(false);
    }
  };

  if (!authState.isAdmin) {
    return null; // Redirection gérée par useEffect
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Initialisation des données de test
        </Typography>
        
        <Typography variant="body1" paragraph>
          Cette page permet d'initialiser les données de test dans la base de données Supabase pour le module de gestion des stages.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Les données suivantes seront ajoutées :
          <ul>
            <li>3 entreprises</li>
            <li>3 offres de stage</li>
            <li>3 actualités</li>
            <li>3 emplois du temps</li>
          </ul>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {results.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résultats
            </Typography>
            <List>
              {results.map((result, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {result.success ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.step}
                    secondary={result.message}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleInitializeData}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Initialisation en cours...' : 'Initialiser les données'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InitializeDataPage;
