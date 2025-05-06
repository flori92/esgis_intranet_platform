import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Work as WorkIcon, 
  Search as SearchIcon, 
  Add as AddIcon 
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
// Correction du chemin d'importation de Supabase
import { supabase } from '@/supabase';
import OffresList from './components/OffresList';
import MesCandidatures from './components/MesCandidatures';
import AjouterOffre from './components/AjouterOffre';
// Les types sont maintenant définis dans types.js avec JSDoc

// Données mock pour les offres de stage
const mockOffres = [
  {
    id: 1,
    titre: "Stage développement frontend React",
    description: "Nous recherchons un développeur frontend pour travailler sur notre application React.",
    entreprise: {
      id: 1,
      nom: "TechSolutions",
      secteur: "Informatique"
    },
    dateDebut: "2025-06-01",
    dateFin: "2025-08-31",
    lieu: "Paris",
    typeStage: "temps_plein",
    competencesRequises: ["React", "TypeScript", "CSS"],
    remuneration: 800,
    duree: 12,
    professeurContact: "Dr. Martin Dubois",
    datePublication: "2025-04-15",
    departementId: 1,
    niveauRequis: ["Licence 3", "Master 1"]
  },
  {
    id: 2,
    titre: "Stage développement backend Node.js",
    description: "Stage de développement backend avec Node.js et Express.",
    entreprise: {
      id: 2,
      nom: "WebInnovate",
      secteur: "Développement Web"
    },
    dateDebut: "2025-07-01",
    dateFin: "2025-09-30",
    lieu: "Lyon",
    typeStage: "temps_plein",
    competencesRequises: ["Node.js", "Express", "MongoDB"],
    remuneration: 900,
    duree: 12,
    professeurContact: "Mme. Sophie Laurent",
    datePublication: "2025-04-20",
    departementId: 1,
    niveauRequis: ["Master 1", "Master 2"]
  },
  {
    id: 3,
    titre: "Stage en alternance - Développement mobile",
    description: "Alternance en développement d'applications mobiles (iOS/Android).",
    entreprise: {
      id: 3,
      nom: "MobileFirst",
      secteur: "Développement Mobile"
    },
    dateDebut: "2025-09-01",
    dateFin: "2026-08-31",
    lieu: "Bordeaux",
    typeStage: "alternance",
    competencesRequises: ["Swift", "Kotlin", "Flutter"],
    remuneration: 1200,
    duree: 52,
    professeurContact: "Prof. Thomas Moreau",
    datePublication: "2025-04-25",
    departementId: 2,
    niveauRequis: ["Master 1", "Master 2"]
  }
];

// Données mock pour les candidatures
const mockCandidatures = [
  {
    id: 1,
    offre_id: 1,
    etudiant_id: "1",
    date_candidature: "2025-04-20",
    status: "pending",
    lettreMotivation: "Je suis très intéressé par ce stage...",
    cv_path: "/uploads/cv/etudiant1_cv.pdf",
    commentaires: null,
    note_entretien: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    offre: {
      id: 1,
      titre: "Stage développement frontend React",
      description: "",
      entreprise: {
        id: 1,
        nom: "TechSolutions",
        secteur: "Informatique"
      },
      dateDebut: "",
      dateFin: "",
      lieu: "",
      typeStage: "temps_plein",
      competencesRequises: [],
      remuneration: null,
      duree: 0,
      professeurContact: "",
      datePublication: "",
      departementId: 0,
      niveauRequis: []
    }
  },
  {
    id: 2,
    offre_id: 3,
    etudiant_id: "1",
    date_candidature: "2025-04-26",
    status: "interview",
    lettreMotivation: "Je souhaite postuler à cette alternance...",
    cv_path: "/uploads/cv/etudiant1_cv.pdf",
    commentaires: "Candidature intéressante, à convoquer pour un entretien",
    note_entretien: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    offre: {
      id: 3,
      titre: "Stage en alternance - Développement mobile",
      description: "",
      entreprise: {
        id: 3,
        nom: "MobileFirst",
        secteur: "Développement Mobile"
      },
      dateDebut: "",
      dateFin: "",
      lieu: "",
      typeStage: "alternance",
      competencesRequises: [],
      remuneration: null,
      duree: 0,
      professeurContact: "",
      datePublication: "",
      departementId: 0,
      niveauRequis: []
    }
  }
];

