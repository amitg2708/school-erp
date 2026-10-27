import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  deactivate: (id) => api.delete(`/students/${id}`),
  promote: (data) => api.post('/students/promote', data),
};

// Staff API
export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  getDepartments: () => api.get('/staff/departments'),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  deactivate: (id) => api.delete(`/staff/${id}`),
  assignTeacher: (data) => api.post('/staff/assign-teacher', data),
};

// Attendance API
export const attendanceAPI = {
  getStudents: (params) => api.get('/attendance/students', { params }),
  saveStudentAttendance: (data) => api.post('/attendance/students/save', data),
  getStudentHistory: (studentId, params) => api.get(`/attendance/student/${studentId}/history`, { params }),
  getDailyReport: (params) => api.get('/attendance/report/daily', { params }),
  getStaff: (params) => api.get('/attendance/staff', { params }),
  saveStaffAttendance: (data) => api.post('/attendance/staff/save', data),
};

// Academic API
export const academicAPI = {
  getYears: () => api.get('/academic/years'),
  createYear: (data) => api.post('/academic/years', data),
  getClasses: () => api.get('/academic/classes'),
  getSections: (params) => api.get('/academic/sections', { params }),
  createSection: (data) => api.post('/academic/sections', data),
  getSubjects: () => api.get('/academic/subjects'),
  createSubject: (data) => api.post('/academic/subjects', data),
  getClassSubjects: (params) => api.get('/academic/class-subjects', { params }),
  assignClassSubjects: (data) => api.post('/academic/class-subjects', data),
  getTeacherAssignments: (params) => api.get('/academic/teacher-assignments', { params }),
};

// Exams API
export const examsAPI = {
  getAll: (params) => api.get('/exams', { params }),
  getTypes: () => api.get('/exams/types'),
  getGradingRules: () => api.get('/exams/grading-rules'),
  create: (data) => api.post('/exams', data),
  addSubject: (examId, data) => api.post(`/exams/${examId}/subjects`, data),
  getSubjects: (examId) => api.get(`/exams/${examId}/subjects`),
  getMarks: (examId, params) => api.get(`/exams/${examId}/marks`, { params }),
  saveMarks: (examId, data) => api.post(`/exams/${examId}/marks`, data),
  getReportCard: (examId, studentId) => api.get(`/exams/${examId}/report-card/${studentId}`),
};

// Fees API
export const feesAPI = {
  getCategories: () => api.get('/fees/categories'),
  getStructures: (params) => api.get('/fees/structures', { params }),
  createStructure: (data) => api.post('/fees/structures', data),
  getStudentFees: (studentId) => api.get(`/fees/student/${studentId}`),
  assignFees: (data) => api.post('/fees/assign', data),
  recordPayment: (data) => api.post('/fees/payment', data),
  getCollectionReport: (params) => api.get('/fees/report/collection', { params }),
  getPendingReport: (params) => api.get('/fees/report/pending', { params }),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  create: (data) => api.post('/notifications', data),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

// Timetable API
export const timetableAPI = {
  get: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data),
  delete: (id) => api.delete(`/timetable/${id}`),
};

// Assignments API
export const assignmentsAPI = {
  getAll: (params) => api.get('/assignments', { params }),
  create: (data) => api.post('/assignments', data),
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data),
  getSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
  gradeSubmission: (assignmentId, submissionId, data) => api.put(`/assignments/${assignmentId}/grade/${submissionId}`, data),
};

// Portal API (Student & Parent)
export const portalAPI = {
  getChildren: () => api.get('/portal/children'),
  getMyStudent: (params) => api.get('/portal/my-student', { params }),
};

// Study Materials API
export const materialsAPI = {
  getAll: (params) => api.get('/materials', { params }),
  create: (data) => api.post('/materials', data),
  delete: (id) => api.delete(`/materials/${id}`),
};

// Leaves API
export const leavesAPI = {
  getTypes: () => api.get('/leaves/types'),
  getAll: () => api.get('/leaves'),
  apply: (data) => api.post('/leaves', data),
  updateStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
};

// Extended Students API with CSV
export const studentsCSVAPI = {
  importCsv: (data) => api.post('/students/import-csv', data),
  exportCsv: () => api.get('/students/export-csv'),
};

// Super Admin API
export const superAdminAPI = {
  getStats: () => api.get('/superadmin/stats'),
  getAdmins: () => api.get('/superadmin/admins'),
  createAdmin: (data) => api.post('/superadmin/admins', data),
  updateAdmin: (id, data) => api.put(`/superadmin/admins/${id}`, data),
  toggleStatus: (id) => api.patch(`/superadmin/admins/${id}/toggle-status`),
  resetPassword: (id, data) => api.post(`/superadmin/admins/${id}/reset-password`, data),
  getWingsOverview: () => api.get('/superadmin/wings-overview'),
};

export default api;
