-- Seed data: Événements de démonstration pour le CMS
-- Basés sur les événements grandioses de Cotonou et Lomé

-- Insérer les événements de démonstration
INSERT INTO "public"."cms_events" (
  "title",
  "description",
  "content",
  "category",
  "start_date",
  "end_date",
  "location",
  "image_url",
  "is_published",
  "position"
) VALUES
-- Event 1: We Love Eya
(
  'We Love Eya 2026',
  'Festival culturel et artistique célébrant la diversité de la Côte d''Or',
  'We Love Eya est le plus grand festival culturel annuel de Cotonou, réunissant artistes, musiciens et danseurs du Bénin et d''Afrique de l''Ouest. \n\nCet événement incontournable célèbre la richesse de la culture béninoise avec des spectacles de musique live, des danses traditionnelles, des expositions d''art et des ateliers participatifs.\n\nRejoignez-nous pour 3 jours de festivités, de couleurs et de partage !',
  'culture',
  '2026-04-15 18:00:00',
  '2026-04-18 02:00:00',
  'Plage de Cotonou, Bénin',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
  TRUE,
  1
),

-- Event 2: Vodoun Days
(
  'Vodoun Days - Festival du Vaudou',
  'Célébration annuelle des traditions spirituelles et culturelles du vaudou',
  'Les Vodoun Days sont une célébration unique du patrimoine spirituel et culturel du Bénin, berceau du vaudou.\n\nCet événement annuel attire des milliers de visiteurs du monde entier pour découvrir les traditions, les rituels et l''art liés à cette spiritualité ancestrale.\n\nAu programme:\n- Processions colorées et cérémonies\n- Ateliers sur l''histoire et la philosophie du vaudou\n- Expositions d''art et d''artisanat traditionnel\n- Performances musicales et danses rituelles\n- Dégustations culinaires béninoises',
  'spirituel',
  '2026-05-10 08:00:00',
  '2026-05-12 22:00:00',
  'Temple de Ouidah, Bénin',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
  TRUE,
  2
),

-- Event 3: Concert Vano Baby 10 ans
(
  'Concert Anniversaire Vano Baby - 10 ans de carrière',
  'Un concert exceptionnel pour célébrer une décennie d''innovations musicales',
  'Rejoignez l''artiste Vano Baby pour un concert monumental célébrant 10 ans de carrière dans la musique contemporaine africaine.\n\nCet événement unique réunira les plus grands collaborateurs et amis de Vano Baby pour une soirée inoubliable de live performances, surprises spéciales et hommages émotionnels.\n\nLa setlist comprendra:\n- Tous les plus grands hits de sa carrière\n- Nouvelles compositions exclusives\n- Collaborations spéciales avec des artistes invités\n- Un show visuel impressionnant avec décor et lumières professionnelles\n\nVenez célébrer une décennie de musique de qualité !',
  'musique',
  '2026-06-20 20:00:00',
  '2026-06-20 23:30:00',
  'Stade de Cotonou, Bénin',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800',
  TRUE,
  3
),

-- Event 4: Speed Dating Business Networking
(
  'Speed Dating Professionnel - Rencontres d''Affaires',
  'Événement de networking accéléré pour entrepreneurs et professionnels',
  'Un événement innovant combinant le concept du speed dating avec le networking professionnel.\n\nCet événement unique est organisé par des leaders du secteur privé et des organisations de développement entrepreneurial pour créer des opportunités de collaborations et de partenariats.\n\nFormat:\n- 3 minutes par rencontre (format speed dating)\n- Multiple rounds avec différentes catégories professionnelles\n- Accès à 50+ professionnels et entrepreneurs\n- Buffet networking et boissons\n- Possibility de suivre les contacts via plateforme numérique\n\nParfait pour:\n- Les entrepreneurs cherchant des investisseurs\n- Les professionnels en recherche de collaborations\n- Les étudiants souhaitant faire des contacts professionnels\n- Les salariés en reconversion professionnelle',
  'professionnel',
  '2026-05-25 18:00:00',
  '2026-05-25 21:00:00',
  'Hôtel Sofitel Cotonou, Bénin',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
  TRUE,
  4
),

