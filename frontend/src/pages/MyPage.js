import React, { useEffect, useState } from 'react';
import { 
  Card, Avatar, Typography, Descriptions, Spin, message, 
  Divider, Tag, Button, Modal, Form, Input, List, Badge, Space
} from 'antd';
import { 
  UserOutlined, MailOutlined, ClockCircleOutlined, 
  SafetyCertificateOutlined, LockOutlined, NotificationOutlined,
  ArrowRightOutlined, EditOutlined, SaveOutlined, CloseOutlined
} from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';
import { authAPI, tradeAPI } from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

function MyPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm(); // 비밀번호용 폼 분리

  // 상태 관리
  const [userInfo, setUserInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true); // 초기 로딩 true
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);

  const isGoogleUser = user?.email?.includes('@gmail.com');

  useEffect(() => {
    if (user) {
      fetchMyData();
    }
  }, [user]);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const [profileRes, tradeRes] = await Promise.all([
        authAPI.getProfile(),
        tradeAPI.getReceivedRequests()
      ]);
      
      if (profileRes.success) setUserInfo(profileRes.user);
      if (tradeRes.data.success) setRequests(tradeRes.data.requests);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      message.error('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 수정
const handleUpdateNickname = async (values) => {
    setEditLoading(true);
    try {
      // 1. API 호출 (여기서 성공하면 DB는 이미 바뀜)
      const response = await authAPI.updateProfile({ username: values.username });
      
      if (response && response.data && response.data.success) {
        // --- 여기서부터 에러가 나면 catch로 튕겨서 '실패' 메시지가 뜸 ---
        
        // 2. AuthContext(전역상태) 안전하게 업데이트
        if (user) {
          const updatedUser = { ...user, username: values.username };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // 3. 로컬 userInfo 안전하게 업데이트 (prev를 사용하는 방식이 가장 안전함)
        setUserInfo(prev => {
          if (!prev) return { username: values.username }; // 데이터가 없으면 새로 생성
          return { ...prev, username: values.username };  // 있으면 닉네임만 교체
        });

        // 4. 성공 메시지 및 편집 모드 종료
        message.success('닉네임이 성공적으로 변경되었습니다!');
        setIsEditing(false); // 👈 이제 이 코드가 정상적으로 실행되어 창이 닫힙니다!
        
      } else {
        message.error(response?.data?.message || '닉네임 수정 실패');
      }
    } catch (error) {
      // API 통신 에러 혹은 위 로직에서 발생한 JS 에러를 잡음
      console.error('수정 로직 에러:', error);
      message.error('닉네임 업데이트 처리 중 오류가 발생했습니다.');
    } finally {
      setEditLoading(false);
    }
  };
  // 비밀번호 변경
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

  // 3. 메인 렌더링 (단 한 번의 return)
  return (
    <Layout>
      <div style={styles.container}>
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
              {new Date(userInfo?.created_at).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>

          {!isGoogleUser && (
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <Button icon={<LockOutlined />} onClick={() => setIsModalOpen(true)}>비밀번호 변경</Button>
            </div>
          )}
        </Card>

        {/* 거래 요청 리스트 */}
        <Card style={{ ...styles.card, marginTop: '24px' }} title={
          <span><NotificationOutlined style={{ color: '#faad14', marginRight: 8 }} /> 받은 거래 요청 <Badge count={requests.length} /></span>
        }>
          <List
            dataSource={requests}
            renderItem={(item) => (
              <List.Item actions={[<Button type="link" onClick={() => navigate(`/marketplace/${item.item_id}`)}>보기</Button>]}>
                <List.Item.Meta title={`${item.buyer_name}님의 거래 요청`} description={item.item_title} />
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
    </Layout>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
  card: { borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  header: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' },
};

export default MyPage;