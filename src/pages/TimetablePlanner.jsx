import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Edit3, Trash2, AlertTriangle } from "lucide-react";
import api from "../services/api";
import { toast } from "../components/Toast";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]; // display grid for weekdays
const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]; // form supports all
const timeSlots = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"
];

export default function TimetablePlanner() {
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
        setTimetable(tt);
        setCourses(cs);
      } catch (err) {
        console.error("Failed to load timetable/courses", err);
        toast.error("Failed to load timetable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="page active p-6 space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Timetable Planner</h1>
          <p className="page-subtitle">Manage weekly class schedule and timings</p>
        </div>
        <Button onClick={() => openAddModal()} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>

      {/* Weekly Schedule Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-6 border-b border-[var(--border)]">
              <div className="p-4 text-[var(--muted-foreground)]">Time</div>
              {weekDays.map((day) => (
                <div key={day} className="p-4 border-l border-[var(--border)] text-center font-medium">{day}</div>
              ))}
            </div>
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-6 border-b border-[var(--border)] min-h-[80px]">
                <div className="p-4 bg-[var(--muted)]/30 font-medium">{time}</div>
                {weekDays.map((day) => {
                  const classes = getClassesForSlot(day, time);
                  return (
                    <div key={day + time} className="border-l border-[var(--border)] relative p-2">
                      {classes.map((cls) => (
                        <div key={cls._id} className="timetable-class-block bg-[var(--primary)]/10 border-l-4 border-[var(--primary)] p-2 rounded relative hover-lift">
                          {cls.conflict && (
                            <AlertTriangle className="absolute top-1 right-1 w-4 h-4 text-red-600" />
                          )}
                          <div className="text-xs font-semibold">{cls.course?.title || "Course"}</div>
                          <div className="font-medium text-sm">{cls.instructor}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">Room {cls.room}</div>
                          <div className="text-xs flex justify-between">
                            <span>
                              {cls.startTime} - {cls.endTime}
                            </span>
                            <span className="text-[var(--muted-foreground)]">{cls.semester} {cls.academicYear}</span>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(cls)} title="Edit">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(cls)} title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {classes.length === 0 && (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddModal({ dayOfWeek: day, startTime: time })}
                          >
                            <Plus className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>{editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Course</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
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
                  <label className="block text-sm font-medium text-gray-700">Day</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
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
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <Input
                    placeholder="e.g., 9:00 AM"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <Input
                    placeholder="e.g., 10:30 AM"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <Input
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructor</label>
                  <Input
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <Input
                    placeholder="e.g., Fall"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <Input
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
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                </div>

                <div className="sm:col-span-2 flex gap-2 mt-2">
                  <Button type="submit" className="flex-1">{editingEntry ? "Update" : "Create"}</Button>
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
