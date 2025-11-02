import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Mail, Phone, Edit3, Trash2, Plus, Search, SlidersHorizontal, Download, Settings } from "lucide-react";
import AddStudentModal from "../components/AddStudentModal";
import api from "../services/api";
import { toast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-800",
  Graduated: "bg-blue-100 text-blue-800",
  Dropped: "bg-red-100 text-red-800",
  Suspended: "bg-yellow-100 text-yellow-800",
};

export default function StudentRoster() {
  const { userRole } = useAuth();
  const isTeacher = userRole === 'teacher';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(null);
  // Manage enrollments modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollStudent, setEnrollStudent] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, courseFilter, yearFilter, statusFilter]);

  async function fetchStudents() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (courseFilter) params.set('course', courseFilter);
      if (yearFilter) params.set('year', yearFilter);
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.apiCall(`/students?${params.toString()}`);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch students failed", err);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingStudent(null);
    setFormData({ studentId: "", program: "", firstName: "", lastName: "", email: "", phone: "", year: 1, status: "Active" });
    setShowModal(true);
  }

  async function openEnrollmentsModal(s) {
    try {
      setEnrollStudent(s);
      setShowEnrollModal(true);
      // Load courses
      const all = await api.getCourses();
      setCoursesList(Array.isArray(all) ? all : []);
      // Seed selected from student.courses
      const seed = (s.courses || []).map(c => c._id);
      setSelectedCourseIds(seed);
    } catch (err) {
      toast.error('Failed to load courses');
    }
  }

  function openEditModal(s) {
    setEditingStudent(s);
    setFormData({
      studentId: s.studentId || "",
      program: s.program || "",
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      email: s.email || "",
      phone: s.phone || "",
      year: s.year || 1,
      status: s.status || "Active",
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingStudent(null);
    setFormData(null);
  }

  async function handleCreateStudent(payload) {
    try {
      await api.createStudent(payload);
      toast.success("Student created");
      closeModal();
      fetchStudents();
    } catch (err) {
      console.error("Create student failed", err);
      toast.error("Failed to create student");
    }
  }

  async function handleUpdateStudent(e) {
    e.preventDefault();
    try {
      await api.updateStudent(editingStudent._id, formData);
      toast.success("Student updated");
      closeModal();
      fetchStudents();
    } catch (err) {
      console.error("Update student failed", err);
      toast.error("Failed to update student");
    }
  }

  async function handleDeleteStudent(s) {
    if (!window.confirm(`Delete student ${s.firstName} ${s.lastName}?`)) return;
    try {
      await api.deleteStudent(s._id);
      toast.success("Student deleted");
      fetchStudents();
    } catch (err) {
      console.error("Delete student failed", err);
      toast.error("Failed to delete student");
    }
  }

  const filtered = useMemo(() => students, [students]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="page active p-6 space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Roster</h1>
          <p className="page-subtitle">Manage student profiles, enrollments, and information</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          {isTeacher && (
            <button onClick={openAddModal} className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Card */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="search"
                placeholder="Search students by name, roll number, email, or course..."
                className="w-full h-11 pl-9 pr-3 rounded-md bg-[var(--input-background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <select className="h-11 px-3 rounded-md bg-[var(--input-background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                <option value="">All Courses</option>
              </select>
              <select className="h-11 px-3 rounded-md bg-[var(--input-background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option value="">All Years</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              <select className="h-11 px-3 rounded-md bg-[var(--input-background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="h-11 w-11 inline-flex items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="glass-card">
        <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--card)] text-[var(--muted-foreground)]">
            <tr>
              <th className="text-left px-4 py-3 border-b border-[var(--border)]">Avatar</th>
              <th className="text-left px-4 py-3 border-b border-[var(--border)]">Name</th>
              <th className="text-left px-4 py-3 border-b border-[var(--border)]">Roll Number</th>
              <th className="text-left px-4 py-3 border-b border-[var(--border)]">Program</th>
              <th className="text-left px-4 py-3 border-b border-[var(--border)]">Enrolled Courses</th>
              <th className="text-left px-4 py-3 border-b border-[var(--border)]">Year</th>
              <th className="text-left px-4 py-3 border-b border-[var(--border)]">Contact</th>
              <th className="text-left px-4 py-3 border-b border-[var(--border)]">Status</th>
              {isTeacher && <th className="text-left px-4 py-3 border-b border-[var(--border)]">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s._id} className="bg-[var(--card)] text-[var(--card-foreground)] border-b border-[var(--border)]">
                <td className="px-4 py-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-black"
                       style={{ background: 'linear-gradient(135deg, var(--chart-1), var(--chart-2))' }}>
                    {`${(s.firstName || "")[0] || "?"}${(s.lastName || "")[0] || ""}`.toUpperCase()}
                  </div>
                </td>
                <td className="px-4 py-3">{`${s.firstName || ''} ${s.lastName || ''}`.trim()}</td>
                <td className="px-4 py-3">{s.rollNumber}</td>
                <td className="px-4 py-3">{s.program}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {(s.courses || []).map((c) => (
                      <span key={c._id} className="px-2 py-0.5 rounded-md bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium border border-[var(--border)]">
                        {c.title}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{s.year}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>
                    {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`${STATUS_COLORS[s.status] || 'bg-gray-500 text-white'} inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold`}>
                    {s.status}
                  </span>
                </td>
                {isTeacher && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" onClick={() => openEnrollmentsModal(s)} title="Manage Enrollments"><Settings /></Button>
                      <Button variant="ghost" onClick={() => openEditModal(s)} title="Edit"><Edit3 /></Button>
                      <Button variant="ghost" onClick={() => handleDeleteStudent(s)} title="Delete"><Trash2 /></Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Modals */}
      {showModal && !editingStudent && (
        <AddStudentModal onClose={closeModal} onCreateStudent={handleCreateStudent} />
      )}
      {showModal && editingStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle>Edit Student</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Student ID</label>
                  <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                         value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Program</label>
                  <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                         value={formData.program} onChange={(e) => setFormData({ ...formData, program: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">First Name</label>
                  <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                         value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Last Name</label>
                  <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                         value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Email</label>
                  <Input type="email" className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                         value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Phone</label>
                  <Input className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                         value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Year</label>
                  <select className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                          value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}>
                    {[1,2,3,4].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--muted-foreground)]">Status</label>
                  <select className="w-full h-11 px-3 rounded-md bg-[var(--input)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]"
                          value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2 flex gap-2 mt-2">
                  <Button type="submit" className="flex-1">Update</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    {/* Enrollments Modal */}
      {showEnrollModal && enrollStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle>Manage Enrollments – {`${enrollStudent.firstName} ${enrollStudent.lastName}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[50vh] overflow-y-auto space-y-2 border border-[var(--border)] rounded-md p-3 bg-[var(--background)]/40">
                {coursesList.map((c) => {
                  const checked = selectedCourseIds.includes(c._id);
                  return (
                    <label key={c._id} className="flex items-center gap-3 p-2 rounded hover:bg-[var(--muted)]/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedCourseIds((prev) => e.target.checked ? [...prev, c._id] : prev.filter(id => id !== c._id));
                        }}
                      />
                      <span className="flex-1">
                        <span className="font-medium">{c.title}</span>
                        <span className="text-[var(--muted-foreground)] ml-2">{c.instructor}</span>
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">Cap {c.currentEnrollment || 0}/{c.maxCapacity}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={async () => {
                    try {
                      await api.apiCall(`/students/${enrollStudent._id}/enrollments`, {
                        method: 'PUT',
                        body: JSON.stringify({ courseIds: selectedCourseIds }),
                      });
                      toast.success('Enrollments updated');
                      setShowEnrollModal(false);
                      setEnrollStudent(null);
                      fetchStudents();
                    } catch (err) {
                      toast.error('Failed to update enrollments');
                    }
                  }}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setShowEnrollModal(false); setEnrollStudent(null); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
