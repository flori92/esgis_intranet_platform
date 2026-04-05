import { supabase } from '../supabase';

const getRelation = (value) => (Array.isArray(value) ? value[0] : value);

const generateTempPassword = () => Math.random().toString(36).slice(-10) + 'A1!';

const normalizeLevel = (value) => {
  const normalized = (value || '').toString().trim().toUpperCase();

  if (['L1', 'LICENCE 1', 'LICENCE1'].includes(normalized)) {
    return 'L1';
  }
  if (['L2', 'LICENCE 2', 'LICENCE2'].includes(normalized)) {
    return 'L2';
  }
  if (['L3', 'LICENCE 3', 'LICENCE3', 'LICENCE III'].includes(normalized)) {
    return 'L3';
  }
  if (['M1', 'MASTER 1', 'MASTER1'].includes(normalized)) {
    return 'M1';
  }
  if (['M2', 'MASTER 2', 'MASTER2'].includes(normalized)) {
    return 'M2';
  }

  return 'L1';
};

const parseSpecialties = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  return `${value}`
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeRole = (value) => {
  const role = `${value || 'student'}`.trim().toLowerCase();

  if (!['student', 'professor', 'admin'].includes(role)) {
    throw new Error(`Rôle invalide: ${value}`);
  }

  return role;
};

const getStudentStatusInput = (value = {}) => (
  value.student_status
  || value.studentStatus
  || value.lifecycle_status
  || value.account_status
  || null
);

const getProfessorStatusInput = (value = {}) => (
  value.professor_status
  || value.professorStatus
  || null
);

const normalizeStudentStatus = (value) => {
  const normalized = `${value || 'active'}`.trim().toLowerCase();

  const map = {
    active: 'active',
    actif: 'active',
    graduated: 'graduated',
    'diplomé': 'graduated',
    diplome: 'graduated',
    suspended: 'suspended',
    suspendu: 'suspended',
    withdrawn: 'withdrawn',
    'radié': 'withdrawn',
    radie: 'withdrawn'
  };

  return map[normalized] || 'active';
};

const normalizeProfessorStatus = (value) => {
  const normalized = `${value || 'active'}`.trim().toLowerCase();

  const map = {
    active: 'active',
    actif: 'active',
    on_leave: 'on_leave',
    'congé': 'on_leave',
    conge: 'on_leave',
    retired: 'retired',
    retraite: 'retired',
    terminated: 'terminated',
    termine: 'terminated'
  };

  return map[normalized] || 'active';
};

const generateStudentNumber = () => `ETU${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
const generateEmployeeNumber = () => `PROF${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

const normalizeUserRow = (row) => {
  const department = getRelation(row.departments);
  const student = getRelation(row.students || row.student);
  const professor = getRelation(row.professors || row.professor);

  return {
    id: row.id,
    created_at: row.created_at,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    department_id: row.department_id,
    department_name: department?.name || 'Non assigné',
    is_active: row.is_active !== false,
    status: row.is_active === false ? 'inactive' : 'active',
    student_id: student?.id || null,
    student_number: student?.student_number || '',
    student_status: student?.status || null,
    level: student?.level || null,
    entry_year: student?.entry_year || null,
    professor_id: professor?.id || null,
    employee_number: professor?.employee_number || '',
    hire_date: professor?.hire_date || null,
    specialties: professor?.specialties || [],
    specialization: (professor?.specialties || []).join(', '),
    professor_status: professor?.status || null
  };
};

const restorePreviousSession = async (session) => {
  if (!session?.access_token || !session?.refresh_token) {
    return;
  }

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });
};

const ensureStudentRecord = async (profileId, userData = {}) => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('students')
      .select('id, student_number, entry_year, level, status')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (existingError) {
      // If table doesn't exist, just return null
      if (existingError.code === 'PGRST116' || existingError.message?.includes('relation "public.students" does not exist')) {
        return null;
      }
      throw existingError;
    }

    if (existing) {
      const updates = {};
      const studentStatus = getStudentStatusInput(userData);

      if (userData.student_number) {
        updates.student_number = userData.student_number;
      }

      if (userData.entry_year) {
        updates.entry_year = Number(userData.entry_year);
      }

      if (userData.level) {
        updates.level = normalizeLevel(userData.level);
      }

      if (studentStatus) {
        updates.status = normalizeStudentStatus(studentStatus);
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('students')
          .update(updates)
          .eq('id', existing.id);

        if (error) {
          throw error;
        }
      }

      return existing;
    }

    const now = new Date();
    const { error } = await supabase
      .from('students')
      .insert({
        profile_id: profileId,
        student_number: userData.student_number || generateStudentNumber(),
        entry_year: Number(userData.entry_year) || now.getFullYear(),
        level: normalizeLevel(userData.level),
        status: normalizeStudentStatus(getStudentStatusInput(userData) || 'active')
      });

    if (error) {
      throw error;
    }

    return null;
  } catch (error) {
    console.error('ensureStudentRecord error:', error);
    return null;
  }
};

