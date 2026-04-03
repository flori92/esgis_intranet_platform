/**
 * API Cours & Ressources Pedagogiques — ESGIS Campus §3.2 / §4.2
 */
import { supabase } from '../supabase';
import { uploadFile, getPublicUrl, removeFiles } from './storage';

const DOCUMENT_BUCKET = 'documents';
const SYLLABUS_CHAPTER_NAME = 'Programme & syllabus';

const getStudentRecord = async (profileId) => {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from('students')
    .select('id, profile_id, level')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const getProfessorMapByCourseIds = async (courseIds) => {
  if (!courseIds.length) return new Map();

  const { data: assignments, error: assignmentError } = await supabase
    .from('professor_courses')
    .select('course_id, professor_id, academic_year, is_principal')
    .in('course_id', courseIds)
    .order('is_principal', { ascending: false });

  if (assignmentError) {
    throw assignmentError;
  }

  const professorIds = [...new Set((assignments || []).map((item) => item.professor_id).filter(Boolean))];
  const professorMap = new Map();

  if (professorIds.length) {
    const { data: professors, error: professorError } = await supabase
      .from('professors')
      .select(`
        id,
        profile_id,
        profiles:profile_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .in('id', professorIds);

    if (professorError) {
      throw professorError;
    }

    (professors || []).forEach((professor) => {
      professorMap.set(professor.id, professor);
    });
  }

  const courseProfessorMap = new Map();
  (assignments || []).forEach((assignment) => {
    if (!courseProfessorMap.has(assignment.course_id)) {
      const professor = professorMap.get(assignment.professor_id);
      courseProfessorMap.set(assignment.course_id, {
        id: assignment.professor_id,
        full_name: professor?.profiles?.full_name || '-',
        avatar_url: professor?.profiles?.avatar_url || null,
        academic_year: assignment.academic_year || null,
        is_principal: Boolean(assignment.is_principal),
      });
    }
  });

  return courseProfessorMap;
};

const getProfessorRecord = async (profileId) => {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from('professors')
    .select('id, profile_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const normalizeManagedCourse = (course) => ({
  id: course.id,
  code: course.code,
  name: course.name,
  credits: course.credits,
  description: course.description || '',
  level: course.level || '',
  semester: course.semester || null,
  department: course.departments?.name || '',
  department_id: course.department_id || null
});

const inferPublicationState = (resource) => {
  if (resource.status === 'draft') {
    return 'draft';
  }

  if (resource.status === 'archived') {
    return 'archived';
  }

  if (resource.publish_at && new Date(resource.publish_at).getTime() > Date.now()) {
    return 'scheduled';
  }

  return 'published';
};

const resolveResourceStoragePath = (fileUrl) => {
  if (!fileUrl || /^https?:\/\/(?!.*\/storage\/v1\/object\/public\/)/.test(fileUrl)) {
    return null;
  }

  if (!/^https?:\/\//.test(fileUrl)) {
    return fileUrl.replace(/^documents\//, '');
  }

  const marker = `/storage/v1/object/public/${DOCUMENT_BUCKET}/`;
  const index = fileUrl.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(fileUrl.slice(index + marker.length));
};

const buildResourceInsertPayload = ({
  courseId,
  chapterId,
  title,
  description,
  fileUrl,
  file,
  professorProfileId,
  publicationState,
  publishAt
}) => ({
  chapter_id: chapterId,
  course_id: courseId,
  title,
  description: description || null,
  file_url: fileUrl,
  file_type: file?.name?.split('.').pop()?.toLowerCase() || 'file',
  file_size: file?.size || 0,
  uploaded_by: professorProfileId,
  status: publicationState === 'draft' ? 'draft' : publicationState === 'archived' ? 'archived' : 'published',
  publish_at: publicationState === 'scheduled' ? publishAt : null,
});

const ensureProfessorCourseAccess = async (courseId, professorProfileId) => {
  const professor = await getProfessorRecord(professorProfileId);

  if (!professor) {
    throw new Error('Professeur introuvable');
  }

  const { data, error } = await supabase
    .from('professor_courses')
    .select('course_id')
    .eq('professor_id', professor.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Acces non autorise a ce cours');
  }

  return professor;
};

const normalizeProfessorResource = (resource) => {
  const uploader = Array.isArray(resource.uploaded_by) ? resource.uploaded_by[0] : resource.uploaded_by;

  return {
    ...resource,
    uploaded_by: uploader,
    publication_state: inferPublicationState(resource),
    is_syllabus: (resource.chapter?.name || '').toLowerCase() === SYLLABUS_CHAPTER_NAME.toLowerCase()
  };
};

/** Recupere les cours assignes a un professeur */
export const getProfessorManagedCourses = async (professorProfileId) => {
  try {
    const professor = await getProfessorRecord(professorProfileId);

    if (!professor) {
      return { data: [], error: null };
    }

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
          description,
          level,
          semester,
          department_id,
          departments:department_id(
            id,
            code,
            name
          )
        )
      `)
      .eq('professor_id', professor.id)
      .order('academic_year', { ascending: false });

    if (error) {
      throw error;
    }

    const dedupedCourses = [];
    const seen = new Set();

    (data || []).forEach((assignment) => {
      const course = assignment.courses;

      if (!course?.id || seen.has(course.id)) {
        return;
      }

      seen.add(course.id);
      dedupedCourses.push(normalizeManagedCourse(course));
    });

    dedupedCourses.sort((left, right) => left.name.localeCompare(right.name, 'fr'));

    return { data: dedupedCourses, error: null };
  } catch (error) {
    console.error('getProfessorManagedCourses:', error);
    return { data: null, error };
  }
};

/** Recupere la bibliotheque complete d'un cours cote professeur */
export const getProfessorCourseChaptersAndResources = async (courseId, professorProfileId) => {
  try {
    await ensureProfessorCourseAccess(courseId, professorProfileId);

    const [{ data: chapters, error: chapterError }, { data: resources, error: resourceError }] =
      await Promise.all([
        supabase
          .from('course_chapters')
          .select('id, name, sort_order, created_at')
          .eq('course_id', courseId)
          .order('sort_order')
          .order('created_at', { ascending: true }),
        supabase
          .from('course_resources')
          .select(`
            id,
            title,
            description,
            file_url,
            file_type,
            file_size,
            downloads_count,
            status,
            publish_at,
            created_at,
            updated_at,
            chapter_id,
            course_id,
            chapter:chapter_id(name),
            uploaded_by:uploaded_by(
              id,
              full_name
            )
          `)
          .eq('course_id', courseId)
          .order('created_at', { ascending: false })
      ]);

    if (chapterError) {
      throw chapterError;
    }

    if (resourceError) {
      throw resourceError;
    }

    const normalizedResources = (resources || []).map(normalizeProfessorResource);
    const chaptersWithResources = (chapters || []).map((chapter) => ({
      ...chapter,
      resources: normalizedResources.filter((resource) => resource.chapter_id === chapter.id)
    }));

    return { data: chaptersWithResources, error: null };
  } catch (error) {
    console.error('getProfessorCourseChaptersAndResources:', error);
    return { data: null, error };
  }
};

/** Cree un chapitre de cours */
export const createCourseChapter = async ({ courseId, name, professorProfileId, sortOrder = null }) => {
  try {
    await ensureProfessorCourseAccess(courseId, professorProfileId);

    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      throw new Error('Le nom du chapitre est requis');
    }

    const { data: existing, error: existingError } = await supabase
      .from('course_chapters')
      .select('id, name, sort_order, created_at')
      .eq('course_id', courseId)
      .ilike('name', trimmedName)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return { data: existing, error: null };
    }

    let finalSortOrder = sortOrder;

    if (finalSortOrder === null) {
      const { data: lastChapter, error: lastChapterError } = await supabase
        .from('course_chapters')
        .select('sort_order')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastChapterError) {
        throw lastChapterError;
      }

      finalSortOrder = Number(lastChapter?.sort_order || 0) + 1;
    }

    const { data, error } = await supabase
      .from('course_chapters')
      .insert({
        course_id: courseId,
        name: trimmedName,
        sort_order: finalSortOrder
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('createCourseChapter:', error);
    return { data: null, error };
  }
};

