import { supabase } from '../supabase';
import { getStudentCourses } from './courses';

const getRelation = (value) => (Array.isArray(value) ? value[0] : value);

const normalizeFileType = (value) => {
  const normalized = `${value || ''}`.trim().toLowerCase();

  if (!normalized) {
    return 'file';
  }

  if (
    normalized === 'pdf' ||
    normalized.includes('pdf')
  ) {
    return 'pdf';
  }

  if (
    normalized.startsWith('video/') ||
    ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(normalized)
  ) {
    return 'video';
  }

  if (
    normalized.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(normalized)
  ) {
    return 'image';
  }

  if (
    normalized.includes('presentation') ||
    ['ppt', 'pptx', 'odp', 'key'].includes(normalized)
  ) {
    return 'presentation';
  }

  if (
    normalized.includes('zip') ||
    normalized.includes('rar') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(normalized)
  ) {
    return 'archive';
  }

  return 'file';
};

const getFileName = (value, fallbackTitle = 'resource') => {
  if (!value) {
    return fallbackTitle;
  }

  const cleanValue = value.split('?')[0];
  const parts = cleanValue.split('/').filter(Boolean);
  return parts.pop() || fallbackTitle;
};

const buildDocumentTagsMap = async (documentIds) => {
  if (!documentIds.length) {
    return {};
  }

  const { data, error } = await supabase
    .from('document_tags')
    .select('document_id, tag')
    .in('document_id', documentIds);

  if (error) {
    throw error;
  }

  return (data || []).reduce((accumulator, row) => {
    accumulator[row.document_id] = accumulator[row.document_id] || [];
    accumulator[row.document_id].push(row.tag);
    return accumulator;
  }, {});
};

const normalizeCourseResource = (resource) => {
  const course = getRelation(resource.course);
  const chapter = getRelation(resource.chapter);
  const uploader = getRelation(resource.uploaded_by_profile);

  return {
    id: `course-${resource.id}`,
    rawId: resource.id,
    source: 'course',
    sourceLabel: 'Ressource de cours',
    title: resource.title,
    description: resource.description || '',
    author: uploader?.full_name || 'Professeur',
    courseName: course?.name || 'Cours',
    courseCode: course?.code || '',
    contextLabel: chapter?.name || course?.name || 'Cours',
    fileType: normalizeFileType(resource.file_type),
    fileSize: Number(resource.file_size || 0),
    fileUrl: resource.file_url || '',
    filePath: null,
    fileName: getFileName(resource.file_url, resource.title),
    visibility: 'course',
    createdAt: resource.created_at,
    downloads: Number(resource.downloads_count || 0),
    tags: [course?.code, chapter?.name].filter(Boolean)
  };
};

const normalizeSharedDocument = (document, tagsByDocumentId) => {
  const course = getRelation(document.course);
  const uploader = getRelation(document.uploaded_by_profile);
  const visibility = document.is_public ? 'public' : (document.visibility || 'public');

  return {
    id: `document-${document.id}`,
    rawId: document.id,
    source: 'shared',
    sourceLabel: 'Document partagé',
    title: document.title,
    description: document.description || '',
    author: uploader?.full_name || 'Administration',
    courseName: course?.name || '',
    courseCode: course?.code || '',
    contextLabel: course?.name || 'Bibliothèque partagée',
    fileType: normalizeFileType(document.file_type),
    fileSize: Number(document.file_size || 0),
    fileUrl: null,
    filePath: document.file_path || '',
    fileName: getFileName(document.file_path, document.title),
    visibility,
    createdAt: document.created_at,
    downloads: 0,
    tags: tagsByDocumentId[document.id] || []
  };
};

export const getStudentLibraryContent = async (profileId) => {
  try {
    if (!profileId) {
      return { items: [], error: null };
    }

    const { data: courses, error: coursesError } = await getStudentCourses(profileId);

    if (coursesError) {
      throw coursesError;
    }

    const courseIds = [...new Set((courses || []).map((course) => course.id).filter(Boolean))];
    const now = new Date().toISOString();

    const courseResourcesPromise = courseIds.length
      ? supabase
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
            chapter_id,
            course_id,
            course:courses!course_id(id, name, code),
            chapter:course_chapters!chapter_id(id, name),
            uploaded_by_profile:uploaded_by(id, full_name)
          `)
          .in('course_id', courseIds)
          .eq('status', 'published')
          .or(`publish_at.is.null,publish_at.lte.${now}`)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null });

    const documentsPromise = supabase
      .from('documents')
      .select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        visibility,
        is_public,
        created_at,
        course_id,
        course:courses(id, name, code),
        uploaded_by_profile:profiles!uploaded_by(id, full_name)
      `)
      .order('created_at', { ascending: false });

    const [
      { data: courseResources, error: courseResourcesError },
      { data: documents, error: documentsError }
    ] = await Promise.all([courseResourcesPromise, documentsPromise]);

    if (courseResourcesError) {
      throw courseResourcesError;
    }

    if (documentsError) {
      throw documentsError;
    }

    const tagsByDocumentId = await buildDocumentTagsMap((documents || []).map((document) => document.id));

    const items = [
      ...(courseResources || []).map(normalizeCourseResource),
      ...(documents || []).map((document) => normalizeSharedDocument(document, tagsByDocumentId))
    ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    return { items, error: null };
  } catch (error) {
    console.error('getStudentLibraryContent:', error);
    return { items: [], error };
  }
};