-- Event 5: Forum International d'Innovations
(
  'Forum International d''Innovations - Afrique Tech 2026',
  'Plateforme d''échange sur les innovations technologiques et durables',
  'Le Forum International d''Innovations est une plateforme majeure réunissant entrepreneurs, innovateurs, investisseurs et décideurs publics pour explorer les solutions technologiques du futur.\n\nThèmes principaux:\n- L''IA et l''automatisation en Afrique\n- Solutions pour l''agriculture durable\n- Fintech et inclusion financière\n- Énergies renouvelables et efficacité énergétique\n- Smart cities et urbanisation\n- Santé numérique et e-santé\n\nActivités:\n- Conférences plénières avec experts internationaux\n- Ateliers collaboratifs et workshops\n- Pitch competitions pour startups\n- Expo interactive des innovations\n- Networking sessions\n- Spectacles culturels et divertissements\n\nParticipants attendus:\n- 5000+ professionnels et entrepreneurs\n- 200+ innovateurs et startups\n- 50+ investisseurs et venture capitalists\n- Médias et influenceurs tech',
  'innovation',
  '2026-07-08 09:00:00',
  '2026-07-11 18:00:00',
  'Centre de Conférences Internationaliste, Cotonou',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
  TRUE,
  5
),

-- Event 6: Festival de Film Africain
(
  'Festival du Film Africain de Cotonou',
  'Célébration du cinéma africain avec films, débats et rencontres d''auteurs',
  'Le Festival du Film Africain de Cotonou est l''événement cinématographique incontournable de l''année, mettant en avant les talents du cinéma africain.\n\nAu programme:\n- Projection de 80+ films africains et de la diaspora\n- Avant-premières de films attendus\n- Masterclasses avec réalisateurs de renom\n- Table-rondes sur l''industrie du cinéma africain\n- Prix pour les meilleur films, réalisateurs et acteurs\n- Soirées de gala et cocktails\n\nCatégories de films:\n- Longs métrages de fiction\n- Documentaires\n- Courts métrages\n- Films d''étudiants et amateurs',
  'culture',
  '2026-08-05 17:00:00',
  '2026-08-12 23:59:00',
  'Cinémas divers à Cotonou, Bénin',
  'https://images.unsplash.com/photo-1489599849228-bed96d3a05c9?w=800',
  TRUE,
  6
),

-- Event 7: Conférence Santé et Bien-être
(
  'Conférence Internationale de Santé et Bien-être',
  'Échanges sur les enjeux sanitaires contemporains et les solutions innovantes',
  'Une conférence dédiée à la promotion de la santé et du bien-être en Afrique de l''Ouest.\n\nSujets traités:\n- Santé maternelle et infantile\n- Maladies chroniques et prévention\n- Santé mentale et résilience psychologique\n- Nutrition et alimentation équilibrée\n- Fitness et activités physiques\n- Médecine traditionnelle vs moderne: complémentarité\n\nIntervenants:\n- Professeurs de médecine de prestigieuses universités\n- Praticiens de la médecine alternative\n- Représentants d''organisations humanitaires\n- Athletes et coachs professionnels\n\nActivités:\n- Conférences éducatives\n- Ateliers pratiques (yoga, méditation, premiers secours)\n- Consultations médicales gratuites\n- Exposition de produits de bien-être',
  'sante',
  '2026-06-10 08:30:00',
  '2026-06-12 17:00:00',
  'Hôtel Novotel Cotonou, Bénin',
  'https://images.unsplash.com/photo-1631217314997-e94188a1ce53?w=800',
  TRUE,
  7
),

