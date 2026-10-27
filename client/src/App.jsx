import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Staff from './pages/Staff';
import StudentAttendance from './pages/StudentAttendance';
import StaffAttendance from './pages/StaffAttendance';
import Examinations from './pages/Examinations';
import Fees from './pages/Fees';
import Academic from './pages/Academic';
import Timetable from './pages/Timetable';
import Assignments from './pages/Assignments';
import StudyMaterials from './pages/StudyMaterials';
import LeaveManagement from './pages/LeaveManagement';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Super Admin Pages
import ManageAdmins from './pages/superadmin/ManageAdmins';
import ClassWingsOverview from './pages/superadmin/ClassWingsOverview';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  if (!user) return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />

        {/* Super Admin Management Routes */}
        <Route path="/superadmin/admins" element={<ProtectedRoute roles={['superadmin']}><ManageAdmins /></ProtectedRoute>} />
        <Route path="/superadmin/overview" element={<ProtectedRoute roles={['superadmin']}><ClassWingsOverview /></ProtectedRoute>} />

        {/* School Operations (Super Admin is strictly excluded from these) */}
        <Route path="/students" element={<ProtectedRoute roles={['admin', 'teacher']}><Students /></ProtectedRoute>} />
        <Route path="/students/:id" element={<StudentProfile />} />
        <Route path="/staff" element={<ProtectedRoute roles={['admin']}><Staff /></ProtectedRoute>} />
        <Route path="/attendance/students" element={<ProtectedRoute roles={['admin', 'teacher', 'student', 'parent']}><StudentAttendance /></ProtectedRoute>} />
        <Route path="/attendance/staff" element={<ProtectedRoute roles={['admin']}><StaffAttendance /></ProtectedRoute>} />
        <Route path="/examinations" element={<ProtectedRoute roles={['admin', 'teacher', 'student', 'parent']}><Examinations /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute roles={['admin', 'accountant', 'student', 'parent']}><Fees /></ProtectedRoute>} />
        <Route path="/academic" element={<ProtectedRoute roles={['admin']}><Academic /></ProtectedRoute>} />
        <Route path="/timetable" element={<ProtectedRoute roles={['admin', 'teacher', 'student', 'parent']}><Timetable /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute roles={['admin', 'teacher', 'student', 'parent']}><Assignments /></ProtectedRoute>} />
        <Route path="/materials" element={<ProtectedRoute roles={['admin', 'teacher', 'student', 'parent']}><StudyMaterials /></ProtectedRoute>} />
        <Route path="/leaves" element={<ProtectedRoute roles={['admin', 'teacher', 'staff']}><LeaveManagement /></ProtectedRoute>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<ProtectedRoute roles={['admin', 'accountant']}><Reports /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', borderRadius: '10px' }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
