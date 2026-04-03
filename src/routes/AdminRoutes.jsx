import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RouteLoader from '../components/common/RouteLoader';

// Pages
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const DepartmentManagerPage = lazy(() => import('../pages/admin/DepartmentManagerPage'));
const ProfessorRolesPage = lazy(() => import('../pages/admin/ProfessorRolesPage'));
const CoursesManagerPage = lazy(() => import('../pages/admin/CoursesManagerPage'));
const ProfessorCoursesPage = lazy(() => import('../pages/admin/ProfessorCoursesPage'));
const DocumentGeneratorPage = lazy(() => import('../pages/admin/DocumentGeneratorPage'));
const ReportsPage = lazy(() => import('../pages/admin/ReportsPage.jsx'));
const InitializeDataPage = lazy(() => import('../pages/admin/InitializeDataPage'));

// Student Management Pages
const StudentsListPage = lazy(() => import('../pages/admin/students/StudentsListPage'));
const StudentFormPage = lazy(() => import('../pages/admin/students/StudentFormPage'));
const StudentDetailsPage = lazy(() => import('../pages/admin/students/StudentDetailsPage'));
const StudentImportPage = lazy(() => import('../pages/admin/StudentImportPage'));

// Super Admin Pages
const RolesPermissionsPage = lazy(() => import('../pages/admin/superadmin/RolesPermissionsPage'));
const AuditLogPage = lazy(() => import('../pages/admin/superadmin/AuditLogPage'));

// Nouveaux modules
const CalendarManagerPage = lazy(() => import('../pages/admin/CalendarManagerPage'));
const BulkBulletinPage = lazy(() => import('../pages/admin/BulkBulletinPage'));
const PaymentsPage = lazy(() => import('../pages/admin/PaymentsPage'));
const PartnersPage = lazy(() => import('../pages/admin/PartnersPage'));
const AnnouncementsPage = lazy(() => import('../pages/admin/AnnouncementsPage'));
const SystemConfigPage = lazy(() => import('../pages/admin/superadmin/SystemConfigPage'));

const AdminRoutes = () => {
  const { authState } = useAuth();

  if (!authState.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<RouteLoader />}>
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
          <Route path="import" element={<StudentImportPage />} />
          <Route path=":id" element={<StudentDetailsPage />} />
          <Route path=":id/edit" element={<StudentFormPage />} />
        </Route>

        {/* Calendrier & Bulletins */}
        <Route path="calendar" element={<CalendarManagerPage />} />
        <Route path="bulk-bulletins" element={<BulkBulletinPage />} />

        {/* Paiements, Partenaires, Annonces */}
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />

        {/* Super Admin Routes */}
        <Route path="roles" element={<RolesPermissionsPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="system-config" element={<SystemConfigPage />} />

        {/* Default Route */}
        <Route path="*" element={<AdminDashboardPage />} />
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
