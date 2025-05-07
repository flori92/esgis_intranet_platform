/**
 * Script pour restaurer l'implémentation originale du quiz de virtualisation
 * telle qu'elle était dans le commit f24e043
 */

import fs from 'fs';
import path from 'path';

// Fonction principale
const main = async () => {
  console.log("=== RESTAURATION DE L'IMPLÉMENTATION ORIGINALE DU QUIZ DE VIRTUALISATION ===");
  
  try {
    // 1. Créer le dossier data s'il n'existe pas
    const dataDir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Dossier ${dataDir} créé.`);
    }
    
    // 2. Créer le fichier questions.js avec les 40 questions originales
    const questionsPath = path.join(dataDir, 'questions.js');
    
    const questionsContent = `/**
 * Questions pour le quiz de virtualisation cloud et datacenter
 * Implémentation originale du commit f24e043
 */

// Questions complètes pour le cours de virtualisation cloud et datacenter
export const questions = [
  {
    id: "q1",
    text: "Quelle technologie permet d'exécuter plusieurs systèmes d'exploitation sur une même machine physique ?",
    options: [
      "L'émulation",
      "La virtualisation",
      "La containerisation",
      "Le clustering"
    ],
    correctAnswer: 1
  },
  {
    id: "q2",
    text: "Quel composant logiciel permet de créer et de gérer des machines virtuelles ?",
    options: [
      "Container Engine",
      "Broker d'API",
      "Hyperviseur",
      "Orchestrateur"
    ],
    correctAnswer: 2
  },
  {
    id: "q3",
    text: "Qu'est-ce que la virtualisation matérielle assistée ?",
    options: [
      "Une virtualisation qui ne fonctionne qu'avec du matériel spécifique",
      "Une technique utilisant des extensions du processeur pour accélérer la virtualisation",
      "L'émulation complète du matériel physique",
      "Un type de virtualisation basée uniquement sur des logiciels"
    ],
    correctAnswer: 1
  },
  {
    id: "q4",
    text: "Quelle est la principale différence entre un hyperviseur de type 1 et un hyperviseur de type 2 ?",
    options: [
      "Le type 1 s'exécute directement sur le matériel, le type 2 sur un système d'exploitation hôte",
      "Le type 1 est open source, le type 2 est propriétaire",
      "Le type 1 supporte uniquement Linux, le type 2 est multi-plateforme",
      "Le type 1 est plus ancien que le type 2"
    ],
    correctAnswer: 0
  },
  {
    id: "q5",
    text: "Qu'est-ce que la migration à chaud (live migration) d'une machine virtuelle ?",
    options: [
      "Le déplacement d'une VM d'un hôte à un autre sans interruption de service",
      "La sauvegarde à chaud des données d'une VM",
      "L'ajout de ressources à une VM pendant son fonctionnement",
      "Le redimensionnement automatique d'une VM selon sa charge"
    ],
    correctAnswer: 0
  },
  {
    id: "q6",
    text: "Quel modèle de service cloud fournit uniquement l'infrastructure de calcul, réseau et stockage ?",
    options: [
      "SaaS",
      "PaaS",
      "IaaS",
      "FaaS"
    ],
    correctAnswer: 2
  },
  {
    id: "q7",
    text: "Quelle caractéristique du cloud computing permet aux utilisateurs de payer uniquement pour les ressources qu'ils consomment ?",
    options: [
      "Multi-tenancy",
      "Elasticité",
      "Pay-as-you-go",
      "Self-service"
    ],
    correctAnswer: 2
  },
  {
    id: "q8",
    text: "Quel type de cloud est utilisé exclusivement par une seule organisation ?",
    options: [
      "Cloud public",
      "Cloud privé",
      "Cloud hybride",
      "Cloud communautaire"
    ],
    correctAnswer: 1
  },
  {
    id: "q9",
    text: "Qu'est-ce que le 'cloud bursting' ?",
    options: [
      "Une faille de sécurité dans le cloud",
      "Une technique permettant d'utiliser des ressources cloud publiques lorsque le cloud privé atteint sa capacité maximale",
      "Une méthode de compression des données dans le cloud",
      "Une technologie de diffusion de contenu"
    ],
    correctAnswer: 1
  },
  {
    id: "q10",
    text: "Quel service d'AWS fournit des machines virtuelles ?",
    options: [
      "S3",
      "EC2",
      "RDS",
      "Lambda"
    ],
    correctAnswer: 1
  },
  {
    id: "q11",
    text: "Quelle commande Docker permet de créer et démarrer un conteneur en mode détaché ?",
    options: [
      "docker run -d",
      "docker start --background",
      "docker create --detach",
      "docker launch -bg"
    ],
    correctAnswer: 0
  },
  {
    id: "q12",
    text: "Quelle est la principale différence entre une machine virtuelle et un conteneur ?",
    options: [
      "Les conteneurs partagent le même noyau OS que l'hôte",
      "Les conteneurs sont toujours plus rapides que les VMs",
      "Les VMs ne peuvent exécuter qu'un seul processus",
      "Les conteneurs nécessitent plus de ressources que les VMs"
    ],
    correctAnswer: 0
  },
  {
    id: "q13",
    text: "Quel fichier est utilisé pour définir la construction d'une image Docker ?",
    options: [
      "docker-compose.yml",
      "Containerfile",
      "Dockerfile",
      "image.conf"
    ],
    correctAnswer: 2
  },
  {
    id: "q14",
    text: "Qu'est-ce que Kubernetes ?",
    options: [
      "Une plateforme d'orchestration de conteneurs",
      "Un hyperviseur de type 1",
      "Un service de stockage cloud",
      "Un système d'exploitation pour conteneurs"
    ],
    correctAnswer: 0
  },
  {
    id: "q15",
    text: "Quel est le principal avantage de l'orchestration de conteneurs ?",
    options: [
      "Automatiser le déploiement, la mise à l'échelle et la gestion des applications conteneurisées",
      "Créer des images de conteneurs",
      "Remplacer complètement les VMs traditionnelles",
      "Stocker les données des applications"
    ],
    correctAnswer: 0
  },
  {
    id: "q16",
    text: "Qu'est-ce que le Software-Defined Networking (SDN) ?",
    options: [
      "Une approche de mise en réseau où le contrôle est découplé du matériel et implémenté en logiciel",
      "Un protocole de routage spécifique au cloud",
      "Un type de VPN utilisé dans les environnements virtualisés",
      "Un système de câblage pour datacenters"
    ],
    correctAnswer: 0
  },
  {
    id: "q17",
    text: "Qu'est-ce qu'un pod dans Kubernetes ?",
    options: [
      "Un cluster de nœuds worker",
      "La plus petite unité déployable qui peut contenir un ou plusieurs conteneurs",
      "Un service de stockage persistant",
      "Un composant du plan de contrôle"
    ],
    correctAnswer: 1
  },
  {
    id: "q18",
    text: "Quelle commande permet de déployer une application sur Kubernetes à partir d'un fichier YAML ?",
    options: [
      "kubectl run -f app.yaml",
      "kubectl apply -f app.yaml",
      "kubectl start -f app.yaml",
      "kubectl deploy -f app.yaml"
    ],
    correctAnswer: 1
  },
  {
    id: "q19",
    text: "Qu'est-ce qu'un Service dans Kubernetes ?",
    options: [
      "Une API REST pour gérer les clusters",
      "Un ensemble de pods exposés comme un service réseau unique",
      "Un type spécial de conteneur pour les applications web",
      "Un outil de surveillance des performances"
    ],
    correctAnswer: 1
  },
  {
    id: "q20",
    text: "Qu'est-ce que Helm dans l'écosystème Kubernetes ?",
    options: [
      "Un gestionnaire de packages pour Kubernetes",
      "Un outil de monitoring",
      "Un service de stockage",
      "Un système d'authentification"
    ],
    correctAnswer: 0
  },
  {
    id: "q21",
    text: "Qu'est-ce qu'un cluster informatique ?",
    options: [
      "Un ensemble de machines travaillant ensemble comme un système unique",
      "Une technique de stockage redondant",
      "Un type de réseau local",
      "Un système de sauvegarde distribué"
    ],
    correctAnswer: 0
  },
  {
    id: "q22",
    text: "Qu'est-ce que la haute disponibilité (High Availability) ?",
    options: [
      "La capacité d'un système à fonctionner sans interruption pendant une période prolongée",
      "La capacité à traiter un grand nombre de requêtes simultanées",
      "La capacité à stocker de grandes quantités de données",
      "La capacité à exécuter des applications à haute performance"
    ],
    correctAnswer: 0
  },
  {
    id: "q23",
    text: "Qu'est-ce que le scaling horizontal ?",
    options: [
      "Ajouter plus de ressources (CPU, RAM) à une machine existante",
      "Ajouter plus de machines à un système",
      "Augmenter la capacité de stockage",
      "Améliorer les performances réseau"
    ],
    correctAnswer: 1
  },
  {
    id: "q24",
    text: "Qu'est-ce que l'équilibrage de charge (load balancing) ?",
    options: [
      "La distribution du trafic réseau sur plusieurs serveurs pour optimiser l'utilisation des ressources",
      "L'équilibrage des coûts entre différents fournisseurs cloud",
      "La répartition des tâches administratives entre différentes équipes",
      "L'allocation dynamique de la mémoire"
    ],
    correctAnswer: 0
  },
  {
    id: "q25",
    text: "Quelle commande Kubernetes permet d'afficher les informations détaillées sur un pod spécifique ?",
    options: [
      "kubectl inspect pod [nom-du-pod]",
      "kubectl describe pod [nom-du-pod]",
      "kubectl info pod [nom-du-pod]",
      "kubectl show pod [nom-du-pod]"
    ],
    correctAnswer: 1
  },
  {
    id: "q26",
    text: "Qu'est-ce qu'un hyperconverged infrastructure (HCI) ?",
    options: [
      "Une infrastructure qui combine calcul, stockage et réseau dans une seule solution intégrée",
      "Un type de cloud hybride",
      "Un système d'exploitation spécialisé pour les VMs",
      "Un protocole de communication entre datacenters"
    ],
    correctAnswer: 0
  },
  {
    id: "q27",
    text: "Qu'est-ce qu'un réseau overlay dans un environnement virtualisé ?",
    options: [
      "Un réseau physique redondant",
      "Un réseau virtuel construit par-dessus un réseau existant",
      "Un type de VPN pour les connexions sécurisées",
      "Un système de câblage haute performance"
    ],
    correctAnswer: 1
  },
  {
    id: "q28",
    text: "Quelle technologie est souvent utilisée pour créer des réseaux virtuels isolés dans le cloud ?",
    options: [
      "VPN",
      "VPC (Virtual Private Cloud)",
      "VRF (Virtual Routing and Forwarding)",
      "MPLS"
    ],
    correctAnswer: 1
  },
  {
    id: "q29",
    text: "Qu'est-ce qu'un NSX dans l'écosystème VMware ?",
    options: [
      "Une plateforme de virtualisation de serveurs",
      "Une solution de virtualisation du réseau et de la sécurité",
      "Un système de stockage distribué",
      "Un outil de gestion de clusters"
    ],
    correctAnswer: 1
  },
  {
    id: "q30",
    text: "Quel protocole est couramment utilisé pour créer des tunnels dans les réseaux overlay ?",
    options: [
      "VXLAN",
      "HTTP",
      "FTP",
      "SMTP"
    ],
    correctAnswer: 0
  },
  {
    id: "q31",
    text: "Qu'est-ce que le SAN (Storage Area Network) ?",
    options: [
      "Un réseau dédié au stockage qui fournit l'accès au stockage au niveau des blocs",
      "Un système de stockage basé sur le cloud",
      "Un dispositif de sauvegarde automatique",
      "Un système de fichiers distribué"
    ],
    correctAnswer: 0
  },
  {
    id: "q32",
    text: "Quelle technologie permet de présenter le stockage comme des fichiers partagés sur un réseau ?",
    options: [
      "SAN",
      "NAS (Network Attached Storage)",
      "DAS (Direct Attached Storage)",
      "Object Storage"
    ],
    correctAnswer: 1
  },
  {
    id: "q33",
    text: "Qu'est-ce que le thin provisioning ?",
    options: [
      "L'allocation dynamique d'espace de stockage selon les besoins réels",
      "Un type de compression de données",
      "Une technique de chiffrement du stockage",
      "Un système de quotas pour limiter l'utilisation"
    ],
    correctAnswer: 0
  },
  {
    id: "q34",
    text: "Quelle commande Docker permet de lister les volumes disponibles ?",
    options: [
      "docker volume ls",
      "docker ls volumes",
      "docker show volumes",
      "docker volumes list"
    ],
    correctAnswer: 0
  },
  {
    id: "q35",
    text: "Qu'est-ce qu'un volume persistant dans Kubernetes ?",
    options: [
      "Un composant de cluster qui gère l'authentification",
      "Une ressource de stockage qui existe indépendamment du cycle de vie des pods",
      "Un nœud spécialisé dans le stockage de données",
      "Un système de journalisation persistant"
    ],
    correctAnswer: 1
  },
  {
    id: "q36",
    text: "Qu'est-ce que l'isolation des ressources dans un environnement virtualisé ?",
    options: [
      "La séparation physique des serveurs",
      "L'assurance que les VMs ou conteneurs ne peuvent pas accéder aux ressources des autres",
      "Le chiffrement complet des données",
      "La restriction d'accès Internet pour les VMs"
    ],
    correctAnswer: 1
  },
  {
    id: "q37",
    text: "Quelle commande Kubernetes permet de créer un objet à partir d'un fichier YAML ?",
    options: [
      "kubectl generate -f fichier.yaml",
      "kubectl create -f fichier.yaml",
      "kubectl apply -f fichier.yaml",
      "kubernetes start -f fichier.yaml"
    ],
    correctAnswer: 2
  },
  {
    id: "q38",
    text: "Qu'est-ce qu'une politique de sécurité réseau dans Kubernetes ?",
    options: [
      "Une règle qui spécifie les communications réseau autorisées entre les pods",
      "Un document de conformité obligatoire",
      "Un protocole de chiffrement pour les communications inter-clusters",
      "Un système d'authentification pour l'accès aux nœuds"
    ],
    correctAnswer: 0
  },
  {
    id: "q39",
    text: "Qu'est-ce que le principe du moindre privilège dans un contexte cloud ?",
    options: [
      "Octroyer uniquement les droits minimums nécessaires pour accomplir une tâche",
      "Utiliser le cloud le moins cher possible",
      "Minimiser le nombre d'applications déployées",
      "Réduire la consommation d'énergie des datacenters"
    ],
    correctAnswer: 0
  },
  {
    id: "q40",
    text: "Quelle commande Docker permet d'inspecter les métadonnées et configurations d'un conteneur ?",
    options: [
      "docker show",
      "docker inspect",
      "docker analyze",
      "docker metadata"
    ],
    correctAnswer: 1
  }
];

// Fonction pour obtenir les questions dans un ordre aléatoire
export const getRandomizedQuestions = () => {
  // Créer une copie du tableau de questions
  const shuffledQuestions = [...questions];
  
  // Algorithme de mélange Fisher-Yates
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
  }
  
  return shuffledQuestions;
};
`;
    
    fs.writeFileSync(questionsPath, questionsContent, 'utf8');
    console.log(`Fichier ${questionsPath} créé avec les 40 questions originales.`);
    
    // 3. Créer le fichier virtualizationQuizData.js
    const virtualizationQuizDataPath = path.join(dataDir, 'virtualizationQuizData.js');
    
    const virtualizationQuizDataContent = `/**
 * Données du quiz "Virtualization Cloud et Datacenter advanced"
 * Implémentation originale du commit f24e043
 */
import { questions, getRandomizedQuestions } from './questions';

export const virtualizationQuizData = {
  title: "Quiz - Virtualization Cloud et Datacenter advanced",
  description: "Quiz sur les concepts avancés de virtualisation, cloud computing et datacenter",
  duration: 45, // minutes
  questions: getRandomizedQuestions()
};

export default virtualizationQuizData;
`;
    
    fs.writeFileSync(virtualizationQuizDataPath, virtualizationQuizDataContent, 'utf8');
    console.log(`Fichier ${virtualizationQuizDataPath} créé avec la randomisation des questions.`);
    
    // 4. Modifier le composant QuizLauncher.jsx pour utiliser virtualizationQuizData
    const quizLauncherPath = path.join(process.cwd(), 'src/components/QuizLauncher.jsx');
    
    if (fs.existsSync(quizLauncherPath)) {
      let quizLauncherContent = fs.readFileSync(quizLauncherPath, 'utf8');
      
      // Vérifier si l'importation existe déjà
      if (!quizLauncherContent.includes('virtualizationQuizData')) {
        // Ajouter l'importation
        quizLauncherContent = quizLauncherContent.replace(
          /import Quiz from '\.\/Quiz';/,
          `import Quiz from './Quiz';\nimport { virtualizationQuizData } from '../data/virtualizationQuizData';`
        );
      }
      
      // Modifier la fonction fetchQuizData pour utiliser virtualizationQuizData
      if (!quizLauncherContent.includes('examId === \'quiz1\' || examId.includes(\'virtualization\')')) {
        quizLauncherContent = quizLauncherContent.replace(
          /const fetchQuizData = async \(\) => {[\s\S]*?setLoading\(true\);[\s\S]*?setError\(null\);[\s\S]*?try {/,
          `const fetchQuizData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Vérifier si c'est le quiz de virtualisation
        if (examId === 'quiz1' || examId.includes('virtualization')) {
          console.log('Chargement du quiz Virtualization Cloud et Datacenter advanced');
          setQuizData(virtualizationQuizData);
          setLoading(false);
          return;
        }`
        );
      }
      
      // Ajouter la solution de secours pour utiliser virtualizationQuizData
      if (!quizLauncherContent.includes('examId.toLowerCase().includes(\'virtual\') || examId.toLowerCase().includes(\'cloud\')')) {
        quizLauncherContent = quizLauncherContent.replace(
          /} catch \(error\) {[\s\S]*?console\.error\('Erreur lors du chargement du quiz:', error\);[\s\S]*?setError\(error\.message\);/,
          `} catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
        setError(error.message);
        
        // Solution de secours: utiliser les données du quiz de virtualisation
        if (examId.toLowerCase().includes('virtual') || examId.toLowerCase().includes('cloud')) {
          console.log('Utilisation des données de secours pour le quiz Virtualization');
          setQuizData(virtualizationQuizData);
        }`
        );
      }
      
      // Écrire le contenu modifié dans le fichier
      fs.writeFileSync(quizLauncherPath, quizLauncherContent, 'utf8');
      console.log(`Composant ${quizLauncherPath} modifié pour utiliser virtualizationQuizData.`);
    } else {
      console.error(`Le fichier ${quizLauncherPath} n'existe pas.`);
    }
    
    // 5. Vérifier si le contexte QuizContext.jsx utilise la randomisation
    const quizContextPath = path.join(process.cwd(), 'src/context/QuizContext.jsx');
    
    if (fs.existsSync(quizContextPath)) {
      let quizContextContent = fs.readFileSync(quizContextPath, 'utf8');
      
      // Vérifier si l'importation existe déjà
      if (!quizContextContent.includes('getRandomizedQuestions')) {
        // Ajouter l'importation
        quizContextContent = quizContextContent.replace(
          /import { Question, QuizResult, QuizStatus, Timer } from "\.\.\/types";/,
          `import { Question, QuizResult, QuizStatus, Timer } from "../types";\nimport { getRandomizedQuestions } from "../data/questions";`
        );
      }
      
      // Vérifier si la fonction startQuiz utilise getRandomizedQuestions
      if (!quizContextContent.includes('const randomizedQuestions = getRandomizedQuestions()')) {
        quizContextContent = quizContextContent.replace(
          /const startQuiz = \(\) => {[\s\S]*?setQuestions\([^)]*\);/,
          `const startQuiz = () => {
    const randomizedQuestions = getRandomizedQuestions();
    setQuestions(randomizedQuestions);`
        );
      }
      
      // Écrire le contenu modifié dans le fichier
      fs.writeFileSync(quizContextPath, quizContextContent, 'utf8');
      console.log(`Contexte ${quizContextPath} modifié pour utiliser getRandomizedQuestions.`);
    } else {
      console.error(`Le fichier ${quizContextPath} n'existe pas.`);
    }
    
    console.log("\nRestauration de l'implémentation originale du quiz de virtualisation terminée avec succès !");
    console.log("L'implémentation est maintenant conforme à celle du commit f24e043.");
    console.log("La randomisation des questions est activée pour prévenir la communication des réponses entre étudiants.");
    
  } catch (error) {
    console.error(`Erreur lors de la restauration de l'implémentation originale:`, error);
  }
  
  console.log("=== FIN DE LA RESTAURATION ===");
};

// Exécuter la fonction principale
main();
