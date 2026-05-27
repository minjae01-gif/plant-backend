const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// JWT 검증 미들웨어
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: '토큰이 제공되지 않았습니다.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '유효하지 않은 토큰입니다.' 
    });
  }
};

// 이미지 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'myplant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

// ========================================
// 내 식물 관리
// ========================================

// 내 식물 목록 조회
router.get('/', verifyToken, async (req, res) => {
  try {
    const [myPlants] = await db.query(
      `SELECT 
        mp.*,
        p.name as plant_name,
        p.scientific_name,
        p.watering_frequency,
        (SELECT MAX(watered_at) FROM watering_logs WHERE my_plant_id = mp.id) as last_watered_at,
        (SELECT COUNT(*) FROM watering_logs WHERE my_plant_id = mp.id) as watering_count
      FROM my_plants mp
      LEFT JOIN plants p ON mp.plant_id = p.id
      WHERE mp.user_id = ?
      ORDER BY mp.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      plants: myPlants
    });
  } catch (error) {
    console.error('내 식물 목록 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '식물 목록 조회 실패' 
    });
  }
});

// 특정 내 식물 조회
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [myPlants] = await db.query(
      `SELECT 
        mp.*,
        p.name as plant_name,
        p.scientific_name,
        p.image_url as plant_image_url,
        p.description,
        p.care_tips,
        p.watering_frequency,
        p.temp_min,
        p.temp_max,
        p.humidity_min,
        p.humidity_max,
        p.light_min,
        p.light_max,
        p.soil_moisture_min,
        p.soil_moisture_max
      FROM my_plants mp
      LEFT JOIN plants p ON mp.plant_id = p.id
      WHERE mp.id = ? AND mp.user_id = ?`,
      [req.params.id, req.user.userId]
    );

    if (myPlants.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '식물을 찾을 수 없습니다.' 
      });
    }

    res.json({
      success: true,
      plant: myPlants[0]
    });
  } catch (error) {
    console.error('식물 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '식물 조회 실패' 
    });
  }
});

// 내 식물 등록
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { plant_id, nickname, purchase_date, location, notes } = req.body;

    const image_url = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    const [result] = await db.query(
      `INSERT INTO my_plants 
        (user_id, username, plant_id, nickname, purchase_date, location, image_url, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        req.user.username,
        plant_id || null,
        nickname,
        purchase_date || null,
        location || null,
        image_url,
        notes || null
      ]
    );

    console.log('✅ DB 저장 성공! ID:', result.insertId);

    res.status(201).json({ 
      success: true, 
      message: '식물이 등록되었습니다.',
      plantId: result.insertId
    });
  } catch (error) {
    console.error('❌ 식물 등록 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '식물 등록 실패',
      error: error.message
    });
  }
});

// 내 식물 수정
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { plant_id, nickname, purchase_date, location, notes } = req.body;

    // 권한 확인
    const [existing] = await db.query(
      'SELECT * FROM my_plants WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '식물을 찾을 수 없거나 권한이 없습니다.' 
      });
    }

    let image_url = req.body.existing_image_url || existing[0].image_url;
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    await db.query(
      `UPDATE my_plants SET
        plant_id = ?,
        nickname = ?,
        purchase_date = ?,
        location = ?,
        image_url = ?,
        notes = ?
      WHERE id = ? AND user_id = ?`,
      [
        plant_id || null,
        nickname,
        purchase_date || null,
        location || null,
        image_url,
        notes || null,
        req.params.id,
        req.user.userId
      ]
    );

    res.json({ 
      success: true, 
      message: '식물 정보가 수정되었습니다.' 
    });
  } catch (error) {
    console.error('식물 수정 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '식물 수정 실패' 
    });
  }
});

// 내 식물 삭제
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM my_plants WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '식물을 찾을 수 없거나 권한이 없습니다.' 
      });
    }

    res.json({ 
      success: true, 
      message: '식물이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('식물 삭제 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '식물 삭제 실패' 
    });
  }
});

// ========================================
// 물주기 기록
// ========================================

// 물주기 기록 조회
router.get('/:id/watering', verifyToken, async (req, res) => {
  try {
    // 권한 확인
    const [myPlant] = await db.query(
      'SELECT * FROM my_plants WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (myPlant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '식물을 찾을 수 없습니다.' 
      });
    }

    const [logs] = await db.query(
      'SELECT * FROM watering_logs WHERE my_plant_id = ? ORDER BY watered_at DESC LIMIT 50',
      [req.params.id]
    );

    res.json({
      success: true,
      logs: logs
    });
  } catch (error) {
    console.error('물주기 기록 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '물주기 기록 조회 실패' 
    });
  }
});

// 물주기 기록 추가
router.post('/:id/watering', verifyToken, async (req, res) => {
  try {
    const { notes } = req.body;

    // 권한 확인
    const [myPlant] = await db.query(
      'SELECT * FROM my_plants WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (myPlant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '식물을 찾을 수 없습니다.' 
      });
    }

    await db.query(
      'INSERT INTO watering_logs (my_plant_id, notes) VALUES (?, ?)',
      [req.params.id, notes || null]
    );

    res.status(201).json({ 
      success: true, 
      message: '물주기 기록이 추가되었습니다.' 
    });
  } catch (error) {
    console.error('물주기 기록 추가 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '물주기 기록 추가 실패' 
    });
  }
});

// 물주기 기록 삭제
router.delete('/:plantId/watering/:logId', verifyToken, async (req, res) => {
  try {
    // 권한 확인
    const [myPlant] = await db.query(
      'SELECT * FROM my_plants WHERE id = ? AND user_id = ?',
      [req.params.plantId, req.user.userId]
    );

    if (myPlant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '권한이 없습니다.' 
      });
    }

    await db.query(
      'DELETE FROM watering_logs WHERE id = ? AND my_plant_id = ?',
      [req.params.logId, req.params.plantId]
    );

    res.json({ 
      success: true, 
      message: '물주기 기록이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('물주기 기록 삭제 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '물주기 기록 삭제 실패' 
    });
  }
});

module.exports = router;