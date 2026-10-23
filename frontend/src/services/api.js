import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pharmacy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for handling 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't loop redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (userData) => api.post('/auth/users', userData),
  toggleUserStatus: (id) => api.patch(`/auth/users/${id}/toggle`),
};

export const medicineService = {
  getMedicines: (params) => api.get('/medicines', { params }),
  getMedicineById: (id) => api.get(`/medicines/${id}`),
  createMedicine: (data) => api.post('/medicines', data),
  updateMedicine: (id, data) => api.put(`/medicines/${id}`, data),
  toggleStatus: (id) => api.patch(`/medicines/${id}/toggle`),
};

export const batchService = {
  getBatches: (params) => api.get('/batches', { params }),
  getBatchesByMedicine: (medId) => api.get(`/batches/medicine/${medId}`),
  adjustStock: (data) => api.post('/batches/adjust', data),
};

export const supplierService = {
  getSuppliers: () => api.get('/suppliers'),
  createSupplier: (data) => api.post('/suppliers', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}`, data),
};

export const purchaseService = {
  getPurchases: () => api.get('/purchases'),
  createPurchase: (data) => api.post('/purchases', data),
};

export const saleService = {
  getSales: (params) => api.get('/sales', { params }),
  getSaleById: (id) => api.get(`/sales/${id}`),
  createSale: (data) => api.post('/sales', data),
  verifyPayment: (data) => api.post('/sales/verify-payment', data),
  emailInvoice: (id, data) => api.post(`/sales/${id}/email-invoice`, data),
  updateDeliveryStatus: (id, data) => api.patch(`/sales/${id}/delivery-status`, data),
  createReturn: (data) => api.post('/sales/return', data),
  getInvoiceDownloadUrl: (id) => {
    const envUrl = import.meta.env.VITE_API_URL || '';
    return `${envUrl}/api/sales/${id}/invoice`;
  },
};

export const reportService = {
  getDashboard: () => api.get('/reports/dashboard'),
  getTopMedicines: () => api.get('/reports/top-medicines'),
};

export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export default api;
