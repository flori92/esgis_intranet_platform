/**
 * ============================================
 * 18 Relations: Enhanced Services v2
 * Production-ready with error handling, validation, and JSDoc
 * ============================================
 */

import { supabase, formatSupabaseError } from '@/config/supabase.config'

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Validate UUID format
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Validate required fields
 * @param {object} data - Data to validate
 * @param {string[]} fields - Required field names
 * @throws {Error}
 */
function validateRequired(data, fields) {
  if (!data) throw new Error('Data object is required')
  const missing = fields.filter((field) => !data[field])
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
}

// ============================================
// 1. STUDENT GROUPS SERVICE
// ============================================

/**
 * Student Groups Service
 * Manages student group creation, membership, and operations
 * @type {Object}
 */
export const StudentGroupsService = {
  /**
   * Create a new student group
   * @param {string} name - Group name
   * @param {string} description - Group description
   * @returns {Promise<object>} Created group
   */
  async createGroup(name, description) {
    try {
      validateRequired({ name }, ['name'])

      const { data, error } = await supabase
        .from('student_groups')
        .insert([{ name, description }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'StudentGroupsService.createGroup')
      )
    }
  },

  /**
   * Get all groups
   * @returns {Promise<object[]>}
   */
  async getAllGroups() {
    try {
      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      throw new Error(formatSupabaseError(error, 'StudentGroupsService.getAllGroups'))
    }
  },

  /**
   * Get group by ID
   * @param {string} groupId - Group ID
   * @returns {Promise<object>}
   */
  async getGroupById(groupId) {
    try {
      if (!isValidUUID(groupId)) throw new Error('Invalid group ID format')

      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(formatSupabaseError(error, 'StudentGroupsService.getGroupById'))
    }
  },

  /**
   * Update group
   * @param {string} groupId - Group ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>}
   */
  async updateGroup(groupId, updates) {
    try {
      if (!isValidUUID(groupId)) throw new Error('Invalid group ID format')
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('No updates provided')
      }

      const { data, error } = await supabase
        .from('student_groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(formatSupabaseError(error, 'StudentGroupsService.updateGroup'))
    }
  },

  /**
   * Delete group
   * @param {string} groupId - Group ID
   * @returns {Promise<boolean>}
   */
  async deleteGroup(groupId) {
    try {
      if (!isValidUUID(groupId)) throw new Error('Invalid group ID format')

      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error
      return true
    } catch (error) {
      throw new Error(formatSupabaseError(error, 'StudentGroupsService.deleteGroup'))
    }
  }
}

// ============================================
// 2. STUDENT ALERTS SERVICE
// ============================================

/**
 * Student Alerts Service
 * Manages early warning alerts for students
 * @type {Object}
 */
export const StudentAlertsService = {
  /**
   * Create alert for student
   * @param {string} userId - User ID
   * @param {string} alertType - Alert type
   * @param {string} title - Alert title
   * @param {string} description - Alert description
   * @param {string} severity - Alert severity (low|normal|high|critical)
   * @returns {Promise<object>}
   */
  async createAlert(userId, alertType, title, description, severity = 'normal') {
    try {
      validateRequired(
        { userId, alertType, title },
        ['userId', 'alertType', 'title']
      )
      if (!isValidUUID(userId)) throw new Error('Invalid user ID format')

      const validSeverities = ['low', 'normal', 'high', 'critical']
      if (!validSeverities.includes(severity)) {
        throw new Error(`Invalid severity. Must be: ${validSeverities.join(', ')}`)
      }

      const { data, error } = await supabase
        .from('student_alerts')
        .insert([
          {
            user_id: userId,
            alert_type: alertType,
            title,
            description,
            severity
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(formatSupabaseError(error, 'StudentAlertsService.createAlert'))
    }
  },

  /**
   * Get user alerts
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Only unread alerts
   * @returns {Promise<object[]>}
   */
  async getUserAlerts(userId, unreadOnly = false) {
    try {
      if (!isValidUUID(userId)) throw new Error('Invalid user ID format')

      let query = supabase
        .from('student_alerts')
        .select('*')
        .eq('user_id', userId)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query.order('created_at', {
        ascending: false
      })

      if (error) throw error
      return data || []
    } catch (error) {
      throw new Error(formatSupabaseError(error, 'StudentAlertsService.getUserAlerts'))
    }
  },

  /**
   * Mark alert as read
   * @param {string} alertId - Alert ID
   * @returns {Promise<object>}
   */
  async markAlertAsRead(alertId) {
    try {
      if (!isValidUUID(alertId)) throw new Error('Invalid alert ID format')

      const { data, error } = await supabase
        .from('student_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'StudentAlertsService.markAlertAsRead')
      )
    }
  },

  /**
   * Delete alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<boolean>}
   */
  async deleteAlert(alertId) {
    try {
      if (!isValidUUID(alertId)) throw new Error('Invalid alert ID format')

      const { error } = await supabase
        .from('student_alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error
      return true
    } catch (error) {
      throw new Error(formatSupabaseError(error, 'StudentAlertsService.deleteAlert'))
    }
  }
}

// ============================================
// 3. INTERNSHIP SERVICE
// ============================================

/**
 * Internship Service
 * Manages internship offers and applications
 * @type {Object}
 */
export const InternshipService = {
  /**
   * Create internship offer
   * @param {object} offerData - Offer details (title, company_name, description, location, etc.)
   * @returns {Promise<object>}
   */
  async createInternshipOffer(offerData) {
    try {
      validateRequired(offerData, ['title', 'company_name'])

      const { data, error } = await supabase
        .from('internship_offers')
        .insert([offerData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'InternshipService.createInternshipOffer')
      )
    }
  },

  /**
   * Get all internship offers
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<object[]>}
   */
  async getAllInternshipOffers(status = null) {
    try {
      let query = supabase.from('internship_offers').select('*')

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('created_at', {
        ascending: false
      })

      if (error) throw error
      return data || []
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'InternshipService.getAllInternshipOffers')
      )
    }
  },

  /**
   * Get offer by ID
   * @param {string} offerId - Offer ID
   * @returns {Promise<object>}
   */
  async getInternshipOfferById(offerId) {
    try {
      if (!isValidUUID(offerId)) throw new Error('Invalid offer ID format')

      const { data, error } = await supabase
        .from('internship_offers')
        .select('*')
        .eq('id', offerId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'InternshipService.getInternshipOfferById')
      )
    }
  },

  /**
   * Update internship offer
   * @param {string} offerId - Offer ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>}
   */
  async updateInternshipOffer(offerId, updates) {
    try {
      if (!isValidUUID(offerId)) throw new Error('Invalid offer ID format')

      const { data, error } = await supabase
        .from('internship_offers')
        .update(updates)
        .eq('id', offerId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'InternshipService.updateInternshipOffer')
      )
    }
  }
}

