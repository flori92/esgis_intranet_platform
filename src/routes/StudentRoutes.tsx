import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Pages
import StudentDashboard from '../pages/student/DashboardPage';
import StudentExamsList from '../pages/exams/student/StudentExamsList';
import TakeExamPage from '../pages/exams/student/TakeExamPage';
import ExamResultsPage from '../pages/exams/student/ExamResultsPage';

/**
 * Routes pour les étudiants
 */
const StudentRoutes: React.FC = () => {
  const { authState } = useAuth();
  
  // Rediriger vers la connexion si l'utilisateur n'est pas authentifié
  if (!authState.user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<StudentDashboard />} />
      <Route path="/exams">
        <Route index element={<StudentExamsList />} />
        <Route path=":id/take" element={<TakeExamPage />} />
        <Route path=":id/results" element={<ExamResultsPage />} />
      </Route>
      {/* Ajouter ici d'autres routes étudiant si nécessaire */}
    </Routes>
  );
};

export default StudentRoutes;
