// Déclarations de types pour augmenter les types existants
import { Database } from '../../types/supabase.types';

// Étendre les types d'étudiants pour inclure les propriétés nécessaires au module de stages
declare module '../../hooks/useAuth' {
  interface Student extends Database['public']['Tables']['students']['Row'] {
    departement_id?: number;
  }
}

// Déclarer l'existence des modules de composants
declare module './components/OffresList' {
  import { FC } from 'react';
  import { Offre } from './types';
  
  interface OffresListProps {
    offres: Offre[];
    postuler: (offreId: number, lettreMotivation: string, cvPath: string) => Promise<void>;
    filtreActif: string;
    changerFiltre: (filtre: string) => void;
    estEtudiant: boolean;
  }
  
  const OffresList: FC<OffresListProps>;
  export default OffresList;
}

declare module './components/MesCandidatures' {
  import { FC } from 'react';
  import { Candidature, Entretien } from './types';
  
  interface MesCandidaturesProps {
    candidatures: Candidature[];
    supprimerCandidature: (id: number) => Promise<void>;
    modifierCandidature: (id: number, lettreMotivation: string) => Promise<void>;
    entretiens: Entretien[];
  }
  
  const MesCandidatures: FC<MesCandidaturesProps>;
  export default MesCandidatures;
}

declare module './components/AjouterOffre' {
  import { FC } from 'react';
  import { Offre } from './types';
  
  interface AjouterOffreProps {
    ajouterOffre: (offre: Omit<Offre, 'id'>) => Promise<void>;
  }
  
  const AjouterOffre: FC<AjouterOffreProps>;
  export default AjouterOffre;
}
