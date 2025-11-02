import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Users, Calendar, MessageCircle, MapPin, CreditCard, FileText, Bot, LogOut } from 'lucide-react';
import AvatarInitials from './AvatarInitials';
import { useAppStore } from '../store/appStore';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'courses', label: 'Courses', icon: BookOpen, path: '/courses' },
  { id: 'students', label: 'Students', icon: Users, path: '/students', roles: ['teacher'] },
  { id: 'timetable', label: 'Timetable', icon: Calendar, path: '/timetable' },
  { id: 'chat', label: 'Messages', icon: MessageCircle, path: '/chat' },
  { id: 'attendance', label: 'Attendance', icon: MapPin, path: '/attendance' },
  { id: 'payments', label: 'Payments', icon: CreditCard, path: '/payments' },
  { id: 'exams', label: 'Exams', icon: FileText, path: '/exams' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, path: '/ai-assistant' },
];

export default function Navigation({ userRole, userEmail, onLogout, onNavigateComplete }) {
  const navigate = useNavigate();
  const { sidebarOpen, closeSidebar } = useAppStore();

  const filteredItems = navigationItems.filter((item) => {
    if (!item.roles?.length) return true;
    return item.roles.includes(userRole);
  });

  const handleProfileNavigate = () => {
    navigate('/profile');
    onNavigateComplete?.();
    if (sidebarOpen) closeSidebar();
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo">C1</div>
          <div className="logo-text">
            <h1>CampusOne</h1>
            <p>Student Management</p>
          </div>
        </div>
      </div>

      <div className="nav-items">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                onNavigateComplete?.();
                if (sidebarOpen) closeSidebar();
              }}
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="user-profile">
        <button className="w-full flex items-center justify-between" onClick={handleProfileNavigate}>
          <div className="flex items-center gap-3">
            <AvatarInitials fallback={userEmail || 'U'} size={36} />
            <div className="profile-info text-left">
              <p className="profile-name">{userEmail || 'Profile'}</p>
              <p className="profile-role">{userRole === 'teacher' ? 'Teacher' : userRole === 'student' ? 'Student' : 'Guest'}</p>
            </div>
          </div>
        </button>
        {onLogout && (
          <button className="mt-3 nav-item flex items-center gap-2" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
