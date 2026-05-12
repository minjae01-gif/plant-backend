const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let latestData = { temperature: 0, humidity: 0, light: 0 };

// ESP32 대신 테스트용 데이터 수신 엔드포인트
app.post('/sensor', (req, res) => {
  latestData = req.body;
  console.log('받은 데이터:', latestData);
  io.emit('sensorData', latestData); // React로 전송
  res.sendStatus(200);
});

// React 연결 확인
io.on('connection', (socket) => {
  console.log('웹 대시보드 연결됨:', socket.id);
  socket.emit('sensorData', latestData);
});


server.listen(5000, () => console.log('✅ 서버 실행 중'));