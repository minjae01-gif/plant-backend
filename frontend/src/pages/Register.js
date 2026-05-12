import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';

const { Title, Text } = Typography;

function Register() {
  const [form] = Form.useForm(); // Form 제어를 위해 추가
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false); // 이메일 발송 로딩
  const [verifyLoading, setVerifyLoading] = useState(false); // 인증 확인 로딩
  const [isCodeSent, setIsCodeSent] = useState(false); // 인증번호 발송 여부
  const [isVerified, setIsVerified] = useState(false); // 인증 완료 여부
  const navigate = useNavigate();

  // 인증번호 발송 함수
  const handleSendCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      return message.warning('이메일을 먼저 입력해주세요.');
    }
    
    setEmailLoading(true);
    try {
      const res = await authAPI.sendCode( {email, type: 'signup'} ); 
      if (res.data.success) {
        message.success('인증번호가 발송되었습니다. 이메일을 확인해주세요!');
        setIsCodeSent(true);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '인증번호 발송에 실패했습니다.');
    } finally {
      setEmailLoading(false);
    }
  };

  // 인증번호 확인 함수
  const handleVerifyCode = async () => {
    const email = form.getFieldValue('email');
    const code = form.getFieldValue('verificationCode');
    if (!code) {
      return message.warning('인증번호를 입력해주세요.');
    }

    setVerifyLoading(true);
    try {
      const res = await authAPI.verifyCode(email, code);
      if (res.data.success) {
        message.success('이메일 인증이 완료되었습니다!');
        setIsVerified(true);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '인증번호가 틀렸습니다.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // 최종 회원가입 진행
  const onFinish = async (values) => {
    if (!isVerified) {
      return message.error('이메일 인증을 먼저 완료해주세요.');
    }

    setLoading(true);
    try {
      await authAPI.register(values);
      message.success('회원가입이 완료되었습니다!');
      navigate('/login');
    } catch (error) {
      message.error('회원가입에 실패했습니다.(닉네임/이메일 중복)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
          🌱 회원가입
        </Title>

        <Form
          form={form} // 폼 연결
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '닉네임을 입력해주세요.' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="닉네임" size="large" />
          </Form.Item>

          {/* 이메일 입력 및 인증번호 받기 버튼 */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Row gutter={8}>
              <Col span={16}>
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '이메일을 입력해주세요.' },
                    { type: 'email', message: '유효한 이메일 주소를 입력해주세요.' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined />} 
                    placeholder="이메일" 
                    size="large" 
                    disabled={isVerified} // 인증 완료되면 이메일 수정 불가
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Button 
                  size="large" 
                  block 
                  onClick={handleSendCode} 
                  loading={emailLoading}
                  disabled={isVerified}
                >
                  {isCodeSent ? '재전송' : '인증번호 받기'}
                </Button>
              </Col>
            </Row>
          </Form.Item>

          {/* 인증번호 입력 칸 (발송 버튼을 누른 후에만 보임) */}
          {isCodeSent && (
            <Form.Item style={{ marginBottom: 0 }}>
              <Row gutter={8}>
                <Col span={16}>
                  <Form.Item
                    name="verificationCode"
                    rules={[{ required: true, message: '인증번호를 입력해주세요.' }]}
                  >
                    <Input 
                      prefix={<SafetyCertificateOutlined />} 
                      placeholder="6자리 인증번호" 
                      size="large" 
                      disabled={isVerified}
                      maxLength={6}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Button 
                    type={isVerified ? "default" : "primary"}
                    size="large" 
                    block 
                    onClick={handleVerifyCode} 
                    loading={verifyLoading}
                    disabled={isVerified}
                  >
                    {isVerified ? '인증 완료' : '인증 확인'}
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          )}

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '비밀번호를 입력해주세요.' },
              { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다.' }
            ]}
            style={{ marginTop: '24px' }}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '비밀번호 확인을 입력해주세요.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호 확인" size="large" />
          </Form.Item>

          <Form.Item>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                회원가입
              </Button>
              <Button
                size="large"
                block
                onClick={() => navigate('/dashboard')}
                style={{ borderColor: '#d9d9d9' }}
              >
                🏠 게스트로 둘러보기
              </Button>
            </Space>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text>이미 계정이 있으신가요? </Text>
            <Link to="/login">로그인</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 배경색은 기존 유지
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
};

export default Register;