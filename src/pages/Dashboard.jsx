import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Calendar, MessageCircle, MapPin,
  CreditCard, FileText, Bot, Bell, TrendingUp, Clock, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const moduleCards = [
  { id: 'courses', title: 'Courses', icon: BookOpen, description: '12 Active Courses', status: 'success', alert: '3 new assignments', color: 'bg-blue-500', route: '/courses' },
  { id: 'students', title: 'Students', icon: Users, description: '1,247 Enrolled', status: 'success', alert: '24 pending approvals', color: 'bg-green-500', route: '/students' },
  { id: 'timetable', title: 'Timetable', icon: Calendar, description: 'Current Week', status: 'warning', alert: '2 conflicts detected', color: 'bg-orange-500', route: '/timetable' },
  { id: 'chat', title: 'Messages', icon: MessageCircle, description: '47 Conversations', status: 'success', alert: '12 unread messages', color: 'bg-purple-500', route: '/chat' },
  { id: 'attendance', title: 'Attendance', icon: MapPin, description: 'Live Tracking', status: 'success', alert: '89% average rate', color: 'bg-teal-500', route: '/attendance' },
  { id: 'payments', title: 'Payments', icon: CreditCard, description: 'Fee Management', status: 'warning', alert: '156 pending fees', color: 'bg-red-500', route: '/payments' },
  { id: 'exams', title: 'Examinations', icon: FileText, description: 'Upcoming Tests', status: 'info', alert: '5 exams this week', color: 'bg-indigo-500', route: '/exams' },
  { id: 'ai-assistant', title: 'AI Assistant', icon: Bot, description: 'Smart Helper', status: 'success', alert: 'Ready to assist', color: 'bg-pink-500', route: '/ai-assistant' }
];

export default function Dashboard() {
  const navigate = useNavigate();

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
    <div id="dashboard" className="page active p-6 space-y-6">
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
            <div className="stat-value">94.2%</div>
            <div className="stat-label">Overall Performance</div>
          </div>
        </div>

        <div className="stat-card glass-card hover-lift">
          <div className="stat-icon accent"><Users /></div>
          <div className="stat-content">
            <div className="stat-value">1,247</div>
            <div className="stat-label">Active Students</div>
          </div>
        </div>

        <div className="stat-card glass-card hover-lift">
          <div className="stat-icon success"><Clock /></div>
          <div className="stat-content">
            <div className="stat-value">12</div>
            <div className="stat-label">Active Courses</div>
          </div>
        </div>

        <div className="stat-card glass-card hover-lift">
          <div className="stat-icon info"><CheckCircle /></div>
          <div className="stat-content">
            <div className="stat-value">89%</div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      <div className="module-grid">
        {moduleCards.map(m => {
          const Icon = m.icon;
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
                <p>{m.description}</p>
                <div className="module-alert">
                  <div className="alert-dot" />
                  <span>{m.alert}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
