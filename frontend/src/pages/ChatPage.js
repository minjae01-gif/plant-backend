import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Input, Button, List, Avatar, Typography, Card } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import { ArrowLeftOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Modal, message, Space } from 'antd';


const { Content } = Layout;
const { Text } = Typography;

// 서버 주소 
const socket = io('https://plant-backend-mrho.onrender.com');

function ChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef();
  const { refreshUnreadCount } = useAuth(); 
  const handleBack = () => {
    navigate('/chat-list');
  };

useEffect(() => {
  // 유저 정보나 방 번호가 없으면 아예 시작도 안 함 (에러 방지)
  if (!user?.id || !roomId) return;

  fetchMessages();
  // 방 입장
  socket.emit('join_room', roomId);

  //기존에 등록된 리스너가 있다면 다 지우기
  socket.off('receive_message');

  // 새로운 리스너 등록
  socket.on('receive_message', (data) => {
    console.log("메시지 수신됨!", data);
    
    setMessages((prev) => {
      // 혹시라도 이미 목록에 있는 메시지인지 한 번 더 확인
      const isAlreadyExist = prev.some(
        (msg) => msg.created_at === data.created_at && msg.sender_id === data.sender_id
      );
      
      if (isAlreadyExist) return prev; // 이미 있으면 추가 안 함
      return [...prev, data];
    });
  });

  // 컴포넌트가 사라질 때(언마운트) 리스너 깨끗이 정리
  return () => {
    socket.off('receive_message');
  };
}, [roomId, user?.id]); // user.id가 바뀔 때(로그인 완료 시) 다시 실행

  // 스크롤 하단 유지
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await chatAPI.getMessages(roomId);
      if (res.data.success) 
        setMessages(res.data.messages);
    } catch (error) {
      console.error("메시지 로드 실패", error);
    }
  };

    useEffect(() => {
      const markAsRead = async () => {
        try {
          await chatAPI.markAsRead(roomId);
          console.log("읽음 처리 완료");
          
          // ⭐ 서버 데이터가 바뀌었으니, 전역 배지 상태도 새로고침해!
          refreshUnreadCount(); 
        } catch (err) {
          console.error(err);
        }
      };

      if (roomId) markAsRead();
    }, [roomId]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const messageData = {
      room_id: roomId,
      sender_id: user.id || user.userId,
      username: user.username,
      message: inputValue,
      created_at: new Date().toISOString(),
    };

    // 서버로 메시지 전송
   

    console.log("보내는 데이터:", messageData); // 터미널 말고 브라우저 콘솔에서 확인!
  socket.emit('send_message', messageData);
    
    // 내 화면에 즉시 반영
    setMessages((prev) => [...prev, messageData]);
    setInputValue('');

  };

  const showDeleteConfirm = () => {
    Modal.confirm({
      title: '채팅방을 삭제하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      content: '삭제된 대화 내용은 복구할 수 없습니다.',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          const res = await chatAPI.deleteRoom(roomId);
          if (res.data.success) {
            message.success('채팅방이 삭제되었습니다.');
            navigate('/chat-list');
          }
        } catch (error) {
          message.error('삭제 중 오류가 발생했습니다.');
        }
      },
    });
  };

  
return (
    

        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <Card 
          title={
            <Space>
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} />
              <span>채팅방 #{roomId}</span>
            </Space>
          }
          extra={
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={showDeleteConfirm}
            >
              방 나가기
            </Button>
          }
          style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', // 카드 밖으로 내용이 넘치지 않게 고정
          marginBottom: '20px' 
        }}
        // Card의 헤더 부분은 고정
        headStyle={{ flexShrink: 0 }}
        // ⭐ 핵심: Card의 본문 영역만 스크롤 가능하게 설정
        bodyStyle={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}
        >
          <List
            dataSource={messages}
            renderItem={(item) => {
              const isMine = item.sender_id === (user?.id || user?.userId);
              return (
                <List.Item style={{ border: 'none', padding: '8px 0', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-start', maxWidth: '80%' }}>
                    <Avatar style={{ backgroundColor: isMine ? '#87d068' : '#1890ff', flexShrink: 0 }}>
                      {item.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div style={{ 
                      margin: isMine ? '0 10px 0 0' : '0 0 0 10px', 
                      padding: '10px 15px', 
                      borderRadius: '12px', 
                      background: isMine ? '#95de64' : '#ffffff',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      position: 'relative'
                    }}>
                      {!isMine && <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>{item.username}</div>}
                      <Text style={{ color: isMine ? '#000' : '#333' }}>{item.message}</Text>
                      <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: '4px', textAlign: isMine ? 'right' : 'left' }}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
          <div ref={scrollRef} />
        </Card>

             {/* 하단 입력창 */}
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <Input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder="메시지를 입력하세요..."
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage}>보내기</Button>
        </div>
        
        </div>
        
   

   
  );
}

export default ChatPage;