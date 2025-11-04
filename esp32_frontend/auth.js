// 사용자 클래스
class User {
    constructor(id, password, nickname) {
        this.id = id;
        this.password = password;
        this.nickname = nickname;
    }
}

// 인증 관리 클래스
class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    // 회원가입
    signup(id, password, nickname) {
        if (this.users.find(u => u.id === id)) {
            return { success: false, message: '이미 존재하는 아이디입니다.' };
        }
        
        const newUser = new User(id, password, nickname);
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        return { success: true, message: '회원가입이 완료되었습니다!' };
    }

    // 로그인
    login(id, password) {
        const user = this.users.find(u => u.id === id && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        }
        
        return { success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' };
    }

    // 로그아웃
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // 로그인 상태 확인
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// 전역 인증 관리자 인스턴스
const authManager = new AuthManager();