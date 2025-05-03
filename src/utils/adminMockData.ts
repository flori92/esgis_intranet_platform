import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour les statistiques de l'administrateur
export interface AdminStats {
  totalStudents: number;
  totalProfessors: number;
  totalCourses: number;
  activeUsers: number;
  pendingRequests: number;
}

// Interface pour les utilisateurs actifs
export interface ActiveUser {
  id: string;
  name: string;
  role: 'admin' | 'professor' | 'student';
  status: 'online' | 'idle' | 'offline';
  lastActivity: string;
  email: string;
  avatar?: string;
}

// Interface pour les alertes système
export interface SystemAlert {
  id: number;
  title: string;
  description: string;
  date: string;
  severity: 'info' | 'warning' | 'error';
  resolved: boolean;
}

// Interface pour les demandes en attente
export interface PendingRequest {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'document' | 'inscription' | 'absence' | 'note' | 'autre';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  urgency: 'low' | 'medium' | 'high';
  submittedBy: {
    id: string;
    name: string;
    role: 'student' | 'professor';
    email: string;
  };
}

// Interface pour les métriques de performance
export interface PerformanceMetric {
  id: number;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

// Interface pour les nouvelles inscriptions
export interface NewRegistration {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
    gender: 'male' | 'female' | 'other';
  };
  program: {
    id: string;
    name: string;
    department: string;
    degree: 'Licence' | 'Master' | 'Doctorat';
  };
  applicationDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting_for_documents';
  documents: {
    name: string;
    submitted: boolean;
  }[];
  paymentStatus: 'pending' | 'partial' | 'complete';
}

// Données mock pour les statistiques
export const mockAdminStats: AdminStats = {
  totalStudents: 1245,
  totalProfessors: 87,
  totalCourses: 156,
  activeUsers: 325,
  pendingRequests: 18
};

// Données mock pour les utilisateurs actifs
export const mockActiveUsers: ActiveUser[] = [
  {
    id: '1',
    name: 'Thomas Dupont',
    role: 'student',
    lastActivity: '2025-05-03T20:45:12',
    status: 'online',
    email: 'thomas.dupont@example.com'
  },
  {
    id: '2',
    name: 'Dr. Marie Leroy',
    role: 'professor',
    lastActivity: '2025-05-03T20:30:45',
    status: 'online',
    email: 'marie.leroy@example.com'
  },
  {
    id: '3',
    name: 'Lucas Martin',
    role: 'student',
    lastActivity: '2025-05-03T20:15:23',
    status: 'online',
    email: 'lucas.martin@example.com'
  },
  {
    id: '4',
    name: 'Prof. Jacques Bernard',
    role: 'professor',
    lastActivity: '2025-05-03T19:50:10',
    status: 'idle',
    email: 'jacques.bernard@example.com'
  },
  {
    id: '5',
    name: 'Sophie Dubois',
    role: 'admin',
    lastActivity: '2025-05-03T20:40:18',
    status: 'online',
    email: 'sophie.dubois@example.com'
  },
  {
    id: '6',
    name: 'Camille Petit',
    role: 'student',
    lastActivity: '2025-05-03T18:30:45',
    status: 'offline',
    email: 'camille.petit@example.com'
  }
];

// Données mock pour les alertes système
export const mockSystemAlerts: SystemAlert[] = [
  {
    id: 1,
    title: 'Mise à jour système réussie',
    description: 'La mise à jour du système vers la version 3.2.1 a été effectuée avec succès.',
    date: '2025-05-03T10:15:00',
    severity: 'info',
    resolved: true
  },
  {
    id: 2,
    title: 'Ralentissement de la base de données',
    description: 'Ralentissement détecté dans les requêtes de la base de données. L\'équipe technique est en train d\'investiguer.',
    date: '2025-05-03T15:30:00',
    severity: 'warning',
    resolved: false
  },
  {
    id: 3,
    title: 'Problème d\'accès au module d\'examens',
    description: 'Certains utilisateurs signalent des problèmes d\'accès au module d\'examens. Erreur 503.',
    date: '2025-05-03T16:45:00',
    severity: 'error',
    resolved: false
  }
];

