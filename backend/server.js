// =======================================
// 🌐 기본 설정
// =======================================
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();        // .env 사용

const http = require('http');
const { Server } = require('socket.io');

// 라우트 파일
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// =======================================
// 🚀 Express 앱 & HTTP 서버 + Socket.IO
// =======================================
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// =======================================
// ⚙️ 미들웨어
// =======================================
app.use(cors());                   // React 통신 허용
app.use(express.json());           // JSON 파싱
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// =======================================
// 📡 최신 센서 데이터 저장
// =======================================
let latestData = {
  soil: 0,
  light: 0
};

// =======================================
// 📡 ESP32 센서 데이터 수신 엔드포인트
// =======================================
app.post('/sensor', (req, res) => {
  latestData = req.body;
  console.log('📡 받은 센서 데이터:', latestData);

  // 실시간 클라이언트들에게 전송
  io.emit('sensorData', latestData);

  res.send('✅ 센서 데이터 받음');
});

// =======================================
// 💻 웹 대시보드(React, HTML) 실시간 연결
// =======================================
io.on('connection', (socket) => {
  console.log('💻 웹 대시보드 연결됨:', socket.id);

  // 접속 시 최신 센서 데이터 보내기
  socket.emit('sensorData', latestData);
});

// =======================================
// 📌 REST API 라우트
// =======================================
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// =======================================
// 📌 기본 라우트
// =======================================
app.get('/', (req, res) => {
  res.json({
    message: '🌱 Plant Community API + ESP32 Sensor Server is running!',
    sensorExample: "/sensor (POST)",
    apiExample: "/api/auth, /api/posts"
  });
});

// =======================================
// 🚀 서버 실행
// =======================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행중입니다.`);
  console.log(`➡ http://localhost:${PORT}`);
});
