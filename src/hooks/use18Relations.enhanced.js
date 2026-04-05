/**
 * ============================================
 * Enhanced React Hooks for 18 Relations
 * With error handling, loading states, and optimization
 * ============================================
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  StudentGroupsService,
  StudentAlertsService,
  InternshipService,
  CompetenciesService,
  ProfessorDashboardService
} from '../services/18Relations.enhanced.js'

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * useAsync Hook - Manage async operations
 * @param {Function} asyncFunction - Async function to run
 * @param {Array} dependencies - Dependencies array
 * @returns {Object} {data, loading, error}
 */
export function useAsync(asyncFunction, dependencies = []) {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const execute = useCallback(async () => {
    setStatus('pending')
    setData(null)
    setError(null)
    try {
      const response = await asyncFunction()
      setData(response)
      setStatus('success')
      return response
    } catch (err) {
      setError(err.message)
      setStatus('error')
      throw err
    }
  }, [asyncFunction])

  // Use a ref to store the dependencies array to avoid ESLint warning about non-literal dependency list
  const depsRef = useRef(dependencies)
  
  useEffect(() => {
    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, ...dependencies])

  return { data, loading: status === 'pending', error, status, execute }
}

/**
 * useCache Hook - Simple cache management
 * @param {string} key - Cache key
 * @param {Function} fetcher - Function to fetch data
 * @param {number} ttl - Time to live in ms
 * @returns {Object} {data, loading, error, refetch}
 */
export function useCache(key, fetcher, ttl = 5 * 60 * 1000) {
  const cacheRef = useRef(new Map())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const cached = cacheRef.current.get(key)
      if (cached && Date.now() - cached.timestamp < ttl) {
        setData(cached.data)
        setLoading(false)
        return cached.data
      }

      const result = await fetcher()
      cacheRef.current.set(key, { data: result, timestamp: Date.now() })
      setData(result)
      setError(null)
      return result
    } catch (err) {
      setError(err.message)
      console.error(`Cache error for ${key}:`, err)
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}

// ============================================
// 1. useStudentGroups Hook
// ============================================

/**
 * useStudentGroups Hook
 * Manage student groups with full CRUD operations
 * @returns {Object}
 */
