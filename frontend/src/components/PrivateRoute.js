import React from 'react';
import { Navigate } from 'react-router-dom'; 
import { Spin } from 'antd';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // 1. 로딩 중일 때는 스피너 표시
     if (loading) {
    return (
      <div style={styles.loading}>
        <Spin size="large" tip="로딩 중..." />
      </div>
    );
  }


  // 로그인 안 된 상태면 URL 뒤에 ?auth=required 꼬리표를 달고 이동
  if (!user) {
    return <Navigate to="/login?auth=required" replace />;
  }


  // 2. 유저가 있으면 통과
  return children;
}

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
};

export default PrivateRoute;