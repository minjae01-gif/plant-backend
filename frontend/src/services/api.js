import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://plant-backend-mrho.onrender.com';

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

// 이미지 경로 변환
export const getImageUrl = (url) => {
  if (!url) return null;

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  return `${API_URL}${url}`;
};

// =========================
// 인증 API
// =========================
export const authAPI = {
  // 회원가입
  register: async (userData) => {
    const response = await api.post(
      '/api/auth/register',
      userData
    );
    return response.data;
  },

  // 로그인
  login: async (credentials) => {
    const response = await api.post(
      '/api/auth/login',
      credentials
    );
    return response.data;
  },

  // 내 정보 조회
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // 비밀번호 변경
  changePassword: async (data) => {
    const response = await api.put(
      '/api/auth/change-password',
      data
    );
    return response.data;
  },

  // 이메일 인증번호 발송
  sendCode: (data) =>
    api.post('/api/auth/send-code', data),

  // 이메일 인증번호 확인
  verifyCode: (email, code) =>
    api.post('/api/auth/verify-code', {
      email,
      code,
    }),

  // 구글 로그인
  googleLogin: (data) =>
    api.post('/api/auth/google', data),

  // 비밀번호 재설정
  resetPassword: (data) =>
    api.post('/api/auth/reset-password', data),

  // 닉네임 변경
  updateProfile: (data) =>
    api.put('/api/auth/update-profile', data),
};