// Données mock pour les entretiens
const mockEntretiens = [
  {
    id: 1,
    candidatureId: 2,
    date: "2025-05-10T14:00:00",
    lieu: "Visioconférence Zoom",
    type: "visioconference",
    lien_visio: "https://zoom.us/j/123456789",
    contact: "recrutement@mobilefirst.fr",
    duree: 45,
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/**
 * Page de gestion des stages et des candidatures
 * @returns {JSX.Element} Composant de la page de stages
 */
const StagesPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offres, setOffres] = useState([]);
  const [mesCandidatures, setMesCandidatures] = useState([]);
  const [entretiens, setEntretiens] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [filtreOffres, setFiltreOffres] = useState('all');

  // Charger les données au chargement de la page
  useEffect(() => {
    chargerDonnees();
  }, [authState]);

  /**
   * Charger les données des offres, candidatures et entretiens
   */
  const chargerDonnees = async () => {
    setLoading(true);
    
    try {
      // Pour l'instant, on utilise les données mock
      setOffres(mockOffres);
      
      // Si l'utilisateur est connecté et est un étudiant, charger ses candidatures
      if (authState.isAuthenticated && authState.student) {
        setMesCandidatures(mockCandidatures.filter(c => c.etudiant_id === authState.user.id));
        setEntretiens(mockEntretiens);
      } else {
        setMesCandidatures([]);
        setEntretiens([]);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gérer le changement d'onglet
   * @param {React.SyntheticEvent} _event - Événement de changement d'onglet
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (_event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Gérer le changement de filtre pour les offres
   * @param {string} filtre - Nouveau filtre à appliquer
   */
  const handleFiltreChange = (filtre) => {
    setFiltreOffres(filtre);
  };

  /**
   * Ajouter une nouvelle offre de stage
   * @param {Object} nouvelleOffre - Nouvelle offre à ajouter (sans ID)
   * @returns {Promise<{success: boolean, message: string}>} Résultat de l'opération
   */
  const handleAjouterOffre = async (nouvelleOffre) => {
    try {
      // Vérifier que l'utilisateur est un professeur
      if (!authState.isAuthenticated || !authState.professor) {
        return {
          success: false,
          message: 'Vous devez être connecté en tant que professeur pour ajouter une offre'
        };
      }
      
      // Créer un ID pour la nouvelle offre
      const newId = Math.max(...offres.map(o => o.id), 0) + 1;
      
      // Créer l'objet offre complet
      const offreComplete = {
        ...nouvelleOffre,
        id: newId,
        datePublication: new Date().toISOString(),
        professeurContact: authState.user.full_name || 'Professeur',
        departementId: authState.professor.department_id || 1
      };
      
      // Ajouter l'offre à notre liste mock
      setOffres([...offres, offreComplete]);
      
      return {
        success: true,
        message: 'Offre de stage ajoutée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'offre:', error);
      return {
        success: false,
        message: 'Une erreur est survenue lors de l\'ajout de l\'offre'
      };
    }
  };

  /**
   * Postuler à une offre de stage
   * @param {number} offreId - ID de l'offre
   * @param {string} lettreMotivation - Lettre de motivation
   * @param {string} cvPath - Chemin vers le CV
   * @returns {Promise<{success: boolean, message: string}>} Résultat de l'opération
   */
  const handlePostuler = async (offreId, lettreMotivation, cvPath) => {
    try {
      // Vérifier que l'utilisateur est un étudiant
      if (!authState.isAuthenticated || !authState.student) {
        return {
          success: false,
          message: 'Vous devez être connecté en tant qu\'étudiant pour postuler'
        };
      }
      
      // Vérifier que l'offre existe
      const offre = offres.find(o => o.id === offreId);
      if (!offre) {
        return {
          success: false,
          message: 'Cette offre n\'existe pas'
        };
      }
      
      // Vérifier que l'étudiant n'a pas déjà postulé
      const candidatureExistante = mesCandidatures.find(c => c.offre_id === offreId);
      if (candidatureExistante) {
        return {
          success: false,
          message: 'Vous avez déjà postulé à cette offre'
        };
      }
      
      // Créer un ID pour la nouvelle candidature
      const newId = Math.max(...mockCandidatures.map(c => c.id), 0) + 1;
      
      // Créer l'objet candidature
      const nouvelleCandidature = {
        id: newId,
        offre_id: offreId,
        etudiant_id: authState.user.id,
        date_candidature: new Date().toISOString(),
        status: 'pending',
        lettreMotivation,
        cv_path: cvPath,
        commentaires: null,
        note_entretien: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        offre
      };
      
      // Ajouter la candidature à notre liste mock
      setMesCandidatures([...mesCandidatures, nouvelleCandidature]);
      
      return {
        success: true,
        message: 'Candidature envoyée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la candidature:', error);
      return {
        success: false,
        message: 'Une erreur est survenue lors de l\'envoi de la candidature'
      };
    }
  };

  /**
   * Annuler une candidature
   * @param {number} candidatureId - ID de la candidature à annuler
   * @returns {Promise<{success: boolean, message: string}>} Résultat de l'opération
   */
  const handleAnnulerCandidature = async (candidatureId) => {
    try {
      // Vérifier que la candidature existe
      const candidature = mesCandidatures.find(c => c.id === candidatureId);
      if (!candidature) {
        return {
          success: false,
          message: 'Cette candidature n\'existe pas'
        };
      }
      
      // Supprimer la candidature de notre liste mock
      setMesCandidatures(mesCandidatures.filter(c => c.id !== candidatureId));
      
      return {
        success: true,
        message: 'Candidature annulée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la candidature:', error);
      return {
        success: false,
        message: 'Une erreur est survenue lors de l\'annulation de la candidature'
      };
    }
  };

  /**
   * Créer un entretien pour une candidature
   * @param {number} candidatureId - ID de la candidature
   * @param {Object} entretien - Données de l'entretien (sans ID)
   * @returns {Promise<{success: boolean, message: string}>} Résultat de l'opération
   */
  const creerEntretien = async (candidatureId, entretien) => {
    try {
      // Vérifier que la candidature existe
      const candidature = mockCandidatures.find(c => c.id === candidatureId);
      if (!candidature) {
        return {
          success: false,
          message: 'Cette candidature n\'existe pas'
        };
      }
      
      // Créer un ID pour le nouvel entretien
      const newId = Math.max(...entretiens.map(e => e.id), 0) + 1;
      
      // Créer l'objet entretien
      const nouvelEntretien = {
        id: newId,
        candidatureId,
        date: entretien.date,
        lieu: entretien.lieu,
        type: entretien.type,
        lien_visio: entretien.lien_visio,
        contact: entretien.contact,
        duree: entretien.duree,
        notes: entretien.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Ajouter l'entretien à notre liste mock
      setEntretiens([...entretiens, nouvelEntretien]);

      return {
        success: true,
        message: 'Entretien créé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'entretien:', error);
      return {
        success: false,
        message: 'Une erreur est survenue lors de la création de l\'entretien'
      };
    }
  };

  /**
   * Modifier une candidature
   * @param {number} id - ID de la candidature
   * @param {string} lettreMotivation - Nouvelle lettre de motivation
   * @returns {Promise<void>} Promise
   */
  const modifierCandidature = async (id, lettreMotivation) => {
    // Implémentation de modifierCandidature
    const candidature = mesCandidatures.find(c => c.id === id);
    if (!candidature) {
      return;
    }
    
    // Créer une copie mise à jour
    const candidatureMiseAJour = {
      ...candidature,
      lettreMotivation,
      updated_at: new Date().toISOString()
    };
    
    // Mettre à jour la liste des candidatures
    setMesCandidatures(prevCandidatures => 
      prevCandidatures.map(c => c.id === id ? candidatureMiseAJour : c)
    );
    
    return;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des stages
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="stages tabs"
        >
          <Tab 
            icon={<SearchIcon />} 
            label="Offres de stage" 
            id="tab-0" 
            aria-controls="tabpanel-0" 
          />
          <Tab 
            icon={<WorkIcon />} 
            label="Mes candidatures" 
            id="tab-1" 
            aria-controls="tabpanel-1"
            disabled={!authState.isAuthenticated || !authState.student}
          />
          <Tab 
            icon={<AddIcon />} 
            label="Ajouter une offre" 
            id="tab-2" 
            aria-controls="tabpanel-2"
            disabled={!authState.isAuthenticated || !authState.professor}
          />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <div
            role="tabpanel"
            hidden={tabValue !== 0}
            id="tabpanel-0"
            aria-labelledby="tab-0"
          >
            {tabValue === 0 && (
              <OffresList 
                offres={offres} 
                filtreActif={filtreOffres}
                changerFiltre={handleFiltreChange}
                postuler={handlePostuler}
                isStudent={!!authState.student}
                isAuthenticated={authState.isAuthenticated}
              />
            )}
          </div>
          
          <div
            role="tabpanel"
            hidden={tabValue !== 1}
            id="tabpanel-1"
            aria-labelledby="tab-1"
          >
            {tabValue === 1 && (
              <MesCandidatures 
                candidatures={mesCandidatures} 
                entretiens={entretiens}
                onAnnuler={handleAnnulerCandidature}
                supprimerCandidature={handleAnnulerCandidature}
                modifierCandidature={modifierCandidature}
              />
            )}
          </div>
          
          <div
            role="tabpanel"
            hidden={tabValue !== 2}
            id="tabpanel-2"
            aria-labelledby="tab-2"
          >
            {tabValue === 2 && (
              <AjouterOffre 
                onSubmit={handleAjouterOffre}
                departementId={authState.professor?.department_id || 0}
              />
            )}
          </div>
        </>
      )}
    </Box>
  );
};

export default StagesPage;
