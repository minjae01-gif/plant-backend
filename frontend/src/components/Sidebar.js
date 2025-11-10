import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <h2 style={styles.logoText}>🌱 Plant Community</h2>
      </div>

      <nav style={styles.nav}>
        <Link 
          to="/" 
          style={{
            ...styles.navItem,
            ...(isActive('/') ? styles.navItemActive : {})
          }}
        >
          <span style={styles.icon}>🏠</span>
          <span>홈</span>
        </Link>

        <Link 
          to="/community" 
          style={{
            ...styles.navItem,
            ...(isActive('/community') ? styles.navItemActive : {})
          }}
        >
          <span style={styles.icon}>💬</span>
          <span>커뮤니티</span>
        </Link>

        <Link 
          to="/marketplace" 
          style={{
            ...styles.navItem,
            ...(isActive('/marketplace') ? styles.navItemActive : {})
          }}
        >
          <span style={styles.icon}>🛒</span>
          <span>식물 거래</span>
        </Link>

        <Link 
          to="/dashboard" 
          style={{
            ...styles.navItem,
            ...(isActive('/dashboard') ? styles.navItemActive : {})
          }}
        >
          <span style={styles.icon}>📊</span>
          <span>대시보드</span>
        </Link>
      </nav>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '250px',
    height: '100vh',
    backgroundColor: '#2c3e50',
    color: 'white',
    position: 'fixed',
    left: 0,
    top: 0,
    padding: '20px 0',
  },
  logo: {
    padding: '0 20px',
    marginBottom: '30px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '20px',
  },
  logoText: {
    margin: 0,
    fontSize: '20px',
    color: '#4CAF50',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px 20px',
    color: 'white',
    textDecoration: 'none',
    transition: 'background 0.2s',
    cursor: 'pointer',
  },
  navItemActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderLeft: '4px solid #4CAF50',
  },
  icon: {
    fontSize: '20px',
  },
};

export default Sidebar;