/** Garantit l'existence du chapitre syllabus */
export const ensureSyllabusChapter = async (courseId, professorProfileId) =>
  createCourseChapter({
    courseId,
    name: SYLLABUS_CHAPTER_NAME,
    professorProfileId
  });

/** Recupere les cours d'un etudiant via student_courses */
export const getStudentCourses = async (studentProfileId) => {
  try {
    const student = await getStudentRecord(studentProfileId);
    if (!student) {
      return { data: [], error: null };
    }

    const { data: enrollments, error: enrollmentError } = await supabase
      .from('student_courses')
      .select('course_id, academic_year, semester, status')
      .eq('student_id', student.id)
      .order('academic_year', { ascending: false });

    if (enrollmentError) {
      throw enrollmentError;
    }

    const courseIds = [...new Set((enrollments || []).map((item) => item.course_id).filter(Boolean))];
    if (!courseIds.length) {
      return { data: [], error: null };
    }

    const [{ data: courses, error: courseError }, courseProfessorMap] = await Promise.all([
      supabase
        .from('courses')
        .select('id, code, name, credits, description, level, semester, department_id')
        .in('id', courseIds)
        .order('name'),
      getProfessorMapByCourseIds(courseIds),
    ]);

    if (courseError) {
      throw courseError;
    }

    const enrollmentMap = new Map((enrollments || []).map((item) => [item.course_id, item]));
    const formattedCourses = (courses || []).map((course) => {
      const enrollment = enrollmentMap.get(course.id);
      const professor = courseProfessorMap.get(course.id);

      return {
        ...course,
        academic_year: enrollment?.academic_year || null,
        enrollment_status: enrollment?.status || null,
        professor,
        professeur: professor,
      };
    });

    return { data: formattedCourses, error: null };
  } catch (error) {
    console.error('getStudentCourses:', error);
    return { data: null, error };
  }
};