-- Event 8: Marchés Culturels Artisanaux
(
  'Grand Marché Culturel et Artisanal - You''re Invited',
  'Exposition et vente des produits artisanaux des créateurs béninois',
  'Un événement mensuel célébrant le talent et la créativité des artisans béninois.\n\nVous découvrirez:\n- Textiles et sculptures traditionnelles\n- Bijoux en or et argent\n- Poteries et céramiques\n- Peintures et œuvres d''art\n- Objets de décoration uniques\n- Vêtements et accessoires de mode\n- Produits cosmétiques naturels\n- Artisanat du bois et du cuir\n\nAu-delà des achats:\n- Ateliers d''initiation aux techniques artisanales\n- Rencontres avec les créateurs\n- Musique live et danse\n- Dégustations de cuisine traditionnelle\n- Possibilité de commander des pièces personnalisées\n\nUn événement parfait pour:\n- Soutenir les artisans locaux\n- Découvrir l''artisanat béninois\n- Trouver des cadeaux uniques\n- Célébrer la culture locale',
  'artisanat',
  '2026-05-16 10:00:00',
  '2026-05-17 20:00:00',
  'Galerie d''Art de Cotonou, Bénin',
  'https://images.unsplash.com/photo-1578324568222-121067eb98d5?w=800',
  TRUE,
  8
),

-- Event 9: Marathon pour l'Éducation
(
  'Marathon Solidaire - Courir pour l''Éducation',
  'Événement sportif caritatif pour une cause éducative',
  'Un marathon annuel combinant le sport et la solidarité pour soutenir l''éducation des enfants défavorisés.\n\nDétails de l''événement:\n- Parcours de 42.195 km pour les coureurs confirmés\n- Parcours de 21 km pour les coureurs amateurs\n- Parcours de 10 km pour les familles\n- Parcours ludique de 5 km pour enfants\n- Point de ravitaillement tous les 2-3 km\n- Équipes de secouristes et médecins\n- Animation musicale et fêtes en chemin\n\nObjectifs:\n- Collecte de fonds pour construction d''écoles\n- Bourses d''études pour étudiants méritants\n- Équipement scolaire pour écoles rurales\n\nInscriptions:\n- Individuels: 5 000 XOF\n- Équipes (5 pers): 20 000 XOF\n- Enfants: 2 000 XOF',
  'sport',
  '2026-04-25 06:00:00',
  '2026-04-25 14:00:00',
  'Stade de Cotonou - Parcours en ville',
  'https://images.unsplash.com/photo-1552674605-5defe6aa44bb?w=800',
  TRUE,
  9
),

-- Event 10: Sommet du Tourisme Africain
(
  'Sommet du Tourisme Africain - Cotonou 2026',
  'Rassemblement des professionnels du tourisme pour explorer les potentiels de la région',
  'Un événement majeur réunissant ministres, hôteliers, tours-opérateurs et professionnels du tourisme pour développer le secteur touristique en Afrique de l''Ouest.\n\nThèmes:\n- Tourisme durable et écotourisme\n- Développement du tourisme balnéaire\n- Tourisme culturel et patrimonial\n- Agritourisme et tourisme rural\n- Digital et e-tourisme\n- Formation des professionnels du tourisme\n\nActivités:\n- Conférences plénières\n- Ateliers thématiques\n- B2B meetings entre professionnels\n- Visite de sites touristiques\n- Gala d''ouverture et fermeture\n- Exposition d''agences de voyage et hôtels\n\nAttendus:\n- 2000+ professionnels du secteur\n- 100+ hôtels et résorts\n- Ministres du tourisme de 10+ pays\n- Médias internationaux',
  'tourisme',
  '2026-09-20 08:00:00',
  '2026-09-23 18:00:00',
  'Centro Hotel Cotonou, Bénin',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
  TRUE,
  10
);