const ensureProfessorRecord = async (profileId, userData = {}) => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('professors')
      .select('id, employee_number, hire_date, specialties, status')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (existingError) {
      // If table doesn't exist, just return null
      if (existingError.code === 'PGRST116' || existingError.message?.includes('relation "public.professors" does not exist')) {
        return null;
      }
      throw existingError;
    }

    if (existing) {
      const updates = {};
      const professorStatus = getProfessorStatusInput(userData);

      if (userData.employee_number) {
        updates.employee_number = userData.employee_number;
      }

      if (userData.hire_date) {
        updates.hire_date = userData.hire_date;
      }

      if (userData.specialties || userData.speciality) {
        updates.specialties = parseSpecialties(userData.specialties || userData.speciality);
      }

      if (professorStatus) {
        updates.status = normalizeProfessorStatus(professorStatus);
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('professors')
          .update(updates)
          .eq('id', existing.id);

        if (error) {
          throw error;
        }
      }

      return existing;
    }

    const { error } = await supabase
      .from('professors')
      .insert({
        profile_id: profileId,
        employee_number: userData.employee_number || generateEmployeeNumber(),
        hire_date: userData.hire_date || new Date().toISOString().slice(0, 10),
        specialties: parseSpecialties(userData.specialties || userData.speciality),
        status: normalizeProfessorStatus(getProfessorStatusInput(userData) || 'active')
      });

    if (error) {
      throw error;
    }

    return null;
  } catch (error) {
    console.error('ensureProfessorRecord error:', error);
    return null;
  }
};

const ensureRoleRecord = async (profileId, role, userData = {}) => {
  if (role === 'student') {
    await ensureStudentRecord(profileId, userData);
  }

  if (role === 'professor') {
    await ensureProfessorRecord(profileId, userData);
  }
};

/**
 * Charge les entités métier `students` et `professors` liées à un profil.
 * @param {string} profileId
 * @returns {Promise<{ studentEntity: Object|null, professorEntity: Object|null }>}
 */
export const getRoleEntities = async (profileId) => {
  try {
    const [{ data: studentEntity }, { data: professorEntity }] = await Promise.all([
      supabase
        .from('students')
        .select('id, profile_id, student_number, entry_year, level, status')
        .eq('profile_id', profileId)
        .maybeSingle(),
      supabase
        .from('professors')
        .select('id, profile_id, employee_number, hire_date, specialties, status')
        .eq('profile_id', profileId)
        .maybeSingle()
    ]);

    return {
      studentEntity: studentEntity || null,
      professorEntity: professorEntity || null
    };
  } catch (error) {
    // If tables don't exist, return null for both
    if (error.message?.includes('relation "public.students" does not exist') ||
        error.message?.includes('relation "public.professors" does not exist')) {
      return { studentEntity: null, professorEntity: null };
    }
    console.error('getRoleEntities:', error);
    return { studentEntity: null, professorEntity: null };
  }
};

export const getUsers = async (options = {}) => {
  try {
    const {
      page = 1,
      pageSize = 1000,
      role,
      departmentId,
      search,
      isActive
    } = options;

    let query = supabase
      .from('profiles')
      .select(`
        id,
        created_at,
        full_name,
        email,
        phone,
        role,
        department_id,
        is_active,
        departments(name)
      `, { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (typeof isActive === 'boolean') {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const from = Math.max(0, (page - 1) * pageSize);
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return { users: [], count: 0, error };
    }

    // Get role entities separately to handle missing tables
    const usersWithEntities = await Promise.all(
      (data || []).map(async (user) => {
        const { studentEntity, professorEntity } = await getRoleEntities(user.id);
        return {
          ...user,
          students: studentEntity ? [studentEntity] : null,
          professors: professorEntity ? [professorEntity] : null
        };
      })
    );

    return {
      users: usersWithEntities.map(normalizeUserRow),
      count: count || 0,
      error: null
    };
  } catch (error) {
    console.error('Exception lors de la récupération des utilisateurs:', error);
    return { users: [], count: 0, error };
  }
};

export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        created_at,
        full_name,
        email,
        phone,
        role,
        department_id,
        is_active,
        departments(name)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      return { user: null, error };
    }

    // Get role entities separately to handle missing tables
    const { studentEntity, professorEntity } = await getRoleEntities(userId);

    const userWithEntities = {
      ...data,
      students: studentEntity ? [studentEntity] : null,
      professors: professorEntity ? [professorEntity] : null
    };

    return { user: normalizeUserRow(userWithEntities), error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de l'utilisateur ${userId}:`, error);
    return { user: null, error };
  }
};

