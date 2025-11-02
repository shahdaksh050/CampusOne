import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import CourseManagement from './pages/CourseManagement';
import StudentRoster from './pages/StudentRoster';
import TimetablePlanner from './pages/TimetablePlanner';
import Messages from './pages/Messages';
import AttendanceMap from './pages/AttendanceMap';
import UserProfilePage from './pages/UserProfilePage';
import AuthPage from './pages/AuthPage';

function RouterConfig() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="timetable" element={<TimetablePlanner />} />
          <Route path="chat" element={<Messages />} />
          <Route path="attendance" element={<AttendanceMap />} />
          <Route path="payments" element={(
            <div className="p-6">
              <h1 className="text-2xl font-bold">Payment Management</h1>
              <p className="text-muted">Coming soon...</p>
            </div>
          )} />
          <Route path="exams" element={(
            <div className="p-6">
              <h1 className="text-2xl font-bold">Examination System</h1>
              <p className="text-muted">Coming soon...</p>
            </div>
          )} />
          <Route path="ai-assistant" element={(
            <div className="p-6">
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="text-muted">Coming soon...</p>
            </div>
          )} />
          <Route path="profile" element={<UserProfilePage />} />

          <Route element={<ProtectedRoute roles={['teacher']} />}>
            <Route path="students" element={<StudentRoster />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
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
