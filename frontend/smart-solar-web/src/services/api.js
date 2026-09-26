// ============================================================================
// File: api.js
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Axios API client with JWT interceptor for all Web API requests.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import axios from 'axios';

// Resolve base API URL (default to ASP.NET Core backend port 5000 / 5123)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration or unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expires
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;