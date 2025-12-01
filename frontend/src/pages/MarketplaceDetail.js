import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Space, Typography, Tag, Divider, 
  Avatar, Row, Col, Spin, message, Statistic, Carousel, Modal
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  LeftOutlined,
  RightOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { marketplaceAPI, tradeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Comments from '../components/Comments';
import { MessageOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

function MarketplaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);



  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await marketplaceAPI.getItem(id);
      setItem(response.data.item);
    } catch (error) {
      message.error('거래글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await marketplaceAPI.deleteItem(id);
      message.success('거래글이 삭제되었습니다.');
      navigate('/marketplace');
    } catch (error) {
      message.error('삭제에 실패했습니다.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const formData = new FormData();
      formData.append('title', item.title);
      formData.append('content', item.content);
      formData.append('price', item.price);
      formData.append('status', newStatus);

      await marketplaceAPI.updateItem(id, formData);
      message.success(
        newStatus === 'sold' ? '판매완료로 변경되었습니다.' : '판매중으로 변경되었습니다.'
      );
      fetchItem();
    } catch (error) {
      message.error('상태 변경에 실패했습니다.');
    }
  };

  
  // 거래 요청 핸들러
const handleTradeRequest = async () => {
    if (!user) {
      message.warning('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    if (window.confirm('판매자에게 거래를 요청하시겠습니까?')) {
      try {
        const response = await tradeAPI.sendRequest(item.id, item.user_id);
        
        if (response.data.success) {
          // ✅ 성공 알림 (초록색 토스트)
          message.success('요청 되었습니다.');
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 409) {
            // ⚠️ 중복 경고 (화면 중앙 팝업)
            // 이제 무조건 뜰 겁니다.
            Modal.warning({
              title: '알림',
              content: '이미 구매 요청 했습니다.',
            });
          } else if (error.response.status === 400) {
            message.error(error.response.data.message);
          } else {
            message.error('요청 중 오류가 발생했습니다.');
          }
        } else {
          message.error('서버와 연결할 수 없습니다.');
        }
      }
    }
  };
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
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

  const isAuthor = item && user && (
    item.user_id === user.userId || 
    item.user_id === user.id ||
    item.username === user.username
  );

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <Card>
          <Text>거래글을 찾을 수 없습니다.</Text>
        </Card>
      </Layout>
    );
  }

  const totalImages = item.images ? item.images.length : 0;

  return (
    <Layout>
      <div style={styles.container}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/marketplace')}
          size="large"
          style={{ marginBottom: '20px' }}
        >
          목록으로
        </Button>

        <Card style={styles.card}>
          <Row gutter={[32, 32]}>
            {/* 왼쪽: 이미지 캐러셀 */}
            <Col xs={24} md={12}>
              {totalImages > 0 ? (
                <div style={styles.carouselWrapper}>
                  {/* 이미지 순서 표시 */}
                  <div style={styles.imageCounter}>
                    {currentImageIndex + 1}/{totalImages}
                  </div>

                  {/* 캐러셀 */}
                  <Carousel
                    ref={carouselRef}
                    dots={true}
                    afterChange={(current) => setCurrentImageIndex(current)}
                    style={styles.carousel}
                  >
                    {item.images.map((image, index) => (
                      <div key={image.id} style={styles.carouselSlide}>
                        <img
                          src={`http://localhost:5000${image.image_url}`}
                          alt={`${item.title} - ${index + 1}`}
                          style={styles.carouselImage}
                          onError={(e) => {
                            console.error('이미지 로드 실패:', e.target.src);
                            e.target.style.display = 'none';
                          }}
                        />
                        {item.status === 'sold' && (
                          <div style={styles.soldOverlay}>
                            <CheckCircleOutlined style={{ fontSize: '64px', color: '#fff' }} />
                            <Title level={2} style={{ color: '#fff', margin: '10px 0 0 0' }}>
                              판매완료
                            </Title>
                          </div>
                        )}
                      </div>
                    ))}
                  </Carousel>

                  {/* 이전/다음 버튼 */}
                  {totalImages > 1 && (
                    <>
                      <Button
                        icon={<LeftOutlined />}
                        onClick={() => carouselRef.current?.prev()}
                        style={styles.prevButton}
                        shape="circle"
                        size="large"
                      />
                      <Button
                        icon={<RightOutlined />}
                        onClick={() => carouselRef.current?.next()}
                        style={styles.nextButton}
                        shape="circle"
                        size="large"
                      />
                    </>
                  )}

                  {/* 썸네일 네비게이션 */}
                  {totalImages > 1 && (
                    <div style={styles.thumbnailWrapper}>
                      {item.images.map((image, index) => (
                        <div
                          key={image.id}
                          style={{
                            ...styles.thumbnail,
                            border: currentImageIndex === index ? '3px solid #52c41a' : '2px solid #d9d9d9',
                          }}
                          onClick={() => {
                            carouselRef.current?.goTo(index);
                            setCurrentImageIndex(index);
                          }}
                        >
                          <img
                            src={`http://localhost:5000${image.image_url}`}
                            alt={`thumb-${index}`}
                            style={styles.thumbnailImage}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.noImage}>
                  <ShoppingOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                  <Text type="secondary">이미지 없음</Text>
                </div>
              )}
            </Col>

            {/* 오른쪽: 정보 */}
            <Col xs={24} md={12}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 상태 태그 */}
                <div>
                  {item.status === 'sold' ? (
                    <Tag color="default" style={{ fontSize: '16px', padding: '8px 16px' }}>
                      판매완료
                    </Tag>
                  ) : (
                    <Tag color="green" style={{ fontSize: '16px', padding: '8px 16px' }}>
                      판매중
                    </Tag>
                  )}
                </div>

                {/* 제목 */}
                <Title level={2} style={{ margin: 0 }}>
                  {item.title}
                </Title>

                {/* 가격 */}
                <Card style={styles.priceCard}>
                  <Statistic
                    title="판매 가격"
                    value={item.price}
                    prefix={<DollarOutlined />}
                    suffix="원"
                    valueStyle={{
                      color: item.status === 'sold' ? '#8c8c8c' : '#52c41a',
                      fontSize: '36px',
                      fontWeight: 'bold',
                    }}
                    formatter={(value) => formatPrice(value)}
                  />
                </Card>

                <Divider />

                {/* 판매자 정보 */}
                <Space size="large">
                  <Space>
                    <Avatar 
                      icon={<UserOutlined />} 
                      style={{ backgroundColor: '#52c41a' }}
                      size="large"
                    />
                    <div>
                      <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                        판매자
                      </Text>
                      <Text strong style={{ fontSize: '16px' }}>
                        {item.username}
                      </Text>
                    </div>
                  </Space>
                  
                  <Space>
                    <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                    <div>
                      <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>
                        등록일
                      </Text>
                      <Text>{formatDate(item.created_at)}</Text>
                    </div>
                  </Space>
                </Space>

                <Divider />

                {/* 상품 설명 */}
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                    상품 설명
                  </Text>
                  <Paragraph style={styles.description}>
                    {item.content}
                  </Paragraph>
                </div>

                {/* 작성자 액션 버튼 */}
               {isAuthor ? (
                  <>
                    <Divider />
                    <Space wrap>
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/marketplace/edit/${id}`)}
                        size="large"
                      >
                        수정
                      </Button>
                      
                      {item.status === 'selling' ? (
                        <Button
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleStatusChange('sold')}
                          type="primary"
                          size="large"
                        >
                          판매완료
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStatusChange('selling')}
                          size="large"
                        >
                          판매중으로 변경
                        </Button>
                      )}
                      
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
                ) : (
                  // 🔥 구매자일 때만 보이는 버튼
                  <>
                    <Divider />
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<ShopOutlined />}
                      onClick={handleTradeRequest}
                      disabled={item.status === 'sold'}
                      block
                      style={{ 
                        height: '50px', 
                        fontSize: '18px', 
                        background: '#faad14', 
                        borderColor: '#faad14' 
                      }}
                    >
                      {item.status === 'sold' ? '판매 완료된 상품입니다' : '💬 판매자에게 거래 요청하기'}
                    </Button>
                  </>
                )}

              </Space>
            </Col>
          </Row>
        </Card>

        {/* 댓글 섹션 */}
        <Card style={{ marginTop: '24px' }}>
          <Comments type="item" id={id} />
        </Card>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  card: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  carouselWrapper: {
    position: 'relative',
    width: '100%',
    background: '#f5f5f5',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  carousel: {
    width: '100%',
  },
  carouselSlide: {
    position: 'relative',
    width: '100%',
    height: '500px',
    display: 'flex !important',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
  },
  carouselImage: {
    maxWidth: '100%',
    maxHeight: '500px',
    objectFit: 'contain',
  },
  imageCounter: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '24px',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 10,
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  prevButton: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.9)',
  },
  nextButton: {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.9)',
  },
  thumbnailWrapper: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: '#fff',
    overflowX: 'auto',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noImage: {
    width: '100%',
    height: '500px',
    background: '#fafafa',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceCard: {
    background: '#f6ffed',
    border: '2px solid #52c41a',
    borderRadius: '8px',
  },
  description: {
    fontSize: '15px',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
    minHeight: '100px',
    color: '#595959',
  },
};

export default MarketplaceDetail;