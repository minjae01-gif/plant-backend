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
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = authManager.login(id, password);
    
    if (result.success) {
        closeModal('loginModal');
        updateUI();
        e.target.reset();
    } else {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
    }
});

// 회원가입 폼 이벤트
document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('signupId').value;
    const password = document.getElementById('signupPassword').value;
    const nickname = document.getElementById('signupNickname').value;
    
    const result = authManager.signup(id, password, nickname);
    
    if (result.success) {
        alert(result.message);
        closeModal('signupModal');
        e.target.reset();
    } else {
        const errorDiv = document.getElementById('signupError');
        errorDiv.textContent = result.message;
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