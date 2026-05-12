import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Input, Button, Space, Upload, message, 
  Typography, Tag, Divider 
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PictureOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { postAPI } from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Title, Text } = Typography;

function WritePost() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [contentBlocks, setContentBlocks] = useState([
    { type: 'text', content: '', id: Date.now() }
  ]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      message.warning('로그인이 필요한 서비스입니다.');
      navigate('/login');
    }
  }, [user, navigate]);

  // 텍스트 블록 추가
  const addTextBlock = (afterIndex) => {
    const newBlock = { type: 'text', content: '', id: Date.now() };
    const newBlocks = [...contentBlocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    setContentBlocks(newBlocks);
  };

  // 이미지 블록 추가
  const addImageBlock = (afterIndex) => {
    if (images.length >= 5) {
      message.error('이미지는 최대 5개까지만 업로드 가능합니다.');
      return;
    }
    const newBlock = { type: 'image', imageIndex: images.length, id: Date.now() };
    const newBlocks = [...contentBlocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    setContentBlocks(newBlocks);
  };

  // 블록 삭제
  const removeBlock = (index) => {
    if (contentBlocks.length === 1) {
      message.warning('최소 1개의 블록은 필요합니다.');
      return;
    }
    const newBlocks = contentBlocks.filter((_, i) => i !== index);
    setContentBlocks(newBlocks);
  };

  // 블록 위로 이동
  const moveBlockUp = (index) => {
    if (index === 0) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setContentBlocks(newBlocks);
  };

  // 블록 아래로 이동
  const moveBlockDown = (index) => {
    if (index === contentBlocks.length - 1) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  // 텍스트 블록 내용 변경
  const updateTextBlock = (index, value) => {
    const newBlocks = [...contentBlocks];
    newBlocks[index].content = value;
    setContentBlocks(newBlocks);
  };

  // 이미지 업로드
  const handleImageUpload = (file, imageIndex) => {
    if (file.size > 5 * 1024 * 1024) {
      message.error('이미지 크기는 5MB 이하여야 합니다.');
      return false;
    }

    const newImages = [...images];
    newImages[imageIndex] = file;
    setImages(newImages);
    message.success('이미지가 추가되었습니다.');
    return false; // 자동 업로드 방지
  };

  // 이미지 삭제
  const removeImage = (imageIndex) => {
    const newImages = [...images];
    newImages[imageIndex] = null;
    setImages(newImages);
    
    // 해당 이미지 블록도 삭제
    const newBlocks = contentBlocks.filter(
      block => !(block.type === 'image' && block.imageIndex === imageIndex)
    );
    setContentBlocks(newBlocks);
  };

  // 제출
  const handleSubmit = async () => {
    if (!title.trim()) {
      message.error('제목을 입력해주세요.');
      return;
    }

    // 최종 content 조합
    let finalContent = '';
    contentBlocks.forEach((block) => {
      if (block.type === 'text') {
        finalContent += block.content + '\n';
      } else if (block.type === 'image') {
        finalContent += `[IMAGE:${block.imageIndex}]\n`;
      }
    });

    if (!finalContent.trim()) {
      message.error('내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', finalContent.trim());
      
      // 실제 이미지 파일들만 추가
      images.forEach((image) => {
        if (image) {
          formData.append('images', image);
        }
      });

      await postAPI.createPost(formData);
      message.success('게시글이 작성되었습니다.');
      navigate('/community');
    } catch (error) {
      message.error('게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <Card>
          <Title level={2}>✏️ 커뮤니티 글쓰기</Title>
          <Text type="secondary">
            텍스트와 이미지를 자유롭게 배치하여 작성하세요. (이미지 최대 5개)
          </Text>

          <Divider />

          {/* 제목 */}
          <div style={styles.titleSection}>
            <Text strong>제목</Text>
            <Input
              size="large"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>

          <Divider />

          {/* 내용 블록들 */}
          <div style={styles.contentSection}>
            <Text strong>내용</Text>
            
            <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '16px' }}>
              {contentBlocks.map((block, index) => (
                <Card
                  key={block.id}
                  size="small"
                  style={styles.blockCard}
                  extra={
                    <Space>
                      <Tag color="blue">블록 {index + 1}</Tag>
                      {index > 0 && (
                        <Button
                          icon={<ArrowUpOutlined />}
                          size="small"
                          onClick={() => moveBlockUp(index)}
                        />
                      )}
                      {index < contentBlocks.length - 1 && (
                        <Button
                          icon={<ArrowDownOutlined />}
                          size="small"
                          onClick={() => moveBlockDown(index)}
                        />
                      )}
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => removeBlock(index)}
                      />
                    </Space>
                  }
                >
                  {block.type === 'text' ? (
                    // 텍스트 블록
                    <>
                      <TextArea
                        placeholder="내용을 입력하세요..."
                        value={block.content}
                        onChange={(e) => updateTextBlock(index, e.target.value)}
                        autoSize={{ minRows: 3, maxRows: 10 }}
                      />
                      <Space style={{ marginTop: '12px' }}>
                        <Button
                          icon={<PlusOutlined />}
                          size="small"
                          onClick={() => addTextBlock(index)}
                        >
                          텍스트 추가
                        </Button>
                        <Button
                          icon={<PictureOutlined />}
                          size="small"
                          type="primary"
                          onClick={() => addImageBlock(index)}
                          disabled={images.length >= 5}
                        >
                          이미지 추가
                        </Button>
                      </Space>
                    </>
                  ) : (
                    // 이미지 블록
                    <div style={styles.imageBlock}>
                      <Tag color="green" style={{ marginBottom: '12px' }}>
                        이미지 {block.imageIndex + 1}
                      </Tag>
                      {images[block.imageIndex] ? (
                        <div style={styles.imagePreview}>
                          <img
                            src={URL.createObjectURL(images[block.imageIndex])}
                            alt={`preview-${block.imageIndex}`}
                            style={styles.previewImg}
                          />
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => removeImage(block.imageIndex)}
                            style={{ marginTop: '8px' }}
                          >
                            이미지 삭제
                          </Button>
                        </div>
                      ) : (
                        <Upload
                          beforeUpload={(file) => handleImageUpload(file, block.imageIndex)}
                          showUploadList={false}
                          accept="image/*"
                        >
                          <Button icon={<PlusOutlined />} block>
                            이미지 선택 (최대 5MB)
                          </Button>
                        </Upload>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </Space>
          </div>

          <Divider />

          {/* 제출 버튼 */}
          <Space>
            <Button
              size="large"
              onClick={() => navigate('/community')}
            >
              취소
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={loading}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              작성 완료
            </Button>
          </Space>
        </Card>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
  },
  titleSection: {
    marginBottom: '24px',
  },
  contentSection: {
    marginBottom: '24px',
  },
  blockCard: {
    borderRadius: '8px',
    border: '2px solid #f0f0f0',
  },
  imageBlock: {
    padding: '16px',
  },
  imagePreview: {
    textAlign: 'center',
  },
  previewImg: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    marginBottom: '8px',
  },
};

export default WritePost;
