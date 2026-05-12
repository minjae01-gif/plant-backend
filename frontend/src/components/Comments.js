import React, { useState, useEffect } from 'react';
import { Input, Button, List, Avatar, Space, Typography, message, Popconfirm, Tag } from 'antd';
import { UserOutlined, DeleteOutlined, SendOutlined, CommentOutlined } from '@ant-design/icons';
import { commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Text } = Typography;

function Comments({ type, id }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);  // 답글 대상
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [id]);

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getComments(type, id);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('댓글 조회 실패:', error);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      message.error('댓글 내용을 입력해주세요.');
      return;
    }

    if (!user) {
      message.error('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      await commentAPI.createComment(type, id, { content: newComment, parent_id: null });
      message.success('댓글이 작성되었습니다.');
      setNewComment('');
      fetchComments();
    } catch (error) {
      message.error('댓글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyContent.trim()) {
      message.error('답글 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await commentAPI.createComment(type, id, { 
        content: replyContent, 
        parent_id: parentId 
      });
      message.success('답글이 작성되었습니다.');
      setReplyContent('');
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      message.error('답글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentAPI.deleteComment(type, id, commentId);
      message.success('댓글이 삭제되었습니다.');
      fetchComments();
    } catch (error) {
      message.error('댓글 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 댓글 개수 계산 (대댓글 포함)
  const countTotalComments = (commentList) => {
    let count = commentList.length;
    commentList.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        count += comment.replies.length;
      }
    });
    return count;
  };

  // 댓글 렌더링 (재귀적으로 대댓글 포함)
  const renderComment = (comment, isReply = false) => {
    const isAuthor = user && (
      comment.user_id === user.userId ||
      comment.user_id === user.id ||
      comment.username === user.username
    );

    return (
      <div key={comment.id}>
        <List.Item
          style={{
            background: isReply ? '#f9f9f9' : '#f0f0f0',
            padding: '16px',
            marginBottom: '4px',
            marginLeft: isReply ? '40px' : '0',
            borderRadius: '8px',
            border: '1px solid #d9d9d9',
            borderLeft: isReply ? '3px solid #52c41a' : '1px solid #d9d9d9',
          }}
        >
          <List.Item.Meta
            avatar={
              <Avatar 
                icon={<UserOutlined />} 
                style={{ backgroundColor: isReply ? '#1890ff' : '#52c41a' }}
                size={isReply ? 'default' : 'large'}
              />
            }
            title={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Text strong style={{ fontSize: isReply ? '14px' : '15px' }}>
                    {comment.username}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatDate(comment.created_at)}
                  </Text>
                  {isAuthor && (
                    <Tag color="green">내 댓글</Tag>
                  )}
                  {isReply && (
                    <Tag color="blue">답글</Tag>
                  )}
                </Space>
                <Space>
                  {!isReply && user && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CommentOutlined />}
                      onClick={() => setReplyTo(comment.id)}
                    >
                      답글
                    </Button>
                  )}
                  {isAuthor && (
                    <Popconfirm
                      title="댓글을 삭제하시겠습니까?"
                      description={!isReply && comment.replies?.length > 0 ? "답글도 함께 삭제됩니다." : undefined}
                      onConfirm={() => handleDelete(comment.id)}
                      okText="삭제"
                      cancelText="취소"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  )}
                </Space>
              </Space>
            }
            description={
              <Text style={{ 
                fontSize: isReply ? '14px' : '15px', 
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#262626',
                display: 'block',
                marginTop: '8px'
              }}>
                {comment.content}
              </Text>
            }
          />
        </List.Item>

        {/* 답글 작성 폼 */}
        {replyTo === comment.id && (
          <div style={{ 
            marginLeft: '40px', 
            marginTop: '8px', 
            marginBottom: '12px',
            padding: '16px',
            background: '#f0f7ff',
            borderRadius: '8px',
            border: '1px solid #91d5ff',
          }}>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              💬 {comment.username}님에게 답글 작성
            </Text>
            <TextArea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요..."
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{ marginBottom: '8px' }}
            />
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleReplySubmit(comment.id)}
                loading={loading}
              >
                답글 작성
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent('');
                }}
              >
                취소
              </Button>
            </Space>
          </div>
        )}

        {/* 대댓글 렌더링 */}
        {comment.replies && comment.replies.length > 0 && (
          <div>
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <Text strong style={{ fontSize: '18px', marginBottom: '16px', display: 'block' }}>
        💬 댓글 {countTotalComments(comments)}개
      </Text>

      {/* 댓글 목록 */}
      <List
        dataSource={comments}
        locale={{ emptyText: '첫 댓글을 작성해보세요!' }}
        renderItem={(comment) => renderComment(comment, false)}
      />

      {/* 댓글 작성 */}
      {user && (
        <div style={styles.writeSection}>
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={styles.textarea}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={loading}
            style={styles.submitButton}
            size="large"
          >
            댓글 작성
          </Button>
        </div>
      )}

      {!user && (
        <div style={styles.loginPrompt}>
          <Text type="secondary">댓글을 작성하려면 로그인이 필요합니다.</Text>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0',
  },
  writeSection: {
    marginTop: '24px',
    padding: '20px',
    background: '#fafafa',
    borderRadius: '12px',
    border: '1px solid #d9d9d9',
  },
  textarea: {
    marginBottom: '12px',
    fontSize: '15px',
  },
  submitButton: {
    background: '#52c41a',
    borderColor: '#52c41a',
  },
  loginPrompt: {
    textAlign: 'center',
    padding: '24px',
    background: '#fafafa',
    borderRadius: '8px',
    marginTop: '16px',
  },
};

export default Comments;
