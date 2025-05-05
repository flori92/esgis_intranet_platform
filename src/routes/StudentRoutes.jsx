import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from '../pages/student/DashboardPage';
import StudentExamsList from '../pages/exams/student/StudentExamsList';
import TakeExamPage from '../pages/exams/student/TakeExamPage';
import ExamResultsPage from '../pages/exams/student/ExamResultsPage';
// Suppression de l'import du type ExamResult

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
    <Routes>
      <Route index element={<StudentDashboard />} />
      <Route path="exams">
        <Route index element={<StudentExamsList />} />
        <Route path=":id/take" element={<TakeExamPage />} />
        <Route
          path=":id/results"
          element={
            <ExamResultsPage
              examResult={{
                id: 0,
                exam_id: 0,
                student_id: '',
                score: 0,
                status: 'completed',
                submitted_at: new Date().toISOString(),
                answers: []
              }}
            />
          }
        />
      </Route>
      {/* Ajouter ici d'autres routes étudiant si nécessaire */}
    </Routes>
  );
};

export default StudentRoutes;
