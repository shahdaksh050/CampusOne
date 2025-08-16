import React from 'react';
import { Home, BookOpen, Users, Calendar, MessageCircle, MapPin, CreditCard, FileText, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import AvatarInitials from './AvatarInitials';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'attendance', label: 'Attendance', icon: MapPin },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'exams', label: 'Exams', icon: FileText },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
];

export default function Navigation({ currentPage, onPageChange, userRole, userEmail, onLogout }) {
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
        {navigationItems
          .filter(item => {
            if (userRole === 'student') {
              // Hide Student Roster for students
              return item.id !== 'students';
            }
            return true;
          })
          .map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onPageChange(item.id)}
              data-page={item.id}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="user-profile">
        <button className="w-full flex items-center justify-between" onClick={() => onPageChange && onPageChange('user-profile')}>
          <div className="flex items-center gap-3">
            <AvatarInitials fallback={userEmail || 'U'} size={36} />
            <div className="profile-info text-left">
              <p className="profile-name">{userEmail || 'Profile'}</p>
              <p className="profile-role">{userRole === 'teacher' ? 'Teacher' : userRole === 'student' ? 'Student' : 'Guest'}</p>
            </div>
          </div>
        </button>
        {onLogout && (
          <button className="mt-3 nav-item" onClick={onLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
}
