const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//메일 전송 설정 (env 파일에서 이메일 계정과 비밀번호를 불러와서 설정)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 회원가입 API
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 입력값 검증
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '모든 필드를 입력해주세요.' 
      });
    }

    // 이메일 중복 체크
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '이미 존재하는 이메일 또는 사용자명입니다.' 
      });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 데이터베이스에 사용자 저장
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ 
      success: true, 
      message: '회원가입이 완료되었습니다!',
      userId: result.insertId 
    });

  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 로그인 API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '이메일과 비밀번호를 입력해주세요.' 
      });
    }

    // 사용자 찾기
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '이메일 또는 비밀번호가 잘못되었습니다.' 
      });
    }

    const user = users[0];

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '이메일 또는 비밀번호가 잘못되었습니다.' 
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: '로그인 성공!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 구글 소셜 로그인 API

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // 구글 서버에 이 토큰이 진짜인지 확인 요청
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload; // 구글에서 이메일과 이름을 뽑아옴

    // 우리 DB에 가입된 이메일인지 확인
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    let user = users[0];

    // 가입되지 않은 유저라면 자동으로 회원가입 처리
    if (!user) {
      // 구글 로그인은 비밀번호가 필요 없지만, DB 구조상 임의의 아주 복잡한 비밀번호를 생성해서 넣어둠
      const dummyPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      let newUsername = name || email.split('@')[0]; // 이름이 없으면 이메일 앞자리 사용

      // 닉네임 중복 방지 (간단하게 뒤에 난수 추가)
      const [existingName] = await db.query('SELECT * FROM users WHERE username = ?', [newUsername]);
      if (existingName.length > 0) {
        newUsername = newUsername + Math.floor(Math.random() * 1000);
      }

      const [result] = await db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [newUsername, email, dummyPassword]
      );
      
      user = { id: result.insertId, username: newUsername, email, role: 'user' };
    }

    // 로그인 성공 처리 (우리 사이트 전용 JWT 토큰 발급)
  const token = jwt.sign(
  {
    userId: user.id || user.insertId,
    username: user.username,
    email: user.email,
    role: user.role || 'user'
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, username: user.username, email: user.email, role: user.role || 'user' } 
    });

  } catch (error) {
    console.error('구글 로그인 에러:', error);
    res.status(500).json({ success: false, message: '구글 로그인 처리에 실패했습니다.' });
  }
});

// 토큰 검증 미들웨어 (로그인 상태 확인용)
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

// 로그인 상태 확인 API
router.get('/verify', verifyToken, (req, res) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
});

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      ' SELECT id, username, email , role, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );
  
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('프로필 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/** 비밀번호 변경 API  */
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.'
      });
    }

    // 1. 현재 사용자 정보(비밀번호) 가져오기
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 2. 현재 비밀번호 일치 여부 확인
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 일치하지 않습니다.'
      });
    }

    // 3. 새 비밀번호 암호화 및 업데이트
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.'
    });
  }
});


// 인증번호 이메일 발송 API
// [POST] 인증번호 발송 (회원가입 & 비밀번호 재설정 공용)
// [POST] 인증번호 발송 (회원가입 & 비밀번호 재설정 공용)
router.post('/send-code', async (req, res) => {
  const { email, type } = req.body; // 프론트에서 { email, type: 'reset' } 식으로 보냄

  try {
    // 1. 공통 이메일 체크
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    // [회원가입 시] 이미 존재하면 에러
    if (type === 'signup' && users.length > 0) {
      return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
    }

    // [비밀번호 재설정 시] 가입된 유저가 없으면 에러
    if (type === 'reset' && users.length === 0) {
      return res.status(400).json({ success: false, message: '가입되지 않은 이메일입니다.' });
    }

    // 2. 인증번호 생성 (6자리 숫자)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. 이메일 발송 설정 (Nodemailer)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `[식물 커뮤니티] ${type === 'reset' ? '비밀번호 재설정' : '회원가입'} 인증번호`,
      text: `인증번호는 [${code}] 입니다. 화면에 입력해주세요.`,
    };

    // 4. 실제로 메일 보내기
    await transporter.sendMail(mailOptions);

    // 5. DB에 인증번호 저장 (기존에 쓰던 테이블/로직에 맞춰서)
    // 예: verification_codes 테이블이 있다면 아래처럼 저장
    await db.query(
      'INSERT INTO verification_codes (email, code) VALUES (?, ?) ON DUPLICATE KEY UPDATE code = ?, created_at = NOW()',
      [email, code, code]
    );

    console.log(`[${type}] 인증번호 발송 완료: ${email} -> ${code}`);
    res.json({ success: true, message: '인증번호가 발송되었습니다.' });

  } catch (error) {
    // ❌ 에러가 나던 catch 부분
    console.error('인증번호 발송 에러:', error);
    res.status(500).json({ 
      success: false, 
      message: '메일 발송 중 서버 에러가 발생했습니다.',
      error: error.message 
    });
  }
});

// [POST] 인증번호 확인
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    // 1. DB에서 해당 이메일의 가장 최근 인증번호 가져오기
    const [rows] = await db.query(
      'SELECT code FROM verification_codes WHERE email = ?', 
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: '인증 요청 기록이 없습니다.' });
    }

    const savedCode = rows[0].code;

    // 2. 입력받은 코드와 DB의 코드 대조 (공백 제거 후 비교)
    if (savedCode === code.toString().trim()) {
      // 인증 성공 시 해당 데이터 삭제 (선택 사항: 보안상 사용 후 즉시 삭제가 좋음)
      // await db.query('DELETE FROM verification_codes WHERE email = ?', [email]);
      
      res.json({ success: true, message: '인증에 성공했습니다.' });
    } else {
      res.status(400).json({ success: false, message: '인증번호가 일치하지 않습니다.' });
    }
  } catch (error) {
    console.error('인증번호 확인 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// [POST] 비밀번호 재설정 (인증번호 검증 후 호출)
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: '이메일과 새 비밀번호를 입력해주세요.' });
    }

    // 새 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // DB 업데이트
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '해당 이메일의 사용자를 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// [PUT] 내 정보 수정 (닉네임 변경)
router.put('/update-profile', verifyToken, async (req, res) => {
  const { username } = req.body;
  const userId = req.user.userId;

  try {
    if (!username) {
      return res.status(400).json({ success: false, message: '닉네임을 입력해주세요.' });
    }

    // 닉네임 중복 체크 (본인 제외)
    const [existing] = await db.query(
      'SELECT * FROM users WHERE username = ? AND id != ?',
      [username, userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '이미 사용 중인 닉네임입니다.' });
    }

    await db.query('UPDATE users SET username = ? WHERE id = ?', [username, userId]);

    res.json({ success: true, message: '정보가 수정되었습니다.', username });
  } catch (error) {
    console.error('정보 수정 에러:', error);
    res.status(500).json({ success: false, message: '정보 수정 실패' });
  }
});
module.exports = { router, verifyToken };