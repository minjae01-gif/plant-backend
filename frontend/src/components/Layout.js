// src/components/Layout.js
import React, { useState } from 'react';
import { Layout as AntLayout, Drawer, Button, Grid } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const { Content, Header } = AntLayout;
const { useBreakpoint } = Grid;

function Layout({ children }) {
  const location = useLocation();
  const screens = useBreakpoint();
  
  // 모바일용 햄버거 메뉴(서랍) 열림/닫힘 상태
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const excludePaths = ['/login', '/register', '/signup'];
  const isExcluded = excludePaths.includes(location.pathname);
  
  // 모바일 화면(md 미만)인지 체크 (화면이 작아지면 true)
  const isMobile = screens.md === false;

  if (isExcluded) {
    return (
      <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
        {children}
      </div>
    );
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      
      {!isMobile && <Sidebar />}

      
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ padding: 0, background: '#001529' }}
          width={240}
          closable={false}
        >
         
          <Sidebar isMobile={true} closeDrawer={() => setDrawerVisible(false)} />
        </Drawer>
      )}

      <AntLayout style={{ marginLeft: isMobile ? 0 : 240, transition: 'all 0.2s' }}>
        
   
        {isMobile && (
          <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Button 
              type="text" 
              icon={<MenuOutlined style={{ fontSize: '20px' }} />} 
              onClick={() => setDrawerVisible(true)} 
            />
            <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '12px' }}>
              🌿 Plant Community
            </span>
          </Header>
        )}

        <Content style={{ padding: isMobile ? '12px' : '24px', background: '#f0f2f5', minHeight: '100vh', overflowX: 'hidden' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default Layout;