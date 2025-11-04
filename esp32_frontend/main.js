// UI 업데이트 함수
function updateUI() {
    const headerAuth = document.getElementById('headerAuth');
    const btnWrite = document.getElementById('btnWrite');
    
    if (authManager.isLoggedIn()) {
        headerAuth.innerHTML = `
            <div class="user-info">
                <span>${authManager.currentUser.nickname}님</span>
                <button class="btn-logout" onclick="handleLogout()">로그아웃</button>
            </div>
        `;
        btnWrite.style.display = 'block';
    } else {
        headerAuth.innerHTML = `
            <div class="auth-buttons">
                <button class="btn-login" onclick="openModal('loginModal')">로그인</button>
                <button class="btn-signup" onclick="openModal('signupModal')">회원가입</button>
            </div>
        `;
        btnWrite.style.display = 'none';
    }
    
    renderPosts();
}

// 게시글 렌더링
function renderPosts() {
    const postList = document.getElementById('postList');
    const posts = boardManager.getAllPosts();
    
    if (posts.length === 0) {
        postList.innerHTML = '<div class="empty-state">작성된 게시글이 없습니다.</div>';
        return;
    }
    
    postList.innerHTML = posts.map(post => `
        <div class="post-item">
            <div class="post-title">${post.title}</div>
            <div class="post-meta">작성자: ${post.author} | ${post.createdAt}</div>
            ${authManager.isLoggedIn() && authManager.currentUser.id === post.author ? 
                `<div class="post-actions">
                    <button class="btn-delete" onclick="handleDeletePost(${post.id})">삭제</button>
                </div>` : ''}
        </div>
    `).join('');
}

// 모달 열기/닫기
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
}

// 로그아웃 핸들러
function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        authManager.logout();
        updateUI();
    }
}

// 게시글 삭제 핸들러
function handleDeletePost(postId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        const result = boardManager.deletePost(postId, authManager.currentUser.id);
        if (result.success) {
            updateUI();
        } else {
            alert(result.message);
        }
    }
}

// 로그인 폼 이벤트
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = authManager.login(id, password);
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch('http://localhost:8080/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: id,
                password: password
            })
        });
        // server.js 에서 json 꺼내기
        const result = await response.json();

        if (response.ok) { //server.js 의 res.status(200)

            authManager.currentUser = result.user; 
            localStorage.setItem('currentUser', JSON.stringify(result.user));

            alert(result.message);
            closeModal('loginModal');
            updateUI();
            e.target.reset();
        } else {
            errorDiv.textContent = result.message; //server.js 의 401같은 실패 메세지
            errorDiv.style.display = 'block';
        }
    } catch(err) {
        console.error('로그인 요청 실패', err);
        errorDiv.textContent = '서버에 연결할 수 없습니다.';
        errorDiv.style.display = 'block';
    }
        
    
});

// 회원가입 폼 이벤트
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // 폼의 기본 동작(새로고침) 방지
    
    // 폼에서 값 가져오기
    const id = document.getElementById('signupId').value;
    const password = document.getElementById('signupPassword').value;
    const nickname = document.getElementById('signupNickname').value;
    
    const errorDiv = document.getElementById('signupError');
    
    try {
        // 백엔드 서버로 네트워크 요청 보내기
        const response = await fetch('http://localhost:8080/api/signup', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ // JavaScript 객체를 JSON 문자열로 변환
                username: id,
                password: password,
                nickname: nickname
            })
        });

        // 서버로부터 응답(JSON) 받기
        const result = await response.json();

        // 서버 응답에 따라 결과 처리
        if (response.ok) { // HTTP 상태 코드가 200-299일 때 (성공)
            alert(result.message); // "회원가입이 완료되었습니다!"
            closeModal('signupModal');
            e.target.reset(); // 폼 초기화
        } else { // 서버가 오류를 보냈을 때 (예: 아이디 중복)
            errorDiv.textContent = result.message; // "이미 존재하는 아이디입니다."
            errorDiv.style.display = 'block';
        }
        
    } catch (err) {
        // 네트워크 오류 등 (예: 백엔드 서버가 꺼져있을 때)
        console.error('회원가입 요청 실패:', err);
        errorDiv.textContent = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
        errorDiv.style.display = 'block';
    }
});

// 글쓰기 폼 이벤트
document.getElementById('writeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    
    boardManager.createPost(title, content, authManager.currentUser.id);
    closeModal('writeModal');
    updateUI();
    e.target.reset();
});

// 글쓰기 버튼 이벤트
document.getElementById('btnWrite').addEventListener('click', () => {
    openModal('writeModal');
});

// 페이지 로드 시 UI 초기화
updateUI();