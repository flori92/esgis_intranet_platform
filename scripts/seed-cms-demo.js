#!/usr/bin/env node

/**
 * Script de seed de données de démonstration pour le CMS
 * Utilise l'API REST de Supabase pour insérer les données
 * Usage: node scripts/seed-cms-demo.js
 */

import https from 'https';

const SUPABASE_URL = 'https://zsuszjlgatsylleuopff.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXN6amxnYXRzeWxsZXVvcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwMDk2NiwiZXhwIjoyMDkwNzY5NjY2fQ.KoZX_65H9eeGDrV4FrYi3b-i0xxLa4GVLah-nKlHUhw';

// Fonction utilitaire pour effectuer requête HTTPS
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        try {
          const jsonData = responseData ? JSON.parse(responseData) : {};
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Insérer dans une table via l'API REST
async function insertIntoTable(tableName, records) {
  const payload = JSON.stringify(records);
  const options = {
    hostname: 'zsuszjlgatsylleuopff.supabase.co',
    path: `/rest/v1/${tableName}?select=*`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'apikey': SUPABASE_SERVICE_ROLE,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
    }
  };
  
  const response = await makeRequest(options, payload);
  if (response.statusCode >= 200 && response.statusCode < 300) {
    return response.data;
  } else {
    throw new Error(`HTTP ${response.statusCode}: ${JSON.stringify(response.data)}`);
  }
}

