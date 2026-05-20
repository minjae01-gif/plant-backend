import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Button, Space, Typography, Tag, Badge, 
  Input, Select, Empty, Statistic, message
} from 'antd';
import {
  ShoppingOutlined,
  PlusOutlined,
  SearchOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

function Marketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleWriteClick = () => {
    if (!user) {
      message.warning('로그인 후 거래글을 작성할 수 있습니다.');
      navigate('/login');
      return;
    }
    navigate('/marketplace/write');
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.getItems();
      setItems(response.data.items);
    } catch (error) {
      console.error('거래글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 필터링
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sellingCount = items.filter(item => item.status === 'selling').length;
  const soldCount = items.filter(item => item.status === 'sold').length;
  const reservedCount = items.filter(item => item.status === 'reserved').length;

  return (
    
      <div style={styles.container}>
        {/* 헤더 */}
      <div style={styles.header}>
          <Title level={2} style={{ margin: 0 }}>
            🛒 식물 거래
          </Title>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
            <Search
              placeholder="상품명 검색..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              style={{ flex: 1, minWidth: '150px' }} // 유동적으로 크기 조절
            />
            <Select
              size="large"
              defaultValue="all"
              style={{ width: '120px' }}
              onChange={setStatusFilter}
            >
              <Option value="all">전체 상태</Option>
              <Option value="selling">판매중</Option>
              <Option value="reserved">예약 중</Option>  
              <Option value="sold">판매완료</Option>
            </Select>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleWriteClick}
              size="large"
            >
              상품 등록
            </Button>
          </div>
        </div>

        {/* 통계 정보 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {/* 모바일(xs)에선 반쪽(12/24), 태블릿(sm) 이상에선 1/4(6/24) */}
          <Col xs={12} sm={6}>
            <Card style={styles.statCard}>
              <Statistic
                title="전체 상품"
                value={items.length}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={styles.statCard}>
              <Statistic
                title="판매중"
                value={sellingCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={styles.statCard}>
              <Statistic
                title="거래중"
                value={reservedCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fb9206' }}
              />
            </Card>
          </Col>          
          <Col xs={12} sm={6}>
            <Card style={styles.statCard}>
              <Statistic
                title="판매완료"
                value={soldCount}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 상품 그리드 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Text>로딩 중...</Text>
          </div>
        ) : filteredItems.length === 0 ? (
          <Empty
            description={searchText ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
            style={{ padding: '60px' }}
          />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredItems.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item.id}>
                <Badge.Ribbon
                  text={item.status === 'sold' ? '판매완료' : item.status === 'reserved' ? '예약 중' : '판매중'}
                  color={item.status === 'sold' ? 'gray' : item.status === 'reserved' ? 'orange' : 'green'}
                >
                  <Card
                    hoverable
                    cover={
                      item.image_url ? (
                        <div style={styles.imageWrapper}>
                          <img
                            alt={item.title}
                            src={`${process.env.REACT_APP_API_URL}${item.image_url}`}
                            style={styles.image}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                            }}
                          />
                          {item.status === 'sold' && (
                            <div style={styles.soldOverlay}>
                              <CheckCircleOutlined style={{ fontSize: '48px', color: '#fff' }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={styles.noImage}>
                          <ShoppingOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                        </div>
                      )
                    }
                    onClick={() => navigate(`/marketplace/${item.id}`)}
                    style={{
                      ...styles.card,
                      opacity: item.status === 'sold' ? 0.7 : 1,
                      opacity: item.status === 'reserved' ? 0.9 : 1,
                    }}
                  >
                    <Card.Meta
                      title={
                        <div style={styles.titleWrapper}>
                          <Text
                            ellipsis
                            style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: item.status === 'sold' ? '#8c8c8c' : '#262626',
                            }}
                          >
                            {item.title}
                          </Text>
                        </div>
                      }
                      description={
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div style={styles.priceWrapper}>
                            <Text
                              strong
                              style={{
                                fontSize: '20px',
                                color: item.status === 'sold' ? '#8c8c8c' : '#52c41a',
                              }}
                            >
                              {formatPrice(item.price)}원
                            </Text>
                          </div>
                          <Space>
                            <Tag icon={<DollarOutlined />} color="green">
                              {item.username}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {new Date(item.created_at).toLocaleDateString('ko-KR')}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>
        )}
      </div>
    
  );
}

const styles = {
  container: {
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '24px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  statCard: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  card: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    height: '100%',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    background: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImage: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
  },
  titleWrapper: {
    marginBottom: '8px',
  },
  priceWrapper: {
    marginTop: '8px',
    marginBottom: '8px',
  },
};

export default Marketplace;