// =========================
// 게시글 API
// =========================
export const postAPI = {
  getPosts: () => api.get('/api/posts'),

  getPost: (id) =>
    api.get(`/api/posts/${id}`),

  createPost: (formData) =>
    api.post('/api/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  updatePost: (id, formData) =>
    api.put(`/api/posts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  deletePost: (id) =>
    api.delete(`/api/posts/${id}`),
};

// =========================
// 거래 API
// =========================
export const marketplaceAPI = {
  getItems: () => api.get('/api/marketplace'),

  getItem: (id) =>
    api.get(`/api/marketplace/${id}`),

  createItem: (formData) =>
    api.post('/api/marketplace', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  updateItem: (id, formData) =>
    api.put(`/api/marketplace/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  deleteItem: (id) =>
    api.delete(`/api/marketplace/${id}`),

  // 내 판매글
  getMyItems: () =>
    api.get('/api/marketplace/my-items'),

  // 상품 상태 변경
  updateItemStatus: (id, status) =>
    api.patch(
      `/api/marketplace/${id}/status`,
      { status }
    ),
};

// =========================
// 거래 요청 API
// =========================
export const tradeAPI = {
  // 거래 요청
  sendRequest: (itemId, sellerId) =>
    api.post('/api/trade/request', {
      itemId,
      sellerId,
    }),

  // 받은 요청
  getReceivedRequests: () =>
    api.get('/api/trade/received'),

  // 보낸 요청
  getSentRequests: () =>
    api.get('/api/trade/sent'),

  // 거래 수락
  acceptRequest: (requestId) =>
    api.patch(`/api/trade/accept/${requestId}`),

  // 거래 완료
  completeRequest: (requestId) =>
    api.patch(`/api/trade/complete/${requestId}`),

  // 거래 거절
  rejectRequest: (requestId) =>
    api.patch(`/api/trade/reject/${requestId}`),
};

// =========================
// 댓글 API
// =========================
export const commentAPI = {
  // 댓글 조회
  getComments: (type, id) => {
    const endpoint =
      type === 'post'
        ? 'posts'
        : 'marketplace';

    return api.get(
      `/api/${endpoint}/${id}/comments`
    );
  },

  // 댓글 작성
  createComment: (type, id, commentData) => {
    const endpoint =
      type === 'post'
        ? 'posts'
        : 'marketplace';

    return api.post(
      `/api/${endpoint}/${id}/comments`,
      commentData
    );
  },

  // 댓글 삭제
  deleteComment: (
    type,
    postId,
    commentId
  ) => {
    const endpoint =
      type === 'post'
        ? 'posts'
        : 'marketplace';

    return api.delete(
      `/api/${endpoint}/${postId}/comments/${commentId}`
    );
  },
};

// =========================
// IoT 센서 API
// =========================
export const sensorAPI = {
  // 최신 센서 데이터
  getLatestData: async (deviceKey) => {
    const res = await api.get(
      `/api/sensor/latest?device_key=${deviceKey}`
    );

    if (res.data?.data) {
      const d = res.data.data;

      res.data.data = {
        ...d,

        soilMoisture:
          d.soilMoisture ??
          d.soil_moisture ??
          0,

        lightLevel:
          d.lightLevel ??
          d.light_level ??
          0,

        lightRaw:
          d.lightRaw ??
          d.light_raw ??
          0,

        lightPercent:
          d.lightPercent ??
          d.light_percent ??
          0,

        temperature:
          d.temperature ?? 0,

        humidity:
          d.humidity ?? 0,
      };
    }

    return res;
  },

  // 센서 히스토리 데이터
  getHistoryData: async (deviceKey) => {
    const res = await api.get(
      `/api/sensor/history?device_key=${deviceKey}`
    );

    if (Array.isArray(res.data?.data)) {
      res.data.data =
        res.data.data.map((d) => ({
          ...d,

          soilMoisture:
            d.soilMoisture ??
            d.soil_moisture ??
            0,

          lightLevel:
            d.lightLevel ??
            d.light_level ??
            0,

          lightRaw:
            d.lightRaw ??
            d.light_raw ??
            0,

          lightPercent:
            d.lightPercent ??
            d.light_percent ??
            0,

          temperature:
            d.temperature ?? 0,

          humidity:
            d.humidity ?? 0,
        }));
    }

    return res;
  },

  // 명령 전송
  sendCommand: (
    command,
    device_key
  ) =>
    api.post('/api/command', {
      command,
      device_key,
    }),

  // 설정 조회
  getSettings: (deviceKey) =>
    api.get(
      `/api/settings?device_key=${deviceKey}`
    ),

  // 설정 저장
  updateSettings: (data) =>
    api.post('/api/settings/update', data),

  // 식물 종류 조회
  getSpecies: () =>
    api.get('/api/species'),
};

// =========================
// 디바이스 API
// =========================
export const deviceAPI = {
  // 내 디바이스 목록
  getMyDevices: () =>
    api.get('/api/device/my'),
};

// =========================
// 관리자 API
// =========================
export const adminAPI = {
  // 전체 유저
  getUsers: () =>
    api.get('/api/admin/users'),

  // 전체 게시글
  getAllPosts: () =>
    api.get('/api/posts'),

  // 전체 거래글
  getAllMarketplaceItems: () =>
    api.get('/api/marketplace'),

  // 게시글 삭제
  deletePost: (id) =>
    api.delete(`/api/admin/posts/${id}`),

  // 거래글 삭제
  deleteMarketItem: (id) =>
    api.delete(
      `/api/admin/marketplace/${id}`
    ),
};

// =========================
// 식물 정보 API
// =========================
export const plantAPI = {
  getPlants: () =>
    api.get('/api/plants'),

  getPlant: (id) =>
    api.get(`/api/plants/${id}`),

  createPlant: (formData) =>
    api.post('/api/plants', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  updatePlant: (id, formData) =>
    api.put(`/api/plants/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  deletePlant: (id) =>
    api.delete(`/api/plants/${id}`),
};

// =========================
// 내 식물 관리 API
// =========================
export const myPlantsAPI = {
  // 내 식물 목록
  getMyPlants: () =>
    api.get('/api/myplants'),

  // 특정 식물 조회
  getMyPlant: (id) =>
    api.get(`/api/myplants/${id}`),

  // 식물 등록
  createMyPlant: (formData) =>
    api.post('/api/myplants', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // 식물 수정
  updateMyPlant: (id, formData) =>
    api.put(
      `/api/myplants/${id}`,
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    ),

  // 식물 삭제
  deleteMyPlant: (id) =>
    api.delete(`/api/myplants/${id}`),

  // 물주기 기록 조회
  getWateringLogs: (plantId) =>
    api.get(
      `/api/myplants/${plantId}/watering`
    ),

  // 물주기 기록 추가
  addWateringLog: (plantId, data) =>
    api.post(
      `/api/myplants/${plantId}/watering`,
      data
    ),

  // 물주기 기록 삭제
  deleteWateringLog: (
    plantId,
    logId
  ) =>
    api.delete(
      `/api/myplants/${plantId}/watering/${logId}`
    ),
};

// =========================
// 채팅 API
// =========================
export const chatAPI = {
  // 채팅방 생성
  createRoom: (itemId, sellerId) =>
    api.post('/api/chat/rooms', {
      itemId,
      sellerId,
    }),

  // 내 채팅방 목록
  getRooms: () =>
    api.get('/api/chat/rooms'),

  // 메시지 조회
  getMessages: (roomId) =>
    api.get(
      `/api/chat/rooms/${roomId}/messages`
    ),

  // 채팅방 삭제
  deleteRoom: (roomId) =>
    api.delete(`/api/chat/rooms/${roomId}`),

  // 안 읽은 메시지 수
  getUnreadTotal: () =>
    api.get('/api/chat/unread-total'),

  // 읽음 처리
  markAsRead: (roomId) =>
    api.patch(`/api/chat/read/${roomId}`),
};

export default api;