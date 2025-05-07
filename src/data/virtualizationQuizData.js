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
      text: "Quel modèle de service cloud fournit des machines virtuelles, des réseaux et du stockage?",
      options: [
        "Software as a Service (SaaS)",
        "Platform as a Service (PaaS)",
        "Infrastructure as a Service (IaaS)",
        "Function as a Service (FaaS)"
      ],
      correctAnswer: 2 // IaaS
    },
    {
      id: "vq3",
      text: "Quelle technologie est utilisée pour isoler les applications dans des environnements légers et portables?",
      options: [
        "Docker",
        "VMware",
        "Hyper-V",
        "KVM"
      ],
      correctAnswer: 0 // Docker
    },
    {
      id: "vq4",
      text: "Quel est l'avantage principal de l'architecture multi-tenant dans le cloud?",
      options: [
        "Meilleure sécurité",
        "Partage des ressources et réduction des coûts",
        "Performance accrue",
        "Simplicité de configuration"
      ],
      correctAnswer: 1 // Partage des ressources
    },
    {
      id: "vq5",
      text: "Quelle technique permet d'allouer dynamiquement des ressources en fonction de la demande?",
      options: [
        "Load balancing",
        "Clustering",
        "Autoscaling",
        "Failover"
      ],
      correctAnswer: 2 // Autoscaling
    },
    {
      id: "vq6",
      text: "Quelle mesure est utilisée pour évaluer la disponibilité d'un datacenter?",
      options: [
        "Tier Level (Niveau Tier)",
        "IOPS (Operations d'entrée/sortie par seconde)",
        "Latence",
        "Bande passante"
      ],
      correctAnswer: 0 // Tier Level
    },
    {
      id: "vq7",
      text: "Quelle technologie permet de migrer des machines virtuelles entre des hôtes physiques sans interruption de service?",
      options: [
        "Cold migration",
        "Live migration",
        "Snapshot",
        "Cloning"
      ],
      correctAnswer: 1 // Live migration
    },
    {
      id: "vq8",
      text: "Quel concept fait référence à l'utilisation de plusieurs fournisseurs cloud pour éviter la dépendance à un seul fournisseur?",
      options: [
        "Cloud hybride",
        "Cloud privé",
        "Multi-cloud",
        "Cloud public"
      ],
      correctAnswer: 2 // Multi-cloud
    },
    {
      id: "vq9",
      text: "Quelle technologie de stockage permet de présenter un espace de stockage unifié à partir de plusieurs systèmes physiques?",
      options: [
        "RAID",
        "SAN (Storage Area Network)",
        "NAS (Network Attached Storage)",
        "Software-Defined Storage"
      ],
      correctAnswer: 3 // Software-Defined Storage
    },
    {
      id: "vq10",
      text: "Quelle mesure d'efficacité énergétique est couramment utilisée pour évaluer les datacenters?",
      options: [
        "PUE (Power Usage Effectiveness)",
        "TCO (Total Cost of Ownership)",
        "ROI (Return on Investment)",
        "MTBF (Mean Time Between Failures)"
      ],
      correctAnswer: 0 // PUE
    }
  ]
};



/**
 * Fonction pour obtenir un sous-ensemble aléatoire de questions
 * Cette fonction utilise l'algorithme de Fisher-Yates pour mélanger les questions
 * et garantir que chaque étudiant reçoit un ensemble différent de questions
 * @param {Array} questions - Liste complète des questions
 * @param {number} count - Nombre de questions à sélectionner (par défaut: toutes)
 * @returns {Array} Sous-ensemble aléatoire de questions
 */
export const getRandomizedQuestions = (questions, count = questions.length) => {
  // Copier le tableau de questions pour ne pas modifier l'original
  const allQuestions = [...questions];
  
  // Mélanger les questions avec l'algorithme de Fisher-Yates
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  
  // Retourner le nombre de questions demandé
  return allQuestions.slice(0, Math.min(count, allQuestions.length));
};

export default virtualizationQuizData;
