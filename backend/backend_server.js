// =======================================
// 🌐 기본 설정
// =======================================
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

// 라우트 파일
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// =======================================
// 🚀 Express 앱 & HTTP 서버 생성
// =======================================
const app = express();
const server = http.createServer(app);

// Socket.IO 서버 구성
const io = new Server(server, {
  cors: { origin: "*" } // React 등 웹 클라이언트 허용
});

// =======================================
// ⚙️ 미들웨어
// =======================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// =======================================
// 📡 최신 센서 데이터 저장
// =======================================
let latestData = {
  soil: 0,
  light: 0
};

// =======================================
// 📡 ESP32 센서 데이터 수신 (POST /sensor)
// =======================================
app.post('/sensor', (req, res) => {
  latestData = req.body; // { soil, light }
  console.log('📡 받은 센서 데이터:', latestData);

  // 모든 웹 클라이언트로 실시간 전송
  io.emit('sensorData', latestData);

  res.send('✅ Sensor data received');
});

// =======================================
// 💻 웹 대시보드(Socket.IO) 연결
// =======================================
io.on('connection', (socket) => {
  console.log('💻 Dashboard connected:', socket.id);

  // 접속 즉시 최신 데이터 전송
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
    message: '🌱 Plant Community + ESP32 Sensor Server Running',
    api: '/api/auth, /api/posts',
    sensorPost: '/sensor (POST)',
    socket: 'Socket.IO Active'
  });
});

// =======================================
// 🚀 서버 시작
// =======================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 통합 서버가 포트 ${PORT}에서 실행중입니다.`);
  console.log(`➡ http://localhost:${PORT}`);
});
