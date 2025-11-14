const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads 폴더의 절대 경로를 미리 정의합니다.
// (__dirname은 'routes' 폴더, '..'로 'backend' 폴더, 'uploads'로 최종 경로)
const uploadsDir = path.join(__dirname, '..', 'uploads');
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
  destination: function (req, file, cb) {
    // 'uploads' 폴더가 있는지 확인
    if (!fs.existsSync(uploadsDir)) {
      // 없으면 폴더를 생성합니다. (mkdirSync)
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, 'uploads/');  // uploads 폴더에 저장
  },
  filename: function (req, file, cb) {
    // 파일명: timestamp-원본파일명
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB 제한
  fileFilter: function (req, file, cb) {
    // 이미지 파일만 허용
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('이미지 파일만 업로드 가능합니다.'));
  }
});

// 모든 거래 게시글 조회 (GET)
router.get('/', async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM marketplace ORDER BY created_at DESC'
    );
    res.json({ success: true, items });
  } catch (error) {
    console.error('거래글 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '거래글을 불러오는데 실패했습니다.' 
    });
  }
});

// 특정 거래글 조회 (GET)
router.get('/:id', async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM marketplace WHERE id = ?',
      [req.params.id]
    );

    if (items.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '거래글을 찾을 수 없습니다.' 
      });
    }

    res.json({ success: true, item: items[0] });
  } catch (error) {
    console.error('거래글 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '거래글을 불러오는데 실패했습니다.' 
    });
  }
});

// 거래글 작성 (POST) - 이미지 업로드 포함
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { title, content, price } = req.body;

    if (!title || !content || !price) {
      return res.status(400).json({ 
        success: false, 
        message: '제목, 내용, 가격을 모두 입력해주세요.' 
      });
    }

    // 이미지 URL (업로드된 경우)
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO marketplace (title, content, price, image_url, user_id, username) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, price, imageUrl, req.user.userId, req.user.username]
    );

    res.status(201).json({ 
      success: true, 
      message: '거래글이 작성되었습니다.',
      itemId: result.insertId 
    });

  } catch (error) {
    console.error('거래글 작성 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '거래글 작성에 실패했습니다.' 
    });
  }
});

// 거래글 수정 (PUT) - 작성자만 가능
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { title, content, price, status } = req.body;
    const itemId = req.params.id;

    // 거래글 존재 및 작성자 확인
    const [items] = await db.query(
      'SELECT * FROM marketplace WHERE id = ?',
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '거래글을 찾을 수 없습니다.' 
      });
    }

    if (items[0].user_id !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: '본인이 작성한 거래글만 수정할 수 있습니다.' 
      });
    }

    // 이미지 업데이트 (새 이미지가 있는 경우)
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : items[0].image_url;

    // 거래글 수정
    await db.query(
      'UPDATE marketplace SET title = ?, content = ?, price = ?, status = ?, image_url = ? WHERE id = ?',
      [title, content, price, status || 'selling', imageUrl, itemId]
    );

    res.json({ 
      success: true, 
      message: '거래글이 수정되었습니다.' 
    });

  } catch (error) {
    console.error('거래글 수정 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '거래글 수정에 실패했습니다.' 
    });
  }
});

// 거래글 삭제 (DELETE) - 작성자만 가능
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const itemId = req.params.id;

    // 거래글 존재 및 작성자 확인
    const [items] = await db.query(
      'SELECT * FROM marketplace WHERE id = ?',
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '거래글을 찾을 수 없습니다.' 
      });
    }

    if (items[0].user_id !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: '본인이 작성한 거래글만 삭제할 수 있습니다.' 
      });
    }

    // 거래글 삭제
    await db.query('DELETE FROM marketplace WHERE id = ?', [itemId]);

    res.json({ 
      success: true, 
      message: '거래글이 삭제되었습니다.' 
    });

  } catch (error) {
    console.error('거래글 삭제 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '거래글 삭제에 실패했습니다.' 
    });
  }
});

module.exports = router;