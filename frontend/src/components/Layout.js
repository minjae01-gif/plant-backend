import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      
      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>Plant Community</h1>
          <div style={styles.userSection}>
            <span style={styles.username}>{user?.username}님</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              로그아웃
            </button>
          </div>
        </header>

        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  main: {
    marginLeft: '250px',
    width: 'calc(100% - 250px)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#333',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  username: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  content: {
    flex: 1,
    padding: '30px',
  },
};

export default Layout;