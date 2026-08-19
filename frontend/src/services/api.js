import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (formData) => api.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const jobsAPI = {
  getPublicJobs: (search = '') => api.get(`/jobs/public${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getMyOrgJobs: () => api.get('/jobs/my-org'),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs/', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  createPremiumCheckout: (id, priceInr = 1499) => api.post(`/jobs/${id}/create-premium-checkout?price_inr=${priceInr}`),
  confirmPremiumPayment: (id, sessionId) => api.post(`/jobs/${id}/confirm-premium-payment?session_id=${sessionId}`),
};

export const applicationsAPI = {
  apply: (jobId) => api.post('/applications/apply', { job_id: jobId }),
  getMyApplications: () => api.get('/applications/my-applications'),
  getOrgApplications: (jobId = null) => api.get(`/applications/org-applications${jobId ? `?job_id=${jobId}` : ''}`),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
};

export const interviewsAPI = {
  schedule: (data) => api.post('/interviews/schedule', data),
  updateInterview: (id, data) => api.put(`/interviews/${id}`, data),
  getMyInterviews: () => api.get('/interviews/my-interviews'),
  updateStatus: (id, statusStr) => api.put(`/interviews/${id}/status?status_str=${encodeURIComponent(statusStr)}`),
  getSchedulePDFUrl: (id) => `/api/v1/interviews/${id}/pdf`,
};

export const offerLettersAPI = {
  generate: (data) => api.post('/offer-letters/generate', data),
  getMyOffers: () => api.get('/offer-letters/my-offers'),
  respond: (id, status) => api.put(`/offer-letters/${id}/respond`, { status }),
  getOfferPDFUrl: (id) => `/api/v1/offer-letters/${id}/download`,
};

export const subscriptionsAPI = {
  getCurrent: () => api.get('/subscriptions/current'),
  createCheckoutSession: (plan = 'Pro') => api.post(`/subscriptions/create-checkout-session?plan=${plan}`),
  confirmUpgrade: (sessionId) => api.post(`/subscriptions/confirm-upgrade?session_id=${sessionId}`),
  adminUpdatePlan: (data) => api.put('/subscriptions/admin-update-plan', data),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRecruiters: () => api.get('/organizations/recruiters'),
  getOrg: () => api.get('/organizations/my-org'),
};

export default api;
