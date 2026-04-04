/**
 * Service canonique de gestion des notes.
 * Ce module remplace l'ancien branchement sur `cours`, `inscriptions` et `notes`
 * par les tables `courses`, `student_courses`, `professor_courses`, `grades`
 * et `demandes_correction_notes`.
 */
import { supabase } from '../supabase';

const DEFAULT_MAX_VALUE = 20;

const splitFullName = (fullName = '') => {
  const normalized = String(fullName || '').trim();

  if (!normalized) {
    return { first_name: '', last_name: '' };
  }

  const parts = normalized.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' };
  }

  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts.slice(-1).join(' ')
  };
};

const mapStudentProfile = (studentRow) => {
  const profile = studentRow?.profiles || {};
  const { first_name, last_name } = splitFullName(profile.full_name);

  return {
    id: studentRow?.id ?? null,
    first_name,
    last_name,
    full_name: profile.full_name || `${first_name} ${last_name}`.trim(),
    profile_picture: profile.avatar_url || null,
    user_id: studentRow?.profile_id || null,
    profile_id: studentRow?.profile_id || null,
    student_number: studentRow?.student_number || null,
    level: studentRow?.level || null
  };
};

const mapProfessorProfile = (professorRow) => {
  const profile = professorRow?.profiles || {};
  const { first_name, last_name } = splitFullName(profile.full_name);

  return {
    id: professorRow?.id ?? null,
    first_name,
    last_name,
    full_name: profile.full_name || `${first_name} ${last_name}`.trim(),
    profile_id: professorRow?.profile_id || null
  };
};

const mapCourseForProfessorPage = (row) => {
  const course = row?.courses || {};
  const department = course?.departments || null;

  return {
    id: course.id,
    code: course.code,
    name: course.name,
    credits: course.credits,
    semester: course.semester,
    academic_year: row?.academic_year || null,
    niveaux: {
      id: course.level || null,
      code: course.level || '',
      name: course.level || '',
      filieres: department
        ? {
            id: department.id,
            code: department.code,
            name: department.name
          }
        : null
    }
  };
};

const normalizeGradeOn20 = (value, maxValue = DEFAULT_MAX_VALUE) => {
  const numericValue = Number(value ?? 0);
  const numericMax = Number(maxValue || DEFAULT_MAX_VALUE);

  if (!numericMax) {
    return numericValue;
  }

  return (numericValue / numericMax) * DEFAULT_MAX_VALUE;
};

const resolveProfessorEntity = async (profileId) => {
  if (!profileId) {
    return { data: null, error: new Error('Professeur non identifié') };
  }

  const { data, error } = await supabase
    .from('professors')
    .select('id, profile_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: new Error('Entité professeur introuvable') };
  }

  return { data, error: null };
};

const resolveProfessorIdFlexible = async (value, cache = new Map()) => {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    throw new Error('Professeur non identifié');
  }

  if (cache.has(value)) {
    return cache.get(value);
  }

  const { data, error } = await resolveProfessorEntity(value);
  if (error) {
    throw error;
  }

  cache.set(value, data.id);
  return data.id;
};

const mapGradeRow = (row) => {
  const student = mapStudentProfile(row?.students);
  const professor = mapProfessorProfile(row?.professors);
  const course = row?.courses || null;

  return {
    id: row.id,
    student_id: row.student_id,
    course_id: row.course_id,
    professor_id: row.professor_id,
    note: Number(row.value ?? 0),
    value: Number(row.value ?? 0),
    max_value: Number(row.max_value ?? DEFAULT_MAX_VALUE),
    coefficient: Number(row.coefficient ?? 1),
    type_evaluation: row.evaluation_type,
    commentaire: row.comment || '',
    comment: row.comment || '',
    date_evaluation: row.evaluation_date,
    is_published: !!row.is_published,
    published_at: row.published_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    etudiant: student,
    professeur: professor,
    cours: course
      ? {
          id: course.id,
          name: course.name,
          code: course.code,
          semester: course.semester ?? null
        }
      : null
  };
};

