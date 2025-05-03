import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  Alert
} from '@mui/material';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../hooks/useAuth';

// Définition de l'interface StudentDashboardData manquante
interface StudentDashboardData {
  next_course?: {
    name: string;
    time: string;
  };
  recent_grades?: Array<{
    id: number;
    course_name: string;
    value: number;
    max_value: number;
  }>;
}

interface ScheduleItem {
  id: number;
  course_name: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
}

export default function DashboardPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  // Utiliser useRef pour stabiliser la fonction fetchDashboardData
  const fetchDashboardDataRef = useRef(async () => {
    if (!authState?.student?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Récupération des données du dashboard
      const { data, error } = await supabase
        .rpc('get_student_dashboard', { student_id: authState.student.id });
        
      if (error) throw error;
      if (!data) throw new Error('No data returned');
      
      setDashboardData(data);
      
      // Récupération de l'emploi du temps
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('student_id', authState.student.id)
        .order('day_of_week')
        .order('start_time');
        
      if (scheduleError) throw scheduleError;
      setSchedule(scheduleData || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError('Impossible de charger les données du dashboard');
    } finally {
      setLoading(false);
    }
  });

  // Mettre à jour la référence lorsque authState.student?.id change
  useEffect(() => {
    fetchDashboardDataRef.current = async () => {
      if (!authState?.student?.id) return;
    
      setLoading(true);
      setError(null);

      try {
        // Récupération des données du dashboard
        const { data, error } = await supabase
          .rpc('get_student_dashboard', { student_id: authState.student.id });
          
        if (error) throw error;
        if (!data) throw new Error('No data returned');
        
        setDashboardData(data);
        
        // Récupération de l'emploi du temps
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule')
          .select('*')
          .eq('student_id', authState.student.id)
          .order('day_of_week')
          .order('start_time');
          
        if (scheduleError) throw scheduleError;
        setSchedule(scheduleData || []);
        
      } catch (err) {
        console.error('Erreur lors du chargement du dashboard:', err);
        setError('Impossible de charger les données du dashboard');
      } finally {
        setLoading(false);
      }
    };
  }, [authState.student?.id]);

  // Effet pour charger les données au chargement du composant
  useEffect(() => {
    // S'assurer que fetchDashboardDataRef.current est défini
    const fetchData = fetchDashboardDataRef.current;
    if (fetchData) {
      fetchData();
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ m: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord étudiant
      </Typography>
      
      {dashboardData && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">Prochain cours</Typography>
              <Typography>
                {dashboardData.next_course?.name || 'Aucun cours prévu'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dashboardData.next_course?.time && 
                  `À ${new Date(dashboardData.next_course.time).toLocaleTimeString()}`}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">Mes notes récentes</Typography>
              {dashboardData.recent_grades?.length ? (
                <ul>
                  {dashboardData.recent_grades.map((grade) => (
                    <li key={grade.id}>
                      {grade.course_name}: {grade.value}/{grade.max_value}
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography>Aucune note récente</Typography>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>Mon emploi du temps</Typography>
      {schedule.length > 0 ? (
        <ul>
          {schedule.map(item => (
            <li key={item.id}>
              {item.course_name} - {new Date(item.start_time).toLocaleTimeString()} à {new Date(item.end_time).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      ) : (
        <Typography>Aucun cours programmé</Typography>
      )}
    </Box>
  );
}
