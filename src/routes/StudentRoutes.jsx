import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RouteLoader from '../components/common/RouteLoader';

const StudentDashboard = lazy(() => import('../pages/student/DashboardPage'));
const StudentExamsList = lazy(() => import('../pages/exams/student/StudentExamsList'));
const TakeExamPage = lazy(() => import('../pages/exams/student/TakeExamPage'));
const ExamResultsPage = lazy(() => import('../pages/exams/student/ExamResultsPage'));
const JoinExamByTokenPage = lazy(() => import('../pages/exams/student/JoinExamByTokenPage'));
const StudentSchedulePage = lazy(() => import('../pages/student/SchedulePage'));
const StudentGradesPage = lazy(() => import('../pages/student/GradesPage'));
const StudentDocumentsPage = lazy(() => import('../pages/student/DocumentsPage'));
const StudentMessagesPage = lazy(() => import('../pages/student/MessagesPage'));
const StudentInternshipsPage = lazy(() => import('../pages/student/InternshipsPage'));
const StudentGroupsPage = lazy(() => import('../pages/student/GroupsPage'));
const StudentCertificatePage = lazy(() => import('../pages/student/CertificatePage'));
const AdministrativeRequestsPage = lazy(() => import('../pages/student/AdministrativeRequestsPage'));
const LibraryPage = lazy(() => import('../pages/student/LibraryPage'));
const ThesesPage = lazy(() => import('../pages/student/ThesesPage'));
const StudentCoursesPage = lazy(() => import('../pages/student/CoursesPage'));
const PracticeQuizPage = lazy(() => import('../pages/exams/student/PracticeQuizPage'));
const TranscriptPage = lazy(() => import('../pages/student/TranscriptPage'));
const ReportCardPage = lazy(() => import('../pages/student/ReportCardPage'));
const ProfileSettingsPage = lazy(() => import('../pages/student/ProfileSettingsPage'));
const WeeklySchedulesPage = lazy(() => import('../pages/student/WeeklySchedulesPage'));

/**
 * Routes pour les étudiants
 * Définit les routes accessibles aux utilisateurs ayant le rôle étudiant
 */
const StudentRoutes = () => {
  const { authState } = useAuth();
  
  // Vérifier si l'utilisateur est un étudiant
  if (!authState.isStudent) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route index element={<StudentDashboard />} />
        
        {/* Routes pour les examens */}
        <Route path="exams">
          <Route index element={<StudentExamsList />} />
          <Route path="join/:token" element={<JoinExamByTokenPage />} />
          <Route path=":id/take" element={<TakeExamPage />} />
          <Route path=":id/results" element={<ExamResultsPage />} />
        </Route>
        
        {/* Routes pour l'emploi du temps */}
        <Route path="schedule" element={<StudentSchedulePage />} />
        <Route path="weekly-schedules" element={<WeeklySchedulesPage />} />
        
        {/* Routes pour les notes */}
        <Route path="grades" element={<StudentGradesPage />} />
        
        {/* Routes pour les documents */}
        <Route path="documents" element={<StudentDocumentsPage />} />
        
        {/* Routes pour les messages */}
        <Route path="messages" element={<StudentMessagesPage />} />
        
        {/* Routes pour les stages */}
        <Route path="internships" element={<StudentInternshipsPage />} />
        
        {/* Routes pour les groupes */}
        <Route path="groups" element={<StudentGroupsPage />} />
        
        {/* Route pour le certificat de scolarité */}
        <Route path="certificate" element={<StudentCertificatePage />} />
        
        {/* Démarches administratives */}
        <Route path="requests" element={<AdministrativeRequestsPage />} />
        
        {/* Bibliothèque numérique */}
        <Route path="library" element={<LibraryPage />} />
        
        {/* Soutenances & Mémoires */}
        <Route path="theses" element={<ThesesPage />} />
        
        {/* Espace Cours & Ressources */}
        <Route path="courses" element={<StudentCoursesPage />} />
        
        {/* Quiz d'entraînement */}
        <Route path="practice" element={<PracticeQuizPage />} />

        {/* Relève de notes */}
        <Route path="transcript" element={<TranscriptPage />} />

        {/* Bulletin de notes */}
        <Route path="report-card" element={<ReportCardPage />} />

        {/* Paramètres de profil */}
        <Route path="profile" element={<ProfileSettingsPage />} />
      </Routes>
    </Suspense>
  );
};

export default StudentRoutes;
