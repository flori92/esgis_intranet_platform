/**
 * Données du quiz "Virtualization Cloud et Datacenter advanced"
 * @module data/virtualizationQuizData
 */

export const virtualizationQuizData = {
  title: "Quiz - Virtualization Cloud et Datacenter advanced",
  description: "Quiz sur les concepts avancés de virtualisation, cloud computing et datacenter",
  duration: 45, // minutes
  questions: [
    {
      id: "vq1",
      text: "Quelle technologie permet de créer plusieurs machines virtuelles sur un seul serveur physique?",
      options: [
        "Containerisation",
        "Hyperviseur",
        "Microservices",
        "Orchestration"
      ],
      correctAnswer: 1 // Hyperviseur
    },
    {
      id: "vq2",
      text: "Quelle est la différence fondamentale entre la virtualisation et la containerisation?",
      options: [
        "La virtualisation est plus récente que la containerisation",
        "La virtualisation émule le matériel complet alors que la containerisation partage le noyau du système d'exploitation",
        "La containerisation nécessite plus de ressources que la virtualisation",
        "La virtualisation ne fonctionne que sur Linux"
      ],
      correctAnswer: 1 // La virtualisation émule le matériel complet...
    },
    {
      id: "vq3",
      text: "Quel est l'avantage principal du cloud computing par rapport à l'infrastructure traditionnelle?",
      options: [
        "Coût initial plus faible",
        "Sécurité absolue",
        "Élasticité et mise à l'échelle automatique",
        "Performances toujours supérieures"
      ],
      correctAnswer: 2 // Élasticité et mise à l'échelle automatique
    },
    {
      id: "vq4",
      text: "Qu'est-ce que l'hyperconvergence dans un datacenter?",
      options: [
        "Une technique de refroidissement avancée",
        "L'intégration du stockage, du calcul et du réseau dans une seule solution",
        "Un protocole de communication entre datacenters",
        "Une méthode de virtualisation spécifique à VMware"
      ],
      correctAnswer: 1 // L'intégration du stockage, du calcul et du réseau...
    },
    {
      id: "vq5",
      text: "Quel service AWS permet de déployer des machines virtuelles dans le cloud?",
      options: [
        "AWS Lambda",
        "Amazon EC2",
        "Amazon S3",
        "AWS Glue"
      ],
      correctAnswer: 1 // Amazon EC2
    },
    {
      id: "vq6",
      text: "Qu'est-ce que le PaaS (Platform as a Service)?",
      options: [
        "Un modèle où l'utilisateur gère tout, du matériel aux applications",
        "Un modèle où l'utilisateur ne gère que les applications et les données",
        "Un modèle où l'utilisateur loue du matériel physique",
        "Un modèle où l'utilisateur paie uniquement pour les fonctions exécutées"
      ],
      correctAnswer: 1 // Un modèle où l'utilisateur ne gère que les applications...
    },
    {
      id: "vq7",
      text: "Quelle technologie est à la base de Docker?",
      options: [
        "Les conteneurs LXC",
        "Les machines virtuelles KVM",
        "Les zones Solaris",
        "Les hyperviseurs de type 1"
      ],
      correctAnswer: 0 // Les conteneurs LXC
    },
    {
      id: "vq8",
      text: "Qu'est-ce que Kubernetes?",
      options: [
        "Un hyperviseur open-source",
        "Une plateforme de virtualisation propriétaire",
        "Un système d'orchestration de conteneurs",
        "Un service de stockage cloud"
      ],
      correctAnswer: 2 // Un système d'orchestration de conteneurs
    },
    {
      id: "vq9",
      text: "Quelle est la principale caractéristique d'un datacenter Tier IV?",
      options: [
        "Redondance partielle",
        "Tolérance aux pannes complète",
        "Coût minimal",
        "Absence de maintenance"
      ],
      correctAnswer: 1 // Tolérance aux pannes complète
    },
    {
      id: "vq10",
      text: "Quelle technologie permet la migration à chaud d'une machine virtuelle?",
      options: [
        "vMotion",
        "Hot Swap",
        "Live Migration",
        "Dynamic Transfer"
      ],
      correctAnswer: 2 // Live Migration
    },
    {
      id: "vq11",
      text: "Quelle est la principale différence entre le cloud public et le cloud privé?",
      options: [
        "Le cloud public est gratuit, le cloud privé est payant",
        "Le cloud public est partagé entre plusieurs organisations, le cloud privé est dédié à une seule",
        "Le cloud public est moins sécurisé que le cloud privé",
        "Le cloud public est plus rapide que le cloud privé"
      ],
      correctAnswer: 1
    },
    {
      id: "vq12",
      text: "Qu'est-ce que le modèle IaaS (Infrastructure as a Service)?",
      options: [
        "Un service qui fournit uniquement des applications",
        "Un service qui fournit des ressources informatiques virtualisées via Internet",
        "Un service qui fournit uniquement du stockage",
        "Un service qui fournit uniquement des réseaux virtuels"
      ],
      correctAnswer: 1
    },
    {
      id: "vq13",
      text: "Quel est l'avantage principal de la virtualisation de serveurs?",
      options: [
        "Réduction des coûts matériels",
        "Augmentation de la vitesse du réseau",
        "Simplification de la programmation",
        "Élimination des problèmes de sécurité"
      ],
      correctAnswer: 0
    },
    {
      id: "vq14",
      text: "Quelle technologie permet de créer des réseaux virtuels isolés dans un cloud?",
      options: [
        "VPN (Virtual Private Network)",
        "VDI (Virtual Desktop Infrastructure)",
        "VPC (Virtual Private Cloud)",
        "VLAN (Virtual Local Area Network)"
      ],
      correctAnswer: 2
    },
    {
      id: "vq15",
      text: "Qu'est-ce que le 'cloud bursting'?",
      options: [
        "Une panne massive dans un cloud public",
        "La capacité de déployer des applications dans plusieurs clouds",
        "L'extension dynamique d'un cloud privé vers un cloud public lors de pics de charge",
        "Une technique de sécurité pour protéger les données dans le cloud"
      ],
      correctAnswer: 2
    },
    {
      id: "vq16",
      text: "Quel est le principal avantage de l'architecture sans serveur (serverless)?",
      options: [
        "Elle élimine complètement le besoin de serveurs",
        "Elle permet aux développeurs de se concentrer sur le code sans gérer l'infrastructure",
        "Elle est toujours moins chère que les architectures traditionnelles",
        "Elle offre des performances supérieures dans tous les cas"
      ],
      correctAnswer: 1
    },
    {
      id: "vq17",
      text: "Quelle technologie est utilisée pour isoler les processus dans Docker?",
      options: [
        "Les namespaces Linux",
        "Les machines virtuelles légères",
        "Les hyperviseurs de type 2",
        "Les zones Solaris"
      ],
      correctAnswer: 0
    },
    {
      id: "vq18",
      text: "Qu'est-ce que le 'cold storage' dans le contexte du cloud?",
      options: [
        "Un stockage physiquement situé dans des régions froides",
        "Un stockage à faible coût pour les données rarement consultées",
        "Un stockage temporaire pour les données en transit",
        "Un stockage hautement sécurisé pour les données sensibles"
      ],
      correctAnswer: 1
    },
    {
      id: "vq19",
      text: "Quelle est la principale caractéristique d'un SAN (Storage Area Network)?",
      options: [
        "Il connecte des serveurs directement à Internet",
        "Il fournit un stockage au niveau bloc accessible comme des disques locaux",
        "Il est exclusivement utilisé pour les sauvegardes",
        "Il ne peut être utilisé qu'avec des serveurs physiques"
      ],
      correctAnswer: 1
    },
    {
      id: "vq20",
      text: "Qu'est-ce que le 'edge computing'?",
      options: [
        "Le traitement des données au plus près de leur source",
        "Le calcul effectué uniquement sur des serveurs haut de gamme",
        "Une technique d'optimisation des centres de données",
        "Le traitement des données exclusivement dans le cloud"
      ],
      correctAnswer: 0
    },
    {
      id: "vq21",
      text: "Quelle est la principale différence entre la haute disponibilité et la reprise après sinistre?",
      options: [
        "La haute disponibilité est moins coûteuse",
        "La haute disponibilité vise à minimiser les temps d'arrêt, la reprise après sinistre à récupérer après une catastrophe majeure",
        "La haute disponibilité concerne uniquement les applications, la reprise après sinistre les données",
        "La haute disponibilité est automatique, la reprise après sinistre est manuelle"
      ],
      correctAnswer: 1
    },
    {
      id: "vq22",
      text: "Qu'est-ce que le 'cloud-native'?",
      options: [
        "Des applications conçues spécifiquement pour un fournisseur de cloud",
        "Des applications qui fonctionnent exclusivement dans le cloud",
        "Des applications conçues pour exploiter pleinement les avantages du cloud computing",
        "Des applications qui ne nécessitent pas d'infrastructure physique"
      ],
      correctAnswer: 2
    },
    {
      id: "vq23",
      text: "Quel est l'avantage principal des architectures de microservices?",
      options: [
        "Elles sont plus simples à comprendre que les architectures monolithiques",
        "Elles permettent des déploiements indépendants et une meilleure scalabilité",
        "Elles nécessitent moins de ressources serveur",
        "Elles sont toujours plus rapides que les architectures monolithiques"
      ],
      correctAnswer: 1
    },
    {
      id: "vq24",
      text: "Qu'est-ce que le 'Software-Defined Networking' (SDN)?",
      options: [
        "Une approche de la mise en réseau qui utilise des contrôleurs logiciels pour gérer le comportement du réseau",
        "Un type de réseau qui fonctionne uniquement avec des logiciels, sans matériel",
        "Un réseau qui se configure automatiquement sans intervention humaine",
        "Un réseau optimisé pour les applications logicielles"
      ],
      correctAnswer: 0
    },
    {
      id: "vq25",
      text: "Quelle est la principale caractéristique d'un hyperviseur de type 1?",
      options: [
        "Il s'exécute comme une application sur un système d'exploitation hôte",
        "Il s'exécute directement sur le matériel du serveur",
        "Il ne peut virtualiser que des systèmes Windows",
        "Il est plus lent qu'un hyperviseur de type 2"
      ],
      correctAnswer: 1
    },
    {
      id: "vq26",
      text: "Qu'est-ce que le 'multi-cloud'?",
      options: [
        "L'utilisation de plusieurs instances dans un même cloud",
        "L'utilisation de services cloud de plusieurs fournisseurs différents",
        "Un cloud qui s'étend sur plusieurs continents",
        "Un cloud qui prend en charge plusieurs systèmes d'exploitation"
      ],
      correctAnswer: 1
    },
    {
      id: "vq27",
      text: "Quelle technologie permet d'automatiser le déploiement d'infrastructures cloud?",
      options: [
        "Infrastructure as Code (IaC)",
        "Continuous Integration (CI)",
        "Virtual Desktop Infrastructure (VDI)",
        "Content Delivery Network (CDN)"
      ],
      correctAnswer: 0
    },
    {
      id: "vq28",
      text: "Qu'est-ce que le 'bare metal cloud'?",
      options: [
        "Un cloud qui utilise exclusivement des serveurs physiques dédiés",
        "Un cloud optimisé pour les applications gourmandes en ressources",
        "Un cloud qui n'utilise pas de virtualisation",
        "Un cloud avec une sécurité renforcée"
      ],
      correctAnswer: 0
    },
    {
      id: "vq29",
      text: "Quelle est la principale différence entre le scaling vertical et horizontal?",
      options: [
        "Le scaling vertical ajoute plus de ressources à un serveur existant, le scaling horizontal ajoute plus de serveurs",
        "Le scaling vertical concerne les applications, le scaling horizontal l'infrastructure",
        "Le scaling vertical est automatique, le scaling horizontal est manuel",
        "Le scaling vertical est moins coûteux que le scaling horizontal"
      ],
      correctAnswer: 0
    },
    {
      id: "vq30",
      text: "Qu'est-ce que le 'cloud washing'?",
      options: [
        "Une technique pour nettoyer les données dans le cloud",
        "Le processus de migration vers le cloud",
        "La pratique marketing de rebaptiser des produits existants comme 'cloud' sans réelle innovation",
        "Une méthode pour sécuriser les données dans le cloud"
      ],
      correctAnswer: 2
    },
    {
      id: "vq31",
      text: "Quelle technologie est à la base des conteneurs Windows?",
      options: [
        "Docker",
        "Windows Server Containers",
        "Hyper-V",
        "Windows Subsystem for Linux (WSL)"
      ],
      correctAnswer: 1
    },
    {
      id: "vq32",
      text: "Qu'est-ce que le 'cloud hybride'?",
      options: [
        "Un mélange de cloud public et privé qui fonctionne comme un environnement intégré",
        "Un cloud qui prend en charge à la fois Windows et Linux",
        "Un cloud qui combine le stockage et le calcul",
        "Un cloud qui utilise plusieurs technologies de virtualisation"
      ],
      correctAnswer: 0
    },
    {
      id: "vq33",
      text: "Quelle est la principale caractéristique d'un réseau défini par logiciel (SDN)?",
      options: [
        "Il est plus rapide que les réseaux traditionnels",
        "Il sépare le plan de contrôle du plan de données",
        "Il ne nécessite aucun matériel réseau",
        "Il est exclusivement utilisé dans les clouds publics"
      ],
      correctAnswer: 1
    },
    {
      id: "vq34",
      text: "Qu'est-ce que le 'cloud continuum'?",
      options: [
        "La connexion ininterrompue entre différents clouds",
        "Un spectre d'options de déploiement allant du edge au cloud en passant par les centres de données",
        "Une technique pour assurer la continuité des services cloud",
        "Un modèle de tarification pour les services cloud"
      ],
      correctAnswer: 1
    },
    {
      id: "vq35",
      text: "Quelle est la principale caractéristique d'un stockage objet?",
      options: [
        "Il organise les données en blocs de taille fixe",
        "Il organise les données en fichiers et dossiers",
        "Il organise les données en objets avec métadonnées et identifiants uniques",
        "Il organise les données en tables relationnelles"
      ],
      correctAnswer: 2
    },
    {
      id: "vq36",
      text: "Qu'est-ce que le 'cloud souverain'?",
      options: [
        "Un cloud géré par un gouvernement",
        "Un cloud qui respecte les réglementations et la souveraineté des données d'un pays",
        "Un cloud qui n'est pas connecté à Internet",
        "Un cloud qui utilise exclusivement des technologies open source"
      ],
      correctAnswer: 1
    },
    {
      id: "vq37",
      text: "Quelle technologie permet d'orchestrer des conteneurs à grande échelle?",
      options: [
        "Docker Compose",
        "Kubernetes",
        "Vagrant",
        "Ansible"
      ],
      correctAnswer: 1
    },
    {
      id: "vq38",
      text: "Qu'est-ce que le 'cloud repatriation'?",
      options: [
        "Le processus de migration vers le cloud",
        "Le processus de rapatriement des charges de travail du cloud vers des infrastructures sur site",
        "Le transfert de données entre différents clouds",
        "La récupération de données après une panne de cloud"
      ],
      correctAnswer: 1
    },
    {
      id: "vq39",
      text: "Quelle est la principale caractéristique d'un datacenter Tier III?",
      options: [
        "Disponibilité de 99,671%",
        "Redondance N+1",
        "Maintenance possible sans interruption de service",
        "Tolérance aux pannes complète"
      ],
      correctAnswer: 2
    },
    {
      id: "vq40",
      text: "Qu'est-ce que le 'cloud bursting'?",
      options: [
        "Une technique pour gérer les pics de charge en débordant vers un cloud public",
        "Une panne massive dans un cloud",
        "Une méthode pour optimiser les coûts du cloud",
        "Une technique de migration vers le cloud"
      ],
      correctAnswer: 0
    }
  ]
};
/**
 * Fonction pour obtenir un sous-ensemble aléatoire de questions
 * @param {number} count - Nombre de questions à sélectionner (par défaut: 10)
 * @returns {Array} Sous-ensemble aléatoire de questions
 */
export const getRandomizedQuestions = (count = 10) => {
  // Copier le tableau de questions pour ne pas modifier l'original
  const allQuestions = [...virtualizationQuizData.questions];
  
  // Mélanger les questions avec l'algorithme de Fisher-Yates
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  
  // Retourner le nombre de questions demandé
  return allQuestions.slice(0, Math.min(count, allQuestions.length));
};


export default virtualizationQuizData;
