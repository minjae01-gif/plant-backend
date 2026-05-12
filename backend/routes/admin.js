// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// 🛡️ 관리자 권한 확인 미들웨어
const verifyAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ success: false, message: '토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};

// [GET] 전체 사용자 목록 조회 API
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    // 비밀번호를 제외한 사용자 정보 조회
    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users });
  } catch (error) {
    console.error('사용자 목록 조회 에러:', error);
    res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
  }
});

// [GET] 관리자용 전체 게시글 목록 조회
router.get('/posts', verifyAdmin, async (req, res) => {
  try {
    // 작성자 이름을 함께 가져오기 위해 users 테이블과 JOIN 합니다.
    const [posts] = await db.query(`
      SELECT p.id, p.title, u.username, p.created_at 
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: '게시글 로드 실패' });
  }
});

// [GET] 관리자용 전체 마켓 상품 조회
router.get('/marketplace', verifyAdmin, async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT m.id, m.title, u.username, m.price, m.status, m.created_at 
      FROM marketplace m 
      JOIN users u ON m.user_id = u.id 
      ORDER BY m.created_at DESC
    `);
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: '마켓 데이터 로드 실패' });
  }
});

// [DELETE] 관리자 권한으로 게시글 강제 삭제
router.delete('/posts/:id', verifyAdmin, async (req, res) => {
  try {
    const postId = req.params.id;
    // 관리자는 본인 확인 없이 바로 DB에서 삭제!
    await db.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ success: true, message: '게시글이 강제 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '삭제 중 에러 발생' });
  }
});

// [DELETE] 관리자 권한으로 마켓 상품 강제 삭제
router.delete('/marketplace/:id', verifyAdmin, async (req, res) => {
  try {
    const itemId = req.params.id;
    await db.query('DELETE FROM marketplace WHERE id = ?', [itemId]);
    res.json({ success: true, message: '상품 정보가 강제 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '삭제 중 에러 발생' });
  }
});
module.exports = router;