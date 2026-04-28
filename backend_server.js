// =======================================
// 🌐 기본 설정
// =======================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const chatRouter = require('./routes/chat');
const authData = require('./routes/auth');
const db = require('./config/db');

const adminRoutes = require('./routes/admin');
const postRoutes = require('./routes/posts');
const marketplaceRoutes = require('./routes/marketplace');
const commentRoutes = require('./routes/comments');
const tradeRoutes = require('./routes/trade');
const plantRoutes = require('./routes/plants');
const myPlantsRoutes = require('./routes/myplants');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// =======================================
// 🌐 CORS 설정22
// =======================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://esp-32-pv78.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  return (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost')
  );
}

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.log('❌ CORS 차단:', origin);
    return callback(new Error('CORS 차단됨: ' + origin));
  },
  credentials: true,
};

// =======================================
// 🔌 Socket.IO 설정
// =======================================
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.log('❌ Socket.IO CORS 차단:', origin);
      return callback(new Error('Socket.IO CORS 차단됨: ' + origin));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// =======================================
// ⚙️ 미들웨어
// =======================================
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 이미지 업로드 폴더 정적 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================================
// ⚙️ settings.json 로드 / 저장
// =======================================
const SETTINGS_PATH = path.join(__dirname, 'config', 'settings.json');

function loadSettingsFile() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return {};
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch (e) {
    console.error('❌ settings.json 로드 실패:', e);
    return {};
  }
}

function saveSettingsFile(data) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('❌ settings.json 저장 실패:', e);
  }
}

const settings = loadSettingsFile();

// =======================================
// ⚙️ 사용자 설정
// =======================================
let userSettings = {
  ledOffHour: settings.ledOffHour ?? 22,
  wateringIntervalHours: settings.wateringIntervalHours ?? 6,
  autoWaterEnabled: settings.autoWaterEnabled ?? true,
  soilMoistureMin: settings.soilMoistureMin ?? 30,
  soilMoistureMax: settings.soilMoistureMax ?? 60,
  ledOnHoursPerDay: settings.ledOnHoursPerDay ?? 8,
};

// =======================================
// ⭐ ESP32 센서 데이터 저장
// =======================================
let latestSensorData = {
  temperature: 0,
  humidity: 0,
  soilMoisture: 0,
  lightRaw: 0,
  lightPercent: 0,
  lightLevel: 0,
  timestamp: null,
};

// =======================================
// ⭐ ESP32 제어 명령
// =======================================
let command = '';

// =======================================
// 🔍 서버 상태 확인
// =======================================
app.get('/', (req, res) => {
  res.send('Smart Plant Backend Server is running');
});