const sendNotifications = async (notifications) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return;
  }

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    console.error('Erreur lors de la création des notifications:', error);
  }
};

const normalizeGradePayload = async (gradeData, professorIdCache = new Map()) => {
  const professorId = await resolveProfessorIdFlexible(
    gradeData.professor_id ?? gradeData.professeur_id,
    professorIdCache
  );

  return {
    id: gradeData.id || undefined,
    student_id: Number(gradeData.student_id ?? gradeData.etudiant_id),
    course_id: Number(gradeData.course_id ?? gradeData.cours_id),
    professor_id: professorId,
    evaluation_type: String(gradeData.evaluation_type ?? gradeData.type_evaluation),
    coefficient: Number(gradeData.coefficient ?? 1),
    value: Number(gradeData.value ?? gradeData.note),
    max_value: Number(gradeData.max_value ?? DEFAULT_MAX_VALUE),
    comment: gradeData.comment ?? gradeData.commentaire ?? null,
    evaluation_date:
      gradeData.evaluation_date ??
      gradeData.date_evaluation ??
      new Date().toISOString().split('T')[0],
    is_published: Boolean(gradeData.is_published),
    published_at: gradeData.published_at || null
  };
};

/**
 * Récupère les cours assignés à un professeur via `professor_courses`.
 * @param {string} professorProfileId - UUID du profil professeur
 * @returns {Promise<Object>}
 */
