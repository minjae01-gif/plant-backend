const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors()); // React와 통신 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true }));

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// 기본 라우트 (서버 작동 테스트용)
app.get('/', (req, res) => {
  res.json({ message: '🌱 Plant Community API Server' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행중입니다.`);
  console.log(`http://localhost:${PORT}`);
});