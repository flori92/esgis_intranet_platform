import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RouteLoader from '../components/common/RouteLoader';

// Import des composants du professeur
const ProfessorDashboard = lazy(() => import('../pages/professor/DashboardPage'));
const ProfessorCoursesPage = lazy(() => import('../pages/professor/CoursesPage'));
const ProfessorStudentsPage = lazy(() => import('../pages/professor/StudentsPage'));
const ProfessorDocumentsPage = lazy(() => import('../pages/professor/DocumentsPage'));
const ExamsListPage = lazy(() => import('../pages/professor/exams/ExamsListPage'));
const ExamFormPage = lazy(() => import('../pages/professor/exams/ExamFormPage'));
const ExamGradingPage = lazy(() => import('../pages/professor/exams/ExamGradingPage'));
const ExamMonitoringPage = lazy(() => import('../pages/professor/exams/ExamMonitoringPage'));
const GradesManagementPage = lazy(() => import('../pages/professor/grades/GradesManagementPage'));
const GradeCorrectionPage = lazy(() => import('../pages/professor/grades/GradeCorrectionPage'));
const QuestionBankPage = lazy(() => import('../pages/professor/questions/QuestionBankPage'));

/**
 * Routes pour les professeurs
 * Définit l'ensemble des chemins d'accès aux fonctionnalités du module professeur,
 * notamment pour la gestion des examens (création, modification, notation).
 */
const ProfessorRoutes = () => {
  const { authState } = useAuth();
  
  // Vérifier si l'utilisateur est un professeur
  if (!authState.isProfessor) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route index element={<ProfessorDashboard />} />
        <Route path="courses" element={<ProfessorCoursesPage />} />
        <Route path="students" element={<ProfessorStudentsPage />} />
        <Route path="documents" element={<ProfessorDocumentsPage />} />
        <Route path="exams">
          <Route index element={<ExamsListPage />} />
          <Route path="create" element={<ExamFormPage />} />
          <Route path=":id" element={<ExamFormPage />} />
          <Route path=":id/edit" element={<ExamFormPage />} />
          <Route path=":id/monitor" element={<ExamMonitoringPage />} />
          <Route path=":id/grade" element={<ExamGradingPage />} />
        </Route>
        {/* Routes pour la gestion des notes */}
        <Route path="grades">
          <Route index element={<GradesManagementPage />} />
          <Route path="corrections" element={<GradeCorrectionPage />} />
        </Route>
        {/* Banque de questions */}
        <Route path="question-bank" element={<QuestionBankPage />} />
      </Routes>
    </Suspense>
  );
};

export default ProfessorRoutes;
