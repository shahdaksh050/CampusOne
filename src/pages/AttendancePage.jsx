import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, FileText, Download, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import api from '../services/api';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function AttendancePage() {
  const { userRole, userUid } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'history'

  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
  const isStudent = userRole === 'student';

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      if (isStudent) {
        fetchStudentAttendanceHistory();
        fetchStudentStats();
      } else {
        fetchCourseStudents();
        fetchAttendanceForDate();
        fetchCourseStats();
      }
    }
  }, [selectedCourse, selectedDate, isStudent]);

  async function fetchCourses() {
    try {
      setLoading(true);
      const data = await api.getCourses();
      const activeCourses = Array.isArray(data) ? data.filter(c => c.status === 'Active') : [];
      setCourses(activeCourses);
      if (activeCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(activeCourses[0]);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourseStudents() {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      const data = await api.getStudents();
      const allStudents = Array.isArray(data) ? data : [];
      
      // Filter students enrolled in this course
      const enrolledStudents = allStudents.filter(student => 
        student.courses?.some(course => String(course._id || course) === String(selectedCourse._id))
      );
      
      setStudents(enrolledStudents);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAttendanceForDate() {
    if (!selectedCourse || !selectedDate) return;
    
    try {
      const data = await api.getCourseAttendance(selectedCourse._id, selectedDate);
      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  }

  async function fetchCourseStats() {
    if (!selectedCourse) return;
    
    try {
      const data = await api.getCourseAttendanceStats(selectedCourse._id);
      setCourseStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function fetchStudentAttendanceHistory() {
    if (!selectedCourse || !userUid) return;
    
    try {
      setLoading(true);
      // Get current user's student record
      const studentsData = await api.getStudents();
      const currentStudent = studentsData.find(s => 
        s.email === userUid || s.firebaseUid === userUid
      );
      
      if (!currentStudent) {
        setAllAttendanceRecords([]);
        return;
      }

      // Fetch attendance records for this student in this course
      const data = await api.getStudentAttendance(currentStudent._id);
      const courseRecords = data.filter(record => 
        String(record.course?._id || record.course) === String(selectedCourse._id)
      );
      setAllAttendanceRecords(courseRecords);
    } catch (error) {
      console.error('Failed to fetch student attendance:', error);
      setAllAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudentStats() {
    if (!selectedCourse || !userUid) return;
    
    try {
      const studentsData = await api.getStudents();
      const currentStudent = studentsData.find(s => 
        s.email === userUid || s.firebaseUid === userUid
      );
      
      if (!currentStudent) return;

      const data = await api.getStudentAttendanceStats(currentStudent._id, selectedCourse._id);
      setStudentStats(data);
    } catch (error) {
      console.error('Failed to fetch student stats:', error);
    }
  }

  function getAttendanceStatus(studentId) {
    const record = attendanceRecords.find(r => String(r.student?._id) === String(studentId));
    return record?.status || null;
  }

  function setAttendanceStatus(studentId, status) {
    const existing = attendanceRecords.find(r => String(r.student?._id) === String(studentId));
    
    if (existing) {
      setAttendanceRecords(prev => 
        prev.map(r => 
          String(r.student?._id) === String(studentId) 
            ? { ...r, status } 
            : r
        )
      );
    } else {
      const student = students.find(s => String(s._id) === String(studentId));
      setAttendanceRecords(prev => [...prev, {
        student,
        status,
        date: selectedDate,
        course: selectedCourse
      }]);
    }
  }

  async function handleSaveAttendance() {
    if (!selectedCourse || !selectedDate) {
      toast.error('Please select a course and date');
      return;
    }

    try {
      setSaving(true);
      
      const records = students.map(student => ({
        studentId: student._id,
        status: getAttendanceStatus(student._id) || 'Present',
        notes: ''
      }));

      await api.markBulkAttendance({
        courseId: selectedCourse._id,
        date: selectedDate,
        records
      });

      toast.success('Attendance saved successfully!');
      await fetchAttendanceForDate();
      await fetchCourseStats();
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAllPresent() {
    students.forEach(student => {
      setAttendanceStatus(student._id, 'Present');
    });
    toast.success('All students marked as present');
  }

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const rollNumber = (student.rollNumber || '').toLowerCase();
    const email = (student.email || '').toLowerCase();
    return fullName.includes(query) || rollNumber.includes(query) || email.includes(query);
  });

  const statusCounts = {
    present: attendanceRecords.filter(r => r.status === 'Present').length,
    absent: attendanceRecords.filter(r => r.status === 'Absent').length,
    late: attendanceRecords.filter(r => r.status === 'Late').length,
    excused: attendanceRecords.filter(r => r.status === 'Excused').length
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {isStudent ? 'View your attendance records' : 'Track and manage student attendance'}
          </p>
        </div>
        {isTeacherOrAdmin && selectedCourse && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleMarkAllPresent}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Present
            </Button>
            <Button onClick={handleSaveAttendance} disabled={saving}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        )}
      </div>

      {loading && courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
              <p className="text-[var(--muted-foreground)]">Loading courses...</p>
            </div>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-[var(--muted-foreground)]" />
              <h3 className="text-xl font-semibold mb-2">No Active Courses</h3>
              <p className="text-[var(--muted-foreground)]">
                There are no active courses available at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats for Students */}
          {isStudent && studentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Total Classes</p>
                  <p className="text-2xl font-bold">{studentStats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Present</p>
                  <p className="text-2xl font-bold text-green-600">{studentStats.present}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{studentStats.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Attendance Rate</p>
                  <p className="text-2xl font-bold">{studentStats.attendanceRate}%</p>
                </div>
                <Users className="w-8 h-8 text-[var(--primary)]" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Stats for Teachers/Admin */}
      {isTeacherOrAdmin && courseStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Total Records</p>
                  <p className="text-2xl font-bold">{courseStats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Present</p>
                  <p className="text-2xl font-bold text-green-600">{courseStats.present}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{courseStats.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Attendance Rate</p>
                  <p className="text-2xl font-bold">{courseStats.attendanceRate}%</p>
                </div>
                <Users className="w-8 h-8 text-[var(--primary)]" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course</label>
              <select
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                value={selectedCourse?._id || ''}
                onChange={(e) => {
                  const course = courses.find(c => c._id === e.target.value);
                  setSelectedCourse(course);
                }}
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.courseCode} - {course.title}
                  </option>
                ))}
              </select>
            </div>

            {isTeacherOrAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border-[var(--border)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Search Students</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <Input
                      placeholder="Name, roll number, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-[var(--border)]"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      {attendanceRecords.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{statusCounts.present}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Present</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{statusCounts.absent}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Absent</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.late}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Late</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{statusCounts.excused}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Excused</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isStudent ? 'Your Attendance History' : `Students (${filteredStudents.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isStudent ? (
            loading ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                Loading attendance...
              </div>
            ) : allAttendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                No attendance records found for this course
              </div>
            ) : (
              <div className="space-y-2">
                {allAttendanceRecords.map(record => (
                  <div 
                    key={record._id}
                    className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      {record.notes && (
                        <div className="text-sm text-[var(--muted-foreground)] mt-1">
                          Note: {record.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {record.status === 'Present' && (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          ✓ Present
                        </span>
                      )}
                      {record.status === 'Absent' && (
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          ✗ Absent
                        </span>
                      )}
                      {record.status === 'Late' && (
                        <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          ⏰ Late
                        </span>
                      )}
                      {record.status === 'Excused' && (
                        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          📝 Excused
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            loading ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                Loading students...
              </div>
            ) : !selectedCourse ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Please select a course to view students</p>
              </div>
            ) : filteredStudents.length === 0 && searchQuery ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No students match your search</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No students enrolled in this course</p>
                <p className="text-sm mt-2">Students need to be enrolled in the course to mark attendance</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                No students found for this course
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map(student => {
                  const status = getAttendanceStatus(student._id);
                  
                  return (
                    <div 
                      key={student._id}
                      className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {student.rollNumber} • {student.email}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={status === 'Present' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAttendanceStatus(student._id, 'Present')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          variant={status === 'Absent' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAttendanceStatus(student._id, 'Absent')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Absent
                        </Button>
                        <Button
                          variant={status === 'Late' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAttendanceStatus(student._id, 'Late')}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Late
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
