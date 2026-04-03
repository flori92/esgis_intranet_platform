import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import des composants du professeur
import ProfessorDashboard from '../pages/professor/DashboardPage';
import ProfessorDocumentsPage from '../pages/professor/DocumentsPage';
import ExamsListPage from '../pages/professor/exams/ExamsListPage';
import ExamFormPage from '../pages/professor/exams/ExamFormPage';
import ExamGradingPage from '../pages/professor/exams/ExamGradingPage';
import GradesManagementPage from '../pages/professor/grades/GradesManagementPage';
import GradeCorrectionPage from '../pages/professor/grades/GradeCorrectionPage';
import QuestionBankPage from '../pages/professor/questions/QuestionBankPage';

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
    <Routes>
      <Route index element={<ProfessorDashboard />} />
      <Route path="documents" element={<ProfessorDocumentsPage />} />
      <Route path="exams">
        <Route index element={<ExamsListPage />} />
        <Route path="create" element={<ExamFormPage />} />
        <Route path=":id" element={<ExamFormPage />} />
        <Route path=":id/edit" element={<ExamFormPage />} />
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
  );
};

export default ProfessorRoutes;