// Données de démonstration
const demoData = {
  events: [
    {
      title: 'We Love Eya 2026',
      description: 'Festival culturel et artistique célébrant la diversité de la Côte d\'Or. We Love Eya est le plus grand festival culturel annuel de Cotonou, réunissant artistes, musiciens et danseurs du Bénin et d\'Afrique de l\'Ouest.',
      category: 'culture',
      start_date: '2026-04-15T18:00:00',
      end_date: '2026-04-18T02:00:00',
      location: 'Plage de Cotonou, Bénin',
      image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      is_published: true,
      position: 1
    },
    {
      title: 'Vodoun Days - Festival du Vaudou',
      description: 'Célébration annuelle des traditions spirituelles et culturelles du vaudou. Les Vodoun Days célèbrent le patrimoine spirituel et culturel du Bénin avec processions, ateliers, expositions d\'art et performances musicales.',
      category: 'spirituel',
      start_date: '2026-05-10T08:00:00',
      end_date: '2026-05-12T22:00:00',
      location: 'Temple de Ouidah, Bénin',
      image_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
      is_published: true,
      position: 2
    },
    {
      title: 'Concert Anniversaire Vano Baby - 10 ans',
      description: 'Un concert exceptionnel pour célébrer une décennie d\'innovations musicales. Rejoignez Vano Baby pour un concert monumental avec performances en direct et surprises spéciales.',
      category: 'musique',
      start_date: '2026-06-20T20:00:00',
      end_date: '2026-06-20T23:30:00',
      location: 'Stade de Cotonou, Bénin',
      image_url: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800',
      is_published: true,
      position: 3
    },
    {
      title: 'Speed Dating Professionnel',
      description: 'Événement de networking accéléré pour entrepreneurs et professionnels. Une approche innovante combinant speed dating et rencontres d\'affaires organisée par des leaders du secteur privé.',
      category: 'professionnel',
      start_date: '2026-05-25T18:00:00',
      end_date: '2026-05-25T21:00:00',
      location: 'Hôtel Sofitel Cotonou, Bénin',
      image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      is_published: true,
      position: 4
    },
    {
      title: 'Forum International d\'Innovations',
      description: 'Plateforme majeure réunissant entrepreneurs, innovateurs et investisseurs pour explorer les solutions technologiques. Thèmes: IA, fintech, énergies renouvelables, smart cities, santé numérique.',
      category: 'innovation',
      start_date: '2026-07-08T09:00:00',
      end_date: '2026-07-11T18:00:00',
      location: 'Centre de Conférences Internationaliste, Cotonou',
      image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      is_published: true,
      position: 5
    },
    {
      title: 'Festival du Film Africain',
      description: 'Célébration du cinéma africain avec projections de 80+ films, masterclasses avec réalisateurs, table-rondes et gala d\'ouverture. Découvrez les meilleures productions du continent.',
      category: 'culture',
      start_date: '2026-08-05T17:00:00',
      end_date: '2026-08-12T23:59:00',
      location: 'Cinémas divers à Cotonou, Bénin',
      image_url: 'https://images.unsplash.com/photo-1489599849228-bed96d3a05c9?w=800',
      is_published: true,
      position: 6
    },
    {
      title: 'Conférence de Santé et Bien-être',
      description: 'Conférence dédiée à la promotion de la santé et du bien-être en Afrique de l\'Ouest. Sujets: santé maternelle, maladies chroniques, santé mentale, nutrition, fitness et médecine traditionnelle.',
      category: 'sante',
      start_date: '2026-06-10T08:30:00',
      end_date: '2026-06-12T17:00:00',
      location: 'Hôtel Novotel Cotonou, Bénin',
      image_url: 'https://images.unsplash.com/photo-1631217314997-e94188a1ce53?w=800',
      is_published: true,
      position: 7
    },
    {
      title: 'Grand Marché Culturel Artisanal',
      description: 'Événement mensuel célébrant le talent des artisans béninois. Textiles, sculptures, bijoux, poteries, peintures, objets de décoration et produits cosmétiques naturels à découvrir.',
      category: 'artisanat',
      start_date: '2026-05-16T10:00:00',
      end_date: '2026-05-17T20:00:00',
      location: 'Galerie d\'Art de Cotonou, Bénin',
      image_url: 'https://images.unsplash.com/photo-1578324568222-121067eb98d5?w=800',
      is_published: true,
      position: 8
    },
    {
      title: 'Marathon Solidaire',
      description: 'Marathon annuel combinant le sport et la solidarité pour soutenir l\'éducation des enfants défavorisés. Parcours variés: 42.195km, 21km, 10km et 5km pour enfants.',
      category: 'sport',
      start_date: '2026-04-25T06:00:00',
      end_date: '2026-04-25T14:00:00',
      location: 'Stade de Cotonou - Parcours en ville',
      image_url: 'https://images.unsplash.com/photo-1552674605-5defe6aa44bb?w=800',
      is_published: true,
      position: 9
    },
    {
      title: 'Sommet du Tourisme Africain',
      description: 'Événement majeur réunissant ministres, hôteliers et tour-opérateurs pour développer le secteur touristique. Thèmes: tourisme durable, balnéaire, culturel, agritourisme et digital.',
      category: 'tourisme',
      start_date: '2026-09-20T08:00:00',
      end_date: '2026-09-23T18:00:00',
      location: 'Centro Hotel Cotonou, Bénin',
      image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      is_published: true,
      position: 10
    }
  ],
  news: [
    {
      title: 'Partenariat stratégique avec le Forum International d\'Innovations',
      excerpt: 'Les étudiants de ESGIS auront accès à des rencontres exclusives avec les innovateurs et entrepreneurs du continent.',
      content: 'ESGIS Campus est fière d\'annoncer un partenariat stratégique avec les organisateurs du Forum International d\'Innovations. Les étudiants pourront participer aux pitch competitions, accéder aux conférences et ateliers, et bénéficier de mentorship avec des entrepreneurs confirmés.',
      image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
      is_featured: true,
      is_published: true,
      position: 1
    },
    {
      title: 'Nouvelles bourses d\'études disponibles',
      excerpt: 'ESGIS Campus lance un programme de bourses en partenariat avec des entreprises locales et internationales.',
      content: 'ESGIS Campus annonce le lancement d\'un programme de bourses d\'études destinées aux étudiants méritants mais aux moyens financiers limités. Les bourses couvrent les frais de scolarité, livres, matériel pédagogique et accès à tous les clubs et activités parascolaires.',
      image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
      is_featured: true,
      is_published: true,
      position: 2
    },
    {
      title: 'Les étudiants brillent au Vodoun Days Festival',
      excerpt: 'Une délégation de 50 étudiants a brillé au festival avec un projet innovant sur la spiritualité et la technologie.',
      content: 'Une délégation de 50 étudiants de ESGIS Campus a brillé au Vodoun Days Festival, présentant un projet innovant explorant la convergence entre les traditions spirituelles béninoises et les technologies modernes. Les étudiants ont reçu des félicitations et des propositions de collaboration.',
      image_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
      is_featured: false,
      is_published: true,
      position: 3
    }
  ],
  announcements: [
    {
      title: 'Calendrier académique 2026-2027',
      content: 'Le calendrier académique pour l\'année 2026-2027 a été finalisé. Ouverture: 1er septembre 2026. Fermeture: 30 juin 2027. Vacances académiques: 15 décembre - 15 janvier.',
      priority: 'high',
      target_audience: 'students',
      is_published: true,
      position: 1
    },
    {
      title: 'Réunion d\'information: Activités parascolaires',
      content: 'Tous les nouveaux étudiants sont invités à une réunion d\'information le vendredi 12 avril à 14h. Découvrez les clubs disponibles: sports, culture, technologie, entrepreneuriat.',
      priority: 'medium',
      target_audience: 'students',
      is_published: true,
      position: 2
    },
    {
      title: 'Plateforme d\'orientation maintenant active',
      content: 'La nouvelle plateforme d\'orientation en ligne est disponible pour tous les étudiants. Prenez des rendez-vous avec les conseillers, consultez les fiches des métiers, trouvez des stages et emplois.',
      priority: 'normal',
      target_audience: 'students',
      is_published: true,
      position: 3
    }
  ],
  banners: [
    {
      title: 'We Love Eya 2026',
      subtitle: 'Le plus grand festival culturel de Cotonou vous attend!',
      image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
      cta_link: '/events',
      cta_text: 'En savoir plus',
      background_color: '#667eea',
      text_color: '#ffffff',
      is_active: true,
      position: 1
    },
    {
      title: 'Forum International d\'Innovations',
      subtitle: 'Rencontrez les entrepreneurs et innovateurs du continent',
      image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
      cta_link: '/events',
      cta_text: 'S\'inscrire maintenant',
      background_color: '#f093fb',
      text_color: '#ffffff',
      is_active: true,
      position: 2
    },
    {
      title: 'ESGIS Campus: Mission transformatrice',
      subtitle: 'Former les leaders de demain pour transformer l\'Afrique',
      image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200',
      cta_link: '/about',
      cta_text: 'Découvrir ESGIS',
      background_color: '#4facfe',
      text_color: '#ffffff',
      is_active: true,
      position: 3
    }
  ]
};

