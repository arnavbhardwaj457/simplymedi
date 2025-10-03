import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response time
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    
    return response;
  },
  (error) => {
    // Log error
    if (error.config?.metadata?.startTime) {
      const endTime = new Date();
      const duration = endTime - error.config.metadata.startTime;
      console.error(`API ${error.config.method?.toUpperCase()} ${error.config.url} - ${error.response?.status || 'Network Error'} (${duration}ms)`);
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  registerDoctor: (doctorData) => api.post('/auth/register-doctor', doctorData),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Reports API
export const reportsAPI = {
  upload: (formData, onProgress) => 
    api.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`),
  reprocess: (id) => api.post(`/reports/${id}/reprocess`),
};

// Chat API
export const chatAPI = {
  sendMessage: (messageData) => api.post('/chat/message', messageData),
  getHistory: (params) => api.get('/chat/history', { params }),
  getSessions: (params) => api.get('/chat/sessions', { params }),
  addFeedback: (messageId, feedback) => api.post(`/chat/feedback/${messageId}`, feedback),
  clearSession: (sessionId) => api.delete(`/chat/session/${sessionId}`),
  getStats: () => api.get('/chat/stats'),
};

// Appointments API
export const appointmentsAPI = {
  book: (appointmentData) => api.post('/appointments/book', appointmentData),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  cancel: (id, reason) => api.patch(`/appointments/${id}/cancel`, { reason }),
  reschedule: (id, newDate) => api.patch(`/appointments/${id}/reschedule`, { newAppointmentDate: newDate }),
  getAvailability: (doctorId, date) => api.get(`/appointments/availability/${doctorId}`, { params: { date } }),
};

// Doctors API
export const doctorsAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getProfile: () => api.get('/doctors/profile/me'),
  updateProfile: (data) => api.patch('/doctors/profile/me', data),
  getAppointments: (params) => api.get('/doctors/appointments/me', { params }),
  updateAppointment: (id, data) => api.patch(`/doctors/appointments/${id}`, data),
  completeAppointment: (id, data) => api.patch(`/doctors/appointments/${id}/complete`, data),
  getDashboard: () => api.get('/doctors/dashboard/me'),
  updateAvailability: (availability) => api.patch('/doctors/availability/me', { availability }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  updateLanguagePreferences: (data) => api.patch('/users/language-preferences', data),
  getDashboard: () => api.get('/users/dashboard'),
  getMedicalHistory: () => api.get('/users/medical-history'),
  updateMedicalHistory: (data) => api.patch('/users/medical-history', data),
  getNotifications: (params) => api.get('/users/notifications', { params }),
  markNotificationAsRead: (id) => api.patch(`/users/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.patch('/users/notifications/read-all'),
  deleteAccount: (password) => api.delete('/users/account', { data: { password } }),
};

// File upload utility
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('report', file);
  
  return reportsAPI.upload(formData, (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    onProgress(percentCompleted);
  });
};

// Error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.error || 'An error occurred',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

// Request cancellation utility
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export default api;
