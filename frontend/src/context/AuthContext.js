import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { chatAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // 페이지 로드 시 토큰 검증
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.user);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  // 로그인
  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '로그인에 실패했습니다.' 
      };
    }
  };

  // 구글 로그인
  const googleLogin = async (credential) => {
    try {
      const response = await authAPI.googleLogin({ credential });
      // 기존 api 구조에 따라 response.data 안에 토큰이 있을 수 있으니 맞춰서 꺼냄
      const { token, user } = response.data || response; 
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '구글 로그인에 실패했습니다.' 
      };
    }
  };

  // 회원가입
  const signup = async (username, email, password) => {
    try {
      const response = await authAPI.register({ username, email, password });  // 👈 signup → register
      return { success: true, message: response.message };  // 👈 response.data.message → response.message
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '회원가입에 실패했습니다.' 
      };
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUnreadCount = async () => {
    try {
      if (!user) return;
      const res = await chatAPI.getUnreadTotal();

      console.log("서버에서 준 배지 데이터:", res.data);
      
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, unreadCount, refreshUnreadCount,login, googleLogin, setUser, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );

  
};

// 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};