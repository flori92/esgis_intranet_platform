// Types pour le module de gestion des stages

// Type pour l'entreprise
export interface Entreprise {
  id: number;
  nom: string;
  secteur: string;
}

// Type pour une offre de stage
export interface Offre {
  id: number;
  titre: string;
  description: string;
  entreprise: Entreprise;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  typeStage: 'temps_plein' | 'temps_partiel' | 'alternance' | 'stage_etude';
  competencesRequises: string[];
  remuneration: number | null;
  duree: number; // en semaines
  professeurContact: string;
  datePublication: string;
  departementId: number;
  niveauRequis: string[];
}

// Type pour une candidature à un stage
export interface Candidature {
  id: number;
  offre: {
    id: number;
    titre: string;
    entreprise: string;
  };
  dateCandidature: string;
  status: 'pending' | 'accepted' | 'rejected' | 'interview';
  lettreMotivation: string;
  cvPath: string;
  commentaires: string | null;
  noteEntretien: number | null;
}

// Type pour les entretiens
export interface Entretien {
  id: number;
  candidatureId: number;
  date: string;
  lieu: string;
  type: 'presentiel' | 'visioconference' | 'telephonique';
  notes: string | null;
  statut: 'planifie' | 'complete' | 'annule';
}
