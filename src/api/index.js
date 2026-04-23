const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const getToken = () => localStorage.getItem('crm_token') || '';

export async function apiCall(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res  = await fetch(BASE + path, opts);
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  } catch {
    return { ok: false, status: 0, data: { message: 'Tarmoq xatosi', result: null } };
  }
}

export const getResult = (r, fallback = []) => (r.ok ? (r.data?.result ?? fallback) : fallback);

// AUTH
export const authAPI = {
  login: (b) => apiCall('POST', '/auth/login', b),
  me:    ()  => apiCall('GET',  '/auth/me'),
};

// ADMIN
export const adminAPI = {
  getUsers:   ()      => apiCall('GET',    '/admin/users'),
  createUser: (b)     => apiCall('POST',   '/admin/users', b),
  updateUser: (id, b) => apiCall('PATCH',  `/admin/users/${id}`, b),
  deleteUser: (id)    => apiCall('DELETE', `/admin/users/${id}`),
};

// COURSES
export const courseAPI = {
  getAll:  ()      => apiCall('GET',    '/courses/'),
  create:  (b)     => apiCall('POST',   '/courses/', b),
  update:  (id, b) => apiCall('PATCH',  `/courses/${id}`, b),
  delete:  (id)    => apiCall('DELETE', `/courses/${id}`),
};

// STUDENTS — create = auto personal group + lessons + debt
export const studentAPI = {
  getAll:   ()      => apiCall('GET',    '/operator/students'),
  getOne:   (id)    => apiCall('GET',    `/operator/students/${id}`),
  create:   (b)     => apiCall('POST',   '/operator/students', b),
  update:   (id, b) => apiCall('PATCH',  `/operator/students/${id}`, b),
  delete:   (id)    => apiCall('DELETE', `/operator/students/${id}`),
  getDebt:  (id)    => apiCall('GET',    `/operator/debts/student/${id}`),
  // Enrollment holat o'zgartirish
  updateEnrollment: (id, b) => apiCall('PATCH', `/operator/enrollments/${id}`, b),
};

// PAYMENTS
export const paymentAPI = {
  getAll:    ()    => apiCall('GET',    '/operator/payments'),
  create:    (b)   => apiCall('POST',   '/operator/payments', b),
  delete:    (id)  => apiCall('DELETE', `/operator/payments/${id}`),
  summary:   ()    => apiCall('GET',    '/manager/payments/summary'),
  byStudent: (id)  => apiCall('GET',    `/manager/payments/student/${id}`),
};

// MANAGER — o'quvchi bo'yicha
export const managerAPI = {
  getStudents:      ()     => apiCall('GET', '/manager/students'),
  getStudentLessons:(id)   => apiCall('GET', `/manager/students/${id}/lessons`),
  getAttendance:    (p)    => apiCall('GET', `/manager/attendance?${new URLSearchParams(p)}`),
  markAttendance:   (b)    => apiCall('POST',  '/manager/attendance', b),
  updateAttendance: (id,b) => apiCall('PATCH', `/manager/attendance/${id}`, b),
  deleteAttendance: (id)   => apiCall('DELETE',`/manager/attendance/${id}`),
};

// LESSONS — student_id bo'yicha
export const lessonAPI = {
  cancel:    (b)     => apiCall('POST',  '/lessons/cancel', b),
  byStudent: (id, p) => apiCall('GET',   `/lessons/student/${id}${p ? `?${new URLSearchParams(p)}` : ''}`),
  restore:   (id)    => apiCall('PATCH', `/lessons/${id}/restore`),
  move:      (id, b) => apiCall('PATCH', `/lessons/${id}/move`, b),
};

// EXPENSES
export const expenseAPI = {
  getAll:  (p)  => apiCall('GET',    `/expenses/${p ? `?${new URLSearchParams(p)}` : ''}`),
  create:  (b)  => apiCall('POST',   '/expenses/', b),
  delete:  (id) => apiCall('DELETE', `/expenses/${id}`),
  summary: (p)  => apiCall('GET',    `/expenses/summary${p ? `?${new URLSearchParams(p)}` : ''}`),
};

// COURSE MODULES
export const courseModuleAPI = {
  // Modullar
  getModules:  (courseId) => apiCall('GET',    `/course-modules/?course_id=${courseId}`),
  createModule:(courseId, b) => apiCall('POST', `/course-modules/?course_id=${courseId}`, b),
  updateModule:(id, b)    => apiCall('PATCH',  `/course-modules/${id}`, b),
  deleteModule:(id)       => apiCall('DELETE', `/course-modules/${id}`),
  // Darslar
  getLessons:  (moduleId) => apiCall('GET',    `/course-modules/${moduleId}/lessons`),
  createLesson:(moduleId, b) => apiCall('POST',`/course-modules/${moduleId}/lessons`, b),
  updateLesson:(moduleId, lessonId, b) => apiCall('PATCH', `/course-modules/${moduleId}/lessons/${lessonId}`, b),
  deleteLesson:(moduleId, lessonId)    => apiCall('DELETE',`/course-modules/${moduleId}/lessons/${lessonId}`),
  // Fayl yuklash (multipart/form-data — alohida fetch)
  uploadFile:  (moduleId, lessonId, formData) => {
    const token = localStorage.getItem('crm_token') || '';
    return fetch(
      `${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/course-modules/${moduleId}/lessons/${lessonId}/upload`,
      { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData }
    ).then(r => r.json()).then(d => ({ ok: true, data: d })).catch(() => ({ ok: false }));
  },
  deleteFile:  (moduleId, lessonId) => apiCall('DELETE', `/course-modules/${moduleId}/lessons/${lessonId}/upload`),
};