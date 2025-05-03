import React, { useState, useEffect, useRef } from 'react';
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
import { supabase } from '../../utils/supabase';
import OffresList from './components/OffresList';
import MesCandidatures from './components/MesCandidatures';
import AjouterOffre from './components/AjouterOffre';
import { Offre, Candidature, Entretien } from './types';

const StagesPage: React.FC = () => {
  const { authState } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [mesCandidatures, setMesCandidatures] = useState<Candidature[]>([]);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [filtreOffres, setFiltreOffres] = useState('toutes');

  // Utilisation de useRef au lieu de useCallback pour éviter les recréations inutiles
  const chargerDonneesRef = useRef(async () => {
    setLoading(true);
    try {
      // Récupérer les offres de stage
      const { data: offresData, error: offresError } = await supabase
        .from('stage_offres')
        .select(`
          *,
          entreprises:entreprise_id(nom, secteur),
          professeurs:professeur_id(
            profiles:profile_id(full_name)
          )
        `)
        .eq('etat', 'active')
        .order('date_publication', { ascending: false });

      if (offresError) throw offresError;
      
      // Transformer les données pour un usage plus facile
      const offresTransformees = offresData?.map(offre => ({
        id: offre.id,
        titre: offre.titre,
        description: offre.description,
        entreprise: {
          id: offre.entreprise_id,
          nom: offre.entreprises.nom,
          secteur: offre.entreprises.secteur
        },
        dateDebut: offre.date_debut,
        dateFin: offre.date_fin,
        lieu: offre.lieu,
        typeStage: offre.type_stage,
        competencesRequises: offre.competences_requises,
        remuneration: offre.remuneration,
        duree: offre.duree,
        professeurContact: offre.professeurs ? offre.professeurs.profiles.full_name : 'Non assigné',
        datePublication: offre.date_publication,
        departementId: offre.departement_id,
        niveauRequis: offre.niveau_requis
      })) || [];
      
      setOffres(offresTransformees);

      // Si l'utilisateur est un étudiant, récupérer ses candidatures
      if (authState.isStudent && authState.student) {
        const { data: candidaturesData, error: candidaturesError } = await supabase
          .from('stage_candidatures')
          .select(`
            *,
            offres:offre_id(
              titre, 
              entreprises:entreprise_id(nom)
            )
          `)
          .eq('etudiant_id', authState.student.id)
          .order('date_candidature', { ascending: false });

        if (candidaturesError) throw candidaturesError;
        
        const candidaturesTransformees = candidaturesData?.map(candidature => ({
          id: candidature.id,
          offre: {
            id: candidature.offre_id,
            titre: candidature.offres.titre,
            entreprise: candidature.offres.entreprises.nom
          },
          dateCandidature: candidature.date_candidature,
          status: candidature.status,
          noteEntretien: candidature.note_entretien,
          lettreMotivation: candidature.lettre_motivation,
          cvPath: candidature.cv_path,
          commentaires: candidature.commentaires
        })) || [];
        
        setMesCandidatures(candidaturesTransformees);

        // Récupérer les entretiens associés aux candidatures
        const candidatureIds = candidaturesTransformees.map(c => c.id);
        if (candidatureIds.length > 0) {
          const { data: entretiensData, error: entretiensError } = await supabase
            .from('stage_entretiens')
            .select('*')
            .in('candidature_id', candidatureIds);

          if (entretiensError) throw entretiensError;
          
          setEntretiens(entretiensData || []);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Une erreur est survenue lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (chargerDonneesRef.current) {
        await chargerDonneesRef.current();
      }
    };
    fetchData();
  }, []);

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (filter: string) => {
    setFiltreOffres(filter);
  };

  // Filtrer les offres selon le filtre actif
  const offresFilterees = () => {
    if (filtreOffres === 'toutes') {
      return offres;
    }
    
    if (filtreOffres === 'récentes') {
      const unMoisAuparavant = new Date();
      unMoisAuparavant.setMonth(unMoisAuparavant.getMonth() - 1);
      return offres.filter(
        offre => new Date(offre.datePublication) >= unMoisAuparavant
      );
    }
    
    if (filtreOffres === 'département' && authState.student) {
      // Utiliser une correspondance par ID de département si disponible
      // ou filtrer par un autre critère pertinent
      const departementId = authState.student?.departement_id ?? 0;
      return offres.filter(
        offre => offre.departementId === departementId
      );
    }
    
    if (filtreOffres === 'niveau' && authState.student) {
      // Trouver le niveau de l'étudiant (Bachelor 1, 2, 3 ou Master 1, 2)
      const niveauActuel = authState.student?.level || '';
      return offres.filter(
        offre => offre.niveauRequis.includes(niveauActuel)
      );
    }
    
    return offres;
  };

  const ajouterOffre = async (nouvelleOffre: Omit<Offre, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('stage_offres')
        .insert([
          {
            titre: nouvelleOffre.titre,
            description: nouvelleOffre.description,
            entreprise_id: nouvelleOffre.entreprise.id,
            date_debut: nouvelleOffre.dateDebut,
            date_fin: nouvelleOffre.dateFin,
            lieu: nouvelleOffre.lieu,
            type_stage: nouvelleOffre.typeStage,
            competences_requises: nouvelleOffre.competencesRequises,
            remuneration: nouvelleOffre.remuneration,
            duree: nouvelleOffre.duree,
            professeur_id: authState.professor?.id || null,
            date_publication: new Date().toISOString(),
            departement_id: nouvelleOffre.departementId,
            niveau_requis: nouvelleOffre.niveauRequis,
            etat: 'active'
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Créer l'objet offre à ajouter à l'état
        const offreAjoutee: Offre = {
          id: data[0].id,
          titre: nouvelleOffre.titre,
          description: nouvelleOffre.description,
          entreprise: nouvelleOffre.entreprise,
          dateDebut: nouvelleOffre.dateDebut,
          dateFin: nouvelleOffre.dateFin,
          lieu: nouvelleOffre.lieu,
          typeStage: nouvelleOffre.typeStage,
          competencesRequises: nouvelleOffre.competencesRequises,
          remuneration: nouvelleOffre.remuneration,
          duree: nouvelleOffre.duree,
          professeurContact: authState.profile?.full_name || 'Non assigné',
          datePublication: new Date().toISOString(),
          departementId: nouvelleOffre.departementId,
          niveauRequis: nouvelleOffre.niveauRequis
        };
        
        // Mettre à jour l'état
        setOffres([offreAjoutee, ...offres]);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'offre:', err);
      throw err;
    }
  };

  const postuler = async (offreId: number, lettreMotivation: string, cvPath: string) => {
    try {
      if (!authState.isStudent || !authState.student) {
        throw new Error('Vous devez être connecté en tant qu\'étudiant pour postuler.');
      }
      
      const { data, error } = await supabase
        .from('stage_candidatures')
        .insert([
          {
            offre_id: offreId,
            etudiant_id: authState.student.id,
            date_candidature: new Date().toISOString(),
            status: 'pending',
            lettre_motivation: lettreMotivation,
            cv_path: cvPath
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Récupérer les informations de l'offre
        const offre = offres.find(o => o.id === offreId);
        if (!offre) return;
        
        // Créer la nouvelle candidature
        const nouvelleCandidature: Candidature = {
          id: data[0].id,
          offre: {
            id: offreId,
            titre: offre.titre,
            entreprise: offre.entreprise.nom
          },
          dateCandidature: data[0].date_candidature,
          status: data[0].status,
          lettreMotivation: data[0].lettre_motivation,
          cvPath: data[0].cv_path,
          commentaires: null,
          noteEntretien: null
        };
        
        setMesCandidatures([nouvelleCandidature, ...mesCandidatures]);
        setTabValue(1); // Aller à l'onglet "Mes candidatures"
      }
    } catch (err) {
      console.error('Erreur lors de la candidature:', err);
      setError('Une erreur est survenue lors de la candidature.');
    }
  };

  const supprimerCandidature = async (candidatureId: number) => {
    try {
      const { error } = await supabase
        .from('stage_candidatures')
        .delete()
        .eq('id', candidatureId)
        .eq('etudiant_id', authState.student?.id || 0)
        .eq('status', 'pending'); // Ne permettre le retrait que pour les candidatures en attente
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setMesCandidatures(mesCandidatures.filter(c => c.id !== candidatureId));
    } catch (err) {
      console.error('Erreur lors du retrait de la candidature:', err);
      setError('Une erreur est survenue lors du retrait de la candidature.');
    }
  };

  const modifierCandidature = async (candidatureId: number, lettreMotivation: string) => {
    try {
      const { error } = await supabase
        .from('stage_candidatures')
        .update({ lettre_motivation: lettreMotivation })
        .eq('id', candidatureId)
        .eq('etudiant_id', authState.student?.id || 0)
        .eq('status', 'pending'); // Ne permettre la modification que pour les candidatures en attente
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setMesCandidatures(
        mesCandidatures.map(c => 
          c.id === candidatureId 
            ? { ...c, lettreMotivation } 
            : c
        )
      );
    } catch (err) {
      console.error('Erreur lors de la modification de la candidature:', err);
      setError('Une erreur est survenue lors de la modification de la candidature.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Stages et offres d'emploi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleChangeTab} aria-label="stages tabs">
          <Tab label="Offres disponibles" icon={<SearchIcon />} iconPosition="start" />
          {authState.isStudent && (
            <Tab label="Mes candidatures" icon={<WorkIcon />} iconPosition="start" />
          )}
          {(authState.isAdmin || authState.isProfessor) && (
            <Tab label="Ajouter une offre" icon={<AddIcon />} iconPosition="start" />
          )}
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <OffresList 
          offres={offresFilterees()} 
          postuler={postuler} 
          filtreActif={filtreOffres}
          changerFiltre={handleFilterChange}
          estEtudiant={authState.isStudent}
        />
      )}

      {tabValue === 1 && authState.isStudent && (
        <MesCandidatures 
          candidatures={mesCandidatures}
          supprimerCandidature={supprimerCandidature}
          modifierCandidature={modifierCandidature}
          entretiens={entretiens}
        />
      )}

      {tabValue === 1 && (authState.isAdmin || authState.isProfessor) && (
        <AjouterOffre ajouterOffre={ajouterOffre} />
      )}

      {tabValue === 2 && (authState.isAdmin || authState.isProfessor) && (
        <AjouterOffre ajouterOffre={ajouterOffre} />
      )}
    </Box>
  );
};

export default StagesPage;
