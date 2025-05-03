import { supabase } from './supabase';

// Types pour les données mockées
export interface NewsItem {
  id?: number;
  title: string;
  description: string;
  image_url?: string;
  date: string;
  link?: string;
}

export interface EventItem {
  id?: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location?: string;
}

// Actualités mockées
export const mockNews: NewsItem[] = [
  {
    title: 'Journée portes ouvertes ESGIS 2025',
    description: 'L\'ESGIS organise sa journée portes ouvertes annuelle le 15 mai 2025. Venez découvrir nos formations et rencontrer nos enseignants.',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop',
    date: '2025-05-01T08:00:00Z',
    link: '/actualites/portes-ouvertes-2025'
  },
  {
    title: 'Lancement du nouveau diplôme Intelligence Artificielle & Data Science',
    description: 'L\'ESGIS est fière d\'annoncer le lancement de son nouveau diplôme spécialisé en Intelligence Artificielle et Data Science dès la rentrée 2025.',
    image_url: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop',
    date: '2025-04-22T14:30:00Z',
    link: '/actualites/nouveau-diplome-ia-data-science'
  },
  {
    title: 'Résultats du hackathon ESGIS Innovation Challenge',
    description: 'Félicitations à l\'équipe CodeMasters qui a remporté la première place du hackathon ESGIS Innovation Challenge avec leur projet de plateforme d\'apprentissage adaptatif.',
    image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop',
    date: '2025-04-15T18:00:00Z',
    link: '/actualites/resultats-hackathon-2025'
  }
];

// Événements mockés
export const mockEvents: EventItem[] = [
  {
    title: 'Atelier CV et recherche de stage',
    description: 'Atelier pratique sur la rédaction de CV et les techniques de recherche de stage efficaces. Animé par le service carrière de l\'ESGIS.',
    start_date: '2025-05-10T14:00:00Z',
    end_date: '2025-05-10T17:00:00Z',
    location: 'Salle A305 - Campus Principal'
  },
  {
    title: 'Séminaire Intelligence Artificielle',
    description: 'Présentation des dernières avancées en intelligence artificielle et démonstration de projets étudiants.',
    start_date: '2025-05-15T09:30:00Z',
    end_date: '2025-05-15T16:00:00Z',
    location: 'Amphithéâtre Mendès France'
  },
  {
    title: 'Soirée d\'intégration promotion 2025',
    description: 'Soirée festive d\'accueil des nouveaux étudiants de la promotion 2025. Venez faire connaissance avec vos camarades de promotion!',
    start_date: '2025-05-18T19:00:00Z',
    end_date: '2025-05-18T23:00:00Z',
    location: 'Campus ESGIS - Espace Événementiel'
  },
  {
    title: 'Forum entreprises ESGIS Connect',
    description: 'Rencontrez les recruteurs de plus de 50 entreprises partenaires pour des opportunités de stage et d\'emploi.',
    start_date: '2025-05-25T10:00:00Z',
    end_date: '2025-05-25T17:00:00Z',
    location: 'Palais des Congrès'
  }
];

/**
 * Initialise les tables de données de démo dans Supabase
 * Cette fonction est utilisée uniquement pour la démonstration
 */
export const initializeMockData = async () => {
  try {
    console.log('Initialisation des données de démo...');
    
    // Vérifier si les tables existent
    const { error: newsTableError } = await supabase
      .from('news')
      .select('count', { count: 'exact', head: true });
    
    if (newsTableError) {
      console.error('Erreur lors de la vérification de la table news:', newsTableError);
      return false;
    }
    
    // Vérifier s'il y a déjà des données
    const { count: newsCount, error: countError } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Erreur lors du comptage des actualités:', countError);
      return false;
    }
    
    // Si la table est vide, on ajoute les données mockées
    if (newsCount === 0) {
      const { error: insertNewsError } = await supabase
        .from('news')
        .insert(mockNews);
      
      if (insertNewsError) {
        console.error('Erreur lors de l\'insertion des actualités:', insertNewsError);
        return false;
      }
      
      console.log('Actualités de démo ajoutées avec succès');
    } else {
      console.log('Des actualités existent déjà dans la base de données');
    }
    
    // Vérifier les événements
    const { count: eventsCount, error: eventsCountError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    if (eventsCountError) {
      console.error('Erreur lors du comptage des événements:', eventsCountError);
      return false;
    }
    
    // Si la table est vide, on ajoute les données mockées
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
