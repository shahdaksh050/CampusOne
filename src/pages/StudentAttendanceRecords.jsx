import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Download, Filter, TrendingDown, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function StudentAttendanceRecords() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailedRecords, setDetailedRecords] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

  useEffect(() => {
    if (!isTeacherOrAdmin) {
      toast.error('Access denied. Teacher or Admin role required.');
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [isTeacherOrAdmin, navigate]);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery, selectedCourse]);

  async function fetchData() {
    try {
      setLoading(true);
      const [recordsData, coursesData] = await Promise.all([
        api.getAllStudentRecords(),
        api.getCourses()
      ]);
      setRecords(recordsData);
      setCourses(coursesData.filter(c => c.status === 'Active'));
    } catch (error) {
      console.error('Failed to fetch records:', error);
      toast.error('Failed to load student records');
    } finally {
      setLoading(false);
    }
  }

  function filterRecords() {
    let filtered = [...records];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => {
        const fullName = `${record.student.firstName} ${record.student.lastName}`.toLowerCase();
        const email = record.student.email.toLowerCase();
        const rollNumber = (record.student.rollNumber || '').toLowerCase();
        return fullName.includes(query) || email.includes(query) || rollNumber.includes(query);
      });
    }

    // Filter by course
    if (selectedCourse && selectedCourse !== 'all') {
      filtered = filtered.filter(record => 
        record.student.enrolledCourses.some(course => course._id === selectedCourse)
      );
    }

    setFilteredRecords(filtered);
  }

  async function handleViewDetails(student) {
    try {
      setSelectedStudent(student);
      setLoading(true);
      const data = await api.getStudentDetailedRecords(
        student._id,
        selectedCourse !== 'all' ? selectedCourse : null
      );
      setDetailedRecords(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch detailed records:', error);
      toast.error('Failed to load detailed records');
    } finally {
      setLoading(false);
    }
  }

  function closeDetailModal() {
    setShowDetailModal(false);
    setSelectedStudent(null);
    setDetailedRecords(null);
  }

  function exportToCSV() {
    const csvRows = [];
    csvRows.push(['Name', 'Roll Number', 'Email', 'Total Classes', 'Present', 'Absent', 'Late', 'Excused', 'Attendance Rate (%)'].join(','));

    filteredRecords.forEach(record => {
      const row = [
        `"${record.student.firstName} ${record.student.lastName}"`,
        record.student.rollNumber || 'N/A',
        record.student.email,
        record.stats.total,
        record.stats.present,
        record.stats.absent,
        record.stats.late,
        record.stats.excused,
        record.stats.attendanceRate
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  }

  function getAttendanceColor(rate) {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getAttendanceIcon(rate) {
    if (rate >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (rate >= 75) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  }

  if (loading && records.length === 0) {
    return (
      <div className="page">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Student Attendance Records</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            View comprehensive attendance records and statistics for all students
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-[var(--muted-foreground)]">Total Students</div>
            <div className="text-3xl font-bold mt-2">{records.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-[var(--muted-foreground)]">At-Risk Students</div>
            <div className="text-3xl font-bold mt-2 text-red-600">
              {records.filter(r => r.stats.attendanceRate < 75).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-[var(--muted-foreground)]">Good Attendance</div>
            <div className="text-3xl font-bold mt-2 text-green-600">
              {records.filter(r => r.stats.attendanceRate >= 90).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-[var(--muted-foreground)]">Average Rate</div>
            <div className="text-3xl font-bold mt-2">
              {records.length > 0
                ? (records.reduce((sum, r) => sum + r.stats.attendanceRate, 0) / records.length).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
              <Input
                type="search"
                placeholder="Search by name, email, or roll number..."
                className="h-10 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <select
                className="w-full h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.courseCode} - {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Records ({filteredRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left p-3 font-semibold">Student</th>
                  <th className="text-left p-3 font-semibold">Roll Number</th>
                  <th className="text-center p-3 font-semibold">Total</th>
                  <th className="text-center p-3 font-semibold">Present</th>
                  <th className="text-center p-3 font-semibold">Absent</th>
                  <th className="text-center p-3 font-semibold">Late</th>
                  <th className="text-center p-3 font-semibold">Rate</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                  <th className="text-center p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => (
                  <tr key={record.student._id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="p-3">
                      <div className="font-medium">{record.student.firstName} {record.student.lastName}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">{record.student.email}</div>
                    </td>
                    <td className="p-3">{record.student.rollNumber || 'N/A'}</td>
                    <td className="p-3 text-center">{record.stats.total}</td>
                    <td className="p-3 text-center text-green-600">{record.stats.present}</td>
                    <td className="p-3 text-center text-red-600">{record.stats.absent}</td>
                    <td className="p-3 text-center text-yellow-600">{record.stats.late}</td>
                    <td className={`p-3 text-center font-semibold ${getAttendanceColor(record.stats.attendanceRate)}`}>
                      {record.stats.attendanceRate}%
                    </td>
                    <td className="p-3 text-center">
                      {getAttendanceIcon(record.stats.attendanceRate)}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(record.student)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRecords.length === 0 && (
              <div className="text-center py-12 text-[var(--muted-foreground)]">
                No records found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && detailedRecords && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-[var(--border)]">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    {detailedRecords.student.firstName} {detailedRecords.student.lastName}
                  </CardTitle>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {detailedRecords.student.rollNumber} • {detailedRecords.student.email}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {detailedRecords.student.program} • Year {detailedRecords.student.year}
                  </p>
                </div>
                <Button variant="outline" onClick={closeDetailModal}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Course-wise breakdown */}
              <h3 className="font-semibold text-lg mb-4">Course-wise Attendance</h3>
              <div className="space-y-4 mb-6">
                {detailedRecords.attendanceByCourse.map(courseData => (
                  <Card key={courseData.course._id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">{courseData.course.title}</div>
                          <div className="text-sm text-[var(--muted-foreground)]">{courseData.course.courseCode}</div>
                        </div>
                        <div className={`text-2xl font-bold ${getAttendanceColor(courseData.stats.attendanceRate)}`}>
                          {courseData.stats.attendanceRate}%
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <div className="text-[var(--muted-foreground)]">Present</div>
                          <div className="font-semibold text-green-600">{courseData.stats.present}</div>
                        </div>
                        <div>
                          <div className="text-[var(--muted-foreground)]">Absent</div>
                          <div className="font-semibold text-red-600">{courseData.stats.absent}</div>
                        </div>
                        <div>
                          <div className="text-[var(--muted-foreground)]">Late</div>
                          <div className="font-semibold text-yellow-600">{courseData.stats.late}</div>
                        </div>
                        <div>
                          <div className="text-[var(--muted-foreground)]">Total</div>
                          <div className="font-semibold">{courseData.stats.total}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent attendance */}
              <h3 className="font-semibold text-lg mb-4">Recent Attendance Records</h3>
              <div className="space-y-2">
                {detailedRecords.allRecords.slice(0, 15).map(record => (
                  <div key={record._id} className="flex justify-between items-center p-3 border border-[var(--border)] rounded-md">
                    <div>
                      <div className="font-medium">{record.course.title}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'Present' ? 'bg-green-100 text-green-800' :
                        record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                        record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
