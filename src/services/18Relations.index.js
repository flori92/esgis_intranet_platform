// ==========================================
// INDEX: Export Central pour les 18 Relations
// Import depuis ici dans toute l'app
// ==========================================

// Services (v2 Enhanced - Production Ready with full validation)
export {
  StudentGroupsService,
  StudentAlertsService,
  InternshipService,
  CompetenciesService,
  ProfessorDashboardService
} from './18Relations.enhanced.js'

// Legacy Services (v1 - Available for backward compatibility)
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
export {
  useStudentGroups,
  useStudentAlerts,
  useInternshipPipeline,
  useCompetencies,
  useProfessorDashboard,
  // Utility hooks
  useAsync,
  useCache
} from '../hooks/use18Relations.enhanced.js'

// Legacy Hooks (v1 - Available for backward compatibility)
export {
  useLearningPath,
  useAnalytics,
  useAnnouncements,
  useJobBoard,
  usePeerFeedback
} from '../hooks/use18Relations.js'

// Components
export {
  StudentGroupsManager,
  StudentAlertsPanel,
  InternshipBoard
} from '../components/18Relations.components'

// ==========================================
// QUICK START: Utilisation dans l'App
// ==========================================
/*

// 1. Import une seule ligne
import { 
  useStudentAlerts, 
  StudentAlertsPanel,
  StudentAlertsService 
} from '@/services/18Relations.index'

// 2. Utiliser dans un composant
function MyComponent({ studentId }) {
  const { alerts, resolveAlert } = useStudentAlerts(studentId)
  
  return <StudentAlertsPanel studentId={studentId} />
}

// 3. Ou utiliser le service directement
async function loadAlerts(studentId) {
  const data = await StudentAlertsService.getStudentAlerts(studentId)
  return data
}

*/

export default {
  // Services
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
  PartnershipsService,

  // Hooks
  useStudentGroups,
  useStudentAlerts,
  useInternshipPipeline,
  useProfessorDashboard,
  useCompetencies,
  useLearningPath,
  useAnalytics,
  useAnnouncements,
  useJobBoard,
  usePeerFeedback,

  // Components
  StudentGroupsManager,
  StudentAlertsPanel,
  InternshipBoard
}
