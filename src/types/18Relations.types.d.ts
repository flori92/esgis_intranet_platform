/**
 * ============================================
 * TypeScript Type Definitions for 18 Relations
 * Complete type safety for services and hooks
 * ============================================
 */

// ============================================
// STUDENT GROUPS TYPES
// ============================================

export interface StudentGroup {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface StudentGroupInput {
  name: string
  description?: string
}

export interface GroupMember {
  id: string
  group_id: string
  student_id: string
  joined_at: string
}

// ============================================
// STUDENT ALERTS TYPES
// ============================================

export type AlertSeverity = 'low' | 'normal' | 'high' | 'critical'
export type AlertType =
  | 'grading_low'
  | 'deadline_approaching'
  | 'feedback_ready'
  | 'attendance_issue'
  | 'achievement_unlocked'

export interface StudentAlert {
  id: string
  user_id: string
  alert_type: AlertType
  title: string
  description?: string
  severity: AlertSeverity
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface StudentAlertInput {
  user_id: string
  alert_type: AlertType
  title: string
  description?: string
  severity?: AlertSeverity
}

export interface AlertTypeDefinition {
  id: string
  alert_type: AlertType
  label: string
  description?: string
  icon?: string
  color?: string
}

// ============================================
// INTERNSHIP TYPES
// ============================================

export type InternshipStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface InternshipOffer {
  id: string
  title: string
  company_name: string
  description?: string
  location?: string
  sector?: string
  duration_weeks?: number
  compensation?: string
  status: InternshipStatus
  created_at: string
  updated_at: string
  created_by?: string
}

export interface InternshipOfferInput {
  title: string
  company_name: string
  description?: string
  location?: string
  sector?: string
  duration_weeks?: number
  compensation?: string
  status?: InternshipStatus
}

export interface InternshipStatusDefinition {
  id: string
  status: InternshipStatus
  label: string
  description?: string
  color?: string
}

// ============================================
// COMPETENCIES TYPES
// ============================================

export type CompetencyLevel = 1 | 2 | 3
export type CompetencyCategory =
  | 'Communication'
  | 'Collaboration'
  | 'Programmation'
  | 'Bases de données'
  | 'Frontend'
  | 'Backend'
  | 'Data'
  | 'Infrastructure'
  | 'DevOps'
  | 'Design'
  | 'Soft skills'
  | 'Valeurs'
  | 'Autres'

export interface Competency {
  id: string
  name: string
  description?: string
  category: CompetencyCategory
  level: CompetencyLevel
  created_at: string
}

export interface CompetencyInput {
  name: string
  description?: string
  category: CompetencyCategory
  level?: CompetencyLevel
}

export interface UserCompetency {
  id: string
  user_id: string
  competency_id: string
  proficiency_level: CompetencyLevel
  verified: boolean
  verified_by?: string
  created_at: string
}

// ============================================
// PROFESSOR DASHBOARD TYPES
// ============================================

export interface ProfessorDashboard {
  id: string
  professor_id: string
  refresh_interval_minutes: number
  show_alerts: boolean
  show_student_progress: boolean
  created_at: string
  updated_at: string
}

export interface ProfessorDashboardInput {
  refresh_interval_minutes?: number
  show_alerts?: boolean
  show_student_progress?: boolean
}

// ============================================
// LEARNING PATHS TYPES
// ============================================

export interface LearningPath {
  id: string
  user_id: string
  title: string
  description?: string
  progress: number // 0-100
  status: 'active' | 'completed' | 'paused'
  created_at: string
  updated_at: string
}

export interface LearningPathInput {
  title: string
  description?: string
}

// ============================================
// JOB OFFERS TYPES
// ============================================

export type JobStatus = 'draft' | 'published' | 'closed' | 'filled'
export type ContractType = 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance'

export interface JobOffer {
  id: string
  title: string
  company_name: string
  description?: string
  location?: string
  contract_type?: ContractType
  salary_min?: number
  salary_max?: number
  status: JobStatus
  created_at: string
  updated_at: string
}

export interface JobOfferInput {
  title: string
  company_name: string
  description?: string
  location?: string
  contract_type?: ContractType
  salary_min?: number
  salary_max?: number
  status?: JobStatus
}

export interface JobOfferStatusDefinition {
  id: string
  status: JobStatus
  label: string
  description?: string
  color?: string
}

// ============================================
// EXAM TYPES
// ============================================

export interface ExamSession {
  id: string
  exam_id?: string
  session_number: number
  start_date: string
  end_date: string
  location?: string
  capacity?: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
}

// ============================================
// PEER FEEDBACK TYPES
// ============================================

export interface PeerFeedback {
  id: string
  reviewer_id: string
  reviewed_id: string
  feedback_text?: string
  rating: number // 1-5
  created_at: string
}

export interface PeerFeedbackInput {
  reviewed_id: string
  feedback_text?: string
  rating: number
}

// ============================================
// ANNOUNCEMENTS TYPES
// ============================================

export type AnnouncementAudience =
  | 'all'
  | 'students'
  | 'professors'
  | 'staff'
  | 'alumni'
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface TargetedAnnouncement {
  id: string
  title: string
  content: string
  audience: AnnouncementAudience
  priority: AnnouncementPriority
  created_at: string
  updated_at: string
}

export interface AnnouncementInput {
  title: string
  content: string
  audience: AnnouncementAudience
  priority?: AnnouncementPriority
}

// ============================================
// SERVICE RESPONSE TYPES
// ============================================

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseAsyncResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  status: 'idle' | 'pending' | 'success' | 'error'
  execute: () => Promise<T>
}

export interface UseStudentGroupsResult {
  groups: StudentGroup[]
  loading: boolean
  error: string | null
  lastError?: Error
  createGroup: (name: string, description?: string) => Promise<StudentGroup>
  deleteGroup: (groupId: string) => Promise<void>
  loadGroups: () => Promise<void>
}

export interface UseStudentAlertsResult {
  alerts: StudentAlert[]
  loading: boolean
  error: string | null
  unreadCount: number
  filter: 'all' | 'unread' | 'critical'
  setFilter: (filter: 'all' | 'unread' | 'critical') => void
  markAsRead: (alertId: string) => Promise<void>
  deleteAlert: (alertId: string) => Promise<void>
  loadAlerts: () => Promise<void>
}

export interface UseInternshipPipelineResult {
  offers: InternshipOffer[]
  loading: boolean
  error: string | null
  filter: string
  setFilter: (filter: string) => void
  createOffer: (data: InternshipOfferInput) => Promise<InternshipOffer>
  loadOffers: () => Promise<void>
}

export interface UseCompetenciesResult {
  competencies: Competency[]
  categories: CompetencyCategory[]
  loading: boolean
  error: string | null
  loadCompetencies: () => Promise<void>
}

export interface UseProfessorDashboardResult {
  dashboard: ProfessorDashboard | null
  loading: boolean
  error: string | null
  updateSettings: (prefs: ProfessorDashboardInput) => Promise<ProfessorDashboard>
  loadDashboard: () => Promise<void>
}

// ============================================
// ERROR TYPES
// ============================================

export interface SupabaseErrorDetails {
  code?: string
  message: string
  context?: string
}

export class ServiceError extends Error {
  constructor(
    public context: string,
    public originalError: Error,
    public statusCode?: number
  ) {
    super(`${context}: ${originalError.message}`)
    this.name = 'ServiceError'
  }
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type {
  StudentGroup,
  StudentAlert,
  InternshipOffer,
  Competency,
  ProfessorDashboard,
  LearningPath,
  JobOffer,
  ExamSession,
  PeerFeedback,
  TargetedAnnouncement
}