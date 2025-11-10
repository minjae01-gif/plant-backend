import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authAPI = {
  // 회원가입
  signup: (userData) => api.post('/auth/signup', userData),
  
  // 로그인
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 토큰 검증
  verify: () => api.get('/auth/verify'),
};

// 게시글 관련 API
export const postAPI = {
  // 모든 게시글 조회
  getPosts: () => api.get('/posts'),
  
  // 특정 게시글 조회
  getPost: (id) => api.get(`/posts/${id}`),
  
  // 게시글 작성
  createPost: (postData) => api.post('/posts', postData),
  
  // 게시글 수정
  updatePost: (id, postData) => api.put(`/posts/${id}`, postData),
  
  // 게시글 삭제
  deletePost: (id) => api.delete(`/posts/${id}`),
};

export default api;