export function useStudentGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastError, setLastError] = useState(null)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      const data = await StudentGroupsService.getAllGroups()
      setGroups(data)
      setError(null)
    } catch (err) {
      const message = err.message || 'Failed to load groups'
      setError(message)
      setLastError(err)
      console.error('Error loading groups:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createGroup = useCallback(
    async (name, description = '') => {
      try {
        const newGroup = await StudentGroupsService.createGroup(
          name,
          description
        )
        setGroups((prev) => [newGroup, ...prev])
        return newGroup
      } catch (err) {
        const message = err.message || 'Failed to create group'
        setError(message)
        setLastError(err)
        throw err
      }
    },
    []
  )

  const deleteGroup = useCallback(async (groupId) => {
    try {
      await StudentGroupsService.deleteGroup(groupId)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch (err) {
      const message = err.message || 'Failed to delete group'
      setError(message)
      setLastError(err)
      throw err
    }
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  return {
    groups,
    loading,
    error,
    lastError,
    createGroup,
    deleteGroup,
    loadGroups
  }
}

// ============================================
// 2. useStudentAlerts Hook
// ============================================

/**
 * useStudentAlerts Hook
 * Manage student alerts with filtering
 * @param {string} userId - User ID
 * @returns {Object}
 */
export function useStudentAlerts(userId) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'critical'

  const loadAlerts = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const unreadOnly = filter === 'unread'
      const data = await StudentAlertsService.getUserAlerts(userId, unreadOnly)

      if (filter === 'critical') {
        setAlerts(data.filter((a) => a.severity === 'critical'))
      } else {
        setAlerts(data)
      }

      setUnreadCount(data.filter((a) => !a.is_read).length)
      setError(null)
    } catch (err) {
      const message = err.message || 'Failed to load alerts'
      setError(message)
      console.error('Error loading alerts:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, filter])

  const markAsRead = useCallback(
    async (alertId) => {
      try {
        await StudentAlertsService.markAlertAsRead(alertId)
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        const message = err.message || 'Failed to mark alert as read'
        setError(message)
        throw err
      }
    },
    []
  )

  const deleteAlert = useCallback(async (alertId) => {
    try {
      await StudentAlertsService.deleteAlert(alertId)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    } catch (err) {
      const message = err.message || 'Failed to delete alert'
      setError(message)
      throw err
    }
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  return {
    alerts,
    loading,
    error,
    unreadCount,
    filter,
    setFilter,
    markAsRead,
    deleteAlert,
    loadAlerts
  }
}

// ============================================
// 3. useInternshipPipeline Hook
// ============================================

/**
 * useInternshipPipeline Hook
 * Manage internship offers
 * @returns {Object}
 */
export function useInternshipPipeline() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const loadOffers = useCallback(async () => {
    setLoading(true)
    try {
      const status = filter === 'all' ? null : filter
      const data = await InternshipService.getAllInternshipOffers(status)
      setOffers(data)
      setError(null)
    } catch (err) {
      const message = err.message || 'Failed to load offers'
      setError(message)
      console.error('Error loading offers:', err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  const createOffer = useCallback(async (offerData) => {
    try {
      const newOffer = await InternshipService.createInternshipOffer(offerData)
      setOffers((prev) => [newOffer, ...prev])
      return newOffer
    } catch (err) {
      const message = err.message || 'Failed to create offer'
      setError(message)
      throw err
    }
  }, [])

  useEffect(() => {
    loadOffers()
  }, [loadOffers])

  return {
    offers,
    loading,
    error,
    filter,
    setFilter,
    createOffer,
    loadOffers
  }
}

// ============================================
// 4. useCompetencies Hook
// ============================================

/**
 * useCompetencies Hook
 * Manage competencies with caching
 * @param {string} category - Filter by category
 * @returns {Object}
 */
export function useCompetencies(category = null) {
  const [competencies, setCompetencies] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadCompetencies = useCallback(async () => {
    setLoading(true)
    try {
      let data
      if (category) {
        data = await CompetenciesService.getCompetenciesByCategory(category)
      } else {
        data = await CompetenciesService.getAllCompetencies()

        // Extract unique categories
        const uniqueCategories = [...new Set(data.map((c) => c.category))]
        setCategories(uniqueCategories)
      }

      setCompetencies(data)
      setError(null)
    } catch (err) {
      const message = err.message || 'Failed to load competencies'
      setError(message)
      console.error('Error loading competencies:', err)
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    loadCompetencies()
  }, [loadCompetencies])

  return {
    competencies,
    categories,
    loading,
    error,
    loadCompetencies
  }
}

// ============================================
// 5. useProfessorDashboard Hook
// ============================================

/**
 * useProfessorDashboard Hook
 * Manage professor dashboard
 * @param {string} professorId - Professor ID
 * @returns {Object}
 */
export function useProfessorDashboard(professorId) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadDashboard = useCallback(async () => {
    if (!professorId) return

    setLoading(true)
    try {
      const data = await ProfessorDashboardService.getProfessorDashboard(
        professorId
      )
      setDashboard(data)
      setError(null)
    } catch (err) {
      const message = err.message || 'Failed to load dashboard'
      setError(message)
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [professorId])

  const updateSettings = useCallback(
    async (preferences) => {
      if (!dashboard) {
        throw new Error('Dashboard not loaded')
      }

      try {
        const updated = await ProfessorDashboardService.updateDashboardPreferences(
          dashboard.id,
          preferences
        )
        setDashboard(updated)
        return updated
      } catch (err) {
        const message = err.message || 'Failed to update dashboard'
        setError(message)
        throw err
      }
    },
    [dashboard]
  )

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return {
    dashboard,
    loading,
    error,
    updateSettings,
    loadDashboard
  }
}

// ============================================
// EXPORTS
// ============================================

export const hooks18Relations = {
  useStudentGroups,
  useStudentAlerts,
  useInternshipPipeline,
  useCompetencies,
  useProfessorDashboard,
  useAsync,
  useCache
}

export default hooks18Relations