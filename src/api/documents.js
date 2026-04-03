import { supabase } from '../supabase';

const getRelation = (value) => (Array.isArray(value) ? value[0] : value);

const normalizeUploadedDocument = (document, tagsByDocumentId = {}) => {
  const course = getRelation(document.courses);

  return {
    id: document.id,
    title: document.title,
    description: document.description,
    file_path: document.file_path,
    file_size: document.file_size,
    file_type: document.file_type,
    course_id: document.course_id,
    course_name: course?.name || null,
    uploaded_by: document.uploaded_by,
    visibility: document.visibility,
    created_at: document.created_at,
    updated_at: document.updated_at,
    tags: (tagsByDocumentId[document.id] || []).sort((left, right) => left.localeCompare(right))
  };
};

const normalizeGeneratedDocument = (document) => {
  const template = getRelation(document.document_templates);
  const student = getRelation(document.students);
  const studentProfile = getRelation(student?.profiles);

  return {
    id: document.id,
    title: template?.name || 'Document officiel',
    description: `Document généré depuis le modèle ${template?.name || 'inconnu'}`,
    template_name: template?.name || 'Modèle inconnu',
    template_type: template?.type || 'other',
    student_id: document.student_id,
    student_name: studentProfile?.full_name || 'Étudiant inconnu',
    student_number: student?.student_number || '',
    file_path: document.file_path,
    status: document.status,
    created_at: document.created_at,
    updated_at: document.updated_at,
    approval_date: document.approval_date,
    file_type: 'application/pdf'
  };
};

const resolveStoragePath = (filePath) => {
  if (!filePath) {
    return null;
  }

  if (/^https?:\/\//.test(filePath)) {
    return { type: 'url', value: filePath };
  }

  return {
    type: 'storage',
    value: filePath.replace(/^documents\//, '')
  };
};

const getFileNameFromPath = (filePath) => {
  if (!filePath) {
    return '';
  }

  return filePath.split('/').filter(Boolean).pop() || '';
};

const normalizeLegacyFileType = (fileType) => {
  if (!fileType) {
    return 'file';
  }

  if (fileType.includes('/')) {
    const lastSegment = fileType.split('/').pop();
    if (lastSegment === 'pdf') {
      return 'pdf';
    }
    if (lastSegment?.includes('zip')) {
      return 'zip';
    }
    return lastSegment || 'file';
  }

  return fileType;
};

const buildPublicDocumentUrl = (filePath) => {
  const resolvedPath = resolveStoragePath(filePath);

  if (!resolvedPath) {
    return '';
  }

  if (resolvedPath.type === 'url') {
    return resolvedPath.value;
  }

  const { data } = supabase.storage.from('documents').getPublicUrl(resolvedPath.value);
  return data?.publicUrl || '';
};

const normalizeLegacyDocument = (document) => ({
  id: document.id,
  title: document.title,
  description: document.description || '',
  file_url: buildPublicDocumentUrl(document.file_path),
  file_path: document.file_path,
  file_name: getFileNameFromPath(document.file_path),
  file_type: normalizeLegacyFileType(document.file_type),
  file_size: document.file_size || 0,
  created_at: document.created_at,
  updated_at: document.updated_at,
  created_by: document.uploaded_by || null,
  uploaded_by: document.uploaded_by || null,
  course_id: document.course_id || null,
  group_id: document.group_id || null,
  type: document.type || 'other',
  is_public: document.is_public === true || document.visibility === 'public',
  visibility: document.visibility || (document.is_public ? 'public' : 'course')
});

export const getCoursesForDocuments = async ({
  isAdmin = false,
  isStudent = false,
  isProfessor = false,
  studentId = null,
  professorId = null
}) => {
  try {
    if (isStudent && !studentId) {
      return { courses: [], error: null };
    }

    if (isProfessor && !professorId) {
      return { courses: [], error: null };
    }

    if (isAdmin) {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, code')
        .order('name', { ascending: true });

      return { courses: data || [], error };
    }

    if (isStudent) {
      const { data, error } = await supabase
        .from('student_courses')
        .select('course_id, status, courses:course_id(id, name, code)')
        .eq('student_id', studentId)
        .in('status', ['enrolled', 'completed']);

      if (error) {
        return { courses: [], error };
      }

      return {
        courses: (data || []).map((item) => getRelation(item.courses)).filter(Boolean),
        error: null
      };
    }

    if (isProfessor) {
      const { data, error } = await supabase
        .from('professor_courses')
        .select('course_id, courses:course_id(id, name, code)')
        .eq('professor_id', professorId);

      if (error) {
        return { courses: [], error };
      }

      return {
        courses: (data || []).map((item) => getRelation(item.courses)).filter(Boolean),
        error: null
      };
    }

    return { courses: [], error: null };
  } catch (error) {
    console.error('Erreur lors du chargement des cours pour les documents:', error);
    return { courses: [], error };
  }
};

export const getUploadedDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        courses:course_id(id, name, code)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { documents: [], error };
    }

    const documentIds = (data || []).map((document) => document.id);
    let tagsByDocumentId = {};

    if (documentIds.length > 0) {
      const { data: tagRows, error: tagsError } = await supabase
        .from('document_tags')
        .select('document_id, tag')
        .in('document_id', documentIds);

      if (tagsError) {
        return { documents: [], error: tagsError };
      }

      tagsByDocumentId = (tagRows || []).reduce((accumulator, row) => {
        accumulator[row.document_id] = accumulator[row.document_id] || [];
        accumulator[row.document_id].push(row.tag);
        return accumulator;
      }, {});
    }

    return {
      documents: (data || []).map((document) => normalizeUploadedDocument(document, tagsByDocumentId)),
      error: null
    };
  } catch (error) {
    console.error('Erreur lors du chargement des documents:', error);
    return { documents: [], error };
  }
};

