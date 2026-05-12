import React, { useEffect, useState } from 'react';
import { 
  Card, Avatar, Typography, Descriptions, Spin, message, 
  Divider, Tag, Button, Modal, Form, Input, List, Badge, Space, Table, Select
} from 'antd';
import { 
  UserOutlined, MailOutlined, ClockCircleOutlined, 
  SafetyCertificateOutlined, LockOutlined, NotificationOutlined,
  ArrowRightOutlined, EditOutlined, SaveOutlined, CloseOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI, tradeAPI, marketplaceAPI } from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
const { Option } = Select;

const { Title, Text } = Typography;

function MyPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

  // 상태 관리
  const [userInfo, setUserInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [mySentRequests, setMySentRequests] = useState([]);

  const isGoogleUser = user?.email?.includes('@gmail.com');

  useEffect(() => {
    if (user) {
      fetchMyData();
    }
  }, [user]);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const [profileRes, tradeRes, myItemsRes, chatRes] = await Promise.all([
        authAPI.getProfile(),
        tradeAPI.getReceivedRequests(),
        marketplaceAPI.getMyItems(),
        chatAPI.getRooms() 
      ]);
      
      if (profileRes.success) setUserInfo(profileRes.user);
      if (tradeRes.data.success) setRequests(tradeRes.data.requests);
      if (myItemsRes.data.success) setMyItems(myItemsRes.data.items);
      if (chatRes.data.success) setChatRooms(chatRes.data.rooms);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      message.error('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
  try {
    const res = await tradeAPI.getSentRequests();
    if (res.data.success) {
      setMySentRequests(res.data.requests);
    }
  } catch (err) {
    console.error("보낸 요청 로드 실패", err);
  }
};

  useEffect(() => {
  fetchMyData();      // 기존 데이터(받은 요청 등)
  fetchSentRequests(); // 내가 보낸 요청 추가
}, []);

  const handleUpdateNickname = async (values) => {
    setEditLoading(true);
    try {
      const response = await authAPI.updateProfile({ username: values.username });
      if (response && response.data && response.data.success) {
        if (user) {
          const updatedUser = { ...user, username: values.username };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        setUserInfo(prev => ({ ...prev, username: values.username }));
        message.success('닉네임이 변경되었습니다!');
        setIsEditing(false);
      }
    } catch (error) {
      message.error('닉네임 업데이트 중 오류가 발생했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setChangeLoading(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      if (response.success) {
        message.success('비밀번호가 변경되었습니다.');
        setIsModalOpen(false);
        pwForm.resetFields();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '변경 중 오류 발생');
    } finally {
      setChangeLoading(false);
    }
  };

  const handleAcceptTrade = async (requestId) => {
    try {
      const response = await tradeAPI.acceptRequest(requestId); 
      if (response.data.success) {
        message.success('거래를 수락했습니다. 상품이 예약 중으로 변경되었습니다.');
        fetchMyData();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '수락 처리 중 오류가 발생했습니다.');
    }
  };

  const handleRejectTrade = async (requestId) => {
      try {
        const response = await tradeAPI.rejectRequest(requestId);
        if (response.data.success) {
          // 1. 성공 메시지 띄우기
          message.success('거래 요청을 거절했습니다.');
          
          // 2. 굳이 무거운 fetchMyData()를 부르지 않고, 
          // 현재 목록에서 방금 거절한 항목(requestId)만 필터링해서 즉시 삭제!
          setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
        }
      } catch (error) {
        message.error('거절 처리 중 오류가 발생했습니다.');
      }
    };

  const handleCompleteTrade = async (requestId) => {
    try {
      const response = await tradeAPI.completeRequest(requestId);
      if (response.data.success) {
        message.success('거래가 완료되었습니다!');
        fetchMyData();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '완료 처리 중 오류가 발생했습니다.');
    }
  };

  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      const response = await marketplaceAPI.updateItemStatus(itemId, newStatus);
      if (response.data.success) {
        message.success('상태가 변경되었습니다.');
        fetchMyData();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '변경 실패');
    }
  };

  // 1. 가드: 로그인 안됨
  if (!user) {
    return (
      <Layout>
        <div style={{ padding: '100px 20px', textAlign: 'center' }}>
          <Title level={4}>로그인이 필요한 서비스입니다.</Title>
          <Button type="primary" onClick={() => navigate('/login')}>로그인하러 가기</Button>
        </div>
      </Layout>
    );
  }

  // 2. 가드: 로딩 중
  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>
      </Layout>
    );
  }

  // 3. 메인 렌더링
  return (
    
      <div style={styles.container}>
        {/* 프로필 카드 */}
        <Card style={styles.card}>
          <div style={styles.header}>
            <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#52c41a', marginBottom: '20px' }} />
            {isEditing ? (
              <Form form={form} layout="inline" onFinish={handleUpdateNickname} initialValues={{ username: userInfo?.username }}>
                <Form.Item name="username" rules={[{ required: true, message: '입력해주세요' }]}>
                  <Input placeholder="새 닉네임" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={editLoading} icon={<SaveOutlined />} />
                <Button icon={<CloseOutlined />} onClick={() => setIsEditing(false)} style={{ marginLeft: 5 }} />
              </Form>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ marginBottom: '5px' }}>
                  {userInfo?.username} <EditOutlined style={{ fontSize: '18px', cursor: 'pointer', color: '#1890ff' }} onClick={() => setIsEditing(true)} />
                </Title>
                <Tag color="blue" icon={<SafetyCertificateOutlined />}>인증된 사용자</Tag>
              </div>
            )}
          </div>
          <Divider />
          <Descriptions title="내 정보 상세" bordered column={1}>
            <Descriptions.Item label="이메일">
              {userInfo?.email} {isGoogleUser && <Tag color="orange" style={{ marginLeft: 8 }}>Google</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="가입일">
              {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString() : '날짜 정보 없음'}
            </Descriptions.Item>
          </Descriptions>
          {!isGoogleUser && (
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <Button icon={<LockOutlined />} onClick={() => setIsModalOpen(true)}>비밀번호 변경</Button>
            </div>
          )}
        </Card>

        {/* 📦 섹션 1: 내가 올린 판매글 관리 */}
        <Card style={{ ...styles.card, marginTop: '24px' }} title="📦 내가 올린 판매글 관리">
          <Table 
            dataSource={myItems} 
            rowKey="id"
            columns={[
              { title: '상품명', dataIndex: 'title', key: 'title' },
              { 
                title: '현재 상태', 
                dataIndex: 'status', 
                render: (status) => (
                  <Tag color={status === 'selling' ? 'green' : status === 'reserved' ? 'orange' : 'gray'}>
                    {status === 'selling' ? '판매중' : status === 'reserved' ? '예약 중' : '판매완료'}
                  </Tag>
                )
              },
              {
                title: '상태 변경',
                key: 'action',
                render: (record) => (
                  <Space>
                    <Select 
                      value={record.status} 
                      disabled={record.status === 'sold'} 
                      onChange={(value) => {
                        if (value === 'sold') {
                          Modal.confirm({
                            title: '판매 완료로 변경하시겠습니까?',
                            content: '판매 완료 후에는 다시 상태를 변경할 수 없습니다.',
                            onOk: () => handleStatusUpdate(record.id, 'sold'),
                          });
                        } else {
                          handleStatusUpdate(record.id, value);
                        }
                      }}
                      style={{ width: 120 }}
                    >
                      <Option value="selling">판매중</Option>
                      <Option value="reserved">예약 중</Option>
                      <Option value="sold">판매완료</Option>
                    </Select>
                    <Button onClick={() => navigate(`/marketplace/${record.id}`)}>보기</Button>
                  </Space>
                )
              }
            ]}
          />
        </Card>

        {/* 🔔 섹션 2: 받은 거래 요청 */}
        <Card 
          style={{ ...styles.card, marginTop: '24px' }} 
          title={<span><NotificationOutlined style={{ color: '#faad14', marginRight: 8 }} /> 받은 거래 요청 <Badge count={requests.filter(r => r.status === 'pending').length} /></span>}
        >
          <List
            dataSource={requests.filter(req => req.status !== 'rejected')}
            renderItem={(item) => (
              <List.Item 
                actions={[
                  <Button type="link" onClick={() => navigate(`/marketplace/${item.item_id}`)}>보기</Button>,
                  item.status === 'pending' && (
                    <space>
                    <Button type="primary" size="small" onClick={() => handleAcceptTrade(item.id)}>수락</Button>
                    <Button danger size="small" onClick={() => handleRejectTrade(item.id)}>거절</Button>
                    </space>
                  ),
                  item.status === 'accepted' && (
                    <Button type="default" size="small" style={{ color: '#52c41a', borderColor: '#52c41a' }} onClick={() => handleCompleteTrade(item.id)}>거래 완료</Button>
                  ),
                  item.status === 'completed' && <Tag color="default">거래 종료</Tag>
                ]}
              > 
                <List.Item.Meta 
                  title={
                    <Space>
                      {item.buyer_name}님의 거래 요청
                      {item.status === 'accepted' && <Tag color="orange">예약 중</Tag>}
                      {item.status === 'completed' && <Tag color="blue">판매 완료</Tag>}
                    </Space>
                  } 
                  description={item.item_title} 
                />
              </List.Item>
            )}
          />
        </Card>

        <Card title="내가 보낸 거래 요청" style={{ marginTop: '24px' }}>
          <List
            dataSource={mySentRequests} // 위에서 만든 API로 가져온 데이터
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.seller_name}님께 보낸 요청`}
                  description={item.item_title}
                />
                {/* 상태에 따른 태그 표시 */}
                {item.status === 'pending' && <Tag color="default">대기 중</Tag>}
                {item.status === 'accepted' && <Tag color="orange">예약 중</Tag>}
                {item.status === 'completed' && <Tag color="blue">구매 완료</Tag>}
                {item.status === 'rejected' && <Tag color="red">거절됨</Tag>}
              </List.Item>
            )}
          />
        </Card>

        {/* 비밀번호 변경 모달 */}
        <Modal title="비밀번호 변경" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
          <Form form={pwForm} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item name="currentPassword" label="현재 비밀번호" rules={[{ required: true }]}><Input.Password /></Form.Item>
            <Form.Item name="newPassword" label="새 비밀번호" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
            <Button type="primary" htmlType="submit" block loading={changeLoading}>변경 완료</Button>
          </Form>
        </Modal>
      </div>
    
  );
} // <--- MyPage 함수 끝

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  card: { borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  header: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' },
};

export default MyPage;