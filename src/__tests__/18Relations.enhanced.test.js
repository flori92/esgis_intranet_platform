/**
 * Tests des services et hooks 18Relations v2 Enhanced
 * TDD approach: Tests complètes avec couverture 80%+
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  StudentGroupsService,
  StudentAlertsService,
  InternshipService,
  CompetenciesService,
  ProfessorDashboardService,
  isValidUUID,
  validateRequired
} from '../services/18Relations.enhanced.js'

// ================================================
// VALIDATION UTILITIES TESTS
// ================================================

describe('Input Validation Utilities', () => {
  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000'
      ]
      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true)
      })
    })

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-44665544000',
        '550e8400-e29b-41d4-a716-4466554400001',
        ''
      ]
      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false)
      })
    })
  })

  describe('validateRequired', () => {
    it('should pass when all required fields are present', () => {
      const data = { name: 'Test', email: 'test@example.com' }
      expect(() => validateRequired(data, ['name', 'email'])).not.toThrow()
    })

    it('should throw error when required field is missing', () => {
      const data = { name: 'Test' }
      expect(() => validateRequired(data, ['name', 'email'])).toThrow('email is required')
    })

    it('should throw error when required field is empty', () => {
      const data = { name: '', email: 'test@example.com' }
      expect(() => validateRequired(data, ['name'])).toThrow('name is required')
    })

    it('should throw error when required field is null', () => {
      const data = { name: null, email: 'test@example.com' }
      expect(() => validateRequired(data, ['name'])).toThrow('name is required')
    })
  })
})

// ================================================
// STUDENT GROUPS SERVICE TESTS
// ================================================

describe('StudentGroupsService', () => {
  describe('createGroup', () => {
    it('should validate required fields before creation', async () => {
      const invalidData = { name: '', course_id: '123' }
      try {
        await StudentGroupsService.createGroup(invalidData)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.message).toContain('required')
      }
    })

    it('should validate professor_id UUID format', async () => {
      const invalidData = {
        name: 'Group 1',
        course_id: 'valid-uuid',
        professor_id: 'invalid-uuid'
      }
      try {
        await StudentGroupsService.createGroup(invalidData)
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })

  describe('getGroupsByProfessor', () => {
    it('should validate professor ID format', async () => {
      try {
        await StudentGroupsService.getGroupsByProfessor('invalid-uuid')
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })

  describe('addStudentToGroup', () => {
    it('should validate both student and group IDs', async () => {
      try {
        await StudentGroupsService.addStudentToGroup('invalid', 'also-invalid')
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })
})

// ================================================
// STUDENT ALERTS SERVICE TESTS
// ================================================

describe('StudentAlertsService', () => {
  describe('createAlert', () => {
    it('should require all mandatory fields', async () => {
      const incompleteAlert = {
        student_id: '550e8400-e29b-41d4-a716-446655440000',
        // missing: alert_type, message, severity
      }
      try {
        await StudentAlertsService.createAlert(incompleteAlert)
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('required')
      }
    })

    it('should validate student_id format', async () => {
      const invalidAlert = {
        student_id: 'not-a-uuid',
        alert_type: 'attendance',
        message: 'Low attendance',
        severity: 'high'
      }
      try {
        await StudentAlertsService.createAlert(invalidAlert)
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })

  describe('resolveAlert', () => {
    it('should validate alert_id UUID format', async () => {
      try {
        await StudentAlertsService.resolveAlert('invalid-uuid')
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })
})

// ================================================
// INTERNSHIP SERVICE TESTS
// ================================================

describe('InternshipService', () => {
  describe('createOffer', () => {
    it('should require all mandatory offer fields', async () => {
      const incompletOffer = {
        title: 'Summer Internship',
        // missing: company_id, description, duration_weeks
      }
      try {
        await InternshipService.createOffer(incompletOffer)
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('required')
      }
    })

    it('should validate company_id UUID format', async () => {
      const invalidOffer = {
        title: 'Summer Internship',
        company_id: 'invalid',
        description: 'Learn real-world skills',
        duration_weeks: 12
      }
      try {
        await InternshipService.createOffer(invalidOffer)
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })

  describe('applyForInternship', () => {
    it('should validate both offer and student IDs', async () => {
      try {
        await InternshipService.applyForInternship('invalid1', 'invalid2', {})
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })
})

// ================================================
// COMPETENCIES SERVICE TESTS
// ================================================

describe('CompetenciesService', () => {
  describe('addCompetency', () => {
    it('should require all mandatory fields', async () => {
      const incomplete = {
        student_id: '550e8400-e29b-41d4-a716-446655440000'
        // missing: name, category, level
      }
      try {
        await CompetenciesService.addCompetency(incomplete)
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('required')
      }
    })

    it('should validate student_id UUID', async () => {
      try {
        await CompetenciesService.addCompetency({
          student_id: 'invalid',
          name: 'JavaScript',
          category: 'programming',
          level: 'intermediate'
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })

  describe('getCompetenciesByStudent', () => {
    it('should validate student_id UUID format', async () => {
      try {
        await CompetenciesService.getCompetenciesByStudent('not-uuid')
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })
})

// ================================================
// PROFESSOR DASHBOARD SERVICE TESTS
// ================================================

describe('ProfessorDashboardService', () => {
  describe('getClassStats', () => {
    it('should validate class_id UUID format', async () => {
      try {
        await ProfessorDashboardService.getClassStats('invalid-uuid')
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })

  describe('getDashboardSettings', () => {
    it('should validate professor_id UUID format', async () => {
      try {
        await ProfessorDashboardService.getDashboardSettings('invalid')
        expect(true).toBe(false)
      } catch (error) {
        expect(error.message).toContain('UUID')
      }
    })
  })
})

// ================================================
// EDGE CASES & SECURITY TESTS
// ================================================

describe('Security & Edge Cases', () => {
  it('should not accept UUID with extra characters', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000x')).toBe(false)
  })

  it('should not accept UUID with spaces', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000 ')).toBe(false)
  })

  it('should handle special characters in text fields gracefully', () => {
    const data = {
      name: `'; DROP TABLE groups; --`,
      email: `test@example.com<script>alert('xss')</script>`
    }
    expect(() => validateRequired(data, ['name', 'email'])).not.toThrow()
  })

  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000)
    const data = { description: longString }
    expect(() => validateRequired(data, ['description'])).not.toThrow()
  })

  it('should handle undefined fields in validation', () => {
    const data = { field1: undefined }
    expect(() => validateRequired(data, ['field1'])).toThrow()
  })
})
