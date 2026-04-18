import { supabase } from '../supabase';

const CONNECTOR_SELECT = `
  id,
  provider,
  name,
  base_url,
  auth_type,
  status,
  capabilities,
  settings,
  secret_ref,
  last_sync_at,
  last_success_at,
  last_error,
  created_by,
  created_at,
  updated_at
`;

const normalizeRelation = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
};

const normalizeJsonField = (value, fallback = {}) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    return JSON.parse(value);
  }

  return value;
};

const compactObject = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const mapCourse = (course) => {
  if (!course) {
    return null;
  }

  return {
    ...course,
    department: normalizeRelation(course.departments)
  };
};

const mapCourseLink = (link) => ({
  ...link,
  connector: normalizeRelation(link.external_lms_connectors),
  course: mapCourse(normalizeRelation(link.courses))
});

const mapSyncRun = (run) => ({
  ...run,
  connector: normalizeRelation(run.external_lms_connectors)
});

const buildConnectorPayload = (payload, { includeCreator = false } = {}) =>
  compactObject({
    provider: payload.provider,
    name: payload.name?.trim(),
    base_url: payload.base_url?.trim() || null,
    auth_type: payload.auth_type || 'token',
    status: payload.status || 'active',
    capabilities: normalizeJsonField(payload.capabilities, {}),
    settings: normalizeJsonField(payload.settings, {}),
    secret_ref: payload.secret_ref?.trim() || null,
    created_by: includeCreator ? payload.created_by || null : undefined
  });

const buildCourseLinkPayload = (payload) =>
  compactObject({
    connector_id: payload.connector_id,
    course_id: Number(payload.course_id),
    external_course_id: String(payload.external_course_id || '').trim(),
    external_course_shortname: payload.external_course_shortname?.trim() || null,
    external_category_id: payload.external_category_id?.trim() || null,
    sync_direction: payload.sync_direction || 'bidirectional',
    sync_enabled: payload.sync_enabled ?? true,
    metadata: normalizeJsonField(payload.metadata, {})
  });

const buildSyncRunPayload = (payload) =>
  compactObject({
    connector_id: payload.connector_id,
    sync_type: payload.sync_type || 'full',
    direction: payload.direction || 'bidirectional',
    status: payload.status || 'queued',
    counters: normalizeJsonField(payload.counters, {}),
    details: normalizeJsonField(payload.details, {}),
    initiated_by: payload.initiated_by || null
  });

export const getLmsBridgeDashboard = async () => {
  try {
    const [connectorsRes, courseLinksRes, syncRunsRes, coursesRes] = await Promise.all([
      supabase.from('external_lms_connectors').select(CONNECTOR_SELECT).order('updated_at', { ascending: false }),
      supabase
        .from('external_lms_course_links')
        .select(`
          id,
          connector_id,
          course_id,
          external_course_id,
          external_course_shortname,
          external_category_id,
          sync_direction,
          sync_enabled,
          metadata,
          last_synced_at,
          created_at,
          updated_at,
          external_lms_connectors!connector_id(id, name, provider, status),
          courses!course_id(
            id,
            code,
            name,
            level,
            semester,
            department_id,
            departments!department_id(id, name, code)
          )
        `)
        .order('updated_at', { ascending: false }),
      supabase
        .from('external_lms_sync_runs')
        .select(`
          id,
          connector_id,
          sync_type,
          direction,
          status,
          started_at,
          finished_at,
          counters,
          details,
          error_message,
          initiated_by,
          created_at,
          updated_at,
          external_lms_connectors!connector_id(id, name, provider, status)
        `)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('courses')
        .select(`
          id,
          code,
          name,
          level,
          semester,
          department_id,
          departments!department_id(id, name, code)
        `)
        .order('name')
    ]);

    const error = connectorsRes.error || courseLinksRes.error || syncRunsRes.error || coursesRes.error;

    if (error) {
      throw error;
    }

    return {
      data: {
        connectors: connectorsRes.data || [],
        courseLinks: (courseLinksRes.data || []).map(mapCourseLink),
        syncRuns: (syncRunsRes.data || []).map(mapSyncRun),
        courses: (coursesRes.data || []).map(mapCourse)
      },
      error: null
    };
  } catch (error) {
    console.error('getLmsBridgeDashboard:', error);
    return {
      data: {
        connectors: [],
        courseLinks: [],
        syncRuns: [],
        courses: []
      },
      error
    };
  }
};

export const createConnector = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('external_lms_connectors')
      .insert(buildConnectorPayload(payload, { includeCreator: true }))
      .select(CONNECTOR_SELECT)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('createConnector:', error);
    return { data: null, error };
  }
};

export const updateConnector = async (id, payload) => {
  try {
    const { data, error } = await supabase
      .from('external_lms_connectors')
      .update(buildConnectorPayload(payload))
      .eq('id', id)
      .select(CONNECTOR_SELECT)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('updateConnector:', error);
    return { data: null, error };
  }
};

export const deleteConnector = async (id) => {
  try {
    const { error } = await supabase.from('external_lms_connectors').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('deleteConnector:', error);
    return { error };
  }
};

export const createCourseLink = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('external_lms_course_links')
      .insert(buildCourseLinkPayload(payload))
      .select(`
        id,
        connector_id,
        course_id,
        external_course_id,
        external_course_shortname,
        external_category_id,
        sync_direction,
        sync_enabled,
        metadata,
        last_synced_at,
        created_at,
        updated_at,
        external_lms_connectors!connector_id(id, name, provider, status),
        courses!course_id(
          id,
          code,
          name,
          level,
          semester,
          department_id,
          departments!department_id(id, name, code)
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data: mapCourseLink(data), error: null };
  } catch (error) {
    console.error('createCourseLink:', error);
    return { data: null, error };
  }
};

export const updateCourseLink = async (id, payload) => {
  try {
    const { data, error } = await supabase
      .from('external_lms_course_links')
      .update(buildCourseLinkPayload(payload))
      .eq('id', id)
      .select(`
        id,
        connector_id,
        course_id,
        external_course_id,
        external_course_shortname,
        external_category_id,
        sync_direction,
        sync_enabled,
        metadata,
        last_synced_at,
        created_at,
        updated_at,
        external_lms_connectors!connector_id(id, name, provider, status),
        courses!course_id(
          id,
          code,
          name,
          level,
          semester,
          department_id,
          departments!department_id(id, name, code)
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data: mapCourseLink(data), error: null };
  } catch (error) {
    console.error('updateCourseLink:', error);
    return { data: null, error };
  }
};

export const deleteCourseLink = async (id) => {
  try {
    const { error } = await supabase.from('external_lms_course_links').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('deleteCourseLink:', error);
    return { error };
  }
};

export const queueSyncRun = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('external_lms_sync_runs')
      .insert(buildSyncRunPayload(payload))
      .select(`
        id,
        connector_id,
        sync_type,
        direction,
        status,
        started_at,
        finished_at,
        counters,
        details,
        error_message,
        initiated_by,
        created_at,
        updated_at,
        external_lms_connectors!connector_id(id, name, provider, status)
      `)
      .single();

    if (error) {
      throw error;
    }

    return { data: mapSyncRun(data), error: null };
  } catch (error) {
    console.error('queueSyncRun:', error);
    return { data: null, error };
  }
};
