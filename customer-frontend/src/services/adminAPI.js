import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const adminAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      toast.error('Access denied. Admin privileges required.');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // Verify admin access
  verifyAdmin: async () => {
    const response = await adminAPI.get('/admin/verify');
    return response.data;
  },

  // Menu CRUD
  getAllMenuItems: async () => {
    const response = await adminAPI.get('/menu');
    return response.data;
  },

  createMenuItem: async (formData) => {
    const response = await adminAPI.post('/menu', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateMenuItem: async (id, formData) => {
    const response = await adminAPI.put(`/menu/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteMenuItem: async (id) => {
    const response = await adminAPI.delete(`/menu/${id}`);
    return response.data;
  },

  toggleAvailability: async (id) => {
    const response = await adminAPI.patch(`/menu/${id}/availability`);
    return response.data;
  },

  bulkDelete: async (ids) => {
    const response = await adminAPI.post('/menu/bulk-delete', { ids });
    return response.data;
  },

  bulkToggle: async (ids, isAvailable) => {
    const response = await adminAPI.post('/menu/bulk-toggle', { ids, isAvailable });
    return response.data;
  },

  getCategories: async () => {
    const response = await adminAPI.get('/menu/categories');
    return response.data;
  },
};