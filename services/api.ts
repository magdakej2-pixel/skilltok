import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach Firebase auth token to every request
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — could trigger re-auth here
      console.warn('Auth error — user may need to re-login');
    }
    return Promise.reject(error);
  }
);

// ============ AUTH API ============
export const authAPI = {
  register: (data: { displayName: string; role: string; language?: string; expertiseCategory?: string }) =>
    api.post('/auth/register', data),
  login: () => api.post('/auth/login'),
  updateProfile: (data: Partial<{ displayName: string; bio: string; avatarUrl: string; expertiseCategory: string; language: string }>) =>
    api.put('/auth/profile', data),
};

// ============ VIDEOS API ============
export const videosAPI = {
  getFeed: (page = 1, limit = 10, category?: string) =>
    api.get('/videos/feed', { params: { page, limit, category } }),
  getById: (id: string) => api.get(`/videos/${id}`),
  create: (data: { videoUrl: string; title: string; category: string; description?: string; tags?: string[]; coverUrl?: string; duration?: number; fileSize?: number }) =>
    api.post('/videos', data),
  update: (id: string, data: Partial<{ title: string; description: string; tags: string[]; category: string; coverUrl: string }>) =>
    api.put(`/videos/${id}`, data),
  delete: (id: string) => api.delete(`/videos/${id}`),
  getTeacherVideos: (teacherId: string) => api.get(`/videos/teacher/${teacherId}`),
  getSaved: (page = 1) => api.get('/videos/saved', { params: { page } }),
  toggleLike: (id: string) => api.post(`/videos/${id}/like`),
  toggleSave: (id: string) => api.post(`/videos/${id}/save`),
  getComments: (id: string, page = 1) => api.get(`/videos/${id}/comments`, { params: { page } }),
  addComment: (id: string, text: string, parentCommentId?: string) =>
    api.post(`/videos/${id}/comments`, { text, parentCommentId }),
};

// ============ USERS API ============
export const usersAPI = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  toggleFollow: (id: string) => api.post(`/users/${id}/follow`),
  getFollowers: (id: string, page = 1) => api.get(`/users/${id}/followers`, { params: { page } }),
  getFollowing: (id: string, page = 1) => api.get(`/users/${id}/following`, { params: { page } }),
};

// ============ CATEGORIES API ============
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// ============ SEARCH API ============
export const searchAPI = {
  search: (q?: string, category?: string, page = 1) =>
    api.get('/search', { params: { q, category, page } }),
};

export default api;
