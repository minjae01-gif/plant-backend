const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// 토큰 검증
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ success: false, message: '토큰 없음' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '유효하지 않은 토큰' });
  }
};

// 1. 거래 요청 보내기 (POST /api/trade/request)
router.post('/request', verifyToken, async (req, res) => {
  try {
    const { itemId, sellerId } = req.body;
    const buyerId = req.user.userId;

    // 자기가 자기한테 요청 불가
    if (buyerId === Number(sellerId)) {
      return res.status(400).json({ success: false, message: '본인 상품입니다.' });
    }

    // 중복 요청 방지
    const [existing] = await db.query(
      'SELECT * FROM trade_requests WHERE item_id = ? AND buyer_id = ?',
      [itemId, buyerId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: '이미 요청을 보낸 상품입니다.' });
    }

    // DB 저장
    await db.query(
      'INSERT INTO trade_requests (item_id, buyer_id, seller_id) VALUES (?, ?, ?)',
      [itemId, buyerId, sellerId]
    );

    res.json({ success: true, message: '거래 요청 완료!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 에러' });
  }
});

// 2. 받은 요청 목록 보기 (GET /api/trade/received)
router.get('/received', verifyToken, async (req, res) => {
  try {
    // 내가 판매자인 요청들 조회
    const [requests] = await db.query(`
      SELECT 
        tr.id, tr.status, tr.created_at,
        m.id AS item_id,
        m.title AS item_title,
        u.username AS buyer_name
      FROM trade_requests tr
      JOIN marketplace m ON tr.item_id = m.id
      JOIN users u ON tr.buyer_id = u.id
      WHERE tr.seller_id = ?
      ORDER BY tr.created_at DESC
    `, [req.user.userId]);

    res.json({ success: true, requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

module.exports = router;