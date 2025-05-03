import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

// Pages
import ProfessorDashboard from '../pages/professor/DashboardPage';
import ExamsListPage from '../pages/professor/exams/ExamsListPage';
import ExamFormPage from '../pages/professor/exams/ExamFormPage';
import ExamGradingPage from '../pages/professor/exams/ExamGradingPage';
import { useAuth } from '../hooks/useAuth';

/**
 * Routes pour les professeurs
 */
const ProfessorRoutes: React.FC = () => {
  const { authState } = useAuth();
  
  // Rediriger vers la connexion si l'utilisateur n'est pas authentifié
  if (!authState.user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<ProfessorDashboard />} />
      <Route path="/exams">
        <Route index element={<ExamsListPage />} />
        <Route path="create" element={<ExamFormPage />} />
        <Route path=":id" element={<ExamFormPage />} />
        <Route path=":id/edit" element={<ExamFormPage />} />
        <Route path=":id/grade" element={<ExamGradingPage />} />
      </Route>
      {/* Ajouter ici d'autres routes professeur si nécessaire */}
    </Routes>
  );
};

export default ProfessorRoutes;
