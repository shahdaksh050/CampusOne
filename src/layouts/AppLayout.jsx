import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';

export default function AppLayout() {
  const { userRole, userEmail, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useAppStore();

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Navigation userRole={userRole} userEmail={userEmail} onLogout={logout} onNavigateComplete={closeSidebar} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
