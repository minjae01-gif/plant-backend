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
    cb(null, 'plant-' + uniqueSuffix + path.extname(file.originalname));
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

// 모든 식물 조회
router.get('/', async (req, res) => {
  try {
    const [plants] = await db.query(
      'SELECT * FROM plants ORDER BY name ASC'
    );

    res.json({
      success: true,
      plants: plants
    });
  } catch (error) {
    console.error('식물 목록 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '식물 목록 조회 실패' 
    });
  }
});

// 특정 식물 조회
router.get('/:id', async (req, res) => {
  try {
    const [plants] = await db.query(
      'SELECT * FROM plants WHERE id = ?',
      [req.params.id]
    );

    if (plants.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '식물을 찾을 수 없습니다.' 
      });
    }

    res.json({
      success: true,
      plant: plants[0]
    });
  } catch (error) {
    console.error('식물 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '식물 조회 실패' 
    });
  }
});

// 식물 등록 (관리자)
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const {
      name, scientific_name, habitat,
      temp_min, temp_max, humidity_min, humidity_max,
      light_min, light_max, light_description,
      soil_moisture_min, soil_moisture_max,
      description, care_tips, watering_frequency
    } = req.body;

    const image_url = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    await db.query(
      `INSERT INTO plants (
        name, scientific_name, image_url, habitat,
        temp_min, temp_max, humidity_min, humidity_max,
        light_min, light_max, light_description,
        soil_moisture_min, soil_moisture_max,
        description, care_tips, watering_frequency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, scientific_name, image_url, habitat,
        temp_min, temp_max, humidity_min, humidity_max,
        light_min, light_max, light_description,
        soil_moisture_min, soil_moisture_max,
        description, care_tips, watering_frequency
      ]
    );

    res.status(201).json({ 
      success: true, 
      message: '식물이 등록되었습니다.' 
    });
  } catch (error) {
    console.error('식물 등록 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '식물 등록 실패' 
    });
  }
});

// 식물 수정 (관리자)
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const {
      name, scientific_name, habitat,
      temp_min, temp_max, humidity_min, humidity_max,
      light_min, light_max, light_description,
      soil_moisture_min, soil_moisture_max,
      description, care_tips, watering_frequency
    } = req.body;

    let image_url = req.body.existing_image_url;
    if (req.file) {
      image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    await db.query(
      `UPDATE plants SET
        name = ?, scientific_name = ?, image_url = ?, habitat = ?,
        temp_min = ?, temp_max = ?, humidity_min = ?, humidity_max = ?,
        light_min = ?, light_max = ?, light_description = ?,
        soil_moisture_min = ?, soil_moisture_max = ?,
        description = ?, care_tips = ?, watering_frequency = ?
      WHERE id = ?`,
      [
        name, scientific_name, image_url, habitat,
        temp_min, temp_max, humidity_min, humidity_max,
        light_min, light_max, light_description,
        soil_moisture_min, soil_moisture_max,
        description, care_tips, watering_frequency,
        req.params.id
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

// 식물 삭제 (관리자)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM plants WHERE id = ?', [req.params.id]);
    
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

module.exports = router;