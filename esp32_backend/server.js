const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

//db.js 에서 pool 객체를 가져와 db에 넣기
const db = require('./db.js');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('잘 작동중입니다 ');
});

// 회원가입
app.post('/api/signup', async (req, res) => {

    const { username, password, nickname } = req.body;
    console.log(`회원가입 요청 받음: username=${username}, nickname=${nickname}`);
    
    // 프론트엔드 정보 가져오기
    
    // 비밀번호 암호화하기
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // MySQL DB에 저장하기
    const sql = "INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)";
    
    try {
        // SQL 쿼리 실행
        await db.query(sql, [username, hashedPassword, nickname]);
        
        // 성공 
        res.status(201).json({ success: true, message: '회원가입이 완료되었습니다' });
        
    } catch (err) {
        // 실패 
        console.error('DB 저장 중 오류:', err);
        
        if (err.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ success: false, message: '이미 존재하는 아이디입니다.' });
        }
        
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.post('/api/login', async (req, res) => {

    // 입력한 정보 가져오기
    const { username, password } = req.body;

    console.log(`로그인 요청 받음: username=${username}`);

    // 입력한 username 찾기
    const sql = "SELECT * FROM users WHERE username = ? ";

    try {
        const [users] = await db.query(sql, [username]);
        // 없을때
        if (users.length==0) {
            console.log("로그인 실패: 존재하지 않는 아이디"); //404 - 못찾음
            return res.status(404).json({ sucesss: false, message: '아이디 또는 비밀번호가 잘못되었습니다.'});
        }

        const user = users[0];
        
        // 비교했을 때
        const passwordCorrect = await bcrypt.compare(password, user.password);
        // 틀리면
        if (!passwordCorrect) {
            console.log('비밀번호 틀림'); //401 - 인증 실패(불일치)
            return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.'});
        }

        console.log('로그인 성공',user.username);

        // 응답에 보내는 데이터에 비밀번호 삭제
        const userRes = {
            id: user.id,
            username: user.username,
            nickname: user.nickname 
        };
        // 성공
        res.status(200).json({ success: true, message: '로그인 성공', user: userRes});
        // 오류
    } catch(err) {
        console.log('DB 조회 중 오류: ',err);
        res.status(500).json({ success: false, messgae:'서버 오류가 발생했습니다.'});
    }



});

app.listen(PORT, () => {
    console.log(`백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);

    // 서버 시작 시 DB 연결 테스트
    db.getConnection()
        .then(connection => {
            console.log('MySQL DB 연결 성공');
            connection.release(); 
        })
        .catch(err => {
            console.error('MySQL DB 연결 실패:', err.message);
        });
});