import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Search, SlidersHorizontal, Edit3, Trash2 } from 'lucide-react';
import api from '../services/api';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

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
    description: '',
    instructor: '',
    duration: '',
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
            : (Array.isArray(me.courses) ? me.courses.map((c) => c._id) : [])
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

  function openAddModal() {
    setEditingCourse(null);
    setFormData({ title: '', description: '', instructor: '', duration: '', level: 'Beginner', maxCapacity: 30, status: 'Active' });
    setShowModal(true);
  }

  function openEditModal(course) {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      instructor: course.instructor || '',
      duration: course.duration || '',
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/courses/${courseId}/enroll`, {
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
    if (s === 'active') return 'bg-green-100 text-green-800';
    if (s === 'completed') return 'bg-[var(--chart-2)] text-black';
    return 'bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-white';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
      {/* Header: Search / Filters / Add button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="search"
              placeholder="Search courses, codes, or instructors..."
              className="w-full h-11 pl-9 pr-3 rounded-md bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="hidden md:flex items-center gap-3">
            <select
              className="h-11 px-3 rounded-md bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              className="h-11 px-3 rounded-md bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              {levelOptions.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button className="h-11 w-11 inline-flex items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Course */}
        {isTeacher && (
          <button onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-md px-4 h-11 bg-[var(--primary)] text-black hover:opacity-90 font-semibold">
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        )}
      </div>

      {/* Course grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-[var(--muted-foreground)]">No courses found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course._id} className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-md p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-[var(--muted-foreground)] mb-1">{course._id.slice(-6)}</div>
                  <h3 className="text-lg font-bold leading-tight text-[var(--foreground)]">{course.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${statusBadgeClass(course.status)}`}>{course.status || 'Active'}</span>
                  {isTeacher && (
                    <>
                      <button className="p-2 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)]" title="Edit" onClick={() => openEditModal(course)}>
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)]" title="Delete" onClick={() => handleDelete(course)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div className="text-[var(--muted-foreground)]">
                  <span className="opacity-80">Instructor:</span> <span className="ml-1">{course.instructor}</span>
                </div>
                <div className="text-[var(--muted-foreground)]">
                  <span className="opacity-80">Level:</span> <span className="ml-1">{course.level}</span>
                </div>
                <div className="text-[var(--muted-foreground)]">
                  <span className="opacity-80">Duration:</span> <span className="ml-1">{course.duration}</span>
                </div>
                <div className="text-[var(--muted-foreground)]">
                  <span className="opacity-80">Capacity:</span> <span className="ml-1">{course.currentEnrollment || 0}/{course.maxCapacity}</span>
                </div>
                <div className="col-span-2 text-[var(--muted-foreground)]">
                  <span className="opacity-80">Description:</span> <span className="ml-1">{course.description}</span>
                </div>
              </div>

              {isStudent && (
                <div className="mt-2">
                  {studentCourseIds?.includes(course._id) ? (
                    <button disabled className="rounded-md px-3 py-2 bg-gray-500 text-white text-sm font-semibold">Enrolled</button>
                  ) : (
                    <button onClick={() => handleEnroll(course._id)} disabled={enrollingId === course._id} className="rounded-md px-3 py-2 bg-[var(--primary)] text-black hover:opacity-90 transition text-sm font-semibold">
                      {enrollingId === course._id ? 'Enrolling…' : 'Enroll'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
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
