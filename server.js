/**
 * Quiz API - Serveur Express pour les Questions ESGIS
 * Virtualisation Cloud et Datacenter advanced
 *
 * Expose les endpoints REST pour l'application de quiz sur Kubernetes (gamecloud).
 * Utilise @supabase/supabase-js pour lire les practice_quizzes et exam_questions.
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// ── CORS basique pour le frontend intranet ────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Supabase client ───────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[quiz-api] SUPABASE_URL / SUPABASE_ANON_KEY manquants');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Questions statiques ESGIS (virtualisation, cloud, datacenter) ─────────────
// Source : src/data/questions.js — 40 questions cours "Virtualisation Cloud et Datacenter advanced"
const ESGIS_QUESTIONS = [
  { id: 'q1', text: "Quelle technologie permet d'exécuter plusieurs systèmes d'exploitation sur une même machine physique ?", options: ["L'émulation", 'La virtualisation', 'La containerisation', 'Le clustering'], correctAnswer: 1 },
  { id: 'q2', text: 'Quel composant logiciel permet de créer et de gérer des machines virtuelles ?', options: ['Container Engine', "Broker d'API", 'Hyperviseur', 'Orchestrateur'], correctAnswer: 2 },
  { id: 'q3', text: "Qu'est-ce que la virtualisation matérielle assistée ?", options: ['Une virtualisation qui ne fonctionne qu\'avec du matériel spécifique', 'Une technique utilisant des extensions du processeur pour accélérer la virtualisation', "L'émulation complète du matériel physique", 'Un type de virtualisation basée uniquement sur des logiciels'], correctAnswer: 1 },
  { id: 'q4', text: "Quelle est la principale différence entre un hyperviseur de type 1 et un hyperviseur de type 2 ?", options: ["Le type 1 s'exécute directement sur le matériel, le type 2 sur un système d'exploitation hôte", 'Le type 1 est open source, le type 2 est propriétaire', 'Le type 1 supporte uniquement Linux, le type 2 est multi-plateforme', 'Le type 1 est plus ancien que le type 2'], correctAnswer: 0 },
  { id: 'q5', text: "Qu'est-ce que la migration à chaud (live migration) d'une machine virtuelle ?", options: ["Le déplacement d'une VM d'un hôte à un autre sans interruption de service", 'La sauvegarde à chaud des données d\'une VM', "L'ajout de ressources à une VM pendant son fonctionnement", 'Le redimensionnement automatique d\'une VM selon sa charge'], correctAnswer: 0 },
  { id: 'q6', text: 'Quel modèle de service cloud fournit uniquement l\'infrastructure de calcul, réseau et stockage ?', options: ['SaaS', 'PaaS', 'IaaS', 'FaaS'], correctAnswer: 2 },
  { id: 'q7', text: 'Quelle caractéristique du cloud computing permet aux utilisateurs de payer uniquement pour les ressources qu\'ils consomment ?', options: ['Multi-tenancy', 'Elasticité', 'Pay-as-you-go', 'Self-service'], correctAnswer: 2 },
  { id: 'q8', text: 'Quel type de cloud est utilisé exclusivement par une seule organisation ?', options: ['Cloud public', 'Cloud privé', 'Cloud hybride', 'Cloud communautaire'], correctAnswer: 1 },
  { id: 'q9', text: "Qu'est-ce que le 'cloud bursting' ?", options: ['Une faille de sécurité dans le cloud', 'Une technique permettant d\'utiliser des ressources cloud publiques lorsque le cloud privé atteint sa capacité maximale', 'Une méthode de compression des données dans le cloud', 'Une technologie de diffusion de contenu'], correctAnswer: 1 },
  { id: 'q10', text: "Quel service d'AWS fournit des machines virtuelles ?", options: ['S3', 'EC2', 'RDS', 'Lambda'], correctAnswer: 1 },
  { id: 'q11', text: 'Quelle commande Docker permet de créer et démarrer un conteneur en mode détaché ?', options: ['docker run -d', 'docker start --background', 'docker create --detach', 'docker launch -bg'], correctAnswer: 0 },
  { id: 'q12', text: "Quelle est la principale différence entre une machine virtuelle et un conteneur ?", options: ["Les conteneurs partagent le même noyau OS que l'hôte", 'Les conteneurs sont toujours plus rapides que les VMs', 'Les VMs ne peuvent exécuter qu\'un seul processus', 'Les conteneurs nécessitent plus de ressources que les VMs'], correctAnswer: 0 },
  { id: 'q13', text: 'Quel fichier est utilisé pour définir la construction d\'une image Docker ?', options: ['docker-compose.yml', 'Containerfile', 'Dockerfile', 'image.conf'], correctAnswer: 2 },
  { id: 'q14', text: "Qu'est-ce que Kubernetes ?", options: ["Une plateforme d'orchestration de conteneurs", 'Un hyperviseur de type 1', 'Un service de stockage cloud', "Un système d'exploitation pour conteneurs"], correctAnswer: 0 },
  { id: 'q15', text: "Quel est le principal avantage de l'orchestration de conteneurs ?", options: ['Automatiser le déploiement, la mise à l\'échelle et la gestion des applications conteneurisées', 'Créer des images de conteneurs', 'Remplacer complètement les VMs traditionnelles', 'Stocker les données des applications'], correctAnswer: 0 },
  { id: 'q16', text: "Qu'est-ce que le Software-Defined Networking (SDN) ?", options: ["Une approche de mise en réseau où le contrôle est découplé du matériel et implémenté en logiciel", 'Un protocole de routage spécifique au cloud', 'Un type de VPN utilisé dans les environnements virtualisés', 'Un système de câblage pour datacenters'], correctAnswer: 0 },
  { id: 'q17', text: "Qu'est-ce qu'un pod dans Kubernetes ?", options: ['Un cluster de nœuds worker', 'La plus petite unité déployable qui peut contenir un ou plusieurs conteneurs', 'Un service de stockage persistant', 'Un composant du plan de contrôle'], correctAnswer: 1 },
  { id: 'q18', text: 'Quelle commande permet de déployer une application sur Kubernetes à partir d\'un fichier YAML ?', options: ['kubectl run -f app.yaml', 'kubectl apply -f app.yaml', 'kubectl start -f app.yaml', 'kubectl deploy -f app.yaml'], correctAnswer: 1 },
  { id: 'q19', text: "Qu'est-ce qu'un Service dans Kubernetes ?", options: ['Une API REST pour gérer les clusters', 'Un ensemble de pods exposés comme un service réseau unique', 'Un type spécial de conteneur pour les applications web', 'Un outil de surveillance des performances'], correctAnswer: 1 },
  { id: 'q20', text: "Qu'est-ce que Helm dans l'écosystème Kubernetes ?", options: ['Un gestionnaire de packages pour Kubernetes', 'Un outil de monitoring', 'Un service de stockage', "Un système d'authentification"], correctAnswer: 0 },
  { id: 'q21', text: "Qu'est-ce qu'un cluster informatique ?", options: ["Un ensemble de machines travaillant ensemble comme un système unique", 'Une technique de stockage redondant', 'Un type de réseau local', 'Un système de sauvegarde distribué'], correctAnswer: 0 },
  { id: 'q22', text: "Qu'est-ce que la haute disponibilité (High Availability) ?", options: ["La capacité d'un système à fonctionner sans interruption pendant une période prolongée", 'La capacité à traiter un grand nombre de requêtes simultanées', 'La capacité à stocker de grandes quantités de données', "La capacité à exécuter des applications à haute performance"], correctAnswer: 0 },
  { id: 'q23', text: "Qu'est-ce que le scaling horizontal ?", options: ['Ajouter plus de ressources (CPU, RAM) à une machine existante', 'Ajouter plus de machines à un système', "Augmenter la capacité de stockage", 'Améliorer les performances réseau'], correctAnswer: 1 },
  { id: 'q24', text: "Qu'est-ce que l'équilibrage de charge (load balancing) ?", options: ["La distribution du trafic réseau sur plusieurs serveurs pour optimiser l'utilisation des ressources", "L'équilibrage des coûts entre différents fournisseurs cloud", 'La répartition des tâches administratives entre différentes équipes', "L'allocation dynamique de la mémoire"], correctAnswer: 0 },
  { id: 'q25', text: 'Quelle commande Kubernetes permet d\'afficher les informations détaillées sur un pod spécifique ?', options: ['kubectl inspect pod [nom-du-pod]', 'kubectl describe pod [nom-du-pod]', 'kubectl info pod [nom-du-pod]', 'kubectl show pod [nom-du-pod]'], correctAnswer: 1 },
  { id: 'q26', text: "Qu'est-ce qu'un hyperconverged infrastructure (HCI) ?", options: ['Une infrastructure qui combine calcul, stockage et réseau dans une seule solution intégrée', 'Un type de cloud hybride', "Un système d'exploitation spécialisé pour les VMs", 'Un protocole de communication entre datacenters'], correctAnswer: 0 },
  { id: 'q27', text: "Qu'est-ce qu'un réseau overlay dans un environnement virtualisé ?", options: ['Un réseau physique redondant', 'Un réseau virtuel construit par-dessus un réseau existant', 'Un type de VPN pour les connexions sécurisées', 'Un système de câblage haute performance'], correctAnswer: 1 },
  { id: 'q28', text: 'Quelle technologie est souvent utilisée pour créer des réseaux virtuels isolés dans le cloud ?', options: ['VPN', 'VPC (Virtual Private Cloud)', 'VRF (Virtual Routing and Forwarding)', 'MPLS'], correctAnswer: 1 },
  { id: 'q29', text: "Qu'est-ce qu'un NSX dans l'écosystème VMware ?", options: ['Une plateforme de virtualisation de serveurs', 'Une solution de virtualisation du réseau et de la sécurité', 'Un système de stockage distribué', 'Un outil de gestion de clusters'], correctAnswer: 1 },
  { id: 'q30', text: 'Quel protocole est couramment utilisé pour créer des tunnels dans les réseaux overlay ?', options: ['VXLAN', 'HTTP', 'FTP', 'SMTP'], correctAnswer: 0 },
  { id: 'q31', text: "Qu'est-ce que le SAN (Storage Area Network) ?", options: ["Un réseau dédié au stockage qui fournit l'accès au stockage au niveau des blocs", 'Un système de stockage basé sur le cloud', 'Un dispositif de sauvegarde automatique', 'Un système de fichiers distribué'], correctAnswer: 0 },
  { id: 'q32', text: 'Quelle technologie permet de présenter le stockage comme des fichiers partagés sur un réseau ?', options: ['SAN', 'NAS (Network Attached Storage)', 'DAS (Direct Attached Storage)', 'Object Storage'], correctAnswer: 1 },
  { id: 'q33', text: "Qu'est-ce que le thin provisioning ?", options: ["L'allocation dynamique d'espace de stockage selon les besoins réels", 'Un type de compression de données', 'Une technique de chiffrement du stockage', 'Un système de quotas pour limiter l\'utilisation'], correctAnswer: 0 },
  { id: 'q34', text: 'Quelle commande Docker permet de lister les volumes disponibles ?', options: ['docker volume ls', 'docker ls volumes', 'docker show volumes', 'docker volumes list'], correctAnswer: 0 },
  { id: 'q35', text: "Qu'est-ce qu'un volume persistant dans Kubernetes ?", options: ["Un composant de cluster qui gère l'authentification", 'Une ressource de stockage qui existe indépendamment du cycle de vie des pods', 'Un nœud spécialisé dans le stockage de données', 'Un système de journalisation persistant'], correctAnswer: 1 },
  { id: 'q36', text: "Qu'est-ce que l'isolation des ressources dans un environnement virtualisé ?", options: ['La séparation physique des serveurs', "L'assurance que les VMs ou conteneurs ne peuvent pas accéder aux ressources des autres", 'Le chiffrement complet des données', "La restriction d'accès Internet pour les VMs"], correctAnswer: 1 },
  { id: 'q37', text: 'Quelle commande Kubernetes permet de créer un objet à partir d\'un fichier YAML ?', options: ['kubectl generate -f fichier.yaml', 'kubectl create -f fichier.yaml', 'kubectl apply -f fichier.yaml', 'kubernetes start -f fichier.yaml'], correctAnswer: 2 },
  { id: 'q38', text: "Qu'est-ce qu'une politique de sécurité réseau dans Kubernetes ?", options: ['Une règle qui spécifie les communications réseau autorisées entre les pods', 'Un document de conformité obligatoire', 'Un protocole de chiffrement pour les communications inter-clusters', "Un système d'authentification pour l'accès aux nœuds"], correctAnswer: 0 },
  { id: 'q39', text: "Qu'est-ce que le principe du moindre privilège dans un contexte cloud ?", options: ["Octroyer uniquement les droits minimums nécessaires pour accomplir une tâche", 'Utiliser le cloud le moins cher possible', "Minimiser le nombre d'applications déployées", "Réduire la consommation d'énergie des datacenters"], correctAnswer: 0 },
  { id: 'q40', text: "Quelle commande Docker permet d'inspecter les métadonnées et configurations d'un conteneur ?", options: ['docker show', 'docker inspect', 'docker analyze', 'docker metadata'], correctAnswer: 1 },
];

// Mélange Fisher-Yates
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Santé
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'quiz-api' }));

/**
 * GET /api/quiz/esgis
 * Retourne les 40 questions statiques ESGIS (ordre aléatoire).
 * Optionnel : ?count=N  pour limiter le nombre de questions retournées.
 */