async function seedCMSData() {
  console.log('🌱 Début du seed des données de démonstration CMS...\n');

  let totalInserted = 0;

  try {
    // Insérer les événements
    console.log('📅 Insertion des événements...');
    const eventsResult = await insertIntoTable('cms_events', demoData.events);
    const eventsCount = Array.isArray(eventsResult) ? eventsResult.length : 0;
    console.log(`✅ ${eventsCount} événements insérés\n`);
    totalInserted += eventsCount;

    // Insérer les actualités
    console.log('📰 Insertion des actualités...');
    const newsResult = await insertIntoTable('cms_news', demoData.news);
    const newsCount = Array.isArray(newsResult) ? newsResult.length : 0;
    console.log(`✅ ${newsCount} actualités insérées\n`);
    totalInserted += newsCount;

    // Insérer les annonces
    console.log('📢 Insertion des annonces...');
    const announcementsResult = await insertIntoTable('cms_announcements', demoData.announcements);
    const announcementsCount = Array.isArray(announcementsResult) ? announcementsResult.length : 0;
    console.log(`✅ ${announcementsCount} annonces insérées\n`);
    totalInserted += announcementsCount;

    // Insérer les bannières
    console.log('🎨 Insertion des bannières...');
    const bannersResult = await insertIntoTable('cms_banners', demoData.banners);
    const bannersCount = Array.isArray(bannersResult) ? bannersResult.length : 0;
    console.log(`✅ ${bannersCount} bannières insérées\n`);
    totalInserted += bannersCount;

    if (totalInserted > 0) {
      console.log('🎉 Seed complété avec succès!');
      console.log('\n📊 Résumé:');
      console.log(`  • ${eventsCount} événements`);
      console.log(`  • ${newsCount} actualités`);
      console.log(`  • ${announcementsCount} annonces`);
      console.log(`  • ${bannersCount} bannières`);
      console.log(`  • Total: ${totalInserted} items`);
      console.log('\n✨ Votre CMS est alimenté avec les données de démonstration!');
      console.log('🚀 Rendez-vous sur /admin/cms pour gérer le contenu');
      process.exit(0);
    } else {
      console.log('⚠️ Aucune donnée n\'a été insérée.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
    process.exit(1);
  }
}

seedCMSData();
