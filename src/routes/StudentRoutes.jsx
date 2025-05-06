import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from '../pages/student/DashboardPage';
import StudentExamsList from '../pages/exams/student/StudentExamsList';
import TakeExamPage from '../pages/exams/student/TakeExamPage';
import ExamResultsPage from '../pages/exams/student/ExamResultsPage';
import StudentSchedulePage from '../pages/student/SchedulePage';
import StudentGradesPage from '../pages/student/GradesPage';
import StudentDocumentsPage from '../pages/student/DocumentsPage';
import StudentMessagesPage from '../pages/student/MessagesPage';
import StudentInternshipsPage from '../pages/student/InternshipsPage';
import StudentGroupsPage from '../pages/student/GroupsPage';

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
      
      {/* Routes pour les examens */}
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
      
      {/* Routes pour l'emploi du temps */}
      <Route path="schedule" element={<StudentSchedulePage />} />
      
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
    </Routes>
  );
};

export default StudentRoutes;