// Données mock pour les demandes en attente
export const mockPendingRequests: PendingRequest[] = [
  {
    id: '1',
    title: 'Demande de relevé de notes',
    description: 'Demande de relevé de notes pour le semestre 1 de l\'année 2024-2025.',
    date: '2025-05-02T10:30:45',
    type: 'document',
    status: 'pending',
    urgency: 'medium',
    submittedBy: {
      id: '1',
      name: 'Thomas Dupont',
      role: 'student',
      email: 'thomas.dupont@example.com'
    }
  },
  {
    id: '2',
    title: 'Demande d\'absence exceptionnelle',
    description: 'Demande d\'absence pour raison médicale du 5 au 10 mai 2025.',
    date: '2025-05-01T14:45:30',
    type: 'absence',
    status: 'processing',
    urgency: 'high',
    submittedBy: {
      id: '3',
      name: 'Lucas Martin',
      role: 'student',
      email: 'lucas.martin@example.com'
    }
  },
  {
    id: '3',
    title: 'Contestation de note',
    description: 'Demande de révision de la note d\'examen en Mathématiques Avancées.',
    date: '2025-04-30T09:15:20',
    type: 'note',
    status: 'pending',
    urgency: 'medium',
    submittedBy: {
      id: '6',
      name: 'Camille Petit',
      role: 'student',
      email: 'camille.petit@example.com'
    }
  },
  {
    id: '4',
    title: 'Demande de certificat de scolarité',
    description: 'Besoin d\'un certificat de scolarité pour dossier administratif externe.',
    date: '2025-04-28T16:20:10',
    type: 'document',
    status: 'completed',
    urgency: 'low',
    submittedBy: {
      id: '1',
      name: 'Thomas Dupont',
      role: 'student',
      email: 'thomas.dupont@example.com'
    }
  },
  {
    id: '5',
    title: 'Demande de salle pour examen',
    description: 'Réservation d\'une salle supplémentaire pour l\'examen de Programmation Avancée.',
    date: '2025-05-03T08:45:30',
    type: 'autre',
    status: 'pending',
    urgency: 'high',
    submittedBy: {
      id: '2',
      name: 'Dr. Marie Leroy',
      role: 'professor',
      email: 'marie.leroy@example.com'
    }
  },
  {
    id: '6',
    title: 'Inscription en retard au TD',
    description: 'Demande d\'inscription tardive aux travaux dirigés de Développement Web.',
    date: '2025-04-27T11:30:40',
    type: 'inscription',
    status: 'rejected',
    urgency: 'medium',
    submittedBy: {
      id: '6',
      name: 'Camille Petit',
      role: 'student',
      email: 'camille.petit@example.com'
    }
  }
];

