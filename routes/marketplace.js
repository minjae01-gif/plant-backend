const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
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

// 이미지 업로드 설정 (최대 10개)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB 제한
  fileFilter: function (req, file, cb) {
    console.log('파일 업로드 시도:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });

    // mimetype 체크
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    
    // 확장자로 한번 더 체크
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
      return cb(null, true);
    }
    
    console.error('이미지가 아닌 파일:', file);
    cb(new Error('이미지 파일만 업로드 가능합니다.'));
  }
});

// 모든 거래글 조회 (GET) - 첫 번째 이미지만 썸네일로
router.get('/', async (req, res) => {
  try {
    const [items] = await db.query(
      'SELECT * FROM marketplace ORDER BY created_at DESC'
    );

    // 각 거래글의 첫 번째 이미지 가져오기
    for (let item of items) {
      const [images] = await db.query(
        'SELECT image_url FROM marketplace_images WHERE item_id = ? ORDER BY image_order ASC LIMIT 1',
        [item.id]
      );
      item.image_url = images.length > 0 ? images[0].image_url : null;
    }

    res.json({ success: true, items });
  } catch (error) {
    console.error('거래글 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '거래글을 불러오는데 실패했습니다.' 
    });
  }
});


// 1. 내가 올린 상품만 조회 (GET /api/marketplace/my-items)
router.get('/my-items', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId; // 토큰에서 내 ID 추출
    const [items] = await db.query(
      'SELECT * FROM marketplace WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 2. 상품 상태 수동 변경 (PATCH /api/marketplace/:id/status)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    // 권한 확인 (내 글이 맞는지)
    const [item] = await db.query('SELECT user_id, status FROM marketplace WHERE id = ?', [id]);
    if (item.length === 0) return res.status(404).json({ message: '상품 없음' });
    if (item[0].user_id !== userId) return res.status(403).json({ message: '권한 없음' });

    // [구상 4번 반영] 이미 판매완료(sold)라면 변경 불가
    if (item[0].status === 'sold') {
      return res.status(400).json({ success: false, message: '판매 완료된 상품은 상태를 변경할 수 없습니다.' });
    }

    await db.query('UPDATE marketplace SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `상태가 ${status}로 변경되었습니다.` });
  } catch (error) {
    res.status(500).json({ success: false, message: '변경 실패' });
  }
});


// 특정 거래글 조회 (GET) - 모든 이미지 포함
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

    // 거래글에 연결된 모든 이미지 조회
    const [images] = await db.query(
      'SELECT * FROM marketplace_images WHERE item_id = ? ORDER BY image_order ASC',
      [req.params.id]
    );

    const item = items[0];
    item.images = images;

    res.json({ success: true, item });
  } catch (error) {
    console.error('거래글 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '거래글을 불러오는데 실패했습니다.' 
    });
  }
});

// 거래글 작성 (POST) - 다중 이미지 업로드 (최대 10개)
router.post('/', verifyToken, upload.array('images', 10), async (req, res) => {
  try {
    const { title, content, price, status } = req.body;

    if (!title || !content || !price) {
      return res.status(400).json({ 
        success: false, 
        message: '제목, 내용, 가격을 모두 입력해주세요.' 
      });
    }

    // 거래글 저장
    const [result] = await db.query(
      'INSERT INTO marketplace (title, content, price, status, user_id, username) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, price, status || 'selling', req.user.userId, req.user.username]
    );

    const itemId = result.insertId;

    // 이미지들 저장
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map((file, index) => [
        itemId,
        `/uploads/${file.filename}`,
        index
      ]);

      await db.query(
        'INSERT INTO marketplace_images (item_id, image_url, image_order) VALUES ?',
        [imageValues]
      );
    }

    res.status(201).json({ 
      success: true, 
      message: '거래글이 작성되었습니다.',
      itemId: itemId 
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
router.put('/:id', verifyToken, upload.array('images', 10), async (req, res) => {
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

    // 거래글 수정
    await db.query(
      'UPDATE marketplace SET title = ?, content = ?, price = ?, status = ? WHERE id = ?',
      [title, content, price, status, itemId]
    );

    // 새 이미지가 있으면 기존 이미지 삭제 후 추가
    if (req.files && req.files.length > 0) {
      // 기존 이미지 삭제
      await db.query('DELETE FROM marketplace_images WHERE item_id = ?', [itemId]);

      // 새 이미지 저장
      const imageValues = req.files.map((file, index) => [
        itemId,
        `/uploads/${file.filename}`,
        index
      ]);

      await db.query(
        'INSERT INTO marketplace_images (item_id, image_url, image_order) VALUES ?',
        [imageValues]
      );
    }

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

// 거래글 삭제 (DELETE) - 작성자만 가능 (이미지도 함께 삭제됨)
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

    // 거래글 삭제 (CASCADE로 이미지도 함께 삭제됨)
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
