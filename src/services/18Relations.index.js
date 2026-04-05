// ==========================================
// INDEX: Export Central pour les 18 Relations
// Import depuis ici dans toute l'app
// ==========================================

// Services (v2 Enhanced - Production Ready with full validation)
import {
  StudentGroupsService as _StudentGroupsService,
  StudentAlertsService as _StudentAlertsService,
  InternshipService as _InternshipService,
  CompetenciesService as _CompetenciesService,
  ProfessorDashboardService as _ProfessorDashboardService
} from './18Relations.enhanced.js'

export {
  StudentGroupsService,
  StudentAlertsService,
  InternshipService,
  CompetenciesService,
  ProfessorDashboardService
} from './18Relations.enhanced.js'

// Legacy Services (v1 - Available for backward compatibility)
import {
  PrerequisitesService as _PrerequisitesService,
  LearningPathsService as _LearningPathsService,
  ResourcesService as _ResourcesService,
  ExamSessionsService as _ExamSessionsService,
  PlagiarismService as _PlagiarismService,
  JobBoardService as _JobBoardService,
  AnalyticsService as _AnalyticsService,
  AnnouncementsService as _AnnouncementsService,
  PeerFeedbackService as _PeerFeedbackService,
  PartnershipsService as _PartnershipsService
} from './18Relations.service.js'

export {
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
} from './18Relations.service.js'

// Hooks (v2 Enhanced - Production Ready)
import {
  useStudentGroups as _useStudentGroups,
  useStudentAlerts as _useStudentAlerts,
  useInternshipPipeline as _useInternshipPipeline,
  useCompetencies as _useCompetencies,
  useProfessorDashboard as _useProfessorDashboard,
  useAsync as _useAsync,
  useCache as _useCache
} from '../hooks/use18Relations.enhanced.js'

export {
  useStudentGroups,
  useStudentAlerts,
  useInternshipPipeline,
  useCompetencies,
  useProfessorDashboard,
  useAsync,
  useCache
} from '../hooks/use18Relations.enhanced.js'

// Legacy Hooks (v1 - Available for backward compatibility)
import {
  useLearningPath as _useLearningPath,
  useAnalytics as _useAnalytics,
  useAnnouncements as _useAnnouncements,
  useJobBoard as _useJobBoard,
  usePeerFeedback as _usePeerFeedback
} from '../hooks/use18Relations.js'

export {
  useLearningPath,
  useAnalytics,
  useAnnouncements,
  useJobBoard,
  usePeerFeedback
} from '../hooks/use18Relations.js'

// Components
import {
  StudentGroupsManager as _StudentGroupsManager,
  StudentAlertsPanel as _StudentAlertsPanel,
  InternshipBoard as _InternshipBoard
} from '../components/18Relations.components'

export {
  StudentGroupsManager,
  StudentAlertsPanel,
  InternshipBoard
} from '../components/18Relations.components'

export default {
  StudentGroupsService: _StudentGroupsService,
  StudentAlertsService: _StudentAlertsService,
  InternshipService: _InternshipService,
  ProfessorDashboardService: _ProfessorDashboardService,
  CompetenciesService: _CompetenciesService,
  PrerequisitesService: _PrerequisitesService,
  LearningPathsService: _LearningPathsService,
  ResourcesService: _ResourcesService,
  ExamSessionsService: _ExamSessionsService,
  PlagiarismService: _PlagiarismService,
  JobBoardService: _JobBoardService,
  AnalyticsService: _AnalyticsService,
  AnnouncementsService: _AnnouncementsService,
  PeerFeedbackService: _PeerFeedbackService,
  PartnershipsService: _PartnershipsService,
  useStudentGroups: _useStudentGroups,
  useStudentAlerts: _useStudentAlerts,
  useInternshipPipeline: _useInternshipPipeline,
  useProfessorDashboard: _useProfessorDashboard,
  useCompetencies: _useCompetencies,
  useLearningPath: _useLearningPath,
  useAnalytics: _useAnalytics,
  useAnnouncements: _useAnnouncements,
  useJobBoard: _useJobBoard,
  usePeerFeedback: _usePeerFeedback,
  StudentGroupsManager: _StudentGroupsManager,
  StudentAlertsPanel: _StudentAlertsPanel,
  InternshipBoard: _InternshipBoard
}
