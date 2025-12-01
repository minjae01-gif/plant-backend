import React, { useEffect, useState } from 'react';
import { 
  Card, Avatar, Typography, Descriptions, Spin, message, 
  Divider, Tag, Button, Modal, Form, Input,List, Badge, Space
} from 'antd';
import { 
  UserOutlined, MailOutlined, ClockCircleOutlined, 
  SafetyCertificateOutlined, LockOutlined , NotificationOutlined
  ,ArrowRightOutlined
} from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';
import { authAPI, tradeAPI } from '../services/api';
import Layout from '../components/Layout';

const { Title, Text } = Typography;

function MyPage() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  
  // 모달(팝업) 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [form] = Form.useForm();

  const navigate = useNavigate();
  useEffect(() => {
    fetchMyInfo();
    fetchRequests();
  }, []);

  const fetchMyInfo = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        setUserInfo(response.user);
      }
    } catch (error) {
      console.error('내 정보 조회 실패:', error);
      message.error('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

    const fetchRequests = async () => {
    try {
      const response = await tradeAPI.getReceivedRequests();
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('요청 조회 실패', error);
    }
  };

  // 비밀번호 변경 요청 함수
  const handleChangePassword = async (values) => {
    setChangeLoading(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      if (response.success) {
        message.success('비밀번호가 성공적으로 변경되었습니다.');
        setIsModalOpen(false); // 성공하면 모달 닫기
        form.resetFields();    // 입력창 초기화
      } else {
        message.error(response.message || '비밀번호 변경 실패');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setChangeLoading(false);
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
        <Card style={styles.card}>
          <div style={styles.header}>
            <Avatar 
              size={100} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#52c41a', marginBottom: '20px' }} 
            />
            <Title level={2} style={{ marginBottom: '5px' }}>
              {userInfo?.username}
            </Title>
            <Tag color="blue" icon={<SafetyCertificateOutlined />}>
              인증된 사용자
            </Tag>
          </div>

          <Divider />

          <Descriptions 
            title="내 정보 상세" 
            bordered 
            column={1} 
            styles={{ label: { width: '150px' } }}
          >
            <Descriptions.Item label={<span><UserOutlined /> 사용자명</span>}>
              {userInfo?.username}
            </Descriptions.Item>
            
            <Descriptions.Item label={<span><MailOutlined /> 이메일</span>}>
              {userInfo?.email}
            </Descriptions.Item>
            
            <Descriptions.Item label={<span><ClockCircleOutlined /> 가입일</span>}>
              {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric'
              }) : '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* 🔥 비밀번호 변경 버튼 */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <Button 
              icon={<LockOutlined />} 
              size="large"
              onClick={() => setIsModalOpen(true)}
            >
              비밀번호 변경
            </Button>
          </div>
        </Card>

        <Card 
          style={{ ...styles.card, marginTop: '24px' }}
          title={
            <span>
              <NotificationOutlined style={{ color: '#faad14', marginRight: '8px' }} />
              받은 거래 요청 <Badge count={requests.length} offset={[5, -2]} color="red" />
            </span>
          }
        >
          <List
            itemLayout="horizontal"
            dataSource={requests}
            locale={{ emptyText: '아직 받은 거래 요청이 없습니다.' }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="primary"
                    ghost
                    size="small" 
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate(`/marketplace/${item.item_id}`)}
                  >
                    게시물 보기
                  </Button>
                ]}>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />}
                  title={
                    <span>
                      <strong>{item.buyer_name}</strong>님이 
                      <span style={{ color: '#1890ff' }}> [{item.item_title}]</span> 거래를 요청했습니다.
                    </span>
                  }
                  description={
                    <Space>
                      <Text type="secondary">{new Date(item.created_at).toLocaleDateString()}</Text>
                      <Tag color={item.status === 'pending' ? 'orange' : 'green'}>
                        {item.status === 'pending' ? '대기중' : item.status}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>        

        {/*  비밀번호 변경 모달 */}
        <Modal
          title="비밀번호 변경"
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
          }}
          footer={null} // 기본 버튼 제거하고 폼 내부 버튼 사용
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleChangePassword}
            style={{ marginTop: '20px' }}
          >
            <Form.Item
              name="currentPassword"
              label="현재 비밀번호"
              rules={[{ required: true, message: '현재 비밀번호를 입력해주세요.' }]}
            >
              <Input.Password placeholder="사용 중인 비밀번호 입력" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="새 비밀번호"
              rules={[
                { required: true, message: '새 비밀번호를 입력해주세요.' },
                { min: 6, message: '최소 6자 이상 입력해주세요.' }
              ]}
            >
              <Input.Password placeholder="변경할 비밀번호 (6자 이상)" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="새 비밀번호 확인"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '비밀번호를 다시 입력해주세요.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="새 비밀번호 다시 입력" />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={changeLoading}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                변경하기
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  card: {
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0',
  },
};

export default MyPage;