// Données mock pour les nouvelles inscriptions
export const mockNewRegistrations: NewRegistration[] = [
  {
    id: '1',
    student: {
      id: 's001',
      name: 'Alexandre Moreau',
      email: 'alexandre.moreau@example.com',
      phone: '+33 6 12 34 56 78',
      gender: 'male'
    },
    program: {
      id: 'p001',
      name: 'Informatique et Systèmes d\'Information',
      department: 'Informatique',
      degree: 'Licence'
    },
    applicationDate: '2025-04-15T10:30:45',
    status: 'pending',
    documents: [
      { name: 'Pièce d\'identité', submitted: true },
      { name: 'Relevé de notes du bac', submitted: true },
      { name: 'Photo d\'identité', submitted: false },
      { name: 'Justificatif de domicile', submitted: true }
    ],
    paymentStatus: 'pending'
  },
  {
    id: '2',
    student: {
      id: 's002',
      name: 'Emilie Laurent',
      email: 'emilie.laurent@example.com',
      phone: '+33 6 23 45 67 89',
      gender: 'female'
    },
    program: {
      id: 'p003',
      name: 'Intelligence Artificielle',
      department: 'Informatique',
      degree: 'Master'
    },
    applicationDate: '2025-04-10T14:45:30',
    status: 'approved',
    documents: [
      { name: 'Pièce d\'identité', submitted: true },
      { name: 'Diplôme de licence', submitted: true },
      { name: 'Lettres de recommandation', submitted: true },
      { name: 'CV', submitted: true }
    ],
    paymentStatus: 'partial'
  },
  {
    id: '3',
    student: {
      id: 's003',
      name: 'Julien Roux',
      email: 'julien.roux@example.com',
      phone: '+33 6 34 56 78 90',
      gender: 'male'
    },
    program: {
      id: 'p002',
      name: 'Réseaux et Sécurité',
      department: 'Informatique',
      degree: 'Licence'
    },
    applicationDate: '2025-04-18T09:15:20',
    status: 'waiting_for_documents',
    documents: [
      { name: 'Pièce d\'identité', submitted: true },
      { name: 'Relevé de notes du bac', submitted: true },
      { name: 'Photo d\'identité', submitted: true },
      { name: 'Justificatif de domicile', submitted: false }
    ],
    paymentStatus: 'pending'
  },
  {
    id: '4',
    student: {
      id: 's004',
      name: 'Marie Dubois',
      email: 'marie.dubois@example.com',
      phone: '+33 6 45 67 89 01',
      gender: 'female'
    },
    program: {
      id: 'p004',
      name: 'Gestion des Entreprises',
      department: 'Management',
      degree: 'Master'
    },
    applicationDate: '2025-04-12T11:30:40',
    status: 'rejected',
    documents: [
      { name: 'Pièce d\'identité', submitted: true },
      { name: 'Diplôme de licence', submitted: false },
      { name: 'Lettres de recommandation', submitted: true },
      { name: 'CV', submitted: true }
    ],
    paymentStatus: 'pending'
  },
  {
    id: '5',
    student: {
      id: 's005',
      name: 'Nicolas Lambert',
      email: 'nicolas.lambert@example.com',
      phone: '+33 6 56 78 90 12',
      gender: 'male'
    },
    program: {
      id: 'p005',
      name: 'Développement Web et Mobile',
      department: 'Informatique',
      degree: 'Licence'
    },
    applicationDate: '2025-04-20T08:45:30',
    status: 'approved',
    documents: [
      { name: 'Pièce d\'identité', submitted: true },
      { name: 'Relevé de notes du bac', submitted: true },
      { name: 'Photo d\'identité', submitted: true },
      { name: 'Justificatif de domicile', submitted: true }
    ],
    paymentStatus: 'complete'
  }
];

// Données mock pour les métriques de performance
export const mockPerformanceMetrics: PerformanceMetric[] = [
  {
    id: 1,
    name: 'Taux de réussite global',
    value: 87.5,
    unit: '%',
    change: 2.3,
    trend: 'up'
  },
  {
    id: 2,
    name: 'Temps de réponse moyen',
    value: 1.8,
    unit: 's',
    change: -0.3,
    trend: 'down'
  },
  {
    id: 3,
    name: 'Taux d\'utilisation des ressources',
    value: 78.2,
    unit: '%',
    change: 5.1,
    trend: 'up'
  },
  {
    id: 4,
    name: 'Satisfaction utilisateurs',
    value: 92.0,
    unit: '%',
    change: 1.5,
    trend: 'up'
  }
];

// Fonction pour formater une date
export const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
};

// Fonction pour formater une heure
export const formatTime = (dateString: string) => {
  return format(new Date(dateString), 'HH:mm', { locale: fr });
};

// Fonction pour formater une date avec l'heure
export const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
};

// Fonction pour obtenir le temps écoulé depuis une date
export const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'il y a moins d\'une minute';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `il y a ${diffInMonths} mois`;
};
