import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RouteLoader from '../components/common/RouteLoader';

// Pages
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const AcademicManagerPage = lazy(() => import('../pages/admin/AcademicManagerPage'));
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

// Professor & Department Pages
const ProfessorsListPage = lazy(() => import('../pages/admin/ProfessorsListPage'));
const AuditLogNewPage = lazy(() => import('../pages/admin/AuditLogPage'));
const AccountStatusPage = lazy(() => import('../pages/admin/AccountStatusPage'));
const LevelsAndSemestersPage = lazy(() => import('../pages/admin/LevelsAndSemestersPage'));
const SubjectsPage = lazy(() => import('../pages/admin/SubjectsPage'));
const DocumentTemplatesPage = lazy(() => import('../pages/admin/DocumentTemplatesPage'));
const ValidationQueuePage = lazy(() => import('../pages/admin/ValidationQueuePage'));
const AllowedEmailsPage = lazy(() => import('../pages/admin/AllowedEmailsPage'));

// Super Admin Pages
const RolesPermissionsPage = lazy(() => import('../pages/admin/superadmin/RolesPermissionsPage'));
const AuditLogPage = lazy(() => import('../pages/admin/superadmin/AuditLogPage'));

// Nouveaux modules
const CalendarManagerPage = lazy(() => import('../pages/admin/CalendarManagerPage'));
const BulkBulletinPage = lazy(() => import('../pages/admin/BulkBulletinPage'));
const PaymentsPage = lazy(() => import('../pages/admin/PaymentsPage'));
const StagesPartnersPage = lazy(() => import('../pages/admin/StagesPartnersPage'));
const AnnouncementsPage = lazy(() => import('../pages/admin/AnnouncementsPage'));
const SystemConfigPage = lazy(() => import('../pages/admin/superadmin/SystemConfigPage'));

// Weekly Schedules
const WeeklySchedulesPage = lazy(() => import('../pages/admin/WeeklySchedulesPage'));

// CMS Pages
const CMSAdminPage = lazy(() => import('../pages/admin/CMSAdminPage'));
const CMSPermissionsPage = lazy(() => import('../pages/admin/CMSPermissionsPage'));

const AdminRoutes = () => {
  const { authState } = useAuth();

  if (!authState.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route index element={<AdminDashboardPage />} />
        <Route path="academic-structure" element={<AcademicManagerPage />} />
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

        {/* Professor & Department Routes */}
        <Route path="professors" element={<ProfessorsListPage />} />
        <Route path="audit-log-new" element={<AuditLogNewPage />} />
        <Route path="account-status" element={<AccountStatusPage />} />
        <Route path="levels-semesters" element={<LevelsAndSemestersPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="document-templates" element={<DocumentTemplatesPage />} />
        <Route path="validation-queue" element={<ValidationQueuePage />} />
        <Route path="allowed-emails" element={<AllowedEmailsPage />} />

        {/* Calendrier & Bulletins */}
        <Route path="calendar" element={<CalendarManagerPage />} />
        <Route path="weekly-schedules" element={<WeeklySchedulesPage />} />
        <Route path="bulk-bulletins" element={<BulkBulletinPage />} />

        {/* Paiements, Partenaires, Annonces */}
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="partners" element={<StagesPartnersPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />

        {/* Super Admin Routes */}
        <Route path="roles" element={<RolesPermissionsPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="system-config" element={<SystemConfigPage />} />

        {/* CMS Routes */}
        <Route path="cms" element={<CMSAdminPage />} />
        <Route path="cms-permissions" element={<CMSPermissionsPage />} />

        {/* Default Route */}
        <Route path="*" element={<AdminDashboardPage />} />
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
