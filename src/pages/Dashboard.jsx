import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Calendar, MessageCircle, CheckSquare,
  Bot, Bell, TrendingUp, Clock, CheckCircle, Settings, ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ActiveClassesWidget from '../components/ActiveClassesWidget';

const moduleCards = [
  { id: 'courses', title: 'Courses', icon: BookOpen, status: 'success', color: 'bg-blue-500', route: '/courses' },
  { id: 'students', title: 'Students', icon: Users, status: 'success', color: 'bg-green-500', route: '/students', roles: ['teacher', 'admin'] },
  { id: 'timetable', title: 'Timetable', icon: Calendar, status: 'warning', color: 'bg-orange-500', route: '/timetable' },
  { id: 'chat', title: 'Messages', icon: MessageCircle, status: 'success', color: 'bg-purple-500', route: '/chat' },
  { id: 'attendance', title: 'Attendance', icon: CheckSquare, status: 'success', color: 'bg-teal-500', route: '/attendance-manage' },
  { id: 'attendance-records', title: 'Attendance Records', icon: ClipboardList, status: 'success', color: 'bg-indigo-500', route: '/attendance-records', roles: ['teacher', 'admin'] },
  { id: 'user-management', title: 'User Management', icon: Settings, status: 'success', color: 'bg-red-500', route: '/user-management', roles: ['admin'] },
  { id: 'ai-assistant', title: 'AI Assistant', icon: Bot, status: 'success', color: 'bg-pink-500', route: '/ai-assistant' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
  
  const [stats, setStats] = useState({
    activeCourses: 0,
    totalStudents: 0,
    totalConversations: 0,
    attendanceRate: 0,
    loading: true
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [coursesRes, studentsRes, conversationsRes, attendanceRes] = await Promise.allSettled([
          api.getCourses(),
          api.getStudents(),
          api.getConversations(),
          api.getAttendance()
        ]);

        const courses = coursesRes.status === 'fulfilled' ? coursesRes.value : [];
        const students = studentsRes.status === 'fulfilled' ? studentsRes.value : [];
        const conversations = conversationsRes.status === 'fulfilled' ? conversationsRes.value : [];
        const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value : [];

        // Calculate attendance rate
        let attendanceRate = 0;
        if (attendance.length > 0) {
          const presentCount = attendance.filter(a => a.status === 'present').length;
          attendanceRate = Math.round((presentCount / attendance.length) * 100);
        }

        setStats({
          activeCourses: courses.length || 0,
          totalStudents: students.length || 0,
          totalConversations: conversations.length || 0,
          attendanceRate: attendanceRate,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardStats();
  }, []);

  const handleNavigate = (card) => {
    if (!card.route) return;
    if (card.id === 'students') {
      // students module is restricted in ProtectedRoute; navigation still allowed, fallback handled there
      navigate(card.route);
    } else {
      navigate(card.route);
    }
  };

  return (
    <div id="dashboard" className="page space-y-6">
      <div className="page-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening at your campus.</p>
        </div>
        <Button className="btn btn-outline">
          <Bell />
          Notifications
        </Button>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card hover-lift">
          <div className="stat-icon primary"><TrendingUp /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.loading ? '...' : `${stats.totalConversations}`}</div>
            <div className="stat-label">Total Conversations</div>
          </div>
        </div>

        <div className="stat-card glass-card hover-lift">
          <div className="stat-icon accent"><Users /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.loading ? '...' : stats.totalStudents}</div>
            <div className="stat-label">Active Students</div>
          </div>
        </div>

        <div className="stat-card glass-card hover-lift">
          <div className="stat-icon success"><Clock /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.loading ? '...' : stats.activeCourses}</div>
            <div className="stat-label">Active Courses</div>
          </div>
        </div>

        <div className="stat-card glass-card hover-lift">
          <div className="stat-icon info"><CheckCircle /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.loading ? '...' : `${stats.attendanceRate}%`}</div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {isTeacherOrAdmin && (
        <div className="mb-6">
          <ActiveClassesWidget />
        </div>
      )}

      <div className="module-grid">
        {moduleCards
          .filter(m => {
            // Filter cards based on user role
            if (!m.roles || m.roles.length === 0) return true;
            return m.roles.includes(userRole);
          })
          .map(m => {
            const Icon = m.icon;
            let description = '';
            let alert = '';

            // Dynamic descriptions and alerts based on real data
            switch (m.id) {
              case 'courses':
                description = `${stats.activeCourses} Active Courses`;
                alert = stats.activeCourses > 0 ? 'View all courses' : 'No courses yet';
                break;
              case 'students':
                description = `${stats.totalStudents} Enrolled`;
                alert = stats.totalStudents > 0 ? `${stats.totalStudents} total students` : 'No students yet';
                break;
              case 'timetable':
                description = 'Current Week';
                alert = 'Manage schedule';
                break;
              case 'chat':
                description = `${stats.totalConversations} Conversations`;
                alert = stats.totalConversations > 0 ? 'Check messages' : 'No conversations';
                break;
              case 'attendance':
                description = 'Live Tracking';
                alert = `${stats.attendanceRate}% average rate`;
                break;
              case 'attendance-records':
                description = 'Student Records';
                alert = 'View detailed records';
                break;
              case 'user-management':
                description = 'Manage Roles';
                alert = 'Update user permissions';
                break;
              case 'ai-assistant':
                description = 'Smart Helper';
                alert = 'Ready to assist';
                break;
              default:
                description = m.title;
                alert = 'Available';
            }

            return (
              <div key={m.id} className="module-card glass-card hover-lift" onClick={() => handleNavigate(m)}>
                <div className="module-header">
                  <div className={`module-icon ${m.color.replace('bg-','')}`}>
                    <Icon />
                  </div>
                  <div className="badge success">Active</div>
                </div>
                <div className="module-content">
                  <h3>{m.title}</h3>
                  <p>{description}</p>
                  <div className="module-alert">
                    <div className="alert-dot" />
                    <span>{alert}</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
