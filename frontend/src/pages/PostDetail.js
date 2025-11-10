import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await postAPI.getPost(id);
      setPost(response.data.post);
      setEditTitle(response.data.post.title);
      setEditContent(response.data.post.content);
    } catch (error) {
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await postAPI.deletePost(id);
      alert('게시글이 삭제되었습니다.');
      navigate('/community');
    } catch (error) {
      alert(error.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editTitle.trim() || !editContent.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      await postAPI.updatePost(id, { title: editTitle, content: editContent });
      alert('게시글이 수정되었습니다.');
      setIsEditing(false);
      fetchPost();
    } catch (error) {
      setError(error.response?.data?.message || '수정에 실패했습니다.');
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

  const isAuthor = post && user && (
    post.user_id === user.userId || 
    post.user_id === user.id ||
    post.username === user.username
  );

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>로딩 중...</div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div style={styles.error}>게시글을 찾을 수 없습니다.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <button 
          onClick={() => navigate('/community')}
          style={styles.backBtn}
        >
          ← 목록으로
        </button>

        {isEditing ? (
          // 수정 모드
          <div style={styles.editForm}>
            <h2 style={styles.pageTitle}>게시글 수정</h2>
            {error && <div style={styles.errorBox}>{error}</div>}
            
            <form onSubmit={handleUpdate}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>내용</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={styles.textarea}
                  rows="15"
                />
              </div>

              <div style={styles.buttonGroup}>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  style={styles.cancelBtn}
                >
                  취소
                </button>
                <button type="submit" style={styles.submitBtn}>
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        ) : (
          // 보기 모드
          <div style={styles.postContainer}>
            <div style={styles.postHeader}>
              <h1 style={styles.postTitle}>{post.title}</h1>
              <div style={styles.postMeta}>
                <span style={styles.author}>👤 {post.username}</span>
                <span style={styles.date}>🕐 {formatDate(post.created_at)}</span>
                {post.updated_at !== post.created_at && (
                  <span style={styles.edited}>(수정됨)</span>
                )}
              </div>
            </div>

            <div style={styles.postContent}>
              {post.content}
            </div>

            {isAuthor && (
              <div style={styles.actionButtons}>
                <button 
                  onClick={() => setIsEditing(true)}
                  style={styles.editBtn}
                >
                  ✏️ 수정
                </button>
                <button 
                  onClick={handleDelete}
                  style={styles.deleteBtn}
                >
                  🗑️ 삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#757575',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '20px',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#f44336',
  },
  postContainer: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  postHeader: {
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '20px',
    marginBottom: '30px',
  },
  postTitle: {
    margin: '0 0 15px 0',
    fontSize: '28px',
    color: '#333',
  },
  postMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '14px',
    color: '#999',
  },
  author: {
    fontWeight: '500',
  },
  date: {},
  edited: {
    color: '#4CAF50',
  },
  postContent: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#333',
    whiteSpace: 'pre-wrap',
    marginBottom: '30px',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '20px',
  },
  editBtn: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deleteBtn: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  // 수정 모드 스타일
  editForm: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  pageTitle: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#333',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#757575',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default PostDetail;