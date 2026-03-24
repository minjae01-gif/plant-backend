import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
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