export const getProfessorCourses = async (professorProfileId) => {
  try {
    const { data: professor, error: professorError } = await resolveProfessorEntity(professorProfileId);
    if (professorError) throw professorError;

    const { data, error } = await supabase
      .from('professor_courses')
      .select(`
        academic_year,
        is_principal,
        courses:course_id(
          id,
          code,
          name,
          credits,
          level,
          semester,
          departments:department_id(id, code, name)
        )
      `)
      .eq('professor_id', professor.id)
      .order('academic_year', { ascending: false });

    if (error) throw error;

    const dedupedCourses = [];
    const seen = new Set();

    (data || []).forEach((row) => {
      const course = mapCourseForProfessorPage(row);
      if (!course.id || seen.has(course.id)) {
        return;
      }
      seen.add(course.id);
      dedupedCourses.push(course);
    });

    dedupedCourses.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    return { data: dedupedCourses, error: null };
  } catch (error) {
    console.error('Erreur getProfessorCourses:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les étudiants effectivement inscrits à un cours via `student_courses`.
 * @param {number|string} courseId
 * @returns {Promise<Object>}
 */
export const getStudentsByCourse = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('student_courses')
      .select(`
        id,
        academic_year,
        students:student_id(
          id,
          profile_id,
          student_number,
          level,
          profiles:profile_id(
            id,
            full_name,
            avatar_url,
            email
          )
        )
      `)
      .eq('course_id', Number(courseId))
      .order('student_id', { ascending: true });

    if (error) throw error;

    const students = (data || []).map((row) => ({
      id: row.id,
      academic_year: row.academic_year || null,
      etudiant: mapStudentProfile(row.students)
    }));

    return { data: students, error: null };
  } catch (error) {
    console.error('Erreur getStudentsByCourse:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les notes d'un cours pour tous les étudiants.
 * @param {number|string} courseId
 * @param {string} [typeEvaluation]
 * @returns {Promise<Object>}
 */
export const getGradesByCourse = async (courseId, typeEvaluation) => {
  try {
    let query = supabase
      .from('grades')
      .select(`
        id,
        student_id,
        course_id,
        professor_id,
        evaluation_type,
        coefficient,
        value,
        max_value,
        comment,
        evaluation_date,
        is_published,
        published_at,
        created_at,
        updated_at,
        students:student_id(
          id,
          profile_id,
          student_number,
          level,
          profiles:profile_id(id, full_name, avatar_url, email)
        ),
        professors:professor_id(
          id,
          profile_id,
          profiles:profile_id(id, full_name)
        ),
        courses:course_id(
          id,
          name,
          code,
          semester
        )
      `)
      .eq('course_id', Number(courseId))
      .order('evaluation_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (typeEvaluation) {
      query = query.eq('evaluation_type', typeEvaluation);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: (data || []).map(mapGradeRow), error: null };
  } catch (error) {
    console.error('Erreur getGradesByCourse:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les notes d'un étudiant pour un cours spécifique.
 * @param {number|string} studentId
 * @param {number|string} courseId
 * @returns {Promise<Object>}
 */
export const getStudentGradesForCourse = async (studentId, courseId) => {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select(`
        id,
        student_id,
        course_id,
        professor_id,
        evaluation_type,
        coefficient,
        value,
        max_value,
        comment,
        evaluation_date,
        is_published,
        published_at,
        created_at,
        updated_at,
        students:student_id(
          id,
          profile_id,
          student_number,
          level,
          profiles:profile_id(id, full_name, avatar_url, email)
        ),
        professors:professor_id(
          id,
          profile_id,
          profiles:profile_id(id, full_name)
        ),
        courses:course_id(
          id,
          name,
          code,
          semester
        )
      `)
      .eq('student_id', Number(studentId))
      .eq('course_id', Number(courseId))
      .order('evaluation_date', { ascending: false });

    if (error) throw error;
    return { data: (data || []).map(mapGradeRow), error: null };
  } catch (error) {
    console.error('Erreur getStudentGradesForCourse:', error);
    return { data: null, error };
  }
};

/**
 * Récupère toutes les notes publiées d'un étudiant.
 * @param {number|string} studentId
 * @returns {Promise<Object>}
 */
export const getStudentPublishedGrades = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select(`
        id,
        student_id,
        course_id,
        professor_id,
        evaluation_type,
        coefficient,
        value,
        max_value,
        comment,
        evaluation_date,
        is_published,
        published_at,
        created_at,
        updated_at,
        students:student_id(
          id,
          profile_id,
          student_number,
          level,
          profiles:profile_id(id, full_name, avatar_url, email)
        ),
        professors:professor_id(
          id,
          profile_id,
          profiles:profile_id(id, full_name)
        ),
        courses:course_id(
          id,
          name,
          code,
          semester
        )
      `)
      .eq('student_id', Number(studentId))
      .eq('is_published', true)
      .order('evaluation_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []).map(mapGradeRow), error: null };
  } catch (error) {
    console.error('Erreur getStudentPublishedGrades:', error);
    return { data: null, error };
  }
};

/**
 * Enregistre ou met à jour une note.
 * @param {Object} gradeData
 * @returns {Promise<Object>}
 */
export const upsertGrade = async (gradeData) => {
  try {
    const payload = await normalizeGradePayload(gradeData);

    const { data, error } = await supabase
      .from('grades')
      .upsert(payload, {
        onConflict: 'student_id,course_id,evaluation_type,professor_id'
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur upsertGrade:', error);
    return { data: null, error };
  }
};

/**
 * Enregistre plusieurs notes en lot.
 * @param {Array<Object>} gradesData
 * @returns {Promise<Object>}
 */
export const batchUpsertGrades = async (gradesData) => {
  try {
    const professorIdCache = new Map();
    const payload = await Promise.all(
      (gradesData || []).map((grade) => normalizeGradePayload(grade, professorIdCache))
    );

    if (payload.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('grades')
      .upsert(payload, {
        onConflict: 'student_id,course_id,evaluation_type,professor_id'
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur batchUpsertGrades:', error);
    return { data: null, error };
  }
};

/**
 * Publie les notes d'un cours.
 * @param {number|string} courseId
 * @param {string|string[]} evaluationTypes
 * @param {string} professorProfileId
 * @returns {Promise<Object>}
 */
export const publishGrades = async (courseId, evaluationTypes, professorProfileId) => {
  try {
    const { data: professor, error: professorError } = await resolveProfessorEntity(professorProfileId);
    if (professorError) throw professorError;

    const types = Array.isArray(evaluationTypes)
      ? evaluationTypes.filter(Boolean)
      : [evaluationTypes].filter(Boolean);

    let query = supabase
      .from('grades')
      .update({
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('course_id', Number(courseId))
      .eq('professor_id', professor.id)
      .select(`
        id,
        value,
        evaluation_type,
        student_id,
        students:student_id(id, profile_id),
        courses:course_id(id, name, code)
      `);

    if (types.length === 1) {
      query = query.eq('evaluation_type', types[0]);
    } else if (types.length > 1) {
      query = query.in('evaluation_type', types);
    }

    const { data, error } = await query;
    if (error) throw error;

    const courseName = data?.[0]?.courses?.name || 'votre cours';
    const notifications = (data || [])
      .filter((row) => row?.students?.profile_id)
      .map((row) => ({
        recipient_id: row.students.profile_id,
        recipient_role: 'student',
        sender_id: professorProfileId,
        title: 'Nouvelle note publiée',
        content: `Votre note "${row.evaluation_type}" pour ${courseName} est maintenant disponible.`,
        priority: 'medium'
      }));

    await sendNotifications(notifications);

    return { data, error: null };
  } catch (error) {
    console.error('Erreur publishGrades:', error);
    return { data: null, error };
  }
};

/**
 * Liste les notes publiées du professeur afin d'alimenter les demandes de correction.
 * @param {string} professorProfileId
 * @returns {Promise<Object>}
 */
export const getProfessorPublishedGrades = async (professorProfileId) => {
  try {
    const { data: professor, error: professorError } = await resolveProfessorEntity(professorProfileId);
    if (professorError) throw professorError;

    const { data, error } = await supabase
      .from('grades')
      .select(`
        id,
        student_id,
        course_id,
        professor_id,
        evaluation_type,
        coefficient,
        value,
        max_value,
        comment,
        evaluation_date,
        is_published,
        published_at,
        created_at,
        updated_at,
        students:student_id(
          id,
          profile_id,
          student_number,
          level,
          profiles:profile_id(id, full_name, avatar_url, email)
        ),
        courses:course_id(
          id,
          name,
          code,
          semester
        )
      `)
      .eq('professor_id', professor.id)
      .eq('is_published', true)
      .order('evaluation_date', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map((row) => {
        const mapped = mapGradeRow(row);
        return {
          ...mapped,
          label: `${mapped.cours?.code || 'COURS'} • ${mapped.etudiant?.last_name || ''} ${mapped.etudiant?.first_name || ''} • ${mapped.type_evaluation} • ${mapped.note}/${mapped.max_value}`
            .replace(/\s+/g, ' ')
            .trim()
        };
      }),
      error: null
    };
  } catch (error) {
    console.error('Erreur getProfessorPublishedGrades:', error);
    return { data: null, error };
  }
};

/**
 * Soumet une demande de correction de note.
 * @param {Object} correctionData
 * @returns {Promise<Object>}
 */
export const submitGradeCorrection = async (correctionData) => {
  try {
    if (!correctionData.noteId) {
      throw new Error('Sélectionnez une note publiée à corriger.');
    }

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

    await sendNotifications([
      {
        recipient_role: 'admin',
        sender_id: correctionData.professorId,
        title: 'Demande de correction de note',
        content: 'Un professeur a soumis une demande de correction de note.',
        priority: 'medium'
      }
    ]);

    return { data, error: null };
  } catch (error) {
    console.error('Erreur submitGradeCorrection:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les demandes de correction du professeur.
 * @param {string} professorProfileId
 * @returns {Promise<Object>}
 */
export const getProfessorCorrections = async (professorProfileId) => {
  try {
    const { data: corrections, error } = await supabase
      .from('demandes_correction_notes')
      .select(`
        id,
        note_id,
        professeur_id,
        ancienne_note,
        nouvelle_note,
        justification,
        statut,
        commentaire_admin,
        validee_par,
        validated_at,
        created_at,
        updated_at
      `)
      .eq('professeur_id', professorProfileId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const noteIds = [...new Set((corrections || []).map((item) => item.note_id).filter(Boolean))];
    let gradesById = {};

    if (noteIds.length > 0) {
      const { data: gradeRows, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          student_id,
          course_id,
          professor_id,
          evaluation_type,
          coefficient,
          value,
          max_value,
          comment,
          evaluation_date,
          is_published,
          published_at,
          created_at,
          updated_at,
          students:student_id(
            id,
            profile_id,
            student_number,
            level,
            profiles:profile_id(id, full_name, avatar_url, email)
          ),
          professors:professor_id(
            id,
            profile_id,
            profiles:profile_id(id, full_name)
          ),
          courses:course_id(
            id,
            name,
            code,
            semester
          )
        `)
        .in('id', noteIds);

      if (gradesError) throw gradesError;

      gradesById = Object.fromEntries(
        (gradeRows || []).map((row) => [row.id, mapGradeRow(row)])
      );
    }

    const data = (corrections || []).map((correction) => ({
      ...correction,
      note: gradesById[correction.note_id] || null
    }));

    return { data, error: null };
  } catch (error) {
    console.error('Erreur getProfessorCorrections:', error);
    return { data: null, error };
  }
};

/**
 * Calcule les statistiques d'un cours.
 * @param {number|string} courseId
 * @param {string} [typeEvaluation]
 * @returns {Promise<Object>}
 */
export const getCourseGradeStats = async (courseId, typeEvaluation) => {
  try {
    let query = supabase
      .from('grades')
      .select('value, max_value')
      .eq('course_id', Number(courseId));

    if (typeEvaluation) {
      query = query.eq('evaluation_type', typeEvaluation);
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
          distribution: {
            'Très Bien': 0,
            'Bien': 0,
            'Assez Bien': 0,
            Passable: 0,
            Insuffisant: 0
          }
        },
        error: null
      };
    }

    const notes = data
      .map((row) => normalizeGradeOn20(row.value, row.max_value))
      .filter((value) => Number.isFinite(value));

    const sorted = [...notes].sort((a, b) => a - b);
    const sum = notes.reduce((acc, note) => acc + note, 0);
    const average = sum / notes.length;
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const distribution = {
      'Très Bien': notes.filter((note) => note >= 16).length,
      Bien: notes.filter((note) => note >= 14 && note < 16).length,
      'Assez Bien': notes.filter((note) => note >= 12 && note < 14).length,
      Passable: notes.filter((note) => note >= 10 && note < 12).length,
      Insuffisant: notes.filter((note) => note < 10).length
    };

    return {
      data: {
        count: notes.length,
        average: Math.round(average * 100) / 100,
        min: Math.min(...notes),
        max: Math.max(...notes),
        median: Math.round(median * 100) / 100,
        passRate: Math.round((notes.filter((note) => note >= 10).length / notes.length) * 100),
        distribution
      },
      error: null
    };
  } catch (error) {
    console.error('Erreur getCourseGradeStats:', error);
    return { data: null, error };
  }
};

/**
 * Récupère les cours d'un semestre avec les grades associés.
 * Utilisé par ReportCardPage pour le bulletin.
 * @param {number} semester
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getCoursesBySemesterWithGrades = async (semester) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        grades(
          id,
          score,
          is_published,
          lecture_notes,
          participation,
          attendance,
          comments,
          created_at
        )
      `)
      .eq('semester', semester)
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('getCoursesBySemesterWithGrades:', error);
    return { data: null, error };
  }
};
