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

  async getCourseAttendance(courseId) {
    return this.apiCall(`/attendance/course/${courseId}`);
  }

  async markAttendance(attendanceData) {
    return this.apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
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
}

export default new ApiService();
