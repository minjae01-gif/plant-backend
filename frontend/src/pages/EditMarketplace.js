import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Input, InputNumber, Button, Space, message, 
  Typography, Tag, Divider, Row, Col, Spin 
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { marketplaceAPI } from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Title, Text } = Typography;

function EditMarketplace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuth();  // 추가

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('selling');
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await marketplaceAPI.getItem(id);
      const item = response.data.item;
      setTitle(item.title);
      setContent(item.content);
      setPrice(item.price);
      setStatus(item.status);
    } catch (error) {
      message.error('거래글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로그인 체크 추가
  useEffect(() => {
    if (!user) {
      message.warning('로그인이 필요한 서비스입니다.');
      navigate('/login');
    }
  }, [user, navigate]);

  // 이미지 검증
  const validateImage = (file) => {
    if (!file.type.startsWith('image/')) {
      return '이미지 파일만 업로드 가능합니다.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return '이미지 크기는 5MB 이하여야 합니다.';
    }
    return null;
  };

  // 이미지 추가 (다중)
  const handleFilesSelect = (files) => {
    const fileArray = Array.from(files);
    const remainingSlots = 10 - images.length;

    if (fileArray.length > remainingSlots) {
      message.warning(`최대 ${remainingSlots}개의 이미지만 추가할 수 있습니다.`);
    }

    const validFiles = [];
    const errors = [];

    fileArray.slice(0, remainingSlots).forEach((file) => {
      const error = validateImage(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      message.error(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setImages([...images, ...validFiles]);
      message.success(`${validFiles.length}개의 이미지가 추가되었습니다.`);
    }
  };

  // 파일 선택
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
    }
    e.target.value = '';
  };

  // 드래그 앤 드롭
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  // 이미지 삭제
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  // 이미지 순서 변경
  const moveImageLeft = (index) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const moveImageRight = (index) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
  };

  // 수정 제출
  const handleSubmit = async () => {
    if (!title.trim()) {
      message.error('상품명을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      message.error('상품 설명을 입력해주세요.');
      return;
    }

    if (!price || price <= 0) {
      message.error('가격을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('price', price);
      formData.append('status', status);
      
      images.forEach((image) => {
        formData.append('images', image);
      });

      await marketplaceAPI.updateItem(id, formData);
      message.success('거래글이 수정되었습니다.');
      navigate(`/marketplace/${id}`);
    } catch (error) {
      message.error('거래글 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <Card>
          <Title level={2}>📝 거래글 수정</Title>
          <Text type="secondary">
            새로운 이미지를 드래그하여 추가하세요! (최대 10개)
          </Text>

          <Divider />

          {/* 이미지 업로드 */}
          <div style={styles.section}>
            <Space align="center" style={{ marginBottom: '12px' }}>
              <Text strong>상품 이미지</Text>
              <Tag color="green">{images.length}/10</Tag>
            </Space>

            <div
              style={{
                ...styles.dropZone,
                borderColor: isDragging ? '#52c41a' : '#d9d9d9',
                background: isDragging ? '#f6ffed' : '#fafafa',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              <Title level={4} style={{ margin: '16px 0 8px 0' }}>
                {isDragging ? '여기에 놓으세요!' : '새 이미지 추가하기'}
              </Title>
              <Text type="secondary">
                여러 이미지를 한번에 선택 가능 (기존 이미지 대체)
              </Text>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>

            {images.length > 0 && (
              <>
                <Divider />
                <Row gutter={[16, 16]}>
                  {images.map((image, index) => (
                    <Col xs={12} sm={8} md={6} key={index}>
                      <Card
                        size="small"
                        cover={
                          <div style={styles.imageWrapper}>
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`preview-${index}`}
                              style={styles.previewImg}
                            />
                            <div style={styles.imageOrder}>
                              {index + 1}/{images.length}
                            </div>
                            {index === 0 && (
                              <div style={styles.mainBadge}>대표</div>
                            )}
                          </div>
                        }
                        actions={[
                          <Button
                            icon={<ArrowLeftOutlined />}
                            size="small"
                            disabled={index === 0}
                            onClick={() => moveImageLeft(index)}
                          />,
                          <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            onClick={() => removeImage(index)}
                          />,
                          <Button
                            icon={<ArrowRightOutlined />}
                            size="small"
                            disabled={index === images.length - 1}
                            onClick={() => moveImageRight(index)}
                          />,
                        ]}
                      >
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {image.name.substring(0, 15)}...
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </div>

          <Divider />

          {/* 상품명 */}
          <div style={styles.section}>
            <Text strong>상품명</Text>
            <Input
              size="large"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginTop: '8px' }}
              maxLength={100}
              showCount
            />
          </div>

          <Divider />

          {/* 가격 */}
          <div style={styles.section}>
            <Text strong>가격</Text>
            <Space.Compact style={{ width: '100%', marginTop: '8px' }}>
              <InputNumber
                size="large"
                value={price}
                onChange={setPrice}
                style={{ width: '100%' }}
                min={0}
                max={10000000}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
              <Button size="large">원</Button>
            </Space.Compact>
          </div>

          <Divider />

          {/* 상품 설명 */}
          <div style={styles.section}>
            <Text strong>상품 설명</Text>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ marginTop: '8px' }}
              rows={10}
              maxLength={1000}
              showCount
            />
          </div>

          <Divider />

          {/* 버튼 */}
          <Space>
            <Button
              size="large"
              onClick={() => navigate(`/marketplace/${id}`)}
            >
              취소
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              수정 완료
            </Button>
          </Space>
        </Card>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
  },
  section: {
    marginBottom: '8px',
  },
  dropZone: {
    border: '2px dashed #d9d9d9',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '16px',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%',
    background: '#f5f5f5',
    borderRadius: '8px 8px 0 0',
    overflow: 'hidden',
  },
  previewImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageOrder: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  mainBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: '#52c41a',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

export default EditMarketplace;
