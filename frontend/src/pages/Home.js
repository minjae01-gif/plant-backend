import React from 'react';
import Layout from '../components/Layout';

function Home() {
  return (
    <Layout>
      <div style={styles.content}>
        <h2 style={styles.title}>🏠 홈</h2>
        
        <div style={styles.cards}>
          <div style={styles.card}>
            <h3>🛒 식물 거래</h3>
            <p>준비 중입니다...</p>
          </div>

          <div style={styles.card}>
            <h3>💬 커뮤니티</h3>
            <p>준비 중입니다...</p>
          </div>

          <div style={styles.card}>
            <h3>📊 대시보드</h3>
            <p>준비 중입니다...</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    marginBottom: '30px',
    color: '#333',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
};

export default Home;