// =======================================
// 📌 REST API 라우트 등록
// =======================================
app.use('/api/chat', chatRouter);
app.use('/api/admin', adminRoutes);
app.use('/api', commentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/myplants', myPlantsRoutes);
app.use('/api/auth', authData.router);

// =======================================
// 💬 실시간 채팅 소켓
// =======================================
io.on('connection', (socket) => {
  console.log('📱 새로운 사용자가 연결되었습니다:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`🏠 유저가 방 ${roomId}에 입장했습니다.`);
  });

  socket.on('send_message', async (data) => {
    const { room_id, sender_id, message } = data;

    try {
      await db.query(
        'INSERT INTO chat_messages (room_id, sender_id, message) VALUES (?, ?, ?)',
        [room_id, sender_id, message]
      );

      socket.to(room_id).emit('receive_message', data);
    } catch (err) {
      console.error('❌ 메시지 저장 실패:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ 유저 연결 종료:', socket.id);
  });
});

// =======================================
// ⭐ ESP32 → 서버 : 센서 데이터 수신
// =======================================
app.post('/sensor', async (req, res) => {
  console.log('\n📩 req.body:', req.body);

  const {
    soil,
    soilMoisture,
    lightRaw,
    lightPercent,
    lightLevel,
    temperature,
    humidity,
  } = req.body;

  const data = {
    temperature: Number(temperature ?? 0),
    humidity: Number(humidity ?? 0),
    soilMoisture: Number(soilMoisture ?? soil ?? 0),
    lightRaw: Number(lightRaw ?? 0),
    lightPercent: Number(lightPercent ?? 0),
    lightLevel: Number(lightLevel ?? 0),
    timestamp: new Date(),
  };

  try {
    await db.query(
      `INSERT INTO sensor_data 
      (temperature, humidity, soil_moisture, light_raw, light_percent, light_level) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.temperature,
        data.humidity,
        data.soilMoisture,
        data.lightRaw,
        data.lightPercent,
        data.lightLevel,
      ]
    );

    console.log('💾 DB 저장 성공');
  } catch (err) {
    console.error('❌ DB 저장 실패:', err);
  }

  latestSensorData = data;
  io.emit('sensorData', latestSensorData);

  res.json({
    success: true,
    message: 'Sensor data saved',
    data,
  });
});

// =======================================
// ⭐ 프론트엔드 → 서버 : 최신 센서 데이터 조회
// =======================================
app.get('/api/sensor/latest', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          temperature: 0,
          humidity: 0,
          soilMoisture: 0,
          lightRaw: 0,
          lightPercent: 0,
          lightLevel: 0,
          timestamp: null
        }
      });
    }

    const row = rows[0];

    res.json({
      success: true,
      data: {
        temperature: row.temperature,
        humidity: row.humidity,
        soilMoisture: row.soil_moisture,
        lightRaw: row.light_raw,
        lightPercent: row.light_percent,
        lightLevel: row.light_level,
        timestamp: row.created_at
      }
    });
  } catch (err) {
    console.error('❌ DB 조회 실패:', err);

    res.status(500).json({
      success: false,
      message: 'DB 조회 실패',
    });
  }
});

// =======================================
// ⭐ 그래프용 센서 기록 조회
// =======================================
app.get('/api/sensor/history', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 50'
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error('❌ 센서 기록 조회 실패:', err);

    res.status(500).json({
      success: false,
      message: '센서 기록 조회 실패',
    });
  }
});

// =======================================
// ⭐ ESP32가 명령 가져가는 API
// =======================================
app.get('/command', (req, res) => {
  res.send(command);
  command = '';
});

// =======================================
// ⭐ 프론트엔드가 명령 전달하는 API
// =======================================
app.post('/api/command', (req, res) => {
  command = req.body.command || '';
  console.log('📤 [프론트엔드 → 서버] 명령:', command);

  res.json({
    success: true,
    command,
  });
});

// =======================================
// ⭐ 식물 데이터셋 API
// =======================================
app.get('/api/species', (req, res) => {
  try {
    const speciesPath = path.join(__dirname, 'config', 'plant_species.json');
    const species = JSON.parse(fs.readFileSync(speciesPath, 'utf-8'));
    res.json(species);
  } catch (error) {
    console.error('❌ plant_species.json 로드 실패:', error);

    res.status(500).json({
      success: false,
      message: '식물 데이터 로드 실패',
    });
  }
});

// =======================================
// ⚙️ 프론트/ESP 설정 조회 API
// =======================================
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    settings: userSettings,
  });
});

// =======================================
// ⚙️ 프리셋 수정 API
// =======================================
app.post('/api/settings/update', (req, res) => {
  const {
    ledOffHour,
    wateringIntervalHours,
    autoWaterEnabled,
    soilMoistureMin,
    soilMoistureMax,
    ledOnHoursPerDay,
  } = req.body;

  if (ledOffHour !== undefined) userSettings.ledOffHour = ledOffHour;
  if (wateringIntervalHours !== undefined) {
    userSettings.wateringIntervalHours = wateringIntervalHours;
  }
  if (autoWaterEnabled !== undefined) userSettings.autoWaterEnabled = autoWaterEnabled;
  if (soilMoistureMin !== undefined) userSettings.soilMoistureMin = soilMoistureMin;
  if (soilMoistureMax !== undefined) userSettings.soilMoistureMax = soilMoistureMax;
  if (ledOnHoursPerDay !== undefined) userSettings.ledOnHoursPerDay = ledOnHoursPerDay;

  saveSettingsFile(userSettings);

  console.log('⚙️ 사용자 설정 업데이트:', userSettings);

  res.json({
    success: true,
    settings: userSettings,
  });
});

// =======================================
// ESP32가 LED/물주기 프리셋 가져가는 API
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
    message: `라우트를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`,
  });
});

// =======================================
// 🚀 서버 시작
// =======================================
server.listen(PORT, () => {
  console.log(`\n🚀 서버 실행중: PORT ${PORT}`);
  console.log('🌐 허용된 프론트 주소:', allowedOrigins);
  console.log('📌 /sensor');
  console.log('📌 /api/sensor/latest');
  console.log('📌 /api/settings');
  console.log('📌 /command');
  console.log('📌 /command-settings');
});