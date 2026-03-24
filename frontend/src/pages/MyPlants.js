import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Modal, Form, Input, DatePicker, Upload, message, List, Avatar, Tag, Space, Select, Empty } from 'antd';
import { 
  PlusOutlined, 
  DropboxOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { myPlantsAPI, plantAPI } from '../services/api';
import Layout from '../components/Layout';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function MyPlants() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const [myPlants, setMyPlants] = useState([]);
  const [allPlants, setAllPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [wateringLogs, setWateringLogs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [waterForm] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
  if (loading) return;
  if (user) {
    fetchMyPlants();
    fetchAllPlants();
  } else {
    message.warning('로그인이 필요합니다.');
    navigate('/login');
  }
}, [user, loading, navigate]);

  const fetchMyPlants = async (keepSelectedId = null) => {
  try {
    console.log('🔄 식물 목록 새로고침...');
    const response = await myPlantsAPI.getMyPlants();
    console.log('✅ 받은 식물:', response.data.plants);
    
    setMyPlants(response.data.plants);
    
    // keepSelectedId가 있으면 해당 식물 유지, 없으면 첫 번째 선택
    if (response.data.plants.length > 0) {
      if (keepSelectedId) {
        // 현재 선택된 식물 찾기
        const currentPlant = response.data.plants.find(p => p.id === keepSelectedId);
        if (currentPlant) {
          setSelectedPlant(currentPlant);
          await fetchWateringLogs(currentPlant.id);
        } else {
          // 못 찾으면 첫 번째 선택
          setSelectedPlant(response.data.plants[0]);
          await fetchWateringLogs(response.data.plants[0].id);
        }
        } else {
            // 처음 로딩시에만 첫 번째 자동 선택
            setSelectedPlant(response.data.plants[0]);
            await fetchWateringLogs(response.data.plants[0].id);
        }
        } else {
        setSelectedPlant(null);
        }
    } catch (error) {
        console.error('내 식물 목록 조회 실패:', error);
    } finally {
        setDataLoading(false);
    }
    };

  const fetchAllPlants = async () => {
    try {
      const response = await plantAPI.getPlants();
      setAllPlants(response.data.plants);
    } catch (error) {
      console.error('식물 목록 조회 실패:', error);
    }
  };

  const fetchWateringLogs = async (plantId) => {
    try {
      const response = await myPlantsAPI.getWateringLogs(plantId);
      setWateringLogs(response.data.logs);
    } catch (error) {
      console.error('물주기 기록 조회 실패:', error);
    }
  };

  const handleSelectPlant = (plant) => {
    setSelectedPlant(plant);
    fetchWateringLogs(plant.id);
  };

  const handleAddPlant = () => {
    setEditMode(false);
    form.resetFields();
    setImageFile(null);
    setModalVisible(true);
  };

  const handleEditPlant = () => {
    setEditMode(true);
    form.setFieldsValue({
      ...selectedPlant,
      purchase_date: selectedPlant.purchase_date ? dayjs(selectedPlant.purchase_date) : null,
    });
    setModalVisible(true);
  };

    const handleDeletePlant = async () => {
    if (window.confirm(`${selectedPlant.nickname} 정보를 삭제하시겠습니까?\n물주기 기록도 함께 삭제됩니다.`)) {
        try {
        await myPlantsAPI.deleteMyPlant(selectedPlant.id);
        message.success('식물이 삭제되었습니다.');
        setSelectedPlant(null);
        await fetchMyPlants();  // 삭제시에는 파라미터 없이 호출 (첫 번째 선택)
        } catch (error) {
        console.error('삭제 에러:', error);
        message.error('삭제에 실패했습니다.');
        }
    }
    };

    const handleSubmit = async (values) => {
    console.log('📝 폼 제출:', values);
    console.log('📸 imageFile 상태:', imageFile);
  
    try {
        const formData = new FormData();
    
        formData.append('nickname', values.nickname);
        if (values.plant_id) formData.append('plant_id', values.plant_id);
        if (values.purchase_date) formData.append('purchase_date', values.purchase_date.format('YYYY-MM-DD'));
        if (values.location) formData.append('location', values.location);
        if (values.notes) formData.append('notes', values.notes);

        if (imageFile) {
        console.log('📸 FormData에 이미지 추가 시도...');
        console.log('   - 파일명:', imageFile.name);
        console.log('   - 파일 크기:', imageFile.size);
        console.log('   - 파일 타입:', imageFile.type);
        formData.append('image', imageFile, imageFile.name);
        console.log('✅ FormData에 이미지 추가됨');
      
      // FormData 내용 확인
        for (let pair of formData.entries()) {
            console.log('   FormData:', pair[0], pair[1]);
        }
        } else if (editMode && selectedPlant?.image_url) {
        formData.append('existing_image_url', selectedPlant.image_url);
        console.log('✅ 기존 이미지 유지');
        } else {
        console.log('⚠️ 이미지 없음');
        }

        console.log('📤 API 요청 시작...');

        let plantId;
        if (editMode) {
        await myPlantsAPI.updateMyPlant(selectedPlant.id, formData);
        plantId = selectedPlant.id;
        console.log('✅ 수정 완료, ID:', plantId);
        message.success('식물 정보가 수정되었습니다.');
        } else {
        const response = await myPlantsAPI.createMyPlant(formData);
        plantId = response.data.plantId;
        console.log('✅ 등록 완료, ID:', plantId);
        message.success('식물이 등록되었습니다.');
        }

    // 모달 닫고 초기화
    setModalVisible(false);
    setImageFile(null);
    
    // 데이터 새로고침 (방금 추가/수정한 식물 선택 유지)
    await fetchMyPlants(plantId);  // ← 변경!
    
    console.log('✅ 화면 갱신 완료!');
    
    } catch (error) {
        console.error('❌ 처리 에러:', error);
        console.error('❌ 에러 상세:', error.response?.data);
        message.error('처리에 실패했습니다.');
    }
    };

  const handleWater = () => {
    waterForm.resetFields();
    setWaterModalVisible(true);
  };

  const handleWaterSubmit = async (values) => {
  try {
    await myPlantsAPI.addWateringLog(selectedPlant.id, values);
    message.success('💧 물주기 기록이 추가되었습니다!');
    
    // 현재 선택된 식물 ID 저장
    const currentPlantId = selectedPlant.id;
    
    // 데이터 새로고침 (현재 선택 유지)
    await fetchWateringLogs(currentPlantId);
    await fetchMyPlants(currentPlantId);  // ← 현재 ID 전달!
    setWaterModalVisible(false);
    
    } catch (error) {
        console.error('물주기 기록 에러:', error);
        message.error('기록 추가에 실패했습니다.');
    }
    };

  const handleDeleteWateringLog = async (logId) => {
  if (window.confirm('이 물주기 기록을 삭제하시겠습니까?')) {
    try {
      // 현재 선택된 식물 ID 저장
      const currentPlantId = selectedPlant.id;
      
      await myPlantsAPI.deleteWateringLog(currentPlantId, logId);
      message.success('기록이 삭제되었습니다.');
      
      // 현재 선택 유지하면서 데이터 새로고침
      await fetchWateringLogs(currentPlantId);
      await fetchMyPlants(currentPlantId);
        } catch (error) {
        console.error('삭제 에러:', error);
        message.error('삭제에 실패했습니다.');
        }
    }
    };

  const handleImageChange = (info) => {
  console.log('📸 이미지 선택 이벤트:', info);
  
  if (info.fileList && info.fileList.length > 0) {
    const file = info.fileList[0].originFileObj || info.fileList[0];
    console.log('✅ 선택된 파일:', file);
    setImageFile(file);
  } else if (info.file) {
    const file = info.file.originFileObj || info.file;
    console.log('✅ 선택된 파일:', file);
    setImageFile(file);
  }
};

  const getDaysSinceWatering = (lastWateredAt) => {
    if (!lastWateredAt) return null;
    const days = dayjs().diff(dayjs(lastWateredAt), 'day');
    return days;
  };

  const getWateringStatus = (days) => {
    if (days === null) return { text: '기록 없음', color: 'default' };
    if (days === 0) return { text: '오늘', color: 'green' };
    if (days <= 3) return { text: `${days}일 전`, color: 'green' };
    if (days <= 7) return { text: `${days}일 전`, color: 'orange' };
    return { text: `${days}일 전`, color: 'red' };
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <Title level={2}>🌱 내 식물</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddPlant}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            식물 추가
          </Button>
        </div>

        {myPlants.length === 0 ? (
          <Card style={styles.card}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="아직 등록된 식물이 없습니다"
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddPlant}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                첫 식물 등록하기
              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
            {/* 왼쪽: 내 식물 목록 */}
            <Col xs={24} md={8}>
              <Card title={`내 식물 (${myPlants.length})`} style={styles.card}>
                <List
                  loading={dataLoading}
                  dataSource={myPlants}
                  renderItem={(plant) => {
                    const days = getDaysSinceWatering(plant.last_watered_at);
                    const status = getWateringStatus(days);
                    
                    return (
                      <List.Item
                        style={{
                          ...styles.listItem,
                          background: selectedPlant?.id === plant.id ? '#e6f7ff' : 'transparent'
                        }}
                        onClick={() => handleSelectPlant(plant)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              src={plant.image_url}
                              size={60}
                              shape="square"
                              style={{ borderRadius: '8px' }}
                            >
                              🌿
                            </Avatar>
                          }
                          title={
                            <Space direction="vertical" size={0}>
                              <Text strong style={{ fontSize: '16px' }}>{plant.nickname}</Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {plant.plant_name || '직접 등록'}
                              </Text>
                            </Space>
                          }
                          description={
                            <Space>
                              <Tag color={status.color} icon={<DropboxOutlined />}>
                                {status.text}
                              </Tag>
                              {plant.location && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  <EnvironmentOutlined /> {plant.location}
                                </Text>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              </Card>
            </Col>

            {/* 오른쪽: 상세 정보 */}
            <Col xs={24} md={16}>
              {selectedPlant ? (
                <>
                  <Card
                    title={
                      <Space>
                        <Text strong style={{ fontSize: '20px' }}>{selectedPlant.nickname}</Text>
                        {selectedPlant.plant_name && (
                          <Text type="secondary">({selectedPlant.plant_name})</Text>
                        )}
                      </Space>
                    }
                    extra={
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
                    }
                    style={styles.card}
                  >
                    {selectedPlant.image_url && (
                      <div style={styles.imageContainer}>
                        <img 
                          src={selectedPlant.image_url} 
                          alt={selectedPlant.nickname}
                          style={styles.image}
                        />
                      </div>
                    )}

                    <Space direction="vertical" style={{ width: '100%', marginTop: '16px' }} size="middle">
                      {selectedPlant.location && (
                        <Card size="small" style={{ background: '#f6ffed' }}>
                          <Space>
                            <EnvironmentOutlined style={{ color: '#52c41a' }} />
                            <Text><strong>위치:</strong> {selectedPlant.location}</Text>
                          </Space>
                        </Card>
                      )}

                      {selectedPlant.purchase_date && (
                        <Card size="small" style={{ background: '#f0f5ff' }}>
                          <Space>
                            <CalendarOutlined style={{ color: '#1890ff' }} />
                            <Text><strong>입양일:</strong> {dayjs(selectedPlant.purchase_date).format('YYYY년 MM월 DD일')}</Text>
                            <Text type="secondary">
                              ({dayjs().diff(dayjs(selectedPlant.purchase_date), 'day')}일째 함께)
                            </Text>
                          </Space>
                        </Card>
                      )}

                      {selectedPlant.notes && (
                        <Card size="small" title="📝 메모">
                          <Paragraph>{selectedPlant.notes}</Paragraph>
                        </Card>
                      )}
                    </Space>
                  </Card>

                  {/* 물주기 섹션 */}
                  <Card
                    title={
                      <Space>
                        <DropboxOutlined style={{ color: '#1890ff' }} />
                        <Text strong>물주기 기록</Text>
                      </Space>
                    }
                    extra={
                      <Button 
                        type="primary"
                        icon={<DropboxOutlined />}
                        onClick={handleWater}
                      >
                        물주기
                      </Button>
                    }
                    style={{ ...styles.card, marginTop: '24px' }}
                  >
                    {wateringLogs.length === 0 ? (
                      <Empty description="아직 물주기 기록이 없습니다">
                        <Button 
                          type="primary"
                          icon={<DropboxOutlined />}
                          onClick={handleWater}
                        >
                          첫 물주기 기록하기
                        </Button>
                      </Empty>
                    ) : (
                      <>
                        <div style={{ marginBottom: '16px', padding: '12px', background: '#e6f7ff', borderRadius: '8px' }}>
                          <Space>
                            <Text strong>마지막 물주기:</Text>
                            <Text>{dayjs(wateringLogs[0].watered_at).format('YYYY-MM-DD HH:mm')}</Text>
                            <Text type="secondary">
                              ({dayjs(wateringLogs[0].watered_at).fromNow()})
                            </Text>
                          </Space>
                        </div>

                        <List
                          dataSource={wateringLogs}
                          renderItem={(log) => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="text" 
                                  danger 
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteWateringLog(log.id)}
                                />
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<Avatar icon={<DropboxOutlined />} style={{ background: '#1890ff' }} />}
                                title={
                                  <Space>
                                    <ClockCircleOutlined />
                                    <Text>{dayjs(log.watered_at).format('YYYY-MM-DD HH:mm')}</Text>
                                    <Text type="secondary">({dayjs(log.watered_at).fromNow()})</Text>
                                  </Space>
                                }
                                description={log.notes || '메모 없음'}
                              />
                            </List.Item>
                          )}
                        />
                      </>
                    )}
                  </Card>
                </>
              ) : (
                <Card style={styles.card}>
                  <Empty description="식물을 선택해주세요" />
                </Card>
              )}
            </Col>
          </Row>
        )}
      </div>

      {/* 식물 추가/수정 모달 */}
      <Modal
        title={editMode ? '식물 정보 수정' : '새 식물 추가'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText={editMode ? '수정' : '추가'}
        cancelText="취소"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="nickname"
            label="애칭 (내 식물 이름)"
            rules={[{ required: true, message: '애칭을 입력하세요' }]}
          >
            <Input placeholder="예: 몬이, 스투" />
          </Form.Item>

          <Form.Item
            name="plant_id"
            label="식물 종류 (선택사항)"
          >
            <Select
              placeholder="식물 도감에서 선택 (선택사항)"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {allPlants.map(plant => (
                <Select.Option key={plant.id} value={plant.id}>
                  {plant.name} ({plant.scientific_name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="purchase_date"
            label="입양일"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="location"
            label="위치"
          >
            <Input placeholder="예: 거실 창가, 베란다" />
        </Form.Item>

          <Form.Item label="사진">
            <Upload
                beforeUpload={(file) => {
                console.log('📸 업로드 전 파일:', file);
                setImageFile(file);
                return false; // 자동 업로드 방지
            }}
            maxCount={1}
            listType="picture"
            accept="image/*"
        >
            <Button icon={<UploadOutlined />}>사진 선택</Button>
        </Upload>
        </Form.Item>

          <Form.Item
            name="notes"
            label="메모"
          >
            <TextArea rows={3} placeholder="특이사항, 관리 메모 등" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 물주기 모달 */}
      <Modal
        title="💧 물주기 기록"
        open={waterModalVisible}
        onCancel={() => setWaterModalVisible(false)}
        onOk={() => waterForm.submit()}
        okText="기록하기"
        cancelText="취소"
      >
        <Form
          form={waterForm}
          layout="vertical"
          onFinish={handleWaterSubmit}
        >
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f6ffed', borderRadius: '8px' }}>
            <Text>
              <strong>{selectedPlant?.nickname}</strong>에게 물을 주었나요?
            </Text>
          </div>

          <Form.Item
            name="notes"
            label="메모 (선택사항)"
          >
            <TextArea rows={2} placeholder="물 양, 상태 등" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
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

export default MyPlants;