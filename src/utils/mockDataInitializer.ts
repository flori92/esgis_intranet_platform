import { supabase } from '@/services/supabase';

// Types pour les données mockées d'événements compatibles Supabase
export interface EventItem {
  id?: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  location: string | null;
  event_type: 'course' | 'exam' | 'deadline' | 'holiday' | 'other';
  created_by: string;
  course_id: number | null;
  exam_id: number | null;
  created_at: string;
  updated_at: string;
}

// Mock d'événements conforme au schéma Supabase
export const mockEvents: EventItem[] = [
  {
    title: 'Atelier CV et recherche de stage',
    description: 'Atelier pratique sur la rédaction de CV et les techniques de recherche de stage efficaces. Animé par le service carrière de l\'ESGIS.',
    start_date: '2025-05-10T14:00:00Z',
    end_date: '2025-05-10T17:00:00Z',
    all_day: false,
    location: 'Salle A305 - Campus Principal',
    event_type: 'other',
    created_by: 'admin',
    course_id: null,
    exam_id: null,
    created_at: '2025-05-01T08:00:00Z',
    updated_at: '2025-05-01T08:00:00Z'
  },
  {
    title: 'Séminaire Intelligence Artificielle',
    description: 'Présentation des dernières avancées en intelligence artificielle et démonstration de projets étudiants.',
    start_date: '2025-05-15T09:30:00Z',
    end_date: '2025-05-15T16:00:00Z',
    all_day: false,
    location: 'Amphithéâtre Mendès France',
    event_type: 'other',
    created_by: 'admin',
    course_id: null,
    exam_id: null,
    created_at: '2025-05-01T08:00:00Z',
    updated_at: '2025-05-01T08:00:00Z'
  }
  // Ajoutez d'autres événements si besoin
];

// Pour la table news : désactivation du mock (table non typée Supabase)
// export const mockNews: NewsItem[] = [ ... ]; // <-- Décommenter si la table existe réellement

/**
 * Initialise les tables de données de démo dans Supabase
 * Cette fonction est utilisée uniquement pour la démonstration
 */
export const initializeMockData = async () => {
  try {
    console.log('Initialisation des données de démo...');
    // --- LOGIQUE EVENTS ---
    const { count: eventsCount, error: eventsCountError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    if (eventsCountError) {
      console.error('Erreur lors du comptage des événements:', eventsCountError);
      return false;
    }
    if (eventsCount === 0) {
      const { error: insertEventsError } = await supabase
        .from('events')
        .insert(mockEvents);
      if (insertEventsError) {
        console.error('Erreur lors de l\'insertion des événements:', insertEventsError);
        return false;
      }
      console.log('Événements de démo ajoutés avec succès');
    } else {
      console.log('Des événements existent déjà dans la base de données');
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des données de démo:', error);
    return false;
  }
};
