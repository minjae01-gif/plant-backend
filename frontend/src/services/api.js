import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production'

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
};

// 게시글 API
export const postAPI = {
  getPosts: () => api.get('/api/posts'),
  getPost: (id) => api.get(`/api/posts/${id}`),
  createPost: (formData) => api.post('/api/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePost: (id, formData) => api.put(`/api/posts/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deletePost: (id) => api.delete(`/api/posts/${id}`),
};

// 거래 API
export const marketplaceAPI = {
  getItems: () => api.get('/api/marketplace'),
  getItem: (id) => api.get(`/api/marketplace/${id}`),
  createItem: (formData) => api.post('/api/marketplace', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateItem: (id, formData) => api.put(`/api/marketplace/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteItem: (id) => api.delete(`/api/marketplace/${id}`),
};

// 댓글 API
export const commentAPI = {
  // 댓글 조회
  getComments: (type, id) => {
    const endpoint = type === 'post' ? 'posts' : 'marketplace';
    return api.get(`/api/${endpoint}/${id}/comments`);
  },
  // 댓글 작성
  createComment: (type, id, commentData) => {
    const endpoint = type === 'post' ? 'posts' : 'marketplace';
    return api.post(`/api/${endpoint}/${id}/comments`, commentData);
  },
  // 댓글 삭제
  deleteComment: (type, postId, commentId) => {
    const endpoint = type === 'post' ? 'posts' : 'marketplace';
    return api.delete(`/api/${endpoint}/${postId}/comments/${commentId}`);
  },
};

// IoT 센서 API
export const sensorAPI = {
  getLatestData: () => api.get('/api/sensor/latest'),
  getHistoryData: () => api.get('/api/sensor/history'),
  sendCommand: (command) => api.post('/api/command', { command }), // ⭐ 제어 명령 전송
};

export default api;