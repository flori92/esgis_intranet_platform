import { Question } from "../types";

// Questions complètes pour le cours de virtualisation cloud et datacenter
export const questions: Question[] = [
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
    text: "Qu'est-ce qu'un registre de conteneurs ?",
    options: [
      "Un service qui stocke et distribue des images de conteneurs",
      "Un outil qui surveille les conteneurs en cours d'exécution",
      "Une base de données qui garde une trace des performances des conteneurs",
      "Un service qui génère des rapports sur l'utilisation des conteneurs"
    ],
    correctAnswer: 0
  },
  {
    id: "q15",
    text: "Quelle commande permet de lister tous les conteneurs Docker en cours d'exécution ?",
    options: [
      "docker ps",
      "docker list",
      "docker show",
      "docker images"
    ],
    correctAnswer: 0
  },
  {
    id: "q16",
    text: "Quel est le principal objectif d'un orchestrateur de conteneurs ?",
    options: [
      "Automatiser le déploiement, la mise à l'échelle et la gestion des applications conteneurisées",
      "Créer des images de conteneurs",
      "Remplacer complètement les VMs traditionnelles",
      "Stocker les données des applications"
    ],
    correctAnswer: 0
  },
  {
    id: "q17",
    text: "Qu'est-ce qu'un pod dans Kubernetes ?",
    options: [
      "Un cluster de nœuds worker",
      "La plus petite unité déployable qui peut contenir un ou plusieurs conteneurs",
      "Un serveur maître qui gère le cluster",
      "Un volume de stockage persistant"
    ],
    correctAnswer: 1
  },
  {
    id: "q18",
    text: "Quelle fonction remplit un service dans Kubernetes ?",
    options: [
      "Il expose une application s'exécutant sur un ensemble de pods",
      "Il fournit une interface graphique pour Kubernetes",
      "Il gère l'authentification des utilisateurs",
      "Il déploie automatiquement les mises à jour logicielles"
    ],
    correctAnswer: 0
  },
  {
    id: "q19",
    text: "Comment appelle-t-on un ensemble de pods gérés comme une seule entité qui garantit qu'un nombre spécifié de répliques s'exécute à tout moment ?",
    options: [
      "StatefulSet",
      "DaemonSet",
      "ReplicaSet",
      "CronJob"
    ],
    correctAnswer: 2
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
      "Un réseau isolé pour des raisons de sécurité",
      "Un groupement d'utilisateurs ayant les mêmes privilèges"
    ],
    correctAnswer: 0
  },
  {
    id: "q22",
    text: "Quel terme désigne la capacité d'un système à continuer à fonctionner en cas de panne d'un composant ?",
    options: [
      "Élasticité",
      "Scalabilité",
      "Résilience",
      "Consistance"
    ],
    correctAnswer: 2
  },
  {
    id: "q23",
    text: "Quelle métrique mesure le pourcentage de temps pendant lequel un système est opérationnel ?",
    options: [
      "Temps moyen entre pannes (MTBF)",
      "Temps moyen de réparation (MTTR)",
      "Disponibilité",
      "Taux de défaillance"
    ],
    correctAnswer: 2
  },
  {
    id: "q24",
    text: "Qu'est-ce que la répartition de charge (load balancing) ?",
    options: [
      "La distribution du trafic réseau sur plusieurs serveurs",
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
    text: "Qu'est-ce que le SDN (Software-Defined Networking) ?",
    options: [
      "Une approche qui sépare le plan de contrôle du plan de données dans les réseaux",
      "Un protocole de routage spécifique",
      "Un type de firewall virtuel",
      "Un système d'exploitation réseau"
    ],
    correctAnswer: 0
  },
  {
    id: "q27",
    text: "Qu'est-ce qu'un réseau overlay ?",
    options: [
      "Un réseau virtuel construit par-dessus un réseau physique existant",
      "Un réseau physique redondant",
      "Un réseau de diffusion de contenu",
      "Un réseau sans fil maillé"
    ],
    correctAnswer: 0
  },
  {
    id: "q28",
    text: "Quelle technologie permet la création de réseaux virtuels isolés au sein d'une infrastructure cloud ?",
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
      "Un système de stockage virtuel",
      "Un outil de surveillance des performances"
    ],
    correctAnswer: 1
  },
  {
    id: "q30",
    text: "Quel protocole est souvent utilisé pour l'encapsulation du trafic dans les réseaux overlay ?",
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
export const getRandomizedQuestions = (): Question[] => {
  // Créer une copie du tableau de questions
  const shuffledQuestions = [...questions];
  
  // Algorithme de mélange Fisher-Yates
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
  }
  
  return shuffledQuestions;
};