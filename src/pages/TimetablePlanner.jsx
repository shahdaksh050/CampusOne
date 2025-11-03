import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Edit3, Trash2, AlertTriangle } from "lucide-react";
import api from "../services/api";
import { toast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]; // display grid for weekdays
const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]; // form supports all
const timeSlots = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"
];

export default function TimetablePlanner() {
  const { userRole, userUid } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    course: "",
    dayOfWeek: "Monday",
    startTime: "",
    endTime: "",
    room: "",
    instructor: "",
    semester: "",
    academicYear: "",
    isActive: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [tt, cs] = await Promise.all([api.getTimetable(), api.getCourses()]);
        
        // Filter courses based on user role
        let filteredCourses = cs;
        const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
        
        if (!isTeacherOrAdmin && userRole === 'student') {
          // For students, only show courses they're enrolled in
          try {
            const students = await api.getStudents();
            const currentStudent = students.find(s => 
              s.email === userUid || s.firebaseUid === userUid
            );
            
            if (currentStudent && currentStudent.courses) {
              const enrolledCourseIds = currentStudent.courses.map(c => 
                typeof c === 'object' ? c._id : c
              );
              filteredCourses = cs.filter(course => 
                enrolledCourseIds.includes(course._id)
              );
            } else {
              filteredCourses = [];
            }
          } catch (err) {
            console.error("Failed to fetch student enrollment", err);
            filteredCourses = [];
          }
        }
        
        // Filter timetable entries to match filtered courses
        const filteredCourseIds = filteredCourses.map(c => c._id);
        const filteredTimetable = tt.filter(entry => {
          const courseId = typeof entry.courseId === 'object' ? entry.courseId._id : entry.courseId;
          return filteredCourseIds.includes(courseId);
        });
        
        setTimetable(filteredTimetable);
        setCourses(filteredCourses);
      } catch (err) {
        console.error("Failed to load timetable/courses", err);
        toast.error("Failed to load timetable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userRole, userUid]);

  const getClassesForSlot = (day, time) => timetable.filter((cls) => cls.dayOfWeek === day && (cls.startTime || "").trim() === time);

  const openAddModal = (preset = {}) => {
    setEditingEntry(null);
    setFormData({
      course: preset.course || "",
      dayOfWeek: preset.dayOfWeek || "Monday",
      startTime: preset.startTime || "",
      endTime: preset.endTime || "",
      room: preset.room || "",
      instructor: preset.instructor || "",
      semester: preset.semester || "",
      academicYear: preset.academicYear || "",
      isActive: preset.isActive ?? true,
    });
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData({
      course: (entry.course && entry.course._id) || entry.course || "",
      dayOfWeek: entry.dayOfWeek || "Monday",
      startTime: entry.startTime || "",
      endTime: entry.endTime || "",
      room: entry.room || "",
      instructor: entry.instructor || "",
      semester: entry.semester || "",
      academicYear: entry.academicYear || "",
      isActive: entry.isActive ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.course) {
        toast.warning("Please select a course");
        return;
      }
      if (editingEntry) {
        await api.updateTimetableEntry(editingEntry._id, formData);
        toast.success("Timetable updated");
      } else {
        await api.createTimetableEntry(formData);
        toast.success("Timetable created");
      }
      closeModal();
      const tt = await api.getTimetable();
      setTimetable(tt);
    } catch (err) {
      console.error("Save timetable failed", err);
      toast.error("Failed to save timetable");
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete timetable entry for ${entry?.course?.title || "course"} on ${entry.dayOfWeek} at ${entry.startTime}?`)) return;
    try {
      await api.deleteTimetableEntry(entry._id);
      toast.success("Timetable entry deleted");
      const tt = await api.getTimetable();
      setTimetable(tt);
    } catch (err) {
      console.error("Delete timetable failed", err);
      toast.error("Failed to delete timetable entry");
    }
  };

  const courseOptions = useMemo(() => courses.map((c) => ({ value: c._id, label: c.title })), [courses]);

  if (loading) {
    return (
      <div className="page">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

  return (
    <div className="page space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Timetable Planner</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {isTeacherOrAdmin 
              ? 'Manage weekly class schedule and timings' 
              : 'View your weekly class schedule'}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <Button onClick={() => openAddModal()} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" /> New Entry
          </Button>
        )}
      </div>

      {/* Weekly Schedule Card */}
      <Card className="glass-card shadow-lg">
        <CardHeader className="border-b border-[var(--border)]">
          <CardTitle className="text-xl">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-6 border-b-2 border-[var(--border)] bg-[var(--primary)] text-white sticky top-0 z-10">
              <div className="p-4 font-semibold text-center border-r border-white/20">Time</div>
              {weekDays.map((day, idx) => (
                <div key={day} className={`p-4 text-center font-semibold ${idx < weekDays.length - 1 ? 'border-r border-white/20' : ''}`}>{day}</div>
              ))}
            </div>
            {timeSlots.map((time, tidx) => (
              <div key={time} className={`grid grid-cols-6 ${tidx < timeSlots.length - 1 ? 'border-b' : ''} border-[var(--border)] min-h-[100px]`}>
                <div className="p-4 bg-[var(--muted)] font-medium text-[var(--muted-foreground)] flex items-center justify-center border-r border-[var(--border)]">{time}</div>
                {weekDays.map((day, didx) => {
                  const classes = getClassesForSlot(day, time);
                  return (
                    <div key={day + time} className={`${didx < weekDays.length - 1 ? 'border-r' : ''} border-[var(--border)] relative p-2 bg-[var(--background)] hover:bg-[var(--accent)] transition-colors`}>
                      {classes.map((cls) => (
                        <div key={cls._id} className="timetable-class-block bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 border-l-4 border-[var(--primary)] p-3 rounded-lg shadow-sm relative hover:shadow-md transition-all duration-200 mb-2">
                          {cls.conflict && (
                            <AlertTriangle className="absolute top-2 right-2 w-4 h-4 text-red-600" />
                          )}
                          <div className="text-xs font-semibold text-[var(--primary)] mb-1">{cls.course?.courseCode || "CODE"}</div>
                          <div className="font-semibold text-sm text-[var(--foreground)] mb-1">{cls.course?.title || "Course"}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mb-1">
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium">{cls.instructor}</span>
                            </span>
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)] mb-1">
                            📍 {cls.room}
                          </div>
                          <div className="text-xs flex justify-between items-center mt-2 pt-2 border-t border-[var(--border)]">
                            <span className="font-medium text-[var(--foreground)]">
                              {cls.startTime} - {cls.endTime}
                            </span>
                          </div>
                          {isTeacherOrAdmin && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity bg-white/90 rounded-md p-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditModal(cls)} title="Edit">
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(cls)} title="Delete">
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {classes.length === 0 && isTeacherOrAdmin && (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                            onClick={() => openAddModal({ dayOfWeek: day, startTime: time })}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Class
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-[var(--border)]">
              <CardTitle className="text-xl font-semibold">
                {editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Course *</label>
                  <select
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    required
                  >
                    <option value="" disabled>
                      Select a course
                    </option>
                    {courseOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Day *</label>
                  <select
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  >
                    {allDays.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Room *</label>
                  <Input
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    placeholder="e.g., Room 101"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Start Time *</label>
                  <Input
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    placeholder="e.g., 9:00 AM"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">End Time *</label>
                  <Input
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    placeholder="e.g., 10:30 AM"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Instructor *</label>
                  <Input
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    placeholder="e.g., Dr. Smith"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Semester *</label>
                  <Input
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    placeholder="e.g., Fall 2025"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Academic Year *</label>
                  <Input
                    className="border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    placeholder="e.g., 2024/2025"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={!!formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <label htmlFor="isActive" className="text-sm text-[var(--foreground)]">Active</label>
                </div>

                <div className="sm:col-span-2 flex gap-3 mt-4">
                  <Button type="submit" className="flex-1">
                    {editingEntry ? "Update Entry" : "Create Entry"}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
