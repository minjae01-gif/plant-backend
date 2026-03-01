// =======================================
// 🌐 기본 설정
// =======================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 외부 설정 파일 로드
const settings = JSON.parse(fs.readFileSync('./config/settings.json', 'utf-8'));

const app = express();
const PORT = process.env.PORT || 5000;

// =======================================
// ⚙️ 미들웨어
// =======================================
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================================
// ⚙️ 관리자 라우트 등록
// =======================================

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// =======================================
// ⚙️ 사용자 설정 (LED/물주기 프리셋)
// =======================================
let userSettings = {
  ledOffHour: settings.ledOffHour || 22,
  wateringIntervalHours: settings.wateringIntervalHours || 6,
  autoWaterEnabled: settings.autoWaterEnabled ?? true
};

// =======================================
// 📌 라우트 import
// =======================================
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const marketplaceRoutes = require('./routes/marketplace');
const commentRoutes = require('./routes/comments');
const tradeRoutes = require('./routes/trade');

// =======================================
// ⭐ ESP32 센서 데이터 저장
// =======================================
let latestSensorData = {
  temperature: 0,
  humidity: 0,
  soilMoisture: 0,
  lightLevel: 0,
  timestamp: null
};

// =======================================
// ⭐ ESP32 → 서버 : 센서 데이터 수신
// =======================================
app.post('/sensor', (req, res) => {
  const { soil, light } = req.body;

  latestSensorData = {
    temperature: 0,
    humidity: 0,
    soilMoisture: soil,
    lightLevel: Math.round(light / 10),
    timestamp: new Date()
  };

  console.log("\n📡 [ESP32 → 서버] 센서 데이터 수신");
  console.log(`   🌱 Soil : ${soil}%`);
  console.log(`   💡 Light: ${light}% → ${latestSensorData.lightLevel}`);

  res.json({ success: true, message: "Sensor data received" });
});

// =======================================
// ⭐ 프론트엔드 → 서버 : 최신 센서 데이터 조회
// =======================================
app.get('/api/sensor/latest', (req, res) => {
  res.json({
    success: true,
    data: latestSensorData
  });
});

// =======================================
// ⭐ ESP32 제어 명령
// =======================================
let command = "";

// ESP32가 명령을 가져감
app.get('/command', (req, res) => {
  res.send(command);
  command = ""; 
});

// 프론트엔드가 명령 전달
app.post('/api/command', (req, res) => {
  command = req.body.command || "";
  console.log("📤 [프론트엔드 → 서버] 명령:", command);
  res.json({ success: true });
});

// =======================================
// 📌 REST API 기본 라우트 등록
// =======================================
app.use('/api/auth', authRoutes);
app.use('/api', commentRoutes); 
app.use('/api/posts', postRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/trade', tradeRoutes);

// =======================================
// 🔌 DB 연결 테스트
// =======================================
const db = require('./config/db');
db.query('SELECT 1')
  .then(() => console.log('✅ MySQL 연결 성공!'))
  .catch(err => console.error('❌ MySQL 연결 실패:', err));

// =======================================
// 프론트/ESP가 설정 조회할 API
// =======================================
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    settings: userSettings
  });
});

// =======================================
// 프리셋 수정 API
// =======================================
app.post('/api/settings/update', (req, res) => {
  const { ledOffHour, wateringIntervalHours, autoWaterEnabled } = req.body;

  if (ledOffHour !== undefined) userSettings.ledOffHour = ledOffHour;
  if (wateringIntervalHours !== undefined) userSettings.wateringIntervalHours = wateringIntervalHours;
  if (autoWaterEnabled !== undefined) userSettings.autoWaterEnabled = autoWaterEnabled;

  // JSON 파일 업데이트
  fs.writeFileSync(
    './config/settings.json',
    JSON.stringify(userSettings, null, 2)
  );

  console.log("⚙️ 사용자 설정 업데이트:", userSettings);

  res.json({
    success: true,
    settings: userSettings
  });
});

// =======================================
// ESP32가 LED 자동 OFF/물주기 프리셋 가져가는 API
// =======================================
app.get('/command-settings', (req, res) => {
  res.json(userSettings);
});

// =======================================
// ❌ 404 핸들러
// =======================================
app.use((req, res) => {
  console.log(`❌ 404 - 라우트 없음: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `라우트를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`
  });
});

// =======================================
// 🚀 서버 시작
// =======================================
app.listen(PORT, () => {
  console.log(`\n🚀 서버 실행중: http://localhost:${PORT}`);

  console.log('\n📋 등록된 기능');
  console.log('📌 ESP32 → 서버 : POST /sensor');
  console.log('📌 서버 → ESP32 : GET /command');
  console.log('📌 Front → Server : GET /api/sensor/latest');
  console.log('📌 Front → Server : POST /api/command');
  console.log('📌 Front ↔ Server : /api/settings, /api/settings/update');
});

module.exports = app;
