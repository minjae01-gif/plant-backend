import React, { useEffect, useState } from 'react';
import { Badge, List, Avatar, Card, Tag, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { UserOutlined, MessageOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function ChatListPage() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await chatAPI.getRooms();
      if (res.data.success) {
        setRooms(res.data.rooms);
      }
    } catch (error) {
      console.error("채팅 목록 로드 실패", error);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}><MessageOutlined /> 내 채팅 목록</Title>
      <Card bodyStyle={{ padding: '10px' }}>
        <List
          itemLayout="horizontal"
          dataSource={rooms}
          renderItem={(room) => (
            <List.Item 
              onClick={() => navigate(`/chat/${room.id}`)}
              style={{ 
                cursor: 'pointer', 
                padding: '15px 20px',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <List.Item.Meta
                // 1. 왼쪽: 아이콘과 뱃지
                avatar={
                  <Badge count={room.unread_count} overflowCount={99}>
                    <Avatar size="large" icon={<UserOutlined />} />
                  </Badge>
                }
                // 2. 중간 상단: 이름 / 오른쪽 상단: 날짜 및 식물 이름
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '16px' }}>
                      {room.opponent_name}님과의 대화
                    </Text>
                    <Space>
                      <Tag color="green">{room.item_title}</Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(room.created_at).toLocaleDateString()}
                      </Text>
                    </Space>
                  </div>
                }
                // 3. 하단: 마지막 채팅 내용
                description={
                  <div style={{ marginTop: '5px' }}>
                    <Text type="secondary" ellipsis style={{ maxWidth: '100%' }}>
                      {room.last_message || "대화 내용이 없습니다."}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default ChatListPage;