app.get('/api/quiz/esgis', (req, res) => {
  const count = Math.min(parseInt(req.query.count) || ESGIS_QUESTIONS.length, ESGIS_QUESTIONS.length);
  const questions = shuffle(ESGIS_QUESTIONS).slice(0, count).map(({ correctAnswer: _, ...q }) => q);
  res.json({
    title: 'Questions pour ESGIS – Virtualisation Cloud et Datacenter advanced',
    total: questions.length,
    questions,
  });
});

/**
 * GET /api/quiz/esgis/full
 * Retourne les questions AVEC les bonnes réponses (usage admin/correction).
 */
app.get('/api/quiz/esgis/full', (req, res) => {
  res.json({
    title: 'Questions pour ESGIS – Virtualisation Cloud et Datacenter advanced (avec réponses)',
    total: ESGIS_QUESTIONS.length,
    questions: ESGIS_QUESTIONS,
  });
});

/**
 * GET /api/quiz/practice
 * Liste les quiz d'entraînement actifs depuis Supabase (practice_quizzes).
 */
app.get('/api/quiz/practice', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('practice_quizzes')
      .select('id, title, description, course_id, duration_minutes, difficulty, questions')
      .eq('is_active', true)
      .order('title');

    if (error) throw error;
    res.json({ data: data || [], total: (data || []).length });
  } catch (err) {
    console.error('[quiz-api] /api/quiz/practice error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/quiz/practice/:id
 * Détail d'un quiz d'entraînement depuis Supabase.
 */
app.get('/api/quiz/practice/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('practice_quizzes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Quiz introuvable' });
    res.json(data);
  } catch (err) {
    console.error('[quiz-api] /api/quiz/practice/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/quiz/exam/:examId
 * Questions d'un examen depuis Supabase (exam_questions).
 */
app.get('/api/quiz/exam/:examId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('id, exam_id, question_number, question_text, question_type, points, options')
      .eq('exam_id', req.params.examId)
      .order('question_number');

    if (error) throw error;
    res.json({ data: data || [], total: (data || []).length });
  } catch (err) {
    console.error('[quiz-api] /api/quiz/exam/:examId error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[quiz-api] Serveur démarré sur le port ${PORT}`);
  console.log(`[quiz-api] Supabase URL : ${SUPABASE_URL}`);
});