export const listLegacyDocuments = async ({ userId = null, type = null, courseId = null, groupId = null } = {}) => {
  try {
    let query = supabase
      .from('documents')
      .select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        type,
        is_public,
        group_id
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`is_public.eq.true,uploaded_by.eq.${userId}`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) {
      return { documents: [], error };
    }

    return {
      documents: (data || []).map(normalizeLegacyDocument),
      error: null
    };
  } catch (error) {
    console.error('listLegacyDocuments:', error);
    return { documents: [], error };
  }
};

export const getGeneratedDocuments = async ({
  canViewOfficialDocuments = false,
  isStudent = false,
  studentId = null
} = {}) => {
  try {
    if (!canViewOfficialDocuments) {
      return { documents: [], error: null };
    }

    let query = supabase
      .from('generated_documents')
      .select(`
        id,
        template_id,
        student_id,
        file_path,
        status,
        generated_by,
        approved_by,
        approval_date,
        created_at,
        updated_at,
        document_templates:template_id(id, name, type),
        students:student_id(
          id,
          student_number,
          profiles:profile_id(full_name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (isStudent && studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) {
      return { documents: [], error };
    }

    return {
      documents: (data || []).map(normalizeGeneratedDocument),
      error: null
    };
  } catch (error) {
    console.error('Erreur lors du chargement des documents officiels:', error);
    return { documents: [], error };
  }
};

export const getDocumentsPageData = async (options) => {
  try {
    const [coursesResult, uploadedResult, generatedResult] = await Promise.all([
      getCoursesForDocuments(options),
      getUploadedDocuments(),
      getGeneratedDocuments(options)
    ]);

    const error = coursesResult.error || uploadedResult.error || generatedResult.error;

    if (error) {
      return {
        courses: [],
        documents: [],
        generatedDocuments: [],
        error
      };
    }

    const uniqueCourses = (coursesResult.courses || []).reduce((accumulator, course) => {
      if (!course || accumulator.some((item) => item.id === course.id)) {
        return accumulator;
      }
      return [...accumulator, course];
    }, []);

    return {
      courses: uniqueCourses,
      documents: uploadedResult.documents || [],
      generatedDocuments: generatedResult.documents || [],
      error: null
    };
  } catch (error) {
    console.error('Erreur lors du chargement de la page documents:', error);
    return {
      courses: [],
      documents: [],
      generatedDocuments: [],
      error
    };
  }
};

/**
 * Récupère un modèle de document par type.
 * @param {string} type - Type du template (ex: 'certificate')
 * @returns {Promise<{ template: Object|null, error: Error|null }>}
 */
export const getDocumentTemplateByType = async (type) => {
  try {
    const { data, error } = await supabase
      .from('document_templates')
      .select('id, name, type')
      .eq('type', type)
      .limit(1)
      .single();

    return { template: data, error: error || null };
  } catch (error) {
    console.error('getDocumentTemplateByType:', error);
    return { template: null, error };
  }
};

/**
 * Récupère les certificats générés d'un étudiant.
 * @param {string} studentId
 * @returns {Promise<{ certificates: Array, error: Error|null }>}
 */
export const getStudentGeneratedCertificates = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('generated_documents')
      .select(`
        id,
        file_path,
        status,
        created_at,
        approval_date,
        document_templates:template_id(id, name, type)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      return { certificates: [], error };
    }

    const certificates = (data || []).filter((document) => {
      const template = getRelation(document.document_templates);
      return template?.type === 'certificate';
    });

    return { certificates, error: null };
  } catch (error) {
    console.error('getStudentGeneratedCertificates:', error);
    return { certificates: [], error };
  }
};

