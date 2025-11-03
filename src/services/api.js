import { API_BASE_URL } from './apiBase';

async function getAuthHeader() {
  try {
    // Try to get a fresh token from Firebase
    const { getIdToken } = await import('../context/AuthToken');
    const token = await getIdToken();
    if (token) return { Authorization: `Bearer ${token}` };
  } catch (_) {
    // ignore import errors
  }
  // Fallback to localStorage if no fresh token yet
  const stored = localStorage.getItem('firebase_id_token');
  if (stored) return { Authorization: `Bearer ${stored}` };
  return {};
}

class ApiService {
  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const authHeader = await getAuthHeader();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Courses API
  async getCourses() {
    return this.apiCall('/courses');
  }

  async getCourse(id) {
    return this.apiCall(`/courses/${id}`);
  }

  async createCourse(courseData) {
    return this.apiCall('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id, courseData) {
    return this.apiCall(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id) {
    return this.apiCall(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Students API
  async getStudents() {
    return this.apiCall('/students');
  }

  async getStudent(id) {
    return this.apiCall(`/students/${id}`);
  }

  async createStudent(studentData) {
    return this.apiCall('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id, studentData) {
    return this.apiCall(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id) {
    return this.apiCall(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Attendance API
  async getAttendance() {
    return this.apiCall('/attendance');
  }

  async getStudentAttendance(studentId) {
    return this.apiCall(`/attendance/student/${studentId}`);
  }

  async getStudentAttendanceStats(studentId, courseId = null) {
    const params = courseId ? `?courseId=${courseId}` : '';
    return this.apiCall(`/attendance/student/${studentId}/stats${params}`);
  }

  async getCourseAttendance(courseId, date = null) {
    const params = date ? `?date=${date}` : '';
    return this.apiCall(`/attendance/course/${courseId}${params}`);
  }

  async getCourseAttendanceStats(courseId) {
    return this.apiCall(`/attendance/course/${courseId}/stats`);
  }

  async markAttendance(attendanceData) {
    return this.apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async markBulkAttendance(bulkData) {
    return this.apiCall('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  }

  async updateAttendance(id, attendanceData) {
    return this.apiCall(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  }

  async deleteAttendance(id) {
    return this.apiCall(`/attendance/${id}`, {
      method: 'DELETE',
    });
  }

  // New attendance endpoints
  async getActiveClasses() {
    return this.apiCall('/attendance/active-classes');
  }

  async getAllStudentRecords(courseId = null, startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.apiCall(`/attendance/records/all${query}`);
  }

  async getStudentDetailedRecords(studentId, courseId = null) {
    const params = courseId ? `?courseId=${courseId}` : '';
    return this.apiCall(`/attendance/records/student/${studentId}${params}`);
  }

  // Timetable API
  async getTimetable() {
    return this.apiCall('/timetable');
  }

  async getCourseTimetable(courseId) {
    return this.apiCall(`/timetable/course/${courseId}`);
  }

  async getDayTimetable(day) {
    return this.apiCall(`/timetable/day/${day}`);
  }

  async createTimetableEntry(timetableData) {
    return this.apiCall('/timetable', {
      method: 'POST',
      body: JSON.stringify(timetableData),
    });
  }

  async updateTimetableEntry(id, timetableData) {
    return this.apiCall(`/timetable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timetableData),
    });
  }

  async deleteTimetableEntry(id) {
    return this.apiCall(`/timetable/${id}`, {
      method: 'DELETE',
    });
  }

  // Messaging API
  async getConversations() {
    return this.apiCall('/conversations');
  }

  async getConversationMessages(conversationId) {
    return this.apiCall(`/conversations/${conversationId}/messages`);
  }

  async sendConversationMessage(conversationId, message) {
    return this.apiCall(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async createConversation(conversationData) {
    return this.apiCall('/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    });
  }

  async syncCourseConversations() {
    return this.apiCall('/conversations/sync-courses', {
      method: 'POST',
    });
  }

  // Users API
  async getUsers() {
    return this.apiCall('/users');
  }

  async updateUserRole(userId, role) {
    return this.apiCall(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // AI Assistant API
  async getAIConversations() {
    return this.apiCall('/ai/conversations');
  }

  async getAIConversation(id) {
    return this.apiCall(`/ai/conversations/${id}`);
  }

  async createAIConversation(title = 'New Chat') {
    return this.apiCall('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async sendAIMessage(conversationId, message) {
    return this.apiCall(`/ai/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async deleteAIConversation(id) {
    return this.apiCall(`/ai/conversations/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
