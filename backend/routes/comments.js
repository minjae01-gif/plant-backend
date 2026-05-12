const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

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

// 댓글 계층 구조 만들기
const buildCommentTree = (comments) => {
  const commentMap = {};
  const rootComments = [];

  // 1단계: 모든 댓글을 Map에 저장하고 replies 배열 초기화
  comments.forEach(comment => {
    commentMap[comment.id] = { ...comment, replies: [] };
  });

  // 2단계: 부모-자식 관계 연결
  comments.forEach(comment => {
    if (comment.parent_id) {
      // 대댓글인 경우
      if (commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
      }
    } else {
      // 최상위 댓글인 경우
      rootComments.push(commentMap[comment.id]);
    }
  });

  return rootComments;
};

// 게시글 댓글 조회
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const [comments] = await db.query(
      `SELECT * FROM comments 
       WHERE type = 'post' AND post_id = ? 
       ORDER BY 
         CASE WHEN parent_id IS NULL THEN id ELSE parent_id END ASC,
         parent_id ASC,
         created_at ASC`,
      [req.params.id]
    );
    
    const commentTree = buildCommentTree(comments);
    res.json({ success: true, comments: commentTree });
  } catch (error) {
    console.error('댓글 조회 에러:', error);
    res.status(500).json({ success: false, message: '댓글 조회 실패' });
  }
});

// 게시글 댓글 작성
router.post('/posts/:id/comments', verifyToken, async (req, res) => {
  try {
    const { content, parent_id } = req.body;
    
    console.log('=== 댓글 작성 요청 ===');
    console.log('user:', req.user);
    console.log('content:', content);
    console.log('parent_id:', parent_id);
    
    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: '댓글 내용을 입력해주세요.' 
      });
    }

    await db.query(
      `INSERT INTO comments (type, post_id, parent_id, user_id, username, content) 
       VALUES ('post', ?, ?, ?, ?, ?)`,
      [req.params.id, parent_id || null, req.user.userId, req.user.username, content]
    );

    res.status(201).json({ success: true, message: '댓글이 작성되었습니다.' });
  } catch (error) {
    console.error('댓글 작성 에러:', error);
    res.status(500).json({ success: false, message: '댓글 작성 실패' });
  }
});

// 게시글 댓글 삭제
router.delete('/posts/:postId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const [comments] = await db.query(
      `SELECT * FROM comments WHERE id = ? AND type = 'post'`,
      [req.params.commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
    }

    if (comments[0].user_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: '본인이 작성한 댓글만 삭제할 수 있습니다.' });
    }

    // 대댓글도 함께 삭제
    await db.query('DELETE FROM comments WHERE id = ? OR parent_id = ?', [req.params.commentId, req.params.commentId]);
    res.json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 에러:', error);
    res.status(500).json({ success: false, message: '댓글 삭제 실패' });
  }
});

// 거래글 댓글 조회
router.get('/marketplace/:id/comments', async (req, res) => {
  try {
    const [comments] = await db.query(
      `SELECT * FROM comments 
       WHERE type = 'marketplace' AND item_id = ? 
       ORDER BY 
         CASE WHEN parent_id IS NULL THEN id ELSE parent_id END ASC,
         parent_id ASC,
         created_at ASC`,
      [req.params.id]
    );
    
    const commentTree = buildCommentTree(comments);
    res.json({ success: true, comments: commentTree });
  } catch (error) {
    console.error('댓글 조회 에러:', error);
    res.status(500).json({ success: false, message: '댓글 조회 실패' });
  }
});

// 거래글 댓글 작성
router.post('/marketplace/:id/comments', verifyToken, async (req, res) => {
  try {
    const { content, parent_id } = req.body;
    
    console.log('=== 거래글 댓글 작성 요청 ===');
    console.log('user:', req.user);
    console.log('content:', content);
    console.log('parent_id:', parent_id);
    
    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: '댓글 내용을 입력해주세요.' 
      });
    }

    await db.query(
      `INSERT INTO comments (type, item_id, parent_id, user_id, username, content) 
       VALUES ('marketplace', ?, ?, ?, ?, ?)`,
      [req.params.id, parent_id || null, req.user.userId, req.user.username, content]
    );

    res.status(201).json({ success: true, message: '댓글이 작성되었습니다.' });
  } catch (error) {
    console.error('댓글 작성 에러:', error);
    res.status(500).json({ success: false, message: '댓글 작성 실패' });
  }
});

// 거래글 댓글 삭제
router.delete('/marketplace/:itemId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const [comments] = await db.query(
      `SELECT * FROM comments WHERE id = ? AND type = 'marketplace'`,
      [req.params.commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
    }

    if (comments[0].user_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: '본인이 작성한 댓글만 삭제할 수 있습니다.' });
    }

    // 대댓글도 함께 삭제
    await db.query('DELETE FROM comments WHERE id = ? OR parent_id = ?', [req.params.commentId, req.params.commentId]);
    res.json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 에러:', error);
    res.status(500).json({ success: false, message: '댓글 삭제 실패' });
  }
});

module.exports = router;