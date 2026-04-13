import React, { useState, useEffect } from 'react'; // useEffect 추가
import { Badge, Layout, Menu, Button } from 'antd';
import {
  HomeOutlined,
  DashboardOutlined,
  MessageOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserOutlined,
  SettingOutlined,
  BookOutlined,
  HeartOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios'; // axios 임포트 확인!
import { chatAPI } from '../services/api'; // chatAPI import 추가

const { Sider } = Layout;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, unreadCount, refreshUnreadCount, logout } = useAuth();

  // 전체 안 읽은 메시지 개수 상태
  const [totalUnread] = useState(0);

  // 페이지가 바뀔 때마다 혹은 유저 상태가 바뀔 때마다 개수 업데이트
  useEffect(() => {
    refreshUnreadCount();
  }, [location.pathname, user]); 

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const selectedKey = location.pathname;

  // 메뉴 아이템 정의 (중복 제거 및 배지 적용)
  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '홈', onClick: () => navigate('/') },
    { key: '/dashboard', icon: <DashboardOutlined />, label: '대시보드', onClick: () => navigate('/dashboard') },
    { key: '/myplants', icon: <HeartOutlined />, label: '내 식물', onClick: () => navigate('/myplants') },
    { key: '/plants', icon: <BookOutlined />, label: '식물 정보', onClick: () => navigate('/plants') },
    { key: '/community', icon: <MessageOutlined />, label: '커뮤니티', onClick: () => navigate('/community') },
    { key: '/marketplace', icon: <ShoppingOutlined />, label: '식물 거래', onClick: () => navigate('/marketplace') },
    {
      key: '/chat-list',
      icon: (
        <Badge count={unreadCount} size="small" offset={[60, 0]} overflowCount={99} showZero={false} >
          <CommentOutlined />
        </Badge>
      ),
      label: '메시지',
      onClick: () => navigate('/chat-list'),
    },
    { key: '/mypage', icon: <UserOutlined />, label: '마이페이지', onClick: () => navigate('/mypage') },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({
      key: '/admin',
      icon: <SettingOutlined style={{ color: '#ff4d4f' }} />,
      label: <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>관리자 페이지</span>,
      onClick: () => navigate('/admin'),
      style: { marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }
    });
  }

  return (
    <Sider
      width={240}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        background: '#001529',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}
    >
      <div style={styles.logo}>
        <span style={styles.logoIcon}>🌿</span>
        <span style={styles.logoText}>Plant Community</span>
      </div>

      <div style={styles.userInfo}>
        <div style={styles.userAvatar}>
          {user ? user.username?.charAt(0).toUpperCase() : '👤'}
        </div>
        <div style={styles.userName}>
          {user ? user.username : 'Guest'}
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{ background: 'transparent', border: 'none', marginTop: '20px' }}
        theme="dark"
      />

      <div style={styles.authContainer}>
        {user ? (
          <Menu
            mode="inline"
            theme="dark"
            style={{ background: 'transparent', border: 'none' }}
            items={[{
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '로그아웃',
              onClick: handleLogout,
              danger: true,
            }]}
          />
        ) : (
          <Button type="primary" icon={<LoginOutlined />} onClick={handleLogin} block size="large" style={{ background: '#52c41a', borderColor: '#52c41a' }}>
            로그인
          </Button>
        )}
      </div>
    </Sider>
  );
}

const styles = {
  logo: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logoIcon: {
    fontSize: '28px',
    marginRight: '10px',
  },
  logoText: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  userInfo: {
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  userAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#52c41a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '12px',
  },
  userName: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500',
  },
  authContainer: {
    position: 'absolute',
    bottom: '20px',
    left: 0,
    right: 0,
  },
};



export default Sidebar;