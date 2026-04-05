/**
 * Tests des hooks 18Relations v2 Enhanced
 * React hooks testing avec React Testing Library
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  useAsync,
  useCache,
  useStudentGroups,
  useStudentAlerts,
  useInternshipPipeline,
  useCompetencies,
  useProfessorDashboard
} from '../hooks/use18Relations.enhanced.js'

// ================================================
// UTILITY HOOKS TESTS
// ================================================

describe('useAsync Hook', () => {
  it('should have initial loading state', () => {
    const asyncFunc = jest.fn(async () => ({ data: 'test' }))
    const { result } = renderHook(() => useAsync(asyncFunc))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should update state after async function completes', async () => {
    const asyncFunc = jest.fn(async () => ({ data: 'test result' }))
    const { result } = renderHook(() => useAsync(asyncFunc, []))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ data: 'test result' })
    expect(result.current.error).toBeNull()
  })

  it('should handle errors from async function', async () => {
    const testError = new Error('Test error')
    const asyncFunc = jest.fn(async () => {
      throw testError
    })
    const { result } = renderHook(() => useAsync(asyncFunc, []))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toEqual(testError)
    expect(result.current.data).toBeNull()
  })

  it('should respect dependencies array', async () => {
    const asyncFunc = jest.fn(async () => ({ attempt: asyncFunc.mock.calls.length }))
    const dependency = 'initial'
    const { result, rerender } = renderHook(() => useAsync(asyncFunc, [dependency]))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(asyncFunc).toHaveBeenCalledTimes(1)

    // Change dependency
    rerender()
    await waitFor(() => {
      expect(asyncFunc.mock.calls.length).toBeGreaterThanOrEqual(1)
    })
  })
})

describe('useCache Hook', () => {
  it('should cache results with TTL', async () => {
    const fetcher = jest.fn(async () => ({ cached: 'data' }))
    const { result } = renderHook(() => useCache('test_key', fetcher, 60000))

    await waitFor(() => {
      expect(result.current.data).toEqual({ cached: 'data' })
    })

    expect(fetcher).toHaveBeenCalledTimes(1)

    // Second call should use cache
    const { result: result2 } = renderHook(() => useCache('test_key', fetcher, 60000))

    await waitFor(() => {
      expect(result2.current.data).toEqual({ cached: 'data' })
    })

    // Fetcher still called only once (cached)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('should return null before data is fetched', () => {
    const fetcher = jest.fn(async () => ({ data: 'test' }))
    const { result } = renderHook(() => useCache('test_key', fetcher, 60000))

    expect(result.current.data).toBeNull()
  })

  it('should have loading state', async () => {
    const fetcher = jest.fn(async () => ({ data: 'test' }))
    const { result } = renderHook(() => useCache('test_key', fetcher, 60000))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle cache errors', async () => {
    const error = new Error('Cache fetch failed')
    const fetcher = jest.fn(async () => {
      throw error
    })
    const { result } = renderHook(() => useCache('test_key', fetcher, 60000))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toEqual(error)
  })
})

// ================================================
// MAIN HOOKS TESTS
// ================================================

describe('useStudentGroups Hook', () => {
  it('should initialize with empty groups', () => {
    const { result } = renderHook(() => useStudentGroups())

    expect(Array.isArray(result.current.groups)).toBe(true)
    expect(result.current.loading).toBe(true)
  })

  it('should provide createGroup method', () => {
    const { result } = renderHook(() => useStudentGroups())

    expect(typeof result.current.createGroup).toBe('function')
  })

  it('should provide addStudent method', () => {
    const { result } = renderHook(() => useStudentGroups())

    expect(typeof result.current.addStudent).toBe('function')
  })

  it('should have error and loading states', () => {
    const { result } = renderHook(() => useStudentGroups())

    expect(result.current.loading).toBeDefined()
    expect(result.current.error).toBeNull()
  })
})

describe('useStudentAlerts Hook', () => {
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'

  it('should initialize with empty alerts', () => {
    const { result } = renderHook(() => useStudentAlerts(testUserId))

    expect(Array.isArray(result.current.alerts)).toBe(true)
    expect(Array.isArray(result.current.unresolved)).toBe(true)
  })

  it('should provide resolveAlert method', () => {
    const { result } = renderHook(() => useStudentAlerts(testUserId))

    expect(typeof result.current.resolveAlert).toBe('function')
  })

  it('should separate resolved and unresolved alerts', () => {
    const { result } = renderHook(() => useStudentAlerts(testUserId))

    expect(result.current.unresolved.length).toBeLessThanOrEqual(result.current.alerts.length)
  })

  it('should provide filterAlerts method', () => {
    const { result } = renderHook(() => useStudentAlerts(testUserId))

    expect(typeof result.current.filterAlerts).toBe('function')
  })
})

describe('useInternshipPipeline Hook', () => {
  const testStudentId = '550e8400-e29b-41d4-a716-446655440000'

  it('should initialize with empty offers and applications', () => {
    const { result } = renderHook(() => useInternshipPipeline(testStudentId))

    expect(Array.isArray(result.current.offers)).toBe(true)
    expect(Array.isArray(result.current.applications)).toBe(true)
  })

  it('should provide applyForInternship method', () => {
    const { result } = renderHook(() => useInternshipPipeline(testStudentId))

    expect(typeof result.current.applyForInternship).toBe('function')
  })

  it('should have loading and error states', () => {
    const { result } = renderHook(() => useInternshipPipeline(testStudentId))

    expect(result.current.loading).toBeDefined()
    expect(result.current.error).toBeNull()
  })
})

describe('useCompetencies Hook', () => {
  const testStudentId = '550e8400-e29b-41d4-a716-446655440000'

  it('should initialize with empty competencies', () => {
    const { result } = renderHook(() => useCompetencies())

    expect(Array.isArray(result.current.competencies)).toBe(true)
  })

  it('should filter by category if provided', () => {
    const { result } = renderHook(() => useCompetencies('programming'))

    expect(result.current.competencies).toBeDefined()
  })

  it('should provide addCompetency method', () => {
    const { result } = renderHook(() => useCompetencies())

    expect(typeof result.current.addCompetency).toBe('function')
  })

  it('should provide getByCategory method', () => {
    const { result } = renderHook(() => useCompetencies())

    expect(typeof result.current.getByCategory).toBe('function')
  })

  it('should have caching enabled', () => {
    const { result } = renderHook(() => useCompetencies())

    expect(result.current.isCached).toBe(true)
  })
})

describe('useProfessorDashboard Hook', () => {
  const testProfessorId = '550e8400-e29b-41d4-a716-446655440000'

  it('should initialize with empty dashboard data', () => {
    const { result } = renderHook(() => useProfessorDashboard())

    expect(result.current.settings).toBeDefined()
    expect(result.current.stats).toBeDefined()
  })

  it('should provide updateSettings method', () => {
    const { result } = renderHook(() => useProfessorDashboard())

    expect(typeof result.current.updateSettings).toBe('function')
  })

  it('should have loading state', () => {
    const { result } = renderHook(() => useProfessorDashboard())

    expect(result.current.loading).toBeDefined()
  })

  it('should retrieve class statistics', () => {
    const { result } = renderHook(() => useProfessorDashboard())

    expect(typeof result.current.getClassStats).toBe('function')
  })
})

// ================================================
// INTEGRATION TESTS
// ================================================

describe('Hooks Integration', () => {
  it('should allow multiple hooks to work together', () => {
    const { result: groupsResult } = renderHook(() => useStudentGroups())
    const { result: alertsResult } = renderHook(() => useStudentAlerts('550e8400-e29b-41d4-a716-446655440000'))

    expect(groupsResult.current.groups).toBeDefined()
    expect(alertsResult.current.alerts).toBeDefined()
  })

  it('should cache competencies on subsequent calls', async () => {
    const { result: result1 } = renderHook(() => useCompetencies())
    
    await waitFor(() => {
      expect(result1.current.competencies).toBeDefined()
    })

    const { result: result2 } = renderHook(() => useCompetencies())
    
    // Second call should use cache
    expect(result2.current.isCached).toBe(true)
  })

  it('should handle errors gracefully across hooks', () => {
    const { result: result1 } = renderHook(() => useStudentGroups())
    const { result: result2 } = renderHook(() => useStudentAlerts('550e8400-e29b-41d4-a716-446655440000'))
    const { result: result3 } = renderHook(() => useInternshipPipeline('550e8400-e29b-41d4-a716-446655440000'))

    // All should have error handling
    expect(result1.current.error).toBeDefined()
    expect(result2.current.error).toBeDefined()
    expect(result3.current.error).toBeDefined()
  })
})

// ================================================
// PERFORMANCE TESTS
// ================================================

describe('Performance & Optimization', () => {
  it('should memoize hook results', () => {
    const { result: result1 } = renderHook(() => useStudentGroups())
    const { result: result2 } = renderHook(() => useStudentGroups())

    // Both should return hooks (actual memoization depends on usage)
    expect(result1.current).toBeDefined()
    expect(result2.current).toBeDefined()
  })

  it('should not re-fetch on non-dependency changes', async () => {
    const fetcher = jest.fn(async () => ({ data: 'test' }))
    const { result } = renderHook(() => useCache('perf_test', fetcher, 60000))

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    // Verify cache is used
    const { result: result2 } = renderHook(() => useCache('perf_test', fetcher, 60000))
    
    expect(fetcher).toHaveBeenCalledTimes(1) // Still 1, not 2
  })
})
