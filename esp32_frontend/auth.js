class AuthManager {
    constructor() {
        // [삭제] 모든 사용자 목록(this.users) 관리는 서버가 담당
        
        // [유지] 현재 로그인한 사용자 정보만 클라이언트(브라우저)가 기억
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    //  signup() -> 서버(/api/signup)
    //  login() -> 서버(/api/login)

    // [유지] 로그아웃 (클라이언트 측 localStorage 삭제)
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // [유지] 로그인 상태 확인 (클라이언트 UI 표시에 필요)
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// [유지] main.js가 사용할 전역 인증 관리자 인스턴스
const authManager = new AuthManager();