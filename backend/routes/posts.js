const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// JWT 검증 미들웨어
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  // 관리자 권한 확인 미들웨어 (verifyToken 다음에 사용)
const verifyAdmin = (req, res, next) => {
  // 토큰 해석본(req.user)에 담긴 role이 admin인지 확인
  if (req.user && req.user.role === 'admin') {
    next(); // 관리자가 맞으면 요청한 라우터로 무사 통과!
  } else {
    res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
  }
};

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

// 이미지 업로드 설정 (최대 5개)
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

// 모든 게시글 조회 (GET)
router.get('/', async (req, res) => {
  try {
    const [posts] = await db.query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    res.json({ success: true, posts });
  } catch (error) {
    console.error('게시글 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글을 불러오는데 실패했습니다.' 
    });
  }
});

// 특정 게시글 조회 (GET) - 이미지 포함
router.get('/:id', async (req, res) => {
  try {
    const [posts] = await db.query(
      'SELECT * FROM posts WHERE id = ?',
      [req.params.id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '게시글을 찾을 수 없습니다.' 
      });
    }

    // 게시글에 연결된 이미지들 조회
    const [images] = await db.query(
      'SELECT * FROM post_images WHERE post_id = ? ORDER BY image_order ASC',
      [req.params.id]
    );

    const post = posts[0];
    post.images = images;

    res.json({ success: true, post });
  } catch (error) {
    console.error('게시글 조회 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글을 불러오는데 실패했습니다.' 
    });
  }
});

// 게시글 작성 (POST) - 다중 이미지 업로드 (최대 5개)
router.post('/', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '제목과 내용을 모두 입력해주세요.' 
      });
    }

    // 게시글 저장
    const [result] = await db.query(
      'INSERT INTO posts (title, content, user_id, username) VALUES (?, ?, ?, ?)',
      [title, content, req.user.userId, req.user.username]
    );

    const postId = result.insertId;

    // 이미지들 저장
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map((file, index) => [
        postId,
        `/uploads/${file.filename}`,
        index
      ]);

      await db.query(
        'INSERT INTO post_images (post_id, image_url, image_order) VALUES ?',
        [imageValues]
      );
    }

    res.status(201).json({ 
      success: true, 
      message: '게시글이 작성되었습니다.',
      postId: postId 
    });

  } catch (error) {
    console.error('게시글 작성 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글 작성에 실패했습니다.' 
    });
  }
});

// 게시글 수정 (PUT) - 작성자만 가능
router.put('/:id', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    const { title, content } = req.body;
    const postId = req.params.id;

    // 게시글 존재 및 작성자 확인
    const [posts] = await db.query(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '게시글을 찾을 수 없습니다.' 
      });
    }

    if (posts[0].user_id !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: '본인이 작성한 게시글만 수정할 수 있습니다.' 
      });
    }

    // 게시글 수정
    await db.query(
      'UPDATE posts SET title = ?, content = ? WHERE id = ?',
      [title, content, postId]
    );

    // 새 이미지가 있으면 기존 이미지 삭제 후 추가
    if (req.files && req.files.length > 0) {
      // 기존 이미지 삭제
      await db.query('DELETE FROM post_images WHERE post_id = ?', [postId]);

      // 새 이미지 저장
      const imageValues = req.files.map((file, index) => [
        postId,
        `/uploads/${file.filename}`,
        index
      ]);

      await db.query(
        'INSERT INTO post_images (post_id, image_url, image_order) VALUES ?',
        [imageValues]
      );
    }

    res.json({ 
      success: true, 
      message: '게시글이 수정되었습니다.' 
    });

  } catch (error) {
    console.error('게시글 수정 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글 수정에 실패했습니다.' 
    });
  }
});

// 게시글 삭제 (DELETE) - 작성자만 가능 (이미지도 함께 삭제됨)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;

    // 게시글 존재 및 작성자 확인
    const [posts] = await db.query(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '게시글을 찾을 수 없습니다.' 
      });
    }

    if (posts[0].user_id !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: '본인이 작성한 게시글만 삭제할 수 있습니다.' 
      });
    }

    // 게시글 삭제 (CASCADE로 이미지도 함께 삭제됨)
    await db.query('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({ 
      success: true, 
      message: '게시글이 삭제되었습니다.' 
    });

  } catch (error) {
    console.error('게시글 삭제 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '게시글 삭제에 실패했습니다.' 
    });
  }
});

module.exports = router;