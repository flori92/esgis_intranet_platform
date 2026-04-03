/**
 * Service de gestion des notes
 * Centralise toutes les opérations liées aux notes des étudiants
 */
import { supabase } from '../supabase';

/**
 * Récupère les cours assignés à un professeur
 * @param {string} professorId - ID du professeur
 * @returns {Promise<Object>} Liste des cours
 */
export const getProfessorCourses = async (professorId) => {
  try {
    const { data, error } = await supabase
      .from('cours')
      .select(`
        id, code, name, credits,
        niveaux:niveau_id(id, code, name, filieres:filiere_id(id, code, name))
      `)
      .eq('professeur_id', professorId)
      .order('name');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getProfessorCourses:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les étudiants inscrits à un cours (via le niveau du cours)
 * @param {string} coursId - ID du cours
 * @returns {Promise<Object>} Liste des étudiants
 */
export const getStudentsByCourse = async (coursId) => {
  try {
    // D'abord récupérer le niveau_id du cours
    const { data: coursData, error: coursError } = await supabase
      .from('cours')
      .select('niveau_id')
      .eq('id', coursId)
      .single();

    if (coursError) throw coursError;

    // Ensuite récupérer les étudiants inscrits à ce niveau
    const { data, error } = await supabase
      .from('inscriptions')
      .select(`
        id,
        etudiant:etudiant_id(
          id, first_name, last_name, profile_picture,
          user_id
        )
      `)
      .eq('niveau_id', coursData.niveau_id)
      .eq('statut', 'en cours')
      .order('created_at');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getStudentsByCourse:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les notes d'un cours pour tous les étudiants
 * @param {string} coursId - ID du cours
 * @param {string} [typeEvaluation] - Filtre par type d'évaluation
 * @returns {Promise<Object>} Liste des notes
 */
export const getGradesByCourse = async (coursId, typeEvaluation) => {
  try {
    let query = supabase
      .from('notes')
      .select(`
        id, note, coefficient, type_evaluation, commentaire, 
        date_evaluation, created_at, updated_at,
        etudiant:etudiant_id(id, first_name, last_name),
        professeur:professeur_id(id, first_name, last_name),
        examen:examen_id(id, title)
      `)
      .eq('cours_id', coursId)
      .order('date_evaluation', { ascending: false });

    if (typeEvaluation) {
      query = query.eq('type_evaluation', typeEvaluation);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getGradesByCourse:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les notes d'un étudiant pour un cours spécifique
 * @param {string} studentId - ID de l'étudiant
 * @param {string} coursId - ID du cours
 * @returns {Promise<Object>} Liste des notes de l'étudiant
 */
export const getStudentGradesForCourse = async (studentId, coursId) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('etudiant_id', studentId)
      .eq('cours_id', coursId)
      .order('date_evaluation');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getStudentGradesForCourse:', error);
    return { data: null, error };
  }
};

/**
 * Enregistre ou met à jour une note
 * @param {Object} gradeData - Données de la note
 * @returns {Promise<Object>} Note créée/mise à jour
 */
export const upsertGrade = async (gradeData) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .upsert(gradeData, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur upsertGrade:', error);
    return { data: null, error };
  }
};

/**
 * Enregistre plusieurs notes en lot (batch)
 * @param {Array<Object>} gradesData - Tableau de notes à enregistrer
 * @returns {Promise<Object>} Notes créées/mises à jour
 */
export const batchUpsertGrades = async (gradesData) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .upsert(gradesData, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur batchUpsertGrades:', error);
    return { data: null, error };
  }
};

/**
 * Publie les notes d'un cours (les rend visibles aux étudiants)
 * En pratique, marque les notes comme publiées via un champ ou une table de publication
 * @param {string} coursId - ID du cours
 * @param {string} typeEvaluation - Type d'évaluation
 * @param {string} professorId - ID du professeur
 * @returns {Promise<Object>} Résultat de la publication
 */
export const publishGrades = async (coursId, typeEvaluation, professorId) => {
  try {
    // Mettre à jour les notes pour les marquer comme publiées
    const { data, error } = await supabase
      .from('notes')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('cours_id', coursId)
      .eq('type_evaluation', typeEvaluation)
      .eq('professeur_id', professorId)
      .select();

    if (error) throw error;

    // Créer des notifications pour les étudiants concernés
    if (data && data.length > 0) {
      const notifications = data.map(note => ({
        user_id: note.etudiant_id,
        type: 'note_publiee',
        titre: 'Nouvelle note publiée',
        contenu: `Votre note de ${typeEvaluation} a été publiée.`,
        lien: '/student/grades',
        lu: false
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erreur publishGrades:', error);
    return { data: null, error };
  }
};

/**
 * Soumet une demande de correction de note
 * @param {Object} correctionData - Données de la demande de correction
 * @returns {Promise<Object>} Demande créée
 */
export const submitGradeCorrection = async (correctionData) => {
  try {
    const { data, error } = await supabase
      .from('demandes_correction_notes')
      .insert({
        note_id: correctionData.noteId,
        professeur_id: correctionData.professorId,
        ancienne_note: correctionData.oldGrade,
        nouvelle_note: correctionData.newGrade,
        justification: correctionData.justification,
        statut: 'en_attente'
      })
      .select();

    if (error) throw error;

    // Notifier l'administration
    await supabase.from('notifications').insert({
      user_id: null, // Sera géré par un trigger pour cibler les admins
      type: 'demande_correction',
      titre: 'Demande de correction de note',
      contenu: `Le professeur a soumis une demande de correction.`,
      lien: '/admin/grade-corrections',
      lu: false
    });

    return { data, error: null };
  } catch (error) {
    console.error('Erreur submitGradeCorrection:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les demandes de correction du professeur
 * @param {string} professorId - ID du professeur
 * @returns {Promise<Object>} Liste des demandes
 */
export const getProfessorCorrections = async (professorId) => {
  try {
    const { data, error } = await supabase
      .from('demandes_correction_notes')
      .select(`
        *,
        note:note_id(
          id, note, type_evaluation, date_evaluation,
          etudiant:etudiant_id(id, first_name, last_name),
          cours:cours_id(id, name, code)
        )
      `)
      .eq('professeur_id', professorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur getProfessorCorrections:', error);
    return { data: null, error };
  }
};

/**
 * Calcule les statistiques d'un cours
 * @param {string} coursId - ID du cours
 * @param {string} [typeEvaluation] - Filtre par type d'évaluation
 * @returns {Promise<Object>} Statistiques
 */
export const getCourseGradeStats = async (coursId, typeEvaluation) => {
  try {
    let query = supabase
      .from('notes')
      .select('note, etudiant_id')
      .eq('cours_id', coursId);

    if (typeEvaluation) {
      query = query.eq('type_evaluation', typeEvaluation);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        data: {
          count: 0,
          average: 0,
          min: 0,
          max: 0,
          median: 0,
          passRate: 0,
          distribution: { 'Très Bien': 0, 'Bien': 0, 'Assez Bien': 0, 'Passable': 0, 'Insuffisant': 0 }
        },
        error: null
      };
    }

    const notes = data.map(d => d.note);
    const sorted = [...notes].sort((a, b) => a - b);
    const sum = notes.reduce((acc, n) => acc + n, 0);
    const avg = sum / notes.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const distribution = {
      'Très Bien': notes.filter(n => n >= 16).length,
      'Bien': notes.filter(n => n >= 14 && n < 16).length,
      'Assez Bien': notes.filter(n => n >= 12 && n < 14).length,
      'Passable': notes.filter(n => n >= 10 && n < 12).length,
      'Insuffisant': notes.filter(n => n < 10).length
    };

    return {
      data: {
        count: notes.length,
        average: Math.round(avg * 100) / 100,
        min: Math.min(...notes),
        max: Math.max(...notes),
        median: Math.round(median * 100) / 100,
        passRate: Math.round((notes.filter(n => n >= 10).length / notes.length) * 100),
        distribution
      },
      error: null
    };
  } catch (error) {
    console.error('Erreur getCourseGradeStats:', error);
    return { data: null, error };
  }
};