/**
 * Insère un document généré dans la base.
 * @param {Object} data
 * @returns {Promise<{ document: Object|null, error: Error|null }>}
 */
export const insertGeneratedDocument = async (data) => {
  try {
    const { data: result, error } = await supabase
      .from('generated_documents')
      .insert({
        template_id: data.template_id,
        student_id: data.student_id,
        file_path: data.file_path,
        status: data.status || 'pending',
        generated_by: data.generated_by || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return { document: result, error: error || null };
  } catch (error) {
    console.error('insertGeneratedDocument:', error);
    return { document: null, error };
  }
};

export const createLegacyDocument = async (document) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: document.title,
        description: document.description || null,
        file_path: document.file_path || document.file_url,
        file_size: document.file_size || 0,
        file_type: document.file_type || 'file',
        course_id: document.course_id || null,
        uploaded_by: document.created_by || document.uploaded_by,
        visibility: document.is_public ? 'public' : (document.visibility || 'course'),
        type: document.type || 'other',
        is_public: document.is_public === true,
        group_id: document.group_id || null
      })
      .select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        type,
        is_public,
        group_id
      `)
      .single();

    return {
      document: data ? normalizeLegacyDocument(data) : null,
      error: error || null
    };
  } catch (error) {
    console.error('createLegacyDocument:', error);
    return { document: null, error };
  }
};

export const updateLegacyDocument = async (documentId, updates) => {
  try {
    const payload = {
      title: updates.title,
      description: updates.description,
      file_path: updates.file_path || updates.file_url,
      file_size: updates.file_size,
      file_type: updates.file_type,
      course_id: updates.course_id || null,
      visibility: updates.is_public ? 'public' : (updates.visibility || undefined),
      type: updates.type,
      is_public: typeof updates.is_public === 'boolean' ? updates.is_public : undefined,
      group_id: Object.prototype.hasOwnProperty.call(updates, 'group_id') ? (updates.group_id || null) : undefined,
      updated_at: new Date().toISOString()
    };

    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabase
      .from('documents')
      .update(payload)
      .eq('id', documentId)
      .select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        type,
        is_public,
        group_id
      `)
      .single();

    return {
      document: data ? normalizeLegacyDocument(data) : null,
      error: error || null
    };
  } catch (error) {
    console.error('updateLegacyDocument:', error);
    return { document: null, error };
  }
};

export const deleteLegacyDocumentRecord = async (documentId) => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    return { error: error || null };
  } catch (error) {
    console.error('deleteLegacyDocumentRecord:', error);
    return { error };
  }
};

/**
 * Met à jour le statut d'un document généré (approve / reject).
 * @param {string|number} documentId
 * @param {string} status - 'approved' | 'rejected'
 * @param {string} userId - ID du profil qui valide/rejette
 * @returns {Promise<{ error: Error|null }>}
 */
export const updateGeneratedDocumentStatus = async (documentId, status, userId) => {
  try {
    const { error } = await supabase
      .from('generated_documents')
      .update({
        status,
        approved_by: userId || null,
        approval_date: new Date().toISOString()
      })
      .eq('id', documentId);

    return { error: error || null };
  } catch (error) {
    console.error('updateGeneratedDocumentStatus:', error);
    return { error };
  }
};

/**
 * Récupère tous les documents générés avec relations (vue admin).
 * @returns {Promise<{ documents: Array, error: Error|null }>}
 */
