// 게시글 클래스
class Post {
    constructor(title, content, author) {
        this.id = Date.now();
        this.title = title;
        this.content = content;
        this.author = author;
        this.createdAt = new Date().toLocaleString('ko-KR');
    }
}

// 게시판 관리 클래스
class BoardManager {
    constructor() {
        this.posts = JSON.parse(localStorage.getItem('posts')) || [];
    }

    // 게시글 작성
    createPost(title, content, author) {
        const newPost = new Post(title, content, author);
        this.posts.unshift(newPost);
        this.savePosts();
        return newPost;
    }

    // 게시글 삭제
    deletePost(postId, userId) {
        const post = this.posts.find(p => p.id === postId);
        
        if (post && post.author === userId) {
            this.posts = this.posts.filter(p => p.id !== postId);
            this.savePosts();
            return { success: true };
        }
        
        return { success: false, message: '본인의 글만 삭제할 수 있습니다.' };
    }

    // 전체 게시글 가져오기
    getAllPosts() {
        return this.posts;
    }

    // 게시글 저장
    savePosts() {
        localStorage.setItem('posts', JSON.stringify(this.posts));
    }
}

// 전역 게시판 관리자 인스턴스
const boardManager = new BoardManager();