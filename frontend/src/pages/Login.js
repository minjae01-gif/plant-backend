import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
// 1. Steps 임포트 추가
import { Form, Input, Button, Card, Typography, message, Space, Alert, Modal, Steps, Divider } from 'antd';
// 2. MailOutlined, SafetyCertificateOutlined 아이콘 임포트 추가
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { authAPI } from '../services/api';

const { Title, Text } = Typography;

// 클라이언트 ID 확인 (공백 주의)
const GOOGLE_CLIENT_ID = "903127470546-25prdmi9af1q6vra2lpknhkcahrv86bv.apps.googleusercontent.com";

function Login() {
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthRequired = searchParams.get('auth') === 'required';

  // --- 비밀번호 찾기 모달 관련 상태 ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(0); 
  const [forgotEmail, setForgotEmail] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [forgotForm] = Form.useForm();

  // 1. 일반 로그인 처리
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.email, values.password);
      if (result.success) {
        message.success('로그인 성공!');
        navigate('/dashboard');
      } else {
        message.error(result.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      message.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2. 구글 로그인 성공 시 처리
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.success) {
        message.success('구글 계정으로 로그인되었습니다!');
        navigate('/dashboard');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('구글 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 3. 비밀번호 찾기 - 인증번호 발송
  const handleSendCode = async () => {
    const email = forgotForm.getFieldValue('email');
    if (!email) return message.warning('이메일을 먼저 입력해주세요.');
    setModalLoading(true);
    try {
      await authAPI.sendCode({ email, type: 'reset' });
      message.success('인증번호가 발송되었습니다. 이메일을 확인해주세요.');
      setForgotEmail(email);
    } catch (error) {
      message.error('발송 실패: 존재하지 않는 이메일이거나 서버 오류입니다.');
    } finally {
      setModalLoading(false);
    }
  };

  // 4. 비밀번호 찾기 - 인증번호 확인
  const handleVerifyCode = async () => {
    const code = forgotForm.getFieldValue('code');
    if (!code) return message.warning('인증번호를 입력해주세요.');
    try {
      const res = await authAPI.verifyCode(forgotEmail, code);
      if (res.data.success) {
        message.success('인증 성공! 새 비밀번호를 설정해주세요.');
        setModalStep(1); 
      }
    } catch (error) {
      message.error('인증번호가 일치하지 않습니다.');
    }
  };

  // 5. 비밀번호 찾기 - 최종 재설정
  const handleResetPassword = async (values) => {
    setModalLoading(true);
    try {
      await authAPI.resetPassword({ email: forgotEmail, newPassword: values.newPassword });
      message.success('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      setIsModalVisible(false);
      setModalStep(0);
      forgotForm.resetFields();
    } catch (error) {
      message.error('비밀번호 재설정에 실패했습니다.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
          🌱 식물 커뮤니티
        </Title>

        {isAuthRequired && (
          <Alert
            message="로그인이 필요한 서비스입니다."
            description="계속하려면 먼저 로그인해주세요."
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '이메일을 입력하세요!' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다!' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="이메일" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '비밀번호를 입력하세요!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" size="large" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <Button type="link" onClick={() => setIsModalVisible(true)} style={{ padding: 0 }}>
              비밀번호를 잊으셨나요?
            </Button>
          </div>

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
                로그인
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

          <Divider plain>또는</Divider>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => message.error('구글 로그인 실패')}
                text="signin_with"
              />
            </GoogleOAuthProvider>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Text>아직 계정이 없으신가요? </Text>
            <Link to="/register">회원가입</Link>
          </div>
        </Form>
      </Card>

      {/* 🌟 비밀번호 찾기 모달 */}
      <Modal
        title="비밀번호 찾기"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setModalStep(0);
          forgotForm.resetFields();
        }}
        footer={null}
        destroyOnClose // 닫을 때 내부 상태 초기화
      >
        <Steps 
          current={modalStep} 
          style={{ marginBottom: '24px' }} 
          items={[{ title: '인증' }, { title: '변경' }]} 
        />

        <Form form={forgotForm} layout="vertical" onFinish={handleResetPassword}>
          {modalStep === 0 ? (
            <>
              <Form.Item 
                name="email" 
                label="가입한 이메일"
                rules={[{ required: true, type: 'email', message: '이메일을 입력해주세요.' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="example@gmail.com" />
              </Form.Item>
              <Button block onClick={handleSendCode} loading={modalLoading} style={{ marginBottom: '12px' }}>
                인증번호 받기
              </Button>
              <Form.Item name="code" label="인증번호">
                <Input prefix={<SafetyCertificateOutlined />} placeholder="6자리 숫자" />
              </Form.Item>
              <Button type="primary" block onClick={handleVerifyCode}>
                다음 단계
              </Button>
            </>
          ) : (
            <>
              <Form.Item 
                name="newPassword" 
                label="새 비밀번호"
                rules={[{ required: true, min: 6, message: '6자 이상 입력해주세요.' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item 
                name="confirm" 
                label="비밀번호 확인"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '비밀번호 확인을 입력해주세요.' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                      return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={modalLoading}>
                비밀번호 재설정 완료
              </Button>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  },
};

export default Login;