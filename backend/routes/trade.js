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

    const [items] = await db.query(
      'SELECT status FROM marketplace WHERE id = ?',
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    // 판매 중(selling) 상태가 아닐 경우 요청 거부
    if (items[0].status !== 'selling') {
      return res.status(400).json({ 
        success: false, 
        message: '현재 거래가 가능하지 않은 상품입니다. (예약 중 또는 판매 완료)' 
      });
    }

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
      console.log("⚠️ 중복 요청 감지됨 -> 409 전송"); // 서버 콘솔 로그 추가
      return res.status(409).json({ success: false, message: '이미 구매 요청 했습니다.' });
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

// 거래 요청 수락 (PATCH /api/trade/accept/:requestId)
router.patch('/accept/:requestId', verifyToken, async (req, res) => {
  let conn;
  try {
    const { requestId } = req.params; // 라우트 파라미터에서 ID 가져오기
    const sellerId = req.user.userId; // 현재 로그인한 유저(판매자) ID

    // 1. DB 커넥션 가져오기 및 트랜잭션 시작
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 2. 해당 거래 요청이 존재하는지, 그리고 판매자가 본인이 맞는지 확인
    const [requests] = await conn.query(
      'SELECT item_id, status FROM trade_requests WHERE id = ? AND seller_id = ?',
      [requestId, sellerId]
    );

    // 요청이 없거나 판매자가 일치하지 않는 경우
    if (requests.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: '거래 요청을 찾을 수 없거나 권한이 없습니다.' });
    }

    const request = requests[0];

    // 이미 수락되었거나 거절된 요청인지 확인
    if (request.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: '이미 처리된 요청입니다.' });
    }

    // 3. 거래 요청 상태를 'accepted'로 업데이트
    await conn.query(
      'UPDATE trade_requests SET status = ? WHERE id = ?',
      ['accepted', requestId]
    );

    // 4. 연관된 게시글(marketplace)의 상태를 'reserved'로 업데이트
    await conn.query(
      'UPDATE marketplace SET status = ? WHERE id = ?',
      ['reserved', request.item_id]
    );

    // 5. 모든 작업이 성공하면 DB에 최종 반영
    await conn.commit();
    
    res.json({ 
      success: true, 
      message: '거래를 수락했습니다. 상품 상태가 예약 중으로 변경되었습니다.' 
    });

  } catch (error) {
    // 오류 발생 시 모든 작업을 취소하고 원래대로 되돌림
    if (conn) await conn.rollback();
    console.error('거래 수락 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  } finally {
    // 작업이 끝나면 반드시 커넥션을 반환
    if (conn) conn.release();
  }
});

// 거래 거절 API
router.patch('/reject/:requestId', verifyToken, async (req, res) => {
  const { requestId } = req.params;
  const sellerId = req.user.userId; // 토큰에서 가져온 판매자 ID

  try {
    // 본인의 상품에 들어온 요청만 거절할 수 있어야 하니까 seller_id 
    const [result] = await db.query(
      'UPDATE trade_requests SET status = "rejected" WHERE id = ? AND seller_id = ?',
      [requestId, sellerId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ success: false, message: '거절 권한이 없거나 요청을 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '거래 요청을 거절했습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 거래 완료 처리 (PATCH /api/trade/complete/:requestId)
router.patch('/complete/:requestId', verifyToken, async (req, res) => {
  let conn;
  try {
    const { requestId } = req.params;
    const sellerId = req.user.userId;

    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. 판매자 권한 및 현재 상태 확인
    const [requests] = await conn.query(
      'SELECT item_id, status FROM trade_requests WHERE id = ? AND seller_id = ?',
      [requestId, sellerId]
    );

    if (requests.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: '요청을 찾을 수 없습니다.' });
    }

    const request = requests[0];
    if (request.status !== 'accepted') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: '수락된 거래만 완료 처리할 수 있습니다.' });
    }

    // 2. 거래 요청 상태를 'completed'로 업데이트
    await conn.query(
      'UPDATE trade_requests SET status = ? WHERE id = ?',
      ['completed', requestId]
    );

    // 3. 게시글 상태를 'sold'로 업데이트
    await conn.query(
      'UPDATE marketplace SET status = ? WHERE id = ?',
      ['sold', request.item_id]
    );

    await conn.commit();
    res.json({ success: true, message: '거래가 성공적으로 완료되었습니다.' });

  } catch (error) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, message: '서버 오류' });
  } finally {
    if (conn) conn.release();
  }
});

// 내가 보낸 거래 요청 목록 (구매자 입장)
router.get('/my-requests', verifyToken, async (req, res) => {
  const buyerId = req.user.userId;

  try {
    const [requests] = await db.query(`
      SELECT 
        tr.*, 
        m.title as item_title, 
        u.username as seller_name
      FROM trade_requests tr
      JOIN marketplace m ON tr.item_id = m.id
      JOIN users u ON tr.seller_id = u.id
      WHERE tr.buyer_id = ?
      ORDER BY tr.created_at DESC
    `, [buyerId]);

    res.json({ success: true, requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '목록 조회 실패' });
  }
});

router.get('/sent', verifyToken, async (req, res) => {
  const buyerId = req.user.userId; // 로그인한 내 아이디

  try {
    const [requests] = await db.query(`
      SELECT 
        tr.*, 
        m.title as item_title, 
        u.username as seller_name
      FROM trade_requests tr
      JOIN marketplace m ON tr.item_id = m.id
      JOIN users u ON tr.seller_id = u.id
      WHERE tr.buyer_id = ?
      ORDER BY tr.created_at DESC
    `, [buyerId]);

    res.json({ success: true, requests });
  } catch (error) {
    console.error('보낸 요청 조회 에러:', error);
    res.status(500).json({ success: false, message: '목록 조회 실패' });
  }
});

module.exports = router;