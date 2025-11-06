import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Eager load small/critical pages
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import UserProfilePage from './pages/UserProfilePage';

// Lazy load heavy pages to reduce initial bundle
const CourseManagement = lazy(() => import('./pages/CourseManagement'));
const StudentRoster = lazy(() => import('./pages/StudentRoster'));
const TimetablePlanner = lazy(() => import('./pages/TimetablePlanner'));
const Messages = lazy(() => import('./pages/Messages'));
const AttendanceMap = lazy(() => import('./pages/AttendanceMap'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const StudentAttendanceRecords = lazy(() => import('./pages/StudentAttendanceRecords'));
const UserRoleManagement = lazy(() => import('./pages/UserRoleManagement'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '400px',
    color: 'var(--foreground)'
  }}>
    Loading...
  </div>
);

function RouterConfig() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="timetable" element={<TimetablePlanner />} />
            <Route path="chat" element={<Messages />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="attendance-manage" element={<AttendancePage />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="profile" element={<UserProfilePage />} />

            <Route element={<ProtectedRoute roles={['teacher', 'admin']} />}>
              <Route path="students" element={<StudentRoster />} />
              <Route path="attendance-records" element={<StudentAttendanceRecords />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="user-management" element={<UserRoleManagement />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <RouterConfig />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
