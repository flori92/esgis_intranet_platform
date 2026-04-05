// ==========================================
// SERVICES: Les 18 Nouvelles Relations
// ESGIS Campus 2025-2026
// ==========================================

import { supabase } from '../supabase'

// ==========================================
// 1. STUDENT GROUPS SERVICE
// ==========================================
export const StudentGroupsService = {
  async createGroup(groupData) {
    const { data, error } = await supabase
      .from('student_groups')
      .insert([groupData])
      .select()
    if (error) throw error
    return data
  },

  async getGroupsByClass(courseId) {
    const { data, error } = await supabase
      .from('student_groups')
      .select('*')
      .eq('course_id', courseId)
    if (error) throw error
    return data
  },

  async addStudentToGroup(groupId, studentId) {
    const { data, error } = await supabase
      .from('group_memberships')
      .insert([{ group_id: groupId, student_id: studentId }])
      .select()
    if (error) throw error
    return data
  },

  async getGroupMembers(groupId) {
    const { data, error } = await supabase
      .from('group_memberships')
      .select('*, students(*)')
      .eq('group_id', groupId)
    if (error) throw error
    return data
  },

  async updateGroup(groupId, updates) {
    const { data, error } = await supabase
      .from('student_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
    if (error) throw error
    return data
  },

  async deleteGroup(groupId) {
    const { error } = await supabase
      .from('student_groups')
      .delete()
      .eq('id', groupId)
    if (error) throw error
    return true
  }
}

// ==========================================
// 2. STUDENT ALERTS SERVICE
// ==========================================
export const StudentAlertsService = {
  async createAlert(alertData) {
    const { data, error } = await supabase
      .from('student_alerts')
      .insert([alertData])
      .select()
    if (error) throw error
    return data
  },

  async getStudentAlerts(studentId) {
    const { data, error } = await supabase
      .from('student_alerts')
      .select('*, alert_type_definitions(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getUnresolvedAlerts(studentId) {
    const { data, error } = await supabase
      .from('student_alerts')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_resolved', false)
    if (error) throw error
    return data
  },

  async resolveAlert(alertId) {
    const { data, error } = await supabase
      .from('student_alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId)
      .select()
    if (error) throw error
    return data
  },

  async checkAndCreateAlerts(studentId) {
    // Vérifie conditions et crée les alertes correspondantes
    // À implémenter avec logique métier
    return true
  }
}

// ==========================================
// 3. INTERNSHIP PIPELINE SERVICE
// ==========================================
export const InternshipService = {
  async createOffer(offerData) {
    const { data, error } = await supabase
      .from('internship_offers')
      .insert([offerData])
      .select()
    if (error) throw error
    return data
  },

  async getActiveOffers() {
    const { data, error } = await supabase
      .from('internship_offers')
      .select('*, companies(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async applyForInternship(applicationData) {
    const { data, error } = await supabase
      .from('internship_applications')
      .insert([applicationData])
      .select()
    if (error) throw error
    return data
  },

  async getApplications(studentId) {
    const { data, error } = await supabase
      .from('internship_applications')
      .select('*, internship_offers(*)')
      .eq('student_id', studentId)
    if (error) throw error
    return data
  },

  async startInternship(applicationId, internshipData) {
    const { data: intern, error: internError } = await supabase
      .from('internships')
      .insert([internshipData])
      .select()
    if (internError) throw internError

    const { error: appError } = await supabase
      .from('internship_applications')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', applicationId)
    if (appError) throw appError

    return intern
  },

  async completeInternship(internshipId, noteData) {
    const { data, error } = await supabase
      .from('internships')
      .update({
        status: 'completed',
        end_date: new Date().toISOString(),
        final_grade: noteData.grade,
        supervisor_feedback: noteData.feedback
      })
      .eq('id', internshipId)
      .select()
    if (error) throw error
    return data
  }
}

// ==========================================
// 4. PROFESSOR DASHBOARD SERVICE
// ==========================================
export const ProfessorDashboardService = {
  async getClassMetrics(courseId) {
    const { data: classData, error: classError } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', courseId)
    if (classError) throw classError

    const { data: students, error: studentsError } = await supabase
      .from('student_courses')
      .select('count')
      .eq('course_id', courseId)
    if (studentsError) throw studentsError

    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('value')
      .eq('course_id', courseId)
    if (gradesError) throw gradesError

    return {
      classSize: students?.[0]?.count || 0,
      averageGrade:
        grades?.reduce((sum, g) => sum + g.value, 0) / grades?.length || 0,
      lastUpdated: new Date().toISOString()
    }
  },

  async getAtRiskStudents(courseId) {
    const { data, error } = await supabase
      .from('student_alerts')
      .select('*, students(*)')
      .eq('is_resolved', false)
      .order('severity', { ascending: false })
    if (error) throw error
    return data
  },

  async updateDashboard(professorId, metrics) {
    const { data, error } = await supabase
      .from('professor_dashboards')
      .upsert([{ professor_id: professorId, ...metrics }], {
        onConflict: 'professor_id'
      })
      .select()
    if (error) throw error
    return data
  }
}

// ==========================================
// 5. COMPETENCIES SERVICE
// ==========================================
export const CompetenciesService = {
  async getAllCompetencies() {
    const { data, error } = await supabase
      .from('competencies')
      .select('*')
      .order('category')
    if (error) throw error
    return data
  },

  async assignCompetency(studentId, competencyId, level = 'beginner') {
    const { data, error } = await supabase
      .from('student_competencies')
      .upsert(
        [{ student_id: studentId, competency_id: competencyId, mastery_level: level }],
        { onConflict: 'student_id,competency_id' }
      )
      .select()
    if (error) throw error
    return data
  },

  async getStudentCompetencies(studentId) {
    const { data, error } = await supabase
      .from('student_competencies')
      .select('*, competencies(*)')
      .eq('student_id', studentId)
    if (error) throw error
    return data
  },

  async getCourseCompetencies(courseId) {
    const { data, error } = await supabase
      .from('course_competencies')
      .select('*, competencies(*)')
      .eq('course_id', courseId)
    if (error) throw error
    return data
  }
}

// ==========================================
// 6. PREREQUISITES SERVICE
// ==========================================
export const PrerequisitesService = {
  async checkCanEnroll(studentId, courseId) {
    const { data: prereqs, error: prereqError } = await supabase
      .from('course_prerequisites')
      .select('*')
      .eq('course_id', courseId)
    if (prereqError) throw prereqError

    if (!prereqs || prereqs.length === 0) return true

    for (const prereq of prereqs) {
      const { data: completed } = await supabase
        .from('student_courses')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', prereq.prerequisite_course_id)
        .eq('grade', { gt: 10 })
      if (!completed || completed.length === 0) return false
    }
    return true
  },

  async validatePrerequisites(studentId, courseId) {
    const { data, error } = await supabase
      .from('prerequisite_validations')
      .insert([{ student_id: studentId, course_id: courseId }])
      .select()
    if (error) throw error
    return data
  }
}

// ==========================================
// 7. LEARNING PATHS SERVICE
// ==========================================
export const LearningPathsService = {
  async getCoursePath(courseId) {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('*, path_resources(*)')
      .eq('course_id', courseId)
    if (error) throw error
    return data
  },

  async trackProgress(studentId, pathId) {
    const { data, error } = await supabase
      .from('student_path_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('path_id', pathId)
    if (error) throw error
    return data
  },

  async updateProgress(studentId, pathId, completion) {
    const { data, error } = await supabase
      .from('student_path_progress')
      .upsert(
        [{ student_id: studentId, path_id: pathId, completion_percentage: completion }],
        { onConflict: 'student_id,path_id' }
      )
      .select()
    if (error) throw error
    return data
  }
}

// ==========================================
// 8. RESOURCES SERVICE (Versioning + Interactive)
// ==========================================
export const ResourcesService = {
  async createResourceVersion(resourceId, versionData) {
    const { data, error } = await supabase
      .from('resource_versions')
      .insert([{ resource_id: resourceId, ...versionData }])
      .select()
    if (error) throw error
    return data
  },

  async getResourceHistory(resourceId) {
    const { data, error } = await supabase
      .from('resource_versions')
      .select('*')
      .eq('resource_id', resourceId)
      .order('version_number', { ascending: false })
    if (error) throw error
    return data
  },

  async createInteractiveResource(resourceData) {
    const { data, error } = await supabase
      .from('interactive_resources')
      .insert([resourceData])
      .select()
    if (error) throw error
    return data
  },

  async trackResourceInteraction(studentId, resourceId, interactionType) {
    const { data, error } = await supabase
      .from('resource_interactions')
      .insert([
        {
          student_id: studentId,
          resource_id: resourceId,
          interaction_type: interactionType,
          interaction_date: new Date().toISOString()
        }
      ])
      .select()
    if (error) throw error
    return data
  }
}

// ==========================================
// 9. EXAMS (Multi-Sessions) SERVICE
// ==========================================
export const ExamSessionsService = {
  async createExamSessions(examId, sessionsData) {
    const { data, error } = await supabase
      .from('exam_sessions')
      .insert(
        sessionsData.map(session => ({ exam_id: examId, ...session }))
      )
      .select()
    if (error) throw error
    return data
  },

  async registerForSession(studentId, sessionId) {
    const { data, error } = await supabase
      .from('exam_registrations')
      .insert([{ student_id: studentId, exam_session_id: sessionId }])
      .select()
    if (error) throw error
    return data
  },

  async getSessionSeats(sessionId) {
    const { data, error } = await supabase
      .from('exam_registrations')
      .select('count')
      .eq('exam_session_id', sessionId)
    if (error) throw error
    return data?.[0]?.count || 0
  }
}

// ==========================================
// 10. PLAGIARISM DETECTION SERVICE
// ==========================================
export const PlagiarismService = {
  async analyzSubmission(submissionId, content) {
    const { data, error } = await supabase
      .from('exam_submission_analysis')
      .insert([
        {
          submission_id: submissionId,
          analysis_content: content,
          analyzed_at: new Date().toISOString()
        }
      ])
      .select()
    if (error) throw error
    return data
  },

  async createIntegrityReport(examId, findings) {
    const { data, error } = await supabase
      .from('integrity_reports')
      .insert([
        {
          exam_id: examId,
          findings_summary: findings,
          report_date: new Date().toISOString()
        }
      ])
      .select()
    if (error) throw error
    return data
  },

  async getExamIntegrityReport(examId) {
    const { data, error } = await supabase
      .from('integrity_reports')
      .select('*')
      .eq('exam_id', examId)
      .order('report_date', { ascending: false })
      .limit(1)
    if (error) throw error
    return data?.[0]
  }
}

// ==========================================
// 11. JOB BOARD SERVICE
// ==========================================
export const JobBoardService = {
  async postJobOffer(offerData) {
    const { data, error } = await supabase
      .from('job_offers')
      .insert([offerData])
      .select()
    if (error) throw error
    return data
  },

  async getActiveJobs() {
    const { data, error } = await supabase
      .from('job_offers')
      .select('*, partners(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async applyForJob(applicationData) {
    const { data, error } = await supabase
      .from('job_applications')
      .insert([applicationData])
      .select()
    if (error) throw error
    return data
  },

  async getStudentApplications(studentId) {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, job_offers(*)')
      .eq('student_id', studentId)
    if (error) throw error
    return data
  }
}

// ==========================================
// 12. ANALYTICS & ALERTS SERVICE
// ==========================================
export const AnalyticsService = {
  async getClassAnalytics(courseId) {
    const { data, error } = await supabase
      .from('student_performance_analytics')
      .select('*')
      .eq('course_id', courseId)
    if (error) throw error
    return data
  },

  async getStudentPerformance(studentId) {
    const { data, error } = await supabase
      .from('student_performance_analytics')
      .select('*')
      .eq('student_id', studentId)
    if (error) throw error
    return data
  },

  async trackAnomalies(studentId, anomalyData) {
    const { data, error } = await supabase
      .from('student_alerts')
      .insert([{ student_id: studentId, ...anomalyData }])
      .select()
    if (error) throw error
    return data
  }
}

// ==========================================
// 13. ANNOUNCEMENTS SERVICE
// ==========================================
export const AnnouncementsService = {
  async createAnnouncement(announcementData) {
    const { data, error } = await supabase
      .from('targeted_announcements')
      .insert([announcementData])
      .select()
    if (error) throw error
    return data
  },

  async getRelevantAnnouncements(userId, userType) {
    const { data, error } = await supabase
      .from('targeted_announcements')
      .select('*')
      .eq('audience_type', userType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async markAnnouncementAsRead(announcementId, userId) {
    // Track que l'utilisateur a vu l'annonce
    return true
  }
}

// ==========================================
// 14. PEER FEEDBACK & 360 REVIEWS SERVICE
// ==========================================
export const PeerFeedbackService = {
  async submitFeedback(feedbackData) {
    const { data, error } = await supabase
      .from('peer_feedback')
      .insert([feedbackData])
      .select()
    if (error) throw error
    return data
  },

  async submit360Review(reviewData) {
    const { data, error } = await supabase
      .from('student_360_reviews')
      .insert([reviewData])
      .select()
    if (error) throw error
    return data
  },

  async getStudentFeedback(studentId) {
    const { data, error } = await supabase
      .from('peer_feedback')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
}

// ==========================================
// 15. COMPANY PARTNERSHIPS SERVICE
// ==========================================
export const PartnershipsService = {
  async createPartnership(partnershipData) {
    const { data, error } = await supabase
      .from('partners')
      .insert([partnershipData])
      .select()
    if (error) throw error
    return data
  },

  async getActivePartners() {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
    if (error) throw error
    return data
  },

  async trackPartnershipInteraction(partnerId, interactionData) {
    // Log interactions with partners
    return true
  }
}

export default {
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
}