// ============================================
// 4. COMPETENCIES SERVICE
// ============================================

/**
 * Competencies Service
 * Manages skills and competency tracking
 * @type {Object}
 */
export const CompetenciesService = {
  /**
   * Get all competencies
   * @returns {Promise<object[]>}
   */
  async getAllCompetencies() {
    try {
      const { data, error } = await supabase
        .from('competencies')
        .select('*')
        .order('category')

      if (error) throw error
      return data || []
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'CompetenciesService.getAllCompetencies')
      )
    }
  },

  /**
   * Get competencies by category
   * @param {string} category - Category name
   * @returns {Promise<object[]>}
   */
  async getCompetenciesByCategory(category) {
    try {
      if (!category) throw new Error('Category is required')

      const { data, error } = await supabase
        .from('competencies')
        .select('*')
        .eq('category', category)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'CompetenciesService.getCompetenciesByCategory')
      )
    }
  },

  /**
   * Create new competency
   * @param {string} name - Competency name
   * @param {string} description - Description
   * @param {string} category - Category
   * @param {number} level - Level (1-3)
   * @returns {Promise<object>}
   */
  async createCompetency(name, description, category, level = 1) {
    try {
      validateRequired({ name, category }, ['name', 'category'])

      if (![1, 2, 3].includes(level)) {
        throw new Error('Level must be 1, 2, or 3')
      }

      const { data, error } = await supabase
        .from('competencies')
        .insert([{ name, description, category, level }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'CompetenciesService.createCompetency')
      )
    }
  }
}

// ============================================
// 5. PROFESSOR DASHBOARD SERVICE
// ============================================

/**
 * Professor Dashboard Service
 * Manages professor dashboard configurations
 * @type {Object}
 */
export const ProfessorDashboardService = {
  /**
   * Get or create professor dashboard
   * @param {string} professorId - Professor ID
   * @returns {Promise<object>}
   */
  async getProfessorDashboard(professorId) {
    try {
      if (!isValidUUID(professorId))
        throw new Error('Invalid professor ID format')

      const { data, error } = await supabase
        .from('professor_dashboards')
        .select('*')
        .eq('professor_id', professorId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Dashboard doesn't exist, create it
        return this.createProfessorDashboard(professorId)
      }

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'ProfessorDashboardService.getProfessorDashboard')
      )
    }
  },

  /**
   * Create professor dashboard
   * @param {string} professorId - Professor ID
   * @returns {Promise<object>}
   */
  async createProfessorDashboard(professorId) {
    try {
      if (!isValidUUID(professorId))
        throw new Error('Invalid professor ID format')

      const { data, error } = await supabase
        .from('professor_dashboards')
        .insert([{ professor_id: professorId }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(error, 'ProfessorDashboardService.createProfessorDashboard')
      )
    }
  },

  /**
   * Update dashboard preferences
   * @param {string} dashboardId - Dashboard ID
   * @param {object} preferences - Preference updates
   * @returns {Promise<object>}
   */
  async updateDashboardPreferences(dashboardId, preferences) {
    try {
      if (!isValidUUID(dashboardId))
        throw new Error('Invalid dashboard ID format')

      const { data, error } = await supabase
        .from('professor_dashboards')
        .update(preferences)
        .eq('id', dashboardId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(
        formatSupabaseError(
          error,
          'ProfessorDashboardService.updateDashboardPreferences'
        )
      )
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  StudentGroupsService,
  StudentAlertsService,
  InternshipService,
  CompetenciesService,
  ProfessorDashboardService,
  utils: {
    isValidUUID,
    validateRequired,
    formatSupabaseError
  }
}