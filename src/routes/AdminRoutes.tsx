import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Import des composants d'administration
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import DepartmentManagerPage from '../pages/admin/DepartmentManagerPage';
import ProfessorRolesPage from '../pages/admin/ProfessorRolesPage';
import CoursesManagerPage from '../pages/admin/CoursesManagerPage';
import ProfessorCoursesPage from '../pages/admin/ProfessorCoursesPage';
import DocumentGeneratorPage from '../pages/admin/DocumentGeneratorPage';
import ReportsPage from '../pages/admin/ReportsPage';

// Import des composants de gestion des étudiants
import StudentsListPage from '../pages/admin/students/StudentsListPage';
import StudentDetailsPage from '../pages/admin/students/StudentDetailsPage';
import StudentFormPage from '../pages/admin/students/StudentFormPage';

// Composant pour les routes d'administration
const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboardPage />} />
      <Route path="/departments" element={<DepartmentManagerPage />} />
      <Route path="/professor-roles" element={<ProfessorRolesPage />} />
      <Route path="/courses" element={<CoursesManagerPage />} />
      <Route path="/professor-courses" element={<ProfessorCoursesPage />} />
      <Route path="/document-generator" element={<DocumentGeneratorPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      
      {/* Routes pour la gestion des étudiants */}
      <Route path="/students" element={<StudentsListPage />} />
      <Route path="/students/create" element={<StudentFormPage />} />
      <Route path="/students/:id" element={<StudentDetailsPage />} />
      <Route path="/students/:id/edit" element={<StudentFormPage />} />
      
      {/* Route par défaut vers le tableau de bord */}
      <Route path="*" element={<AdminDashboardPage />} />
    </Routes>
  );
};

export default AdminRoutes;
