import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';


// 페이지 import
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import DashBoard from './pages/DashBoard';
import Community from './pages/Community';
import WritePost from './pages/WritePost';
import PostDetail from './pages/PostDetail';
import Marketplace from './pages/Marketplace';
import WriteMarketplace from './pages/WriteMarketplace';
import EditMarketplace from './pages/EditMarketplace';
import MarketplaceDetail from './pages/MarketplaceDetail';
import MyPage from './pages/MyPage';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 홈 */}
          <Route path="/" element={<Home />} />
          {/* 인증 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Register />} />
          {/* 대시보드 */}
          <Route path="/dashboard" element={<DashBoard />} />
          {/* 커뮤니티 */}
          <Route path="/community" element={<Community />} />
          <Route path="/community/write" element={<PrivateRoute><WritePost /></PrivateRoute>} />
          <Route path="/community/:id" element={<PostDetail />} />
          {/* 거래 */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/write" element={<PrivateRoute><WriteMarketplace /></PrivateRoute>} />
          <Route path="/marketplace/edit/:id" element={<PrivateRoute><EditMarketplace /></PrivateRoute>} />
          <Route path="/marketplace/:id" element={<PrivateRoute><MarketplaceDetail /></PrivateRoute>} />
          {/* 관리자페이지 */}
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          {/* 마이페이지 */}
          <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />
          {/* 404 - 홈으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function App() {
  return (
    <AntdApp>
      <AppContent />
    </AntdApp>
  );
}

export default App;