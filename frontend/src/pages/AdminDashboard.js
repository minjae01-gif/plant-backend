import React, { useState, useEffect } from 'react';
import { Tag, Card, Typography, message, Tabs, Table, Button, Popconfirm, Space } from 'antd';
import { adminAPI } from '../services/api';
import Layout from '../components/Layout';

const { Title } = Typography;

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [marketItems, setMarketItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. 데이터 통합 로딩 함수 (fetchData)
const fetchData = async () => {
  setLoading(true);
  try {
    // 3개의 API를 동시에 호출합니다.
    const [userRes, postRes, marketRes] = await Promise.all([
      adminAPI.getUsers(),
      adminAPI.getAllPosts(),
      adminAPI.getAllMarketplaceItems()
    ]);

    // 각 응답 데이터를 State에 저장합니다.
    if (userRes.data.success) setUsers(userRes.data.users);
    if (postRes.data.success) setPosts(postRes.data.posts);
    if (marketRes.data.success) setMarketItems(marketRes.data.items);
    
  } catch (error) {
    console.error("데이터 로드 에러:", error);
    message.error('데이터를 불러오는 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  // 2. 삭제 처리 함수들
  const handleDeletePost = async (id) => {
    try {
      const res = await adminAPI.deletePost(id);
      if (res.data.success) {
        message.success('게시글이 삭제되었습니다.');
        fetchData(); // 삭제 후 목록 갱신
      }
    } catch (error) {
      message.error('삭제 실패: 권한이 없거나 서버 에러입니다.');
    }
  };

  const handleDeleteMarket = async (id) => {
    try {
      const res = await adminAPI.deleteMarketItem(id);
      if (res.data.success) {
        message.success('상품이 삭제되었습니다.');
        fetchData(); // 삭제 후 목록 갱신
      }
    } catch (error) {
      message.error('상품 삭제에 실패했습니다.');
    }
  };

  // 3. 테이블 컬럼 정의 (사용자)
  const userColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '닉네임', dataIndex: 'username', key: 'username' },
    { title: '이메일', dataIndex: 'email', key: 'email' },
    { 
      title: '권한', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'volcano' : 'blue'}>{role.toUpperCase()}</Tag>
      )
    },
    { title: '가입일', dataIndex: 'created_at', key: 'created_at', render: (date) => new Date(date).toLocaleDateString() },
  ];

  // 4. 테이블 컬럼 정의 (게시글)
  const postColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '제목', dataIndex: 'title', key: 'title' },
    { title: '작성자', dataIndex: 'username', key: 'username' },
    {
      title: '관리',
      key: 'action',
      render: (record) => (
        <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDeletePost(record.id)}>
          <Button type="link" danger>삭제</Button>
        </Popconfirm>
      ),
    },
  ];

  // 5. 테이블 컬럼 정의 (마켓)
  const marketColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '상품명', dataIndex: 'title', key: 'title' }, // 데이터베이스 필드명 확인 필요
    {
      title: '관리',
      key: 'action',
      render: (record) => (
        <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDeleteMarket(record.id)}>
          <Button type="link" danger>삭제</Button>
        </Popconfirm>
      ),
    },
  ];

  // 6. 탭 아이템 설정
  const tabItems = [
    {
      key: '1',
      label: '사용자 관리',
      children: <Table dataSource={users} columns={userColumns} rowKey="id" loading={loading} />,
    },
    {
      key: '2',
      label: '커뮤니티 관리',
      children: <Table dataSource={posts} columns={postColumns} rowKey="id" loading={loading} />,
    },
    {
      key: '3',
      label: '마켓 관리',
      children: <Table dataSource={marketItems} columns={marketColumns} rowKey="id" loading={loading} />,
    },
  ];

  // 7. 최종 출력 (단 하나의 return만 존재해야 함)
  return (
    <Layout>
      <div style={{ padding: '24px' }}>
        <Title level={2}>🛡️ 관리자 대시보드</Title>
        <Card style={{ borderRadius: '12px' }}>
          <Tabs defaultActiveKey="1" items={tabItems} />
        </Card>
      </div>
    </Layout>
  );
}

export default AdminDashboard;