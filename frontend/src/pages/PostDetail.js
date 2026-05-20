import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Space, Typography, Tag, Divider, 
  Avatar, Row, Col, Spin, message, Input, Upload 
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';


const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState([]);

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
      message.error('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (file) => {
    if (editImages.length >= 5) {
      message.error('이미지는 최대 5개까지만 업로드 가능합니다.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('이미지 크기는 5MB 이하여야 합니다.');
      return false;
    }
    setEditImages([...editImages, file]);
    return false;
  };

  const removeEditImage = (index) => {
    setEditImages(editImages.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await postAPI.deletePost(id);
      message.success('게시글이 삭제되었습니다.');
      navigate('/community');
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      message.error('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('content', editContent);
      
      editImages.forEach((image) => {
        formData.append('images', image);
      });

      await postAPI.updatePost(id, formData);
      message.success('게시글이 수정되었습니다.');
      setIsEditing(false);
      setEditImages([]);
      fetchPost();
    } catch (error) {
      message.error('수정에 실패했습니다.');
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

  const renderContent = () => {
    if (!post.content) return null;

    const lines = post.content.split('\n');
    const elements = [];
    
    lines.forEach((line, index) => {
      const imageMatch = line.match(/\[IMAGE:(\d+)\]/);
      
      if (imageMatch) {
        const imgIndex = parseInt(imageMatch[1]);
        if (post.images && post.images[imgIndex]) {
          const totalImages = post.images.length;
          elements.push(
            <div key={`image-${index}`} style={styles.imageBlock}>
              <div style={styles.imageContainer}>
                <img
                  src={`${process.env.REACT_APP_API_URL}${post.images[imgIndex].image_url}`}
                  alt={`${post.title} - ${imgIndex + 1}`}
                  style={styles.contentImage}
                  onError={(e) => {
                    console.error('이미지 로드 실패:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
                <div style={styles.imageNumber}>
                  {imgIndex + 1}/{totalImages}
                </div>
              </div>
            </div>
          );
        }
      } else if (line.trim()) {
        elements.push(
          <Paragraph key={`text-${index}`} style={styles.textBlock}>
            {line}
          </Paragraph>
        );
      }
    });

    return elements;
  };

  const isAuthor = post && user && (
    post.user_id === user.userId || 
    post.user_id === user.id ||
    post.username === user.username
  );


  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }


  if (!post) {
    return (
      <div style={styles.container}>
        <Card>
          <Text>게시글을 찾을 수 없습니다.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/community')}
        size="large"
        style={{ marginBottom: '20px' }}
      >
        목록으로
      </Button>

      {isEditing ? (
        <Card>
          <Title level={3}>게시글 수정</Title>
          <Divider />
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>제목</Text>
              <Input
                size="large"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ marginTop: '8px' }}
              />
            </div>

            <div>
              <Text strong>내용</Text>
              <TextArea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={15}
                style={{ marginTop: '8px' }}
              />
            </div>

            <div>
              <Text strong>이미지 (기존 이미지 삭제 후 새로 업로드)</Text>
              
              {editImages.length > 0 && (
                <Row gutter={[16, 16]} style={{ marginTop: '12px' }}>
                  {editImages.map((img, idx) => (
                    <Col span={6} key={idx}>
                      <Card
                        size="small"
                        cover={
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`preview-${idx}`}
                            style={{ height: '150px', objectFit: 'cover' }}
                          />
                        }
                        actions={[
                          <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            onClick={() => removeEditImage(idx)}
                          />
                        ]}
                      >
                        <Tag>{idx + 1}/{editImages.length}</Tag>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}

              {editImages.length < 5 && (
                <Upload
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button
                    icon={<PlusOutlined />}
                    block
                    style={{ marginTop: '12px' }}
                  >
                    이미지 추가 ({editImages.length}/5)
                  </Button>
                </Upload>
              )}
            </div>

            <Space>
              <Button
                type="primary"
                size="large"
                onClick={handleUpdate}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                수정 완료
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setIsEditing(false);
                  setEditImages([]);
                }}
              >
                취소
              </Button>
            </Space>
          </Space>
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <div style={styles.postHeader}>
              <Title level={2} style={{ margin: 0 }}>
                {post.title}
              </Title>
              
              <Divider />
              
              <Row justify="space-between" align="middle">
                <Col>
                  <Space size="large" wrap>
                    <Space>
                      <Avatar 
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: '#52c41a' }}
                      />
                      <Text strong style={{ fontSize: '16px' }}>
                        {post.username}
                      </Text>
                    </Space>
                    
                    <Space>
                      <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                      <Text type="secondary">{formatDate(post.created_at)}</Text>
                    </Space>
                    
                    {post.updated_at !== post.created_at && (
                      <Tag color="green">수정됨</Tag>
                    )}
                  </Space>
                </Col>
              </Row>
            </div>

            <Divider />

            <div style={styles.contentWrapper}>
              {renderContent()}
            </div>

            {isAuthor && (
              <>
                <Divider />
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(true)}
                    size="large"
                  >
                    수정
                  </Button>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                    danger
                    size="large"
                  >
                    삭제
                  </Button>
                </Space>
              </>
            )}
          </Card>

          <Card style={{ marginTop: '24px' }}>
            <Comments type="post" id={id} />
          </Card>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
  },
  card: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  postHeader: {
    marginBottom: '20px',
  },
  contentWrapper: {
    minHeight: '200px',
  },
  textBlock: {
    fontSize: '16px',
    lineHeight: '1.8',
    marginBottom: '16px',
  },
  imageBlock: {
    margin: '24px 0',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentImage: {
    maxWidth: '100%',
    maxHeight: '600px',
    objectFit: 'contain',
    display: 'block',
  },
  imageNumber: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
};

export default PostDetail;