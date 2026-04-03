import { Suspense, lazy, useEffect, useState } from 'react';
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
import OffresList from './components/OffresList';
import MesCandidatures from './components/MesCandidatures';
import RouteLoader from '@/components/common/RouteLoader';
import {
  createStageApplication,
  createStageOffer,
  deleteStageApplication,
  getStageOffers,
  getStudentStageApplications,
  getStudentStageInterviews,
  updateStageApplication
} from '@/api/stages';
// Les types sont maintenant définis dans types.js avec JSDoc

const AjouterOffre = lazy(() => import('./components/AjouterOffre'));

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
  }, [authState.isAuthenticated, authState.student?.id, authState.professor?.id]);

  /**
   * Charger les données des offres, candidatures et entretiens
   */
  const chargerDonnees = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: offersData, error: offersError } = await getStageOffers();
      if (offersError) {
        throw offersError;
      }

      setOffres(offersData || []);

      if (authState.isAuthenticated && authState.student) {
        const [{ data: applicationsData, error: applicationsError }, { data: interviewsData, error: interviewsError }] =
          await Promise.all([
            getStudentStageApplications(authState.student.id),
            getStudentStageInterviews(authState.student.id)
          ]);

        if (applicationsError) {
          throw applicationsError;
        }

        if (interviewsError) {
          throw interviewsError;
        }

        setMesCandidatures(applicationsData || []);
        setEntretiens(interviewsData || []);
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
      if (!authState.isAuthenticated || !authState.professor) {
        return {
          success: false,
          message: 'Vous devez être connecté en tant que professeur pour ajouter une offre'
        };
      }

      const { data, error: createError } = await createStageOffer({
        titre: nouvelleOffre.titre,
        description: nouvelleOffre.description,
        entrepriseId: nouvelleOffre.entreprise?.id,
        dateDebut: nouvelleOffre.dateDebut,
        dateFin: nouvelleOffre.dateFin,
        lieu: nouvelleOffre.lieu,
        typeStage: nouvelleOffre.typeStage,
        competencesRequises: nouvelleOffre.competencesRequises,
        remuneration: nouvelleOffre.remuneration,
        duree: nouvelleOffre.duree,
        professorId: authState.professor.id,
        departementId: nouvelleOffre.departementId || authState.professor.department_id || authState.user.department_id || 1,
        niveauRequis: nouvelleOffre.niveauRequis
      });

      if (createError) {
        throw createError;
      }

      if (data) {
        setOffres((prev) => [data, ...prev]);
      }

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
      if (!authState.isAuthenticated || !authState.student) {
        return {
          success: false,
          message: 'Vous devez être connecté en tant qu\'étudiant pour postuler'
        };
      }
      
      const offre = offres.find(o => o.id === offreId);
      if (!offre) {
        return {
          success: false,
          message: 'Cette offre n\'existe pas'
        };
      }
      
      const candidatureExistante = mesCandidatures.find(c => c.offre_id === offreId);
      if (candidatureExistante) {
        return {
          success: false,
          message: 'Vous avez déjà postulé à cette offre'
        };
      }
      
      const { data, error: applyError } = await createStageApplication({
        offreId,
        studentId: authState.student.id,
        lettreMotivation,
        cvPath
      });

      if (applyError) {
        throw applyError;
      }

      if (data) {
        setMesCandidatures((prev) => [data, ...prev]);
      }

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
      const candidature = mesCandidatures.find(c => c.id === candidatureId);
      if (!candidature) {
        return {
          success: false,
          message: 'Cette candidature n\'existe pas'
        };
      }
      
      const { error: deleteError } = await deleteStageApplication(candidatureId);
      if (deleteError) {
        throw deleteError;
      }

      setMesCandidatures((prev) => prev.filter((c) => c.id !== candidatureId));
      setEntretiens((prev) => prev.filter((entretien) => entretien.candidatureId !== candidatureId));

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
    const candidature = mesCandidatures.find(c => c.id === id);
    if (!candidature) {
      return;
    }

    const { data, error: updateError } = await updateStageApplication(id, { lettreMotivation });
    if (updateError) {
      throw updateError;
    }

    if (data) {
      setMesCandidatures((prev) => prev.map((item) => (item.id === id ? data : item)));
    }
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
              <Suspense fallback={<RouteLoader label="Chargement du formulaire..." />}>
                <AjouterOffre 
                  onSubmit={handleAjouterOffre}
                  departementId={authState.professor?.department_id || 0}
                />
              </Suspense>
            )}
          </div>
        </>
      )}
    </Box>
  );
};

export default StagesPage;
