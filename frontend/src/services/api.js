import axios from 'axios';

const API_URL = 'http://localhost:5000';

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
  // 회원가입
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
  // 로그인
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  // 내 정보 조회
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
  // 비밀번호 변경
  changePassword: async (data) => {
    const response = await api.put('/api/auth/change-password', data);
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

// 거래 요청 API
export const tradeAPI = {
  // 거래 요청 보내기
  sendRequest: (itemId, sellerId) => api.post('/api/trade/request', { itemId, sellerId }),
  
  // 받은 요청 확인하기
  getReceivedRequests: () => api.get('/api/trade/received'),
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

export const adminAPI = {
  // 전체 유저 목록 가져오기 
  getUsers: () => api.get('/api/admin/users'),
  
  // 전체 게시글/상품 가져오기 (대시보드 리스트용)
  getAllPosts: () => api.get('/api/posts'), // 기존 API 재활용 혹은 관리자용 별도 생성
  getAllMarketplaceItems: () => api.get('/api/marketplace'),

  // 삭제 기능
  deletePost: (id) => api.delete(`/api/admin/posts/${id}`),
  deleteMarketItem: (id) => api.delete(`/api/admin/marketplace/${id}`),
};

export default api;