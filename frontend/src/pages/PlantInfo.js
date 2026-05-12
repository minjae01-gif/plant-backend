import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Space, List, Avatar, Descriptions, Button, Modal, Form, Input, InputNumber, Upload, message } from 'antd';
import { 
  PlusOutlined, 
  EnvironmentOutlined,
  FireOutlined,
  CloudOutlined,
  BulbOutlined,
  DropboxOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { plantAPI } from '../services/api';


const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function PlantInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const response = await plantAPI.getPlants();
      setPlants(response.data.plants);
      if (response.data.plants.length > 0 && !selectedPlant) {
        setSelectedPlant(response.data.plants[0]);
      }
    } catch (error) {
      console.error('식물 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlant = () => {
    if (!user) {
      message.warning('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    setEditMode(false);
    form.resetFields();
    setImageFile(null);
    setModalVisible(true);
  };

  const handleEditPlant = () => {
    if (!user) {
      message.warning('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    setEditMode(true);
    form.setFieldsValue(selectedPlant);
    setModalVisible(true);
  };

  const handleDeletePlant = async () => {
    console.log('🗑️ 삭제 버튼 클릭!');
    console.log('👤 현재 사용자:', user);
    console.log('🌿 선택된 식물:', selectedPlant);
    
    if (!user) {
      console.log('❌ 로그인 안 됨');
      message.warning('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    // window.confirm 사용 (브라우저 기본 확인창)
    const confirmed = window.confirm(`${selectedPlant.name} 정보를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
    
    if (!confirmed) {
      console.log('❌ 삭제 취소');
      return;
    }

    console.log('🔥 삭제 실행:', selectedPlant.id);
    
    try {
      await plantAPI.deletePlant(selectedPlant.id);
      console.log('✅ API 호출 성공');
      message.success('식물 정보가 삭제되었습니다.');
      await fetchPlants();
      setSelectedPlant(null);
      console.log('✅ 삭제 완료');
    } catch (error) {
      console.error('❌ 삭제 에러:', error);
      console.error('❌ 에러 상세:', error.response?.data);
      message.error('삭제에 실패했습니다.');
    }
  };;

  const handleSubmit = async (values) => {
    console.log('🚀 폼 제출 시작:', values);
    
    try {
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
          console.log(`📝 ${key}:`, values[key]);
        }
      });

      if (imageFile) {
        formData.append('image', imageFile);
        console.log('📸 이미지 파일:', imageFile);
      } else if (editMode && selectedPlant?.image_url) {
        formData.append('existing_image_url', selectedPlant.image_url);
      }

      console.log('📤 API 요청 시작...');

      if (editMode) {
        const response = await plantAPI.updatePlant(selectedPlant.id, formData);
        console.log('✅ 수정 성공:', response);
        message.success('식물 정보가 수정되었습니다.');
      } else {
        const response = await plantAPI.createPlant(formData);
        console.log('✅ 등록 성공:', response);
        message.success('식물 정보가 등록되었습니다.');
      }

      setModalVisible(false);
      fetchPlants();
    } catch (error) {
      console.error('❌ 에러 발생:', error);
      console.error('❌ 에러 상세:', error.response?.data);
      message.error('처리에 실패했습니다.');
    }
  };

  const handleImageChange = (info) => {
    if (info.file.originFileObj) {
      setImageFile(info.file.originFileObj);
    }
  };

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header}>
          <Title level={2}>🌿 식물 정보 도감</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddPlant}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            식물 추가
          </Button>
        </div>

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          {/* 왼쪽: 식물 목록 */}
          <Col xs={24} md={8}>
            <Card title="식물 목록" style={styles.card}>
              <List
                loading={loading}
                dataSource={plants}
                renderItem={(plant) => (
                  <List.Item
                    style={{
                      ...styles.listItem,
                      background: selectedPlant?.id === plant.id ? '#e6f7ff' : 'transparent'
                    }}
                    onClick={() => setSelectedPlant(plant)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          src={plant.image_url}
                          size={50}
                          shape="square"
                        />
                      }
                      title={<Text strong>{plant.name}</Text>}
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {plant.scientific_name}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* 오른쪽: 상세 정보 */}
          <Col xs={24} md={16}>
            {selectedPlant ? (
              <Card
                title={
                  <Space>
                    <Text strong style={{ fontSize: '18px' }}>{selectedPlant.name}</Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      ({selectedPlant.scientific_name})
                    </Text>
                  </Space>
                }
                extra={
                  user && (
                    <Space>
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={handleEditPlant}
                      >
                        수정
                      </Button>
                      <Button 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={handleDeletePlant}
                      >
                        삭제
                      </Button>
                    </Space>
                  )
                }
                style={styles.card}
              >
                {/* 이미지 */}
                {selectedPlant.image_url && (
                  <div style={styles.imageContainer}>
                    <img 
                      src={selectedPlant.image_url} 
                      alt={selectedPlant.name}
                      style={styles.image}
                    />
                  </div>
                )}

                {/* 환경 정보 */}
                {selectedPlant.habitat && (
                  <Card 
                    size="small" 
                    title={<Text strong><EnvironmentOutlined /> 서식 환경</Text>}
                    style={{ marginTop: '16px' }}
                  >
                    <Text>{selectedPlant.habitat}</Text>
                  </Card>
                )}

                {/* 최적 환경 */}
                <Card 
                  size="small" 
                  title={<Text strong>🌡️ 최적 환경 조건</Text>}
                  style={{ marginTop: '16px' }}
                >
                  <Descriptions column={2} size="small">
                    <Descriptions.Item 
                      label={<Text><FireOutlined /> 온도</Text>}
                      span={2}
                    >
                      {selectedPlant.temp_min && selectedPlant.temp_max ? (
                        <Tag color="red">
                          {selectedPlant.temp_min}°C ~ {selectedPlant.temp_max}°C
                        </Tag>
                      ) : (
                        <Text type="secondary">-</Text>
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item 
                      label={<Text><CloudOutlined /> 습도</Text>}
                      span={2}
                    >
                      {selectedPlant.humidity_min && selectedPlant.humidity_max ? (
                        <Tag color="blue">
                          {selectedPlant.humidity_min}% ~ {selectedPlant.humidity_max}%
                        </Tag>
                      ) : (
                        <Text type="secondary">-</Text>
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item 
                      label={<Text><BulbOutlined /> 조도</Text>}
                      span={2}
                    >
                      {selectedPlant.light_min && selectedPlant.light_max ? (
                        <>
                          <Tag color="gold">
                            {selectedPlant.light_min.toLocaleString()} ~ {selectedPlant.light_max.toLocaleString()} lux
                          </Tag>
                          {selectedPlant.light_description && (
                            <Text type="secondary" style={{ marginLeft: '8px' }}>
                              ({selectedPlant.light_description})
                            </Text>
                          )}
                        </>
                      ) : (
                        <Text type="secondary">-</Text>
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item 
                      label={<Text><DropboxOutlined /> 토양습도</Text>}
                      span={2}
                    >
                      {selectedPlant.soil_moisture_min && selectedPlant.soil_moisture_max ? (
                        <Tag color="green">
                          {selectedPlant.soil_moisture_min}% ~ {selectedPlant.soil_moisture_max}%
                        </Tag>
                      ) : (
                        <Text type="secondary">-</Text>
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item 
                      label={<Text>💧 물주기</Text>}
                      span={2}
                    >
                      <Text>{selectedPlant.watering_frequency || '-'}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* 식물 설명 */}
                {selectedPlant.description && (
                  <Card 
                    size="small" 
                    title={<Text strong>📖 식물 정보</Text>}
                    style={{ marginTop: '16px' }}
                  >
                    <Paragraph>{selectedPlant.description}</Paragraph>
                  </Card>
                )}

                {/* 관리 팁 */}
                {selectedPlant.care_tips && (
                  <Card 
                    size="small" 
                    title={<Text strong>💡 관리 팁</Text>}
                    style={{ marginTop: '16px' }}
                  >
                    <Paragraph>{selectedPlant.care_tips}</Paragraph>
                  </Card>
                )}
              </Card>
            ) : (
              <Card style={styles.card}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text type="secondary">식물을 선택해주세요</Text>
                </div>
              </Card>
            )}
          </Col>
        </Row>
      </div>

      {/* 식물 추가/수정 모달 */}
      <Modal
        title={editMode ? '식물 정보 수정' : '새 식물 추가'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText={editMode ? '수정' : '추가'}
        cancelText="취소"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="식물 이름"
                rules={[{ required: true, message: '식물 이름을 입력하세요' }]}
              >
                <Input placeholder="예: 몬스테라" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="scientific_name"
                label="학명"
              >
                <Input placeholder="예: Monstera deliciosa" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="habitat"
            label="서식 환경"
          >
            <Input placeholder="예: 열대 우림 (중남미)" />
          </Form.Item>

          <Form.Item label="이미지">
            <Upload
              beforeUpload={() => false}
              onChange={handleImageChange}
              maxCount={1}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>이미지 선택</Button>
            </Upload>
          </Form.Item>

          <Title level={5}>온도 범위 (°C)</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="temp_min" label="최소">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="temp_max" label="최대">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>습도 범위 (%)</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="humidity_min" label="최소">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="humidity_max" label="최대">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>조도 범위 (lux)</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="light_min" label="최소">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="light_max" label="최대">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="light_description" label="설명">
                <Input placeholder="예: 밝은 간접광" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>토양습도 범위 (%)</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="soil_moisture_min" label="최소">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="soil_moisture_max" label="최대">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="watering_frequency" label="물주기 주기">
            <Input placeholder="예: 주 1-2회, 겉흙이 마르면" />
          </Form.Item>

          <Form.Item name="description" label="식물 설명">
            <TextArea rows={3} placeholder="식물의 특징을 설명해주세요" />
          </Form.Item>

          <Form.Item name="care_tips" label="관리 팁">
            <TextArea rows={3} placeholder="식물 관리 팁을 입력해주세요" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

const styles = {

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  listItem: {
    cursor: 'pointer',
    padding: '12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  imageContainer: {
    width: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f5f5f5',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '400px',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },
};

export default PlantInfo;