/** Recupere les chapitres et ressources d'un cours */
export const getCourseChaptersAndResources = async (courseId) => {
  try {
    const now = new Date().toISOString();

    const { data: chapters, error: chapterError } = await supabase
      .from('course_chapters')
      .select('id, name, sort_order')
      .eq('course_id', courseId)
      .order('sort_order');

    if (chapterError) {
      throw chapterError;
    }

    let resourcesQuery = supabase
      .from('course_resources')
      .select(`
        id,
        title,
        description,
        file_url,
        file_type,
        file_size,
        downloads_count,
        status,
        publish_at,
        created_at,
        updated_at,
        chapter_id,
        course_id,
        uploaded_by:uploaded_by(
          id,
          full_name
        )
      `)
      .eq('course_id', courseId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    resourcesQuery = resourcesQuery.or(`publish_at.is.null,publish_at.lte.${now}`);

    const { data: resources, error: resourceError } = await resourcesQuery;

    if (resourceError) {
      throw resourceError;
    }

    const chaptersWithResources = (chapters || []).map((chapter) => ({
      ...chapter,
      resources: (resources || []).filter((resource) => resource.chapter_id === chapter.id),
    }));

    return { data: chaptersWithResources, error: null };
  } catch (error) {
    console.error('getCourseChaptersAndResources:', error);
    return { data: null, error };
  }
};

/** Enregistre une interaction (vue, telechargement, favori, reaction) */
export const recordResourceInteraction = async (resourceId, userId, type, reactionValue = null) => {
  try {
    const { data, error } = await supabase
      .from('resource_interactions')
      .upsert(
        {
          resource_id: resourceId,
          user_id: userId,
          interaction_type: type,
          reaction_value: reactionValue,
        },
        { onConflict: 'resource_id,user_id,interaction_type' }
      )
      .select();

    if (error) {
      throw error;
    }

    if (type === 'download') {
      await supabase.rpc('increment_download_count', { rid: resourceId }).catch(() => {});
    }

    return { data, error: null };
  } catch (error) {
    console.error('recordResourceInteraction:', error);
    return { data: null, error };
  }
};

/** Supprime une interaction utilisateur */
export const removeResourceInteraction = async (resourceId, userId, type) => {
  try {
    const { error } = await supabase
      .from('resource_interactions')
      .delete()
      .eq('resource_id', resourceId)
      .eq('user_id', userId)
      .eq('interaction_type', type);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('removeResourceInteraction:', error);
    return { error };
  }
};

/** Recupere les favoris d'un utilisateur */
export const getUserFavorites = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('resource_interactions')
      .select('resource_id')
      .eq('user_id', userId)
      .eq('interaction_type', 'favorite');

    if (error) {
      throw error;
    }

    return { data: (data || []).map((item) => item.resource_id), error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/** Recherche dans les ressources */
export const searchResources = async (query, courseId = null) => {
  try {
    let searchQuery = supabase
      .from('course_resources')
      .select(`
        id,
        title,
        file_type,
        file_size,
        created_at,
        downloads_count,
        chapter:chapter_id(name),
        course:course_id(name, code),
        uploaded_by:uploaded_by(full_name)
      `)
      .eq('status', 'published')
      .ilike('title', `%${query}%`);

    if (courseId) {
      searchQuery = searchQuery.eq('course_id', courseId);
    }

    const { data, error } = await searchQuery.limit(50);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Upload une ressource (professeur) */
export const uploadResource = async (
  file,
  courseId,
  chapterId,
  title,
  description,
  professorProfileId,
  options = {}
) => {
  try {
    await ensureProfessorCourseAccess(courseId, professorProfileId);

    if (!file) {
      throw new Error('Le fichier est requis');
    }

    const sanitizedFileName = file.name.replace(/\s+/g, '_');
    const path = `courses/${courseId}/${professorProfileId}/${Date.now()}_${sanitizedFileName}`;

    const { error: uploadError } = await uploadFile(DOCUMENT_BUCKET, path, file, {
      upsert: false,
      contentType: file.type || undefined
    });

    if (uploadError) {
      throw uploadError;
    }

    const { publicUrl } = getPublicUrl(DOCUMENT_BUCKET, path);
    const payload = buildResourceInsertPayload({
      courseId,
      chapterId,
      title,
      description,
      fileUrl: publicUrl,
      file,
      professorProfileId,
      publicationState: options.publicationState || 'published',
      publishAt: options.publishAt || null
    });

    const { data, error } = await supabase
      .from('course_resources')
      .insert(payload)
      .select(`
        id,
        title,
        description,
        file_url,
        file_type,
        file_size,
        downloads_count,
        status,
        publish_at,
        created_at,
        updated_at,
        chapter_id,
        course_id,
        chapter:chapter_id(name),
        uploaded_by:uploaded_by(
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data: normalizeProfessorResource(data), error: null };
  } catch (error) {
    console.error('uploadResource:', error);
    return { data: null, error };
  }
};

/** Met a jour les metadonnees d'une ressource */
export const updateCourseResource = async (resourceId, updates, professorProfileId) => {
  try {
    const { data: existingResource, error: existingError } = await supabase
      .from('course_resources')
      .select('id, course_id')
      .eq('id', resourceId)
      .single();

    if (existingError) {
      throw existingError;
    }

    await ensureProfessorCourseAccess(existingResource.course_id, professorProfileId);

    const publicationState = updates.publicationState || 'published';
    const payload = {
      title: updates.title,
      description: updates.description || null,
      chapter_id: updates.chapterId,
      status: publicationState === 'draft' ? 'draft' : publicationState === 'archived' ? 'archived' : 'published',
      publish_at: publicationState === 'scheduled' ? updates.publishAt : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('course_resources')
      .update(payload)
      .eq('id', resourceId)
      .select(`
        id,
        title,
        description,
        file_url,
        file_type,
        file_size,
        downloads_count,
        status,
        publish_at,
        created_at,
        updated_at,
        chapter_id,
        course_id,
        chapter:chapter_id(name),
        uploaded_by:uploaded_by(
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data: normalizeProfessorResource(data), error: null };
  } catch (error) {
    console.error('updateCourseResource:', error);
    return { data: null, error };
  }
};

/** Supprime une ressource et son fichier */
export const deleteCourseResource = async (resourceId, professorProfileId) => {
  try {
    const { data: existingResource, error: existingError } = await supabase
      .from('course_resources')
      .select('id, course_id, file_url')
      .eq('id', resourceId)
      .single();

    if (existingError) {
      throw existingError;
    }

    await ensureProfessorCourseAccess(existingResource.course_id, professorProfileId);

    const storagePath = resolveResourceStoragePath(existingResource.file_url);

    const { error } = await supabase
      .from('course_resources')
      .delete()
      .eq('id', resourceId);

    if (error) {
      throw error;
    }

    if (storagePath) {
      await removeFiles(DOCUMENT_BUCKET, [storagePath]).catch((storageError) => {
        console.error('deleteCourseResource storage cleanup:', storageError);
      });
    }

    return { error: null };
  } catch (error) {
    console.error('deleteCourseResource:', error);
    return { error };
  }
};

export { SYLLABUS_CHAPTER_NAME };
