// ==========================================
// REACT HOOKS: Les 18 Nouvelles Relations
// Utilisability dans les composants React
// ==========================================

import { useState, useEffect, useCallback } from 'react'
import {
  StudentGroupsService,
  StudentAlertsService,
  InternshipService,
  ProfessorDashboardService,
  CompetenciesService,
  PrerequisitesService,
  LearningPathsService,
  ResourcesService,
  ExamSessionsService,
  PlagiarismService,
  JobBoardService,
  AnalyticsService,
  AnnouncementsService,
  PeerFeedbackService,
  PartnershipsService
} from './18Relations.service'

// ==========================================
// 1. useStudentGroups - Manage student groups and memberships
// ==========================================
export function useStudentGroups(courseId) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      const data = await StudentGroupsService.getGroupsByClass(courseId)
      setGroups(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  const createGroup = useCallback(
    async (groupData) => {
      try {
        setLoading(true)
        const newGroup = await StudentGroupsService.createGroup(groupData)
        setGroups([...groups, ...newGroup])
        return newGroup
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [groups]
  )

  const addStudent = useCallback(async (groupId, studentId) => {
    try {
      await StudentGroupsService.addStudentToGroup(groupId, studentId)
      return true
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  useEffect(() => {
    if (courseId) fetchGroups()
  }, [courseId, fetchGroups])

  return { groups, loading, error, createGroup, addStudent, refetch: fetchGroups }
}

// ==========================================
// 2. useStudentAlerts - Early warning system
// ==========================================
export function useStudentAlerts(studentId) {
  const [alerts, setAlerts] = useState([])
  const [unresolved, setUnresolved] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const [allAlerts, unresolvedAlerts] = await Promise.all([
        StudentAlertsService.getStudentAlerts(studentId),
        StudentAlertsService.getUnresolvedAlerts(studentId)
      ])
      setAlerts(allAlerts)
      setUnresolved(unresolvedAlerts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  const resolveAlert = useCallback(async (alertId) => {
    try {
      await StudentAlertsService.resolveAlert(alertId)
      setUnresolved(unresolved.filter(a => a.id !== alertId))
      return true
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [unresolved])

  useEffect(() => {
    if (studentId) fetchAlerts()
  }, [studentId, fetchAlerts])

  return { alerts, unresolved, loading, error, resolveAlert, refetch: fetchAlerts }
}

// ==========================================
// 3. useInternshipPipeline - Manage internships
// ==========================================
export function useInternshipPipeline(studentId) {
  const [offers, setOffers] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await InternshipService.getActiveOffers()
      setOffers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchApplications = useCallback(async () => {
    try {
      const data = await InternshipService.getApplications(studentId)
      setApplications(data)
    } catch (err) {
      setError(err.message)
    }
  }, [studentId])

  const applyForInternship = useCallback(
    async (offerId, applicationData) => {
      try {
        const result = await InternshipService.applyForInternship({
          offer_id: offerId,
          student_id: studentId,
          ...applicationData
        })
        setApplications([...applications, ...result])
        return result
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [studentId, applications]
  )

  useEffect(() => {
    fetchOffers()
    if (studentId) fetchApplications()
  }, [studentId, fetchOffers, fetchApplications])

  return {
    offers,
    applications,
    loading,
    error,
    applyForInternship,
    refetch: () => {
      fetchOffers()
      fetchApplications()
    }
  }
}

// ==========================================
// 4. useProfessorDashboard - Dashboard metrics
// ==========================================
export function useProfessorDashboard(courseId, professorId) {
  const [metrics, setMetrics] = useState(null)
  const [atRiskStudents, setAtRiskStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const classMetrics = await ProfessorDashboardService.getClassMetrics(courseId)
      const risks = await ProfessorDashboardService.getAtRiskStudents(courseId)
      setMetrics(classMetrics)
      setAtRiskStudents(risks)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (courseId) fetchDashboard()
  }, [courseId, fetchDashboard])

  return { metrics, atRiskStudents, loading, error, refetch: fetchDashboard }
}

// ==========================================
// 5. useCompetencies - Track competencies
// ==========================================
export function useCompetencies(studentId, courseId) {
  const [competencies, setCompetencies] = useState([])
  const [courseCompetencies, setCourseCompetencies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCompetencies = useCallback(async () => {
    try {
      setLoading(true)
      const [allComps, courseComps] = await Promise.all([
        studentId ? CompetenciesService.getStudentCompetencies(studentId) : [],
        courseId ? CompetenciesService.getCourseCompetencies(courseId) : []
      ])
      setCompetencies(allComps)
      setCourseCompetencies(courseComps)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [studentId, courseId])

  const assignCompetency = useCallback(
    async (competencyId, level = 'beginner') => {
      try {
        const result = await CompetenciesService.assignCompetency(
          studentId,
          competencyId,
          level
        )
        setCompetencies([...competencies, ...result])
        return result
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [studentId, competencies]
  )

  useEffect(() => {
    fetchCompetencies()
  }, [fetchCompetencies])

  return {
    competencies,
    courseCompetencies,
    loading,
    error,
    assignCompetency,
    refetch: fetchCompetencies
  }
}

// ==========================================
// 6. useLearningPath - Track learning progress
// ==========================================
export function useLearningPath(studentId, courseId) {
  const [path, setPath] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPath = useCallback(async () => {
    try {
      setLoading(true)
      const pathData = await LearningPathsService.getCoursePath(courseId)
      const progressData = await LearningPathsService.trackProgress(studentId, courseId)
      setPath(pathData)
      setProgress(progressData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [studentId, courseId])

  const updateProgress = useCallback(
    async (completion) => {
      try {
        const result = await LearningPathsService.updateProgress(
          studentId,
          courseId,
          completion
        )
        setProgress(result)
        return result
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [studentId, courseId]
  )

  useEffect(() => {
    if (studentId && courseId) fetchPath()
  }, [studentId, courseId, fetchPath])

  return { path, progress, loading, error, updateProgress, refetch: fetchPath }
}

// ==========================================
// 7. useAnalytics - Get performance analytics
// ==========================================
export function useAnalytics(studentId, courseId) {
  const [studentMetrics, setStudentMetrics] = useState(null)
  const [classMetrics, setClassMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const [student, classs] = await Promise.all([
        studentId ? AnalyticsService.getStudentPerformance(studentId) : null,
        courseId ? AnalyticsService.getClassAnalytics(courseId) : null
      ])
      setStudentMetrics(student)
      setClassMetrics(classs)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [studentId, courseId])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return { studentMetrics, classMetrics, loading, error, refetch: fetchAnalytics }
}

// ==========================================
// 8. useAnnouncements - Get relevant announcements
// ==========================================
export function useAnnouncements(userId, userType) {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const data = await AnnouncementsService.getRelevantAnnouncements(userId, userType)
      setAnnouncements(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, userType])

  useEffect(() => {
    if (userId) fetchAnnouncements()
  }, [userId, fetchAnnouncements])

  return { announcements, loading, error, refetch: fetchAnnouncements }
}

// ==========================================
// 9. useJobBoard - Browse and apply for jobs
// ==========================================
export function useJobBoard(studentId) {
  const [activeJobs, setActiveJobs] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const [jobs, apps] = await Promise.all([
        JobBoardService.getActiveJobs(),
        studentId ? JobBoardService.getStudentApplications(studentId) : []
      ])
      setActiveJobs(jobs)
      setMyApplications(apps)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  const applyForJob = useCallback(
    async (jobId, applicationData) => {
      try {
        const result = await JobBoardService.applyForJob({
          job_id: jobId,
          student_id: studentId,
          ...applicationData
        })
        setMyApplications([...myApplications, ...result])
        return result
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [studentId, myApplications]
  )

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    activeJobs,
    myApplications,
    loading,
    error,
    applyForJob,
    refetch: fetchJobs
  }
}

// ==========================================
// 10. usePeerFeedback - Collect peer feedback
// ==========================================
export function usePeerFeedback(studentId) {
  const [feedback, setFeedback] = useState([])
  const [reviews360, setReviews360] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true)
      const data = await PeerFeedbackService.getStudentFeedback(studentId)
      setFeedback(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  const submitFeedback = useCallback(
    async (feedbackData) => {
      try {
        const result = await PeerFeedbackService.submitFeedback(feedbackData)
        setFeedback([...feedback, ...result])
        return result
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [feedback]
  )

  const submit360Review = useCallback(
    async (reviewData) => {
      try {
        const result = await PeerFeedbackService.submit360Review(reviewData)
        setReviews360([...reviews360, ...result])
        return result
      } catch (err) {
        setError(err.message)
        throw err
      }
    },
    [reviews360]
  )

  useEffect(() => {
    if (studentId) fetchFeedback()
  }, [studentId, fetchFeedback])

  return {
    feedback,
    reviews360,
    loading,
    error,
    submitFeedback,
    submit360Review,
    refetch: fetchFeedback
  }
}

export default {
  useStudentGroups,
  useStudentAlerts,
  useInternshipPipeline,
  useProfessorDashboard,
  useCompetencies,
  useLearningPath,
  useAnalytics,
  useAnnouncements,
  useJobBoard,
  usePeerFeedback
}