-- Insérer les actualités de démonstration
INSERT INTO "public"."cms_news" (
  "title",
  "excerpt",
  "content",
  "image_url",
  "is_featured",
  "is_published",
  "position"
) VALUES
(
  'ESGIS Campus annonce un partenariat stratégique avec les organisateurs du Forum International d''Innovations',
  'Les étudiants de ESGIS auront accès à des rencontres exclusives avec les innovateurs et entrepreneurs du continent.',
  'ESGIS Campus est fière d''annoncer un partenariat stratégique avec les organisateurs du Forum International d''Innovations pour promouvoir l''entrepreneuriat et l''innovation parmi nos étudiants.\n\nGrâce à ce partenariat:\n- Les étudiants pourront participer aux pitch competitions de startups\n- Des cours spécialisés en entrepreneuriat seront offerts\n- Accès aux conférences et ateliers du forum\n- Opportunités de mentorship avec des entrepreneurs confirmés',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
  TRUE,
  TRUE,
  1
),
(
  'Nouvelles bourses d''études disponibles pour les étudiants méritants',
  'ESGIS Campus lance un programme de bourses en partenariat avec des entreprises locales et internationales.',
  'ESGIS Campus est heureuse d''annoncer le lancement d''un programme de bourses d''études destinées aux étudiants méritants mais aux moyens financiers limités.\n\nCritères d''éligibilité:\n- Excellentes notes académiques\n- Engagement communautaire démontré\n- Projet de vie claire et motivée\n\nLes bourses couvrent:\n- Frais de scolarité (partiels ou complets selon les critères)\n- Livres et matériel pédagogique\n- Accès à tous les clubs et activités parascolaires',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
  TRUE,
  TRUE,
  2
),
(
  'Les étudiants de ESGIS brille au Vodoun Days Festival',
  'Une délégation de 50 étudiants a représenté ESGIS au festival culturel annuel avec un projet sur la spiritualité et la technologie.',
  'Une délégation de 50 étudiants de ESGIS Campus a brillé lors du Vodoun Days Festival de cette année.\n\nLes étudiants ont présenté un projet innovant explorant la convergence entre los traditions spirituelles béninoises et les technologies modernes.\n\nIls ont reçu des félicitations des organisateurs du festival et des propositions de collaboration pour les prochains événements.',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
  FALSE,
  TRUE,
  3
);

-- Insérer les annonces de démonstration
INSERT INTO "public"."cms_announcements" (
  "title",
  "content",
  "priority",
  "is_published",
  "position"
) VALUES
(
  '⚠️ Important: Calendrier académique 2026-2027',
  'Étudiant et Étudiantes,\n\nLe calendrier académique pour l''année 2026-2027 a été finalisé.\n\nDate d''ouverture: 1er septembre 2026\nDatee de fermeture: 30 juin 2027\nVacances académiques: Du 15 décembre au 15 janvier\n\nPour plus de détails, consultez le portail studentaire ou le bureau de la registrariat.',
  'high',
  TRUE,
  1
),
(
  'Réunion d''information: Comment s''inscrire aux activités parascolaires',
  'Tous les nouveaux étudiants sont invités à une réunion d''information le vendredi 12 avril à 14h dans l''amphithéâtre principal.\n\nVous découvrirez les clubs disponibles: sports, culture, technologie, entrepreneuriat, etc. et comment vous y inscrire.',
  'medium',
  TRUE,
  2
),
(
  'Nouvelles: La plateforme d''orientation ESGIS est maintenant active',
  'La nouvelle plateforme d''orientation en ligne est maintenant disponible pour tous les étudiants.\n\nVous pouvez:\n- Prendre des rendez-vous avec les conseillers académiques\n- Consulter les fiches des métiers\n- Trouver des stages et emplois\n- Rejoindre des communautés d''apprentissage\n\nAccédez-la via votre compte étudiant.',
  'normal',
  TRUE,
  3
);

-- Insérer les bannières de démonstration (hero banners)
INSERT INTO "public"."cms_banners" (
  "title",
  "subtitle",
  "image_url",
  "cta_link",
  "cta_text",
  "background_color",
  "text_color",
  "is_active",
  "position"
) VALUES
(
  'We Love Eya 2026',
  'Le plus grand festival culturel de Cotonou vous attend!',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
  '/events/we-love-eya',
  'En savoir plus',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '#ffffff',
  TRUE,
  1
),
(
  'Rejoignez le Forum International d''Innovations',
  'Rencontrez les entrepreneurs et innovateurs du continent',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
  '/events/forum-innovations',
  'S''inscrire maintenant',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  '#ffffff',
  TRUE,
  2
),
(
  'ESGIS Campus: Découvrez notre mission',
  'Former les leaders de demain pour transformer l''Afrique',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200',
  '/about',
  'Découvrir ESGIS',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  '#ffffff',
  TRUE,
  3
);
