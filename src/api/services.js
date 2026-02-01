import api from './axios';

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Users
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Branches
export const branchService = {
  getAll: (params) => api.get('/branches', { params }),
  getActive: () => api.get('/branches/active'),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

// Colleges
export const collegeService = {
  getAll: (params) => api.get('/colleges', { params }),
  getActive: () => api.get('/colleges/active'),
  getById: (id) => api.get(`/colleges/${id}`),
  create: (data) => api.post('/colleges', data),
  update: (id, data) => api.put(`/colleges/${id}`, data),
  delete: (id) => api.delete(`/colleges/${id}`),
};

// Courses
export const courseService = {
  getAll: (params) => api.get('/courses', { params }),
  getByCollege: (collegeId) => api.get(`/courses/college/${collegeId}`),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Agents
export const agentService = {
  getAll: (params) => api.get('/agents', { params }),
  getActive: (agentType) => api.get('/agents/active', { params: { agentType } }),
  getById: (id) => api.get(`/agents/${id}`),
  getDetails: (id) => api.get(`/agents/${id}/details`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`),
};

// Admissions
export const admissionService = {
  getAll: (params) => api.get('/admissions', { params }),
  getById: (id) => api.get(`/admissions/${id}`),
  getDetails: (id) => api.get(`/admissions/${id}/details`),
  create: (data) => api.post('/admissions', data),
  update: (id, data) => api.put(`/admissions/${id}`, data),
  delete: (id) => api.delete(`/admissions/${id}`),
  recalculate: (id) => api.post(`/admissions/${id}/recalculate`),
};

// Payments
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  createWithAttachment: (formData) => api.post('/payments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  checkTransactionRef: (transactionRef) => api.get('/payments/check-ref', { params: { transactionRef } }),
  getAttachment: (id) => `${api.defaults.baseURL}/payments/${id}/attachment`,
};

// Agent Payments
export const agentPaymentService = {
  getAll: (params) => api.get('/agent-payments', { params }),
  getById: (id) => api.get(`/agent-payments/${id}`),
  create: (data) => api.post('/agent-payments', data),
  update: (id, data) => api.put(`/agent-payments/${id}`, data),
  delete: (id) => api.delete(`/agent-payments/${id}`),
};

// Vouchers
export const voucherService = {
  getAll: (params) => api.get('/vouchers', { params }),
  getById: (id) => api.get(`/vouchers/${id}`),
  getByNumber: (voucherNo) => api.get(`/vouchers/number/${voucherNo}`),
  recordPrint: (id) => api.post(`/vouchers/${id}/print`),
};

// Daybook
export const daybookService = {
  getAll: (params) => api.get('/daybook', { params }),
  getSummary: (params) => api.get('/daybook/summary', { params }),
  getCategoryBreakdown: (params) => api.get('/daybook/category-breakdown', { params }),
  export: (params) => api.get('/daybook/export', { params }),
  getById: (id) => api.get(`/daybook/${id}`),
  create: (data) => api.post('/daybook', data),
  update: (id, data) => api.put(`/daybook/${id}`, data),
  delete: (id) => api.delete(`/daybook/${id}`),
};

// Cashbook
export const cashbookService = {
  getAll: (params) => api.get('/cashbook', { params }),
  getSummary: (params) => api.get('/cashbook/summary', { params }),
  getBalance: (branchId) => api.get(`/cashbook/balance/${branchId}`),
  getById: (id) => api.get(`/cashbook/${id}`),
  create: (data) => api.post('/cashbook', data),
  update: (id, data) => api.put(`/cashbook/${id}`, data),
  delete: (id) => api.delete(`/cashbook/${id}`),
  clear: (params) => api.delete('/cashbook/clear', { params }),
  hardClear: (params) => api.delete('/cashbook/hard-clear', { params }),
};

// Dashboard
export const dashboardService = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getMonthlyTrend: (params) => api.get('/dashboard/monthly-trend', { params }),
  getAdmissionTrend: (params) => api.get('/dashboard/admission-trend', { params }),
  getPaymentTrend: (params) => api.get('/dashboard/payment-trend', { params }),
};
