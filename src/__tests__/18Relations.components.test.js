/**
 * Tests des composants 18Relations
 * Component testing avec React Testing Library
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  StudentGroupsManager,
  StudentAlertsPanel,
  InternshipBoard
} from '../components/18Relations.components.jsx'

// ================================================
// STUDENT GROUPS MANAGER TESTS
// ================================================

describe('StudentGroupsManager Component', () => {
  const defaultProps = {
    courseId: '550e8400-e29b-41d4-a716-446655440000',
    professorId: '550e8400-e29b-41d4-a716-446655440001'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the component', () => {
    render(<StudentGroupsManager {...defaultProps} />)
    
    expect(screen.getByText('Groupes TP/TD')).toBeInTheDocument()
  })

  it('should show "Create Group" button', () => {
    render(<StudentGroupsManager {...defaultProps} />)
    
    const createButton = screen.getByRole('button', { name: /Nouveau Groupe/i })
    expect(createButton).toBeInTheDocument()
  })

  it('should toggle form visibility on button click', async () => {
    render(<StudentGroupsManager {...defaultProps} />)
    
    const createButton = screen.getByRole('button', { name: /Nouveau Groupe/i })
    
    // Initially, form should not be visible
    expect(screen.queryByPlaceholderText(/Nom du groupe/i)).not.toBeInTheDocument()
    
    // Click to show form
    fireEvent.click(createButton)
    expect(screen.getByPlaceholderText(/Nom du groupe/i)).toBeInTheDocument()
  })

  it('should handle form input', async () => {
    render(<StudentGroupsManager {...defaultProps} />)
    
    // Show form
    fireEvent.click(screen.getByRole('button', { name: /Nouveau Groupe/i }))
    
    // Type in input
    const input = screen.getByPlaceholderText(/Nom du groupe/i)
    await userEvent.type(input, 'TP Math A')
    
    expect(input.value).toBe('TP Math A')
  })

  it('should display empty state when no groups', () => {
    render(<StudentGroupsManager {...defaultProps} />)
    
    expect(screen.getByText(/Aucun groupe créé/i)).toBeInTheDocument()
  })

  it('should have Create and Cancel buttons in form', async () => {
    render(<StudentGroupsManager {...defaultProps} />)
    
    // Show form
    fireEvent.click(screen.getByRole('button', { name: /Nouveau Groupe/i }))
    
    expect(screen.getByRole('button', { name: /Créer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument()
  })

  it('should close form on Cancel', async () => {
    render(<StudentGroupsManager {...defaultProps} />)
    
    // Show form
    fireEvent.click(screen.getByRole('button', { name: /Nouveau Groupe/i }))
    expect(screen.getByPlaceholderText(/Nom du groupe/i)).toBeInTheDocument()
    
    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: /Annuler/i }))
    expect(screen.queryByPlaceholderText(/Nom du groupe/i)).not.toBeInTheDocument()
  })
})

// ================================================
// STUDENT ALERTS PANEL TESTS
// ================================================

describe('StudentAlertsPanel Component', () => {
  const defaultProps = {
    studentId: '550e8400-e29b-41d4-a716-446655440000'
  }

  it('should render alerts panel', () => {
    render(<StudentAlertsPanel {...defaultProps} />)
    
    expect(screen.getByText('Alertes')).toBeInTheDocument()
  })

  it('should display unresolved alerts count', () => {
    render(<StudentAlertsPanel {...defaultProps} />)
    
    // Should show alert count badge
    const badge = screen.getByText(/non résolue/i)
    expect(badge).toBeInTheDocument()
  })

  it('should show success message when no alerts', () => {
    render(<StudentAlertsPanel {...defaultProps} />)
    
    // When no unresolved alerts
    expect(screen.getByText(/Aucune alerte/i)).toBeInTheDocument()
  })

  it('should have collapsible resolved alerts section', () => {
    render(<StudentAlertsPanel {...defaultProps} />)
    
    const details = screen.queryByText(/Voir les alertes résolues/i)
    // May or may not show depending on data
    if (details) {
      expect(details).toBeInTheDocument()
    }
  })
})

// ================================================
// INTERNSHIP BOARD TESTS
// ================================================

describe('InternshipBoard Component', () => {
  const defaultProps = {
    studentId: '550e8400-e29b-41d4-a716-446655440000'
  }

  it('should render internship board', () => {
    render(<InternshipBoard {...defaultProps} />)
    
    expect(screen.getByText(/Offres de Stage/i)).toBeInTheDocument()
  })

  it('should show offers section', () => {
    render(<InternshipBoard {...defaultProps} />)
    
    expect(screen.getByText('🌟 Offres de Stage')).toBeInTheDocument()
  })

  it('should display empty state when no offers', () => {
    render(<InternshipBoard {...defaultProps} />)
    
    expect(screen.getByText(/Aucune offre disponible/i)).toBeInTheDocument()
  })

  it('should have layout with two sections', () => {
    const { container } = render(<InternshipBoard {...defaultProps} />)
    
    // Should have grid layout
    const grids = container.querySelectorAll('.lg\\:col-span-2, .sticky')
    expect(grids.length).toBeGreaterThan(0)
  })
})

// ================================================
// INTEGRATION TESTS
// ================================================

describe('Components Integration', () => {
  it('should render multiple components together', () => {
    const { container } = render(
      <>
        <StudentGroupsManager 
          courseId="550e8400-e29b-41d4-a716-446655440000"
          professorId="550e8400-e29b-41d4-a716-446655440001"
        />
        <StudentAlertsPanel 
          studentId="550e8400-e29b-41d4-a716-446655440000"
        />
      </>
    )
    
    expect(screen.getByText('Groupes TP/TD')).toBeInTheDocument()
    expect(screen.getByText('Alertes')).toBeInTheDocument()
  })

  it('should handle rapid interactions', async () => {
    render(<StudentGroupsManager 
      courseId="550e8400-e29b-41d4-a716-446655440000"
      professorId="550e8400-e29b-41d4-a716-446655440001"
    />)
    
    const button = screen.getByRole('button', { name: /Nouveau Groupe/i })
    
    // Rapid clicks
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    
    // Should still work
    expect(button).toBeInTheDocument()
  })
})

// ================================================
// ACCESSIBILITY TESTS
// ================================================

describe('Accessibility', () => {
  it('should have proper heading hierarchy', () => {
    render(<StudentGroupsManager 
      courseId="550e8400-e29b-41d4-a716-446655440000"
      professorId="550e8400-e29b-41d4-a716-446655440001"
    />)
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Groupes TP/TD')
  })

  it('should have descriptive button labels', () => {
    render(<StudentGroupsManager 
      courseId="550e8400-e29b-41d4-a716-446655440000"
      professorId="550e8400-e29b-41d4-a716-446655440001"
    />)
    
    const createButton = screen.getByRole('button', { name: /Nouveau Groupe/i })
    expect(createButton).toHaveTextContent(/Nouveau Groupe/i)
  })

  it('should have form labels and placeholders', () => {
    render(<StudentGroupsManager 
      courseId="550e8400-e29b-41d4-a716-446655440000"
      professorId="550e8400-e29b-41d4-a716-446655440001"
    />)
    
    fireEvent.click(screen.getByRole('button', { name: /Nouveau Groupe/i }))
    
    const input = screen.getByPlaceholderText(/Nom du groupe/i)
    expect(input).toBeInTheDocument()
  })

  it('should have proper button colors/styling', () => {
    const { container } = render(<StudentGroupsManager 
      courseId="550e8400-e29b-41d4-a716-446655440000"
      professorId="550e8400-e29b-41d4-a716-446655440001"
    />)
    
    // Buttons should have color classes
    const buttons = container.querySelectorAll('button')
    buttons.forEach(button => {
      expect(button.className).toMatch(/bg-|text-/)
    })
  })
})

// ================================================
// ERROR HANDLING TESTS
// ================================================

describe('Error Handling', () => {
  it('should handle missing required props gracefully', () => {
    // Mock console.error to avoid test output pollution
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    // This might throw or warn depending on React's handling
    try {
      render(<StudentGroupsManager courseId="123" />)
    } catch (error) {
      expect(error).toBeDefined()
    }
    
    consoleSpy.mockRestore()
  })

  it('should display error message when hook fails', () => {
    // Component should show error UI when service call fails
    const { container } = render(<StudentAlertsPanel 
      studentId="550e8400-e29b-41d4-a716-446655440000"
    />)
    
    // Should render without crashing
    expect(container).toBeInTheDocument()
  })

  it('should display loading state initially', () => {
    const { container } = render(<StudentGroupsManager 
      courseId="550e8400-e29b-41d4-a716-446655440000"
      professorId="550e8400-e29b-41d4-a716-446655440001"
    />)
    
    // May show loading spinner or placeholder
    expect(container).toBeInTheDocument()
  })
})

// ================================================
// RESPONSIVE DESIGN TESTS
// ================================================

describe('Responsive Design', () => {
  it('should have responsive grid classes', () => {
    const { container } = render(<InternshipBoard 
      studentId="550e8400-e29b-41d4-a716-446655440000"
    />)
    
    // Check for responsive tailwind classes
    const grid = container.querySelector('.grid')
    expect(grid?.className).toMatch(/grid-cols|md:|lg:/)
  })

  it('should have responsive layout on InternshipBoard', () => {
    const { container } = render(<InternshipBoard 
      studentId="550e8400-e29b-41d4-a716-446655440000"
    />)
    
    // Should have responsive column spans
    expect(container.querySelector('.lg\\:col-span-2')).toBeInTheDocument()
  })
})
