import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://plant-backend-mrho.onrender.com';

console.log('🔥 API_URL:', API_URL);

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
  // 이메일 인증번호 발송
  sendCode: (data) => api.post('/api/auth/send-code', data),
  // 이메일 인증번호 확인
  verifyCode: (email, code) => api.post('/api/auth/verify-code', { email, code }),
  
  // 구글 로그인
  googleLogin: (data) => api.post('/api/auth/google', data),

  // 비밀번호 재설정
  resetPassword: (data) => api.post('/api/auth/reset-password', data),

  // 마이페이지 닉네임 변경
  updateProfile: (data) => api.put('/api/auth/update-profile', data),
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
  // 내 판매글 목록을 가져오는 함수 추가
  getMyItems: () => api.get('/api/marketplace/my-items'),

  // 상품 상태를 변경하는 함수 추가
  updateItemStatus: (id, status) => api.patch(`/api/marketplace/${id}/status`, { status }),
};

// 거래 요청 API
export const tradeAPI = {
  // 거래 요청 보내기
  sendRequest: (itemId, sellerId) => api.post('/api/trade/request', { itemId, sellerId }),
  
  // 받은 요청 확인하기
  getReceivedRequests: () => api.get('/api/trade/received'),

  // 거래 수락 API (PATCH)
  acceptRequest: (requestId) => api.patch(`/api/trade/accept/${requestId}`),

  // 거래 완료 API (PATCH)
  completeRequest: (requestId) => api.patch(`/api/trade/complete/${requestId}`),

  rejectRequest: (requestId) => api.patch(`/api/trade/reject/${requestId}`),

  getSentRequests: () => api.get('/api/trade/sent'),
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
  getLatestData: async () => {
  const res = await api.get('/api/sensor/latest');

  if (res.data?.data) {
    const d = res.data.data;

    res.data.data = {
      ...d,
      soilMoisture: d.soilMoisture ?? d.soil_moisture ?? 0,
      lightLevel: d.lightLevel ?? d.light_level ?? 0,
      lightRaw: d.lightRaw ?? d.light_raw ?? 0,
      lightPercent: d.lightPercent ?? d.light_percent ?? 0,
      temperature: d.temperature ?? 0,
      humidity: d.humidity ?? 0,
    };
  }

  return res;
},
  getHistoryData: async () => {
  const res = await api.get('/api/sensor/history');

  if (Array.isArray(res.data?.data)) {
    res.data.data = res.data.data.map((d) => ({
      ...d,
      soilMoisture: d.soilMoisture ?? d.soil_moisture ?? 0,
      lightLevel: d.lightLevel ?? d.light_level ?? 0,
      lightRaw: d.lightRaw ?? d.light_raw ?? 0,
      lightPercent: d.lightPercent ?? d.light_percent ?? 0,
      temperature: d.temperature ?? 0,
      humidity: d.humidity ?? 0,
    }));
  }

  return res;
},
  sendCommand: (command) => api.post('/api/command', { command }),

  // ⭐ 추가
  getSettings: () => api.get('/api/settings'),
  updateSettings: (data) => api.post('/api/settings/update', data),
  getSpecies: () => api.get('/api/species')
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

// 식물 정보 API
export const plantAPI = {
  getPlants: () => api.get('/api/plants'),
  getPlant: (id) => api.get(`/api/plants/${id}`),
  createPlant: (formData) => api.post('/api/plants', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePlant: (id, formData) => api.put(`/api/plants/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deletePlant: (id) => api.delete(`/api/plants/${id}`),
};

// 내 식물 관리 API
export const myPlantsAPI = {
  // 내 식물 목록 조회
  getMyPlants: () => api.get('/api/myplants'),
  
  // 특정 내 식물 조회
  getMyPlant: (id) => api.get(`/api/myplants/${id}`),
  
  // 내 식물 등록
  createMyPlant: (formData) => api.post('/api/myplants', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // 내 식물 수정
  updateMyPlant: (id, formData) => api.put(`/api/myplants/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // 내 식물 삭제
  deleteMyPlant: (id) => api.delete(`/api/myplants/${id}`),
  
  // 물주기 기록 조회
  getWateringLogs: (plantId) => api.get(`/api/myplants/${plantId}/watering`),
  
  // 물주기 기록 추가
  addWateringLog: (plantId, data) => api.post(`/api/myplants/${plantId}/watering`, data),
  
  // 물주기 기록 삭제
  deleteWateringLog: (plantId, logId) => api.delete(`/api/myplants/${plantId}/watering/${logId}`),
};

// services/api.js
export const chatAPI = {
  // 채팅방 생성/조회
  createRoom: (itemId, sellerId) => api.post('/api/chat/rooms', { itemId, sellerId }),
  // 내 채팅방 목록
  getRooms: () => api.get('/api/chat/rooms'),
  // 특정 방의 메시지 내역 가져오기 (나중에 구현)
  getMessages: (roomId) => api.get(`/api/chat/rooms/${roomId}/messages`),

  deleteRoom: (roomId) => api.delete(`/api/chat/rooms/${roomId}`),

  // 전체 안 읽은 메시지 총합 가져오기
  getUnreadTotal: () => api.get('/api/chat/unread-total'),

  // 특정 채팅방 메시지 읽음 처리 (PATCH)
  markAsRead: (roomId) => api.patch(`/api/chat/read/${roomId}`),
};

export default api;