// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Badge, Layout, Menu, Button, Avatar } from 'antd';
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
import { chatAPI } from '../services/api'; 

const { Sider } = Layout;

// isMobile, closeDrawer를 props로 받아서 모바일에서 메뉴 클릭 시 서랍이 닫히도록 처리
function Sidebar({ isMobile, closeDrawer }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    refreshUnreadCount();
  }, [user]);

  const refreshUnreadCount = async () => {
    try {
      if (!user) return;
      const res = await chatAPI.getUnreadTotal();
      setTotalUnread(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  // 메뉴 이동 시 '모바일 서랍'을 닫아주는 통합 함수
  const handleNav = (path) => {
    navigate(path);
    if (isMobile && closeDrawer) closeDrawer(); 
  };

  const handleLogout = () => {
    logout();
    handleNav('/dashboard');
  };

  const handleLogin = () => {
    handleNav('/login');
  };

  const selectedKey = location.pathname;

  // onClick에 전부 handleNav를 연결
  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '홈', onClick: () => handleNav('/') },
    { key: '/dashboard', icon: <DashboardOutlined />, label: '대시보드', onClick: () => handleNav('/dashboard') },
    { key: '/myplants', icon: <HeartOutlined />, label: '내 식물', onClick: () => handleNav('/myplants') },
    { key: '/plants', icon: <BookOutlined />, label: '식물 정보', onClick: () => handleNav('/plants') },
    { key: '/community', icon: <MessageOutlined />, label: '커뮤니티', onClick: () => handleNav('/community') },
    { key: '/marketplace', icon: <ShoppingOutlined />, label: '식물 거래', onClick: () => handleNav('/marketplace') },
    {
      key: '/chat-list',
      icon: (
        <Badge count={totalUnread} size="small" offset={[10, 0]}>
          <CommentOutlined />
        </Badge>
      ),
      label: '메시지',
      onClick: () => handleNav('/chat-list'),
    },
    { key: '/mypage', icon: <UserOutlined />, label: '마이페이지', onClick: () => handleNav('/mypage') },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({
      key: '/admin',
      icon: <SettingOutlined style={{ color: '#ff4d4f' }} />,
      label: <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>관리자 페이지</span>,
      onClick: () => handleNav('/admin'),
      style : { marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }
    });
  }

return (
    <Sider
      width={240}
      style={isMobile ? { height: '100%', background: '#001529' } : {
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#001529',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* 👇 여기서부터 전체 스크롤을 담당하는 Flex 컨테이너야 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        
        {/* 1. 맨 위: 로고 영역 */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌿</span>
          <span style={styles.logoText}>Plant Community</span>
        </div>

        {/* 2. 그 다음: 사용자 정보 */}
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {user ? user.username?.charAt(0).toUpperCase() : '👤'}
          </div>
          <div style={styles.userName}>
            {user ? user.username : 'Guest'}
          </div>
          {!user && (
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
              게스트 모드
            </div>
          )}
        </div>

        {/* 3. 중간: 메뉴 영역 (플렉스로 남는 공간 차지) */}
        <div style={{ flex: 1 }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ background: 'transparent', border: 'none', marginTop: '20px', paddingBottom: '20px' }}
            theme="dark"
          />
        </div>

        {/* 4. 맨 밑: 로그인/로그아웃 버튼 */}
        <div style={styles.authContainer}>
          {user ? (
            <Menu
              mode="inline"
              theme="dark"
              style={{ background: 'transparent', border: 'none' }}
              items={[
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '로그아웃',
                  onClick: handleLogout,
                  danger: true,
                },
              ]}
            />
          ) : (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              block
              size="large"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              로그인
            </Button>
          )}
        </div>

      </div>
    </Sider>
  );
}

const styles = {
  logo: { minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
  logoIcon: { fontSize: '28px', marginRight: '10px' },
  logoText: { color: '#fff', fontSize: '18px', fontWeight: 'bold' },
  userInfo: { padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
  userAvatar: { width: '60px', height: '60px', borderRadius: '50%', background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' },
  userName: { color: '#fff', fontSize: '16px', fontWeight: '500' },
  // 👇 예전 코드에 있던 position: absolute 관련 설정들을 완전히 날렸어!
  authContainer: { padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' },
};

export default Sidebar;