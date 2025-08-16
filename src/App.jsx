import React, { useState } from 'react';
import Navigation from './components/Navigation.jsx';
import Dashboard from './pages/Dashboard';
import CourseManagement from './pages/CourseManagement';
import StudentRoster from './pages/StudentRoster';
import TimetablePlanner from './pages/TimetablePlanner';
import ChatWindow from './pages/ChatWindow';
import AttendanceMap from './pages/AttendanceMap';
import UserProfilePage from './pages/UserProfilePage';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

function AppShell() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isAuthenticated, isLoadingAuth, userRole, userEmail, logout } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} userRole={userRole} userEmail={userEmail} onLogout={logout} />
      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'courses' && <CourseManagement />}
        {currentPage === 'students' && <StudentRoster />}
        {currentPage === 'timetable' && <TimetablePlanner />}
        {currentPage === 'chat' && <ChatWindow />}
        {currentPage === 'attendance' && <AttendanceMap />}
        {currentPage === 'user-profile' && <UserProfilePage />}
        {currentPage === 'payments' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Payment Management</h1>
            <p className="text-muted">Coming soon...</p>
          </div>
        )}
        {currentPage === 'exams' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Examination System</h1>
            <p className="text-muted">Coming soon...</p>
          </div>
        )}
        {currentPage === 'ai-assistant' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-muted">Coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}