export const getAllGeneratedDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('generated_documents')
      .select(`
        *,
        students (
          id,
          profiles (
            full_name
          )
        ),
        document_templates (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    return { documents: data || [], error: error || null };
  } catch (error) {
    console.error('getAllGeneratedDocuments:', error);
    return { documents: [], error };
  }
};

export const createDocumentDownloadUrl = async (filePath, expiresIn = 60) => {
  try {
    const resolvedPath = resolveStoragePath(filePath);

    if (!resolvedPath) {
      return { url: null, error: new Error('Chemin de fichier manquant') };
    }

    if (resolvedPath.type === 'url') {
      return { url: resolvedPath.value, error: null };
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(resolvedPath.value, expiresIn);

    return {
      url: data?.signedUrl || null,
      error
    };
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL de téléchargement:', error);
    return { url: null, error };
  }
};

export const deleteUploadedDocument = async (documentId, filePath) => {
  try {
    const resolvedPath = resolveStoragePath(filePath);

    if (resolvedPath?.type === 'storage') {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([resolvedPath.value]);

      if (storageError) {
        return { success: false, error: storageError };
      }
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    return { success: false, error };
  }
};

export const uploadDocument = async ({
  title,
  description,
  visibility = 'course',
  courseId = null,
  file,
  uploadedBy,
  tags = []
}) => {
  try {
    if (!title?.trim() || !file || !uploadedBy) {
      return { document: null, error: new Error('Le titre, le fichier et l\'auteur sont obligatoires') };
    }

    const storagePath = `${uploadedBy}/documents/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return { document: null, error: uploadError };
    }

    const { data: insertedDocument, error: insertError } = await supabase
      .from('documents')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        file_path: storagePath,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        course_id: courseId ? Number(courseId) : null,
        uploaded_by: uploadedBy,
        visibility
      })
      .select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        courses:course_id(id, name, code)
      `)
      .single();

    if (insertError) {
      await supabase.storage.from('documents').remove([storagePath]);
      return { document: null, error: insertError };
    }

    const uniqueTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));

    if (uniqueTags.length > 0) {
      const { error: tagsError } = await supabase
        .from('document_tags')
        .insert(
          uniqueTags.map((tag) => ({
            document_id: insertedDocument.id,
            tag
          }))
        );

      if (tagsError) {
        await supabase.from('documents').delete().eq('id', insertedDocument.id);
        await supabase.storage.from('documents').remove([storagePath]);
        return { document: null, error: tagsError };
      }
    }

    return {
      document: normalizeUploadedDocument(insertedDocument, {
        [insertedDocument.id]: uniqueTags
      }),
      error: null
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload du document:', error);
    return { document: null, error };
  }
};

/**
 * Insère un enregistrement dans documents_generes (table QR).
 * @param {Object} row
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export const insertDocumentGenere = async (row) => {
  try {
    const { data, error } = await supabase
      .from('documents_generes')
      .insert({
        document_type_id: row.document_type_id || null,
        etudiant_id: row.etudiant_id,
        fichier_url: row.fichier_url || '',
        date_generation: row.date_generation || new Date().toISOString(),
        reference: row.reference,
        type_document: row.type_document,
        verification_url: row.verification_url || null
      })
      .select();

    return { data, error: error || null };
  } catch (error) {
    console.error('insertDocumentGenere:', error);
    return { data: null, error };
  }
};

/**
 * Vérifie un document généré via sa référence (table documents_generes).
 * @param {string} reference
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export const getDocumentGenereByReference = async (reference) => {
  try {
    const { data, error } = await supabase
      .from('documents_generes')
      .select(`
        id, reference, date_generation, type_document, fichier_url,
        etudiant:etudiant_id(
          first_name, last_name,
          inscriptions:inscriptions(
            annee_academique,
            niveaux:niveau_id(name, filieres:filiere_id(name))
          )
        )
      `)
      .eq('reference', reference)
      .single();

    return { data, error: error || null };
  } catch (error) {
    console.error('getDocumentGenereByReference:', error);
    return { data: null, error };
  }
};

/**
 * Récupère l'historique des documents générés (QR) d'un étudiant.
 * @param {string} studentId
 * @returns {Promise<{ data: Array|null, error: Error|null }>}
 */
export const getDocumentsGeneresByStudent = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('documents_generes')
      .select('*')
      .eq('etudiant_id', studentId)
      .order('date_generation', { ascending: false });

    return { data, error: error || null };
  } catch (error) {
    console.error('getDocumentsGeneresByStudent:', error);
    return { data: null, error };
  }
};
