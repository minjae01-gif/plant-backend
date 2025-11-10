import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import Layout from '../components/Layout';

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await postAPI.getPosts();
      setPosts(response.data.posts);
    } catch (error) {
      console.error('게시글 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>로딩 중...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>💬 커뮤니티 게시판</h2>
          <button 
            style={styles.writeBtn}
            onClick={() => navigate('/community/write')}
          >
            ✏️ 글쓰기
          </button>
        </div>

        {posts.length === 0 ? (
          <div style={styles.empty}>
            <p>아직 작성된 게시글이 없습니다.</p>
            <p>첫 번째 게시글을 작성해보세요!</p>
          </div>
        ) : (
          <div style={styles.postList}>
            {posts.map((post) => (
              <div 
                key={post.id} 
                style={styles.postCard}
                onClick={() => navigate(`/community/${post.id}`)}
              >
                <h3 style={styles.postTitle}>{post.title}</h3>
                <p style={styles.postContent}>
                  {post.content.length > 100 
                    ? post.content.substring(0, 100) + '...' 
                    : post.content}
                </p>
                <div style={styles.postMeta}>
                  <span style={styles.author}>👤 {post.username}</span>
                  <span style={styles.date}>🕐 {formatDate(post.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  writeBtn: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    padding: '50px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#666',
  },
  postList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  postCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  postTitle: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    color: '#333',
  },
  postContent: {
    margin: '0 0 15px 0',
    color: '#666',
    lineHeight: '1.6',
  },
  postMeta: {
    display: 'flex',
    gap: '20px',
    fontSize: '14px',
    color: '#999',
  },
  author: {
    fontWeight: '500',
  },
  date: {},
};

export default Community;