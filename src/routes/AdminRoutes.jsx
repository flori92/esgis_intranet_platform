import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import AdminDashboardPage from '../pages/admin/DashboardPage';
import DepartmentManagerPage from '../pages/admin/DepartmentManagerPage';
import ProfessorRolesPage from '../pages/admin/ProfessorRolesPage';
import CoursesManagerPage from '../pages/admin/CoursesManagerPage';
import ProfessorCoursesPage from '../pages/admin/ProfessorCoursesPage';
import DocumentGeneratorPage from '../pages/admin/DocumentGeneratorPage';
import ReportsPage from '../pages/admin/ReportsPage.jsx';
import InitializeDataPage from '../pages/admin/InitializeDataPage';

// Student Management Pages
import StudentsListPage from '../pages/admin/students/StudentsListPage';
import StudentFormPage from '../pages/admin/students/StudentFormPage';
import StudentDetailsPage from '../pages/admin/students/StudentDetailsPage';

// Super Admin Pages
import RolesPermissionsPage from '../pages/admin/superadmin/RolesPermissionsPage';
import AuditLogPage from '../pages/admin/superadmin/AuditLogPage';

const AdminRoutes = () => {
  const { authState } = useAuth();

  if (!authState.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route index element={<AdminDashboardPage />} />
      <Route path="departments" element={<DepartmentManagerPage />} />
      <Route path="professor-roles" element={<ProfessorRolesPage />} />
      <Route path="courses" element={<CoursesManagerPage />} />
      <Route path="professor-courses" element={<ProfessorCoursesPage />} />
      <Route path="document-generator" element={<DocumentGeneratorPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="initialize-data" element={<InitializeDataPage />} />

      {/* Student Management Routes */}
      <Route path="students">
        <Route index element={<StudentsListPage />} />
        <Route path="create" element={<StudentFormPage />} />
        <Route path="new" element={<StudentFormPage />} />
        <Route path=":id" element={<StudentDetailsPage />} />
        <Route path=":id/edit" element={<StudentFormPage />} />
      </Route>

      {/* Super Admin Routes */}
      <Route path="roles" element={<RolesPermissionsPage />} />
      <Route path="audit-log" element={<AuditLogPage />} />

      {/* Default Route */}
      <Route path="*" element={<AdminDashboardPage />} />
    </Routes>
  );
};

export default AdminRoutes;