export const createUser = async (userData) => {
  const previousSession = (await supabase.auth.getSession()).data.session;

  try {
    const role = normalizeRole(userData.role);
    const fullName = `${userData.full_name || ''}`.trim();
    const email = `${userData.email || ''}`.trim().toLowerCase();

    if (!fullName || !email) {
      throw new Error('Le nom complet et l’email sont obligatoires');
    }

    const tempPassword = userData.password || generateTempPassword();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name: fullName,
          role
        }
      }
    });

    if (authError || !authData.user) {
      return {
        user: null,
        tempPassword: null,
        error: authError || new Error('Échec de la création du compte')
      };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        phone: userData.phone || null,
        role,
        department_id: userData.department_id || null,
        is_active: userData.status !== 'inactive',
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      return { user: null, tempPassword: null, error: profileError };
    }

    await ensureRoleRecord(authData.user.id, role, userData);
    const { user, error: userError } = await getUserById(authData.user.id);

    if (userError) {
      return { user: null, tempPassword: null, error: userError };
    }

    return {
      user,
      tempPassword,
      error: null
    };
  } catch (error) {
    console.error('Exception lors de la création de l’utilisateur:', error);
    return { user: null, tempPassword: null, error };
  } finally {
    await restorePreviousSession(previousSession);
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const role = normalizeRole(updates.role);
    const payload = {
      full_name: `${updates.full_name || ''}`.trim(),
      phone: updates.phone || null,
      role,
      department_id: updates.department_id || null,
      is_active: updates.status !== 'inactive',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id')
      .single();

    if (error) {
      return { user: null, error };
    }

    await ensureRoleRecord(userId, role, updates);
    const { user, error: userError } = await getUserById(userId);

    if (userError) {
      return { user: null, error: userError };
    }

    return { user, error: null };
  } catch (error) {
    console.error(`Exception lors de la mise à jour de l'utilisateur ${userId}:`, error);
    return { user: null, error };
  }
};

export const toggleUserActive = async (userId, isActive) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { success: !error, error };
  } catch (error) {
    console.error(`Exception lors du changement d'état de l'utilisateur ${userId}:`, error);
    return { success: false, error };
  }
};

export const deleteUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    return { success: !error, error };
  } catch (error) {
    console.error(`Exception lors de la suppression de l'utilisateur ${userId}:`, error);
    return { success: false, error };
  }
};

export const importUsers = async (rows = []) => {
  try {
    const { data: departments, error: departmentError } = await supabase
      .from('departments')
      .select('id, name');

    if (departmentError) {
      return {
        successful: 0,
        failed: rows.length,
        errors: rows.map((row) => ({
          email: row.email || '',
          error: departmentError.message
        })),
        error: departmentError
      };
    }

    const departmentMap = new Map(
      (departments || []).map((department) => [department.name.trim().toLowerCase(), department.id])
    );

    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const row of rows) {
      try {
        const role = normalizeRole(row.role);
        const departmentId = row.department
          ? departmentMap.get(`${row.department}`.trim().toLowerCase()) || null
          : null;

        const result = await createUser({
          full_name: row.full_name,
          email: row.email,
          role,
          department_id: departmentId,
          status: row.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
          level: row.level || row.niveau,
          student_number: row.student_number,
          employee_number: row.employee_number,
          entry_year: row.entry_year || row.annee_entree,
          specialties: row.specialties || row.speciality || row.specialites
        });

        if (result.error) {
          failed += 1;
          errors.push({
            email: row.email || '',
            error: result.error.message || 'Erreur inconnue'
          });
        } else {
          successful += 1;
        }
      } catch (rowError) {
        failed += 1;
        errors.push({
          email: row.email || '',
          error: rowError.message || 'Erreur inconnue'
        });
      }
    }

    return {
      successful,
      failed,
      errors,
      error: null
    };
  } catch (error) {
    console.error('Exception lors de l’import des utilisateurs:', error);
    return {
      successful: 0,
      failed: rows.length,
      errors: rows.map((row) => ({
        email: row.email || '',
        error: error.message || 'Erreur inconnue'
      })),
      error
    };
  }
};

export const getStudents = async (options = {}) => {
  const result = await getUsers({ ...options, role: 'student', pageSize: options.pageSize || 5000 });
  return { students: result.users, error: result.error };
};

export const getProfessors = async (options = {}) => {
  const result = await getUsers({ ...options, role: 'professor', pageSize: options.pageSize || 5000 });
  return { professors: result.users, error: result.error };
};
