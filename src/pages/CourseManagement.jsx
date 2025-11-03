import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Search, SlidersHorizontal, Edit3, Trash2, BookOpen, Calendar, GraduationCap, BarChart3, Users, Clock, MoreVertical } from 'lucide-react';
import api from '../services/api';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/apiBase';

export default function CourseManagement() {
  const { userRole, userEmail } = useAuth();
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';

  const [courses, setCourses] = useState([]);
  const [studentCourseIds, setStudentCourseIds] = useState([]);
  const [enrollingId, setEnrollingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    courseCode: '',
    description: '',
    instructor: '',
    duration: '',
    credits: 3,
    level: 'Beginner',
    maxCapacity: 30,
    status: 'Active',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  // Load logged-in student's enrolled course IDs (to disable Enroll button when already enrolled)
  useEffect(() => {
    async function loadStudentEnrollments() {
      if (!isStudent || !userEmail) return;
      try {
  const data = await api.apiCall(`/students?search=${encodeURIComponent(userEmail)}`);
        const me = Array.isArray(data) ? data[0] : null;
        const ids = me ? (
          (Array.isArray(me.enrolledCourseIds) && me.enrolledCourseIds.length)
            ? me.enrolledCourseIds
            : (Array.isArray(me.courses) ? me.courses.map((c) => (typeof c === 'object' ? c._id : c)) : [])
        ) : [];
        setStudentCourseIds(ids);
      } catch (_) {
        // ignore
      }
    }
    loadStudentEnrollments();
  }, [isStudent, userEmail]);

  async function fetchCourses() {
    try {
      setLoading(true);
      const data = await api.getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load courses', err);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesSearch =
        !q ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.instructor || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || (c.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchesLevel = levelFilter === 'all' || (c.level || '') === levelFilter;
      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [courses, searchTerm, statusFilter, levelFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const activeCourses = courses.filter(c => (c.status || '').toLowerCase() === 'active').length;
    const totalCredits = courses.reduce((sum, c) => sum + (parseInt(c.credits) || 0), 0);
    const totalEnrollments = courses.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0);
    const totalCapacity = courses.reduce((sum, c) => sum + (c.maxCapacity || 0), 0);
    const avgProgress = totalCapacity > 0 ? Math.round((totalEnrollments / totalCapacity) * 100) : 0;
    
    return { totalCourses, activeCourses, totalCredits, avgProgress };
  }, [courses]);

  function openAddModal() {
    setEditingCourse(null);
    setFormData({ title: '', courseCode: '', description: '', instructor: '', duration: '', credits: 3, level: 'Beginner', maxCapacity: 30, status: 'Active' });
    setShowModal(true);
  }

  function openEditModal(course) {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      courseCode: course.courseCode || '',
      description: course.description || '',
      instructor: course.instructor || '',
      duration: course.duration || '',
      credits: course.credits || 3,
      level: course.level || 'Beginner',
      maxCapacity: course.maxCapacity || 30,
      status: course.status || 'Active',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingCourse(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isTeacher) return;
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse._id, formData);
        toast.success('Course updated');
      } else {
        await api.createCourse(formData);
        toast.success('Course created');
      }
      closeModal();
      fetchCourses();
    } catch (err) {
      console.error('Save course failed', err);
      toast.error('Failed to save course');
    }
  }

  async function handleDelete(course) {
    if (!isTeacher) return;
    if (!window.confirm(`Delete course "${course.title}"?`)) return;
    try {
      await api.deleteCourse(course._id);
      toast.success('Course deleted');
      fetchCourses();
    } catch (err) {
      console.error('Delete course failed', err);
      toast.error('Failed to delete course');
    }
  }

  const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
  const statusOptions = ['Active', 'Inactive', 'Completed'];

  async function handleEnroll(courseId) {
    try {
      setEnrollingId(courseId);
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebase_id_token') || ''}`,
        },
      });
      if (res.ok) {
        toast.success('Enrolled in course');
        setStudentCourseIds((prev) => Array.from(new Set([...(prev || []), courseId])));
        fetchCourses();
        // Reload to ensure we have the latest enrollment state
        if (isStudent && userEmail) {
          try {
            const data = await api.apiCall(`/students?search=${encodeURIComponent(userEmail)}`);
            const me = Array.isArray(data) ? data[0] : null;
            const ids = me ? (
              (Array.isArray(me.enrolledCourseIds) && me.enrolledCourseIds.length)
                ? me.enrolledCourseIds
                : (Array.isArray(me.courses) ? me.courses.map((c) => c._id || c) : [])
            ) : [];
            setStudentCourseIds(ids);
          } catch (err) {
            console.error('Failed to reload enrollments:', err);
          }
        }
      } else if (res.status === 409) {
        // Already enrolled — reflect state locally and notify gently
        setStudentCourseIds((prev) => Array.from(new Set([...(prev || []), courseId])));
        toast.info ? toast.info('Already enrolled') : toast.success('Already enrolled');
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Enrollment failed (status ${res.status})`);
      }
    } catch (err) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setEnrollingId(null);
    }
  }

  const statusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'bg-green-500/20 text-green-400 border border-green-500/30';
    if (s === 'completed') return 'bg-[var(--chart-2)]/20 text-[var(--chart-2)] border border-[var(--chart-2)]/30';
    return 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="page space-y-6">
      {/* Page Header with Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Course Management</h1>
            <p className="text-[var(--muted-foreground)] text-sm">Manage your academic courses</p>
          </div>
        </div>
        {isTeacher && (
          <Button onClick={openAddModal} className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-black font-semibold h-11 px-6 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Courses */}
        <Card className="glass-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[var(--muted-foreground)] text-sm mb-1">Total Courses</p>
                <h3 className="text-3xl font-bold text-[var(--foreground)]">{stats.totalCourses}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[var(--primary)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Courses */}
        <Card className="glass-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[var(--muted-foreground)] text-sm mb-1">Active</p>
                <h3 className="text-3xl font-bold text-[var(--foreground)]">{stats.activeCourses}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Credits */}
        <Card className="glass-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[var(--muted-foreground)] text-sm mb-1">Total Credits</p>
                <h3 className="text-3xl font-bold text-[var(--foreground)]">{stats.totalCredits}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Progress */}
        <Card className="glass-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[var(--muted-foreground)] text-sm mb-1">Avg Progress</p>
                <h3 className="text-3xl font-bold text-[var(--foreground)]">{stats.avgProgress}%</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
          <input
            type="search"
            placeholder="Search courses, instructors, or course codes..."
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <button className="h-12 px-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] inline-flex items-center gap-2 font-medium">
          <SlidersHorizontal className="w-4 h-4" />
          All Status
        </button>
      </div>

      {/* Course grid */}
      {filteredCourses.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <p className="text-[var(--muted-foreground)]">No courses found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = studentCourseIds?.includes(course._id);
            const enrollmentPct = course.maxCapacity > 0 
              ? Math.round(((course.currentEnrollment || 0) / course.maxCapacity) * 100) 
              : 0;
            
            return (
              <Card key={course._id} className="glass-card hover-lift overflow-hidden">
                <CardContent className="p-6">
                  {/* Header with Course Code and Actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-[var(--primary)]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--foreground)]">
                            {course.courseCode || `CS${course._id.slice(-3)}`}
                          </span>
                          <Badge className={statusBadgeClass(course.status)}>
                            {course.status || 'Active'}
                          </Badge>
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {course.credits || 3} Credits
                        </span>
                      </div>
                    </div>
                    {isTeacher && (
                      <button className="w-8 h-8 rounded-lg hover:bg-[var(--muted)] flex items-center justify-center">
                        <MoreVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                    )}
                  </div>

                  {/* Course Title */}
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                    {course.title}
                  </h3>

                  {/* Instructor and Schedule */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-[var(--muted-foreground)]" />
                      <span className="text-[var(--foreground)] font-medium">
                        {course.instructor || 'TBA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                      <span className="text-[var(--muted-foreground)]">
                        {course.schedule?.time || course.schedule?.days?.join(', ') || 'Mon, Wed, Fri - 9:00 AM'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-[var(--muted-foreground)]" />
                      <span className="text-[var(--muted-foreground)]">
                        {course.currentEnrollment || 0} students enrolled
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[var(--muted-foreground)]">Progress</span>
                      <span className="font-semibold text-[var(--foreground)]">{enrollmentPct}%</span>
                    </div>
                    <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--chart-2)] transition-all duration-300"
                        style={{ width: `${Math.min(enrollmentPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button className="flex-1 h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] font-medium transition-colors">
                      View Details
                    </button>
                    {isTeacher && (
                      <>
                        <button 
                          onClick={() => openEditModal(course)}
                          className="w-11 h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4 text-[var(--foreground)]" />
                        </button>
                        <button 
                          onClick={() => handleDelete(course)}
                          className="w-11 h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-red-500/10 hover:border-red-500 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    )}
                    {isStudent && (
                      isEnrolled ? (
                        <button 
                          disabled
                          className="flex-1 h-11 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] font-medium cursor-not-allowed"
                        >
                          Enrolled
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEnroll(course._id)}
                          disabled={enrollingId === course._id}
                          className="flex-1 h-11 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-black font-semibold transition-colors disabled:opacity-50"
                        >
                          {enrollingId === course._id ? 'Enrolling…' : 'Enroll Now'}
                        </button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isTeacher && showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)]">
            <CardHeader>
              <CardTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Title</label>
                  <Input
                    className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Course Code</label>
                  <Input
                    className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="e.g., CS101"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Credits</label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Description</label>
                  <textarea
                    className="w-full min-h-[96px] px-3 py-2 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Instructor</label>
                  <Input
                    className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Duration</label>
                  <Input
                    className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="e.g., 12 weeks"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Level</label>
                  <select
                    className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    {levelOptions.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Max Capacity</label>
                  <Input
                    type="number"
                    min={1}
                    className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Status</label>
                  <select
                    className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex gap-2 mt-2">
                  <Button type="submit" className="flex-1">{editingCourse ? 'Update' : 'Create'}</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
