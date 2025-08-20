// post_detail.js - 레시피 상세보기 모달 관리 (조회수 제거, 단일 이미지)

class PostDetailModal {
    constructor() {
        this.modal = document.getElementById('detailModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.closeBtn = document.getElementById('closeModal');
        this.currentPostData = null;
        
        this.initEventListeners();
    }

    initEventListeners() {
        // 자세히 버튼 클릭 이벤트 (이벤트 위임 사용)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('detail-btn')) {
                const postId = e.target.dataset.postId;
                this.showPostDetail(postId);
            }
        });

        // 모달 닫기 이벤트들
        this.closeBtn.addEventListener('click', () => this.closeModal());
        
        // 백드롭 클릭으로 닫기
        this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    async showPostDetail(postId) {
        if (!postId) {
            console.error('Post ID가 없습니다');
            return;
        }

        // 모달 열기 및 로딩 상태 표시
        this.openModal();
        this.showLoading();

        try {
            // 서버에서 게시물 상세 정보 가져오기
            const response = await fetch(`/api/post/${postId}`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('로그인이 필요합니다');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const post = await response.json();
            this.currentPostData = post;
            
            // 모달에 상세 내용 표시
            this.renderPostDetail(post);
            
        } catch (error) {
            console.error('게시물을 불러오는데 실패했습니다:', error);
            this.showError(error.message || '게시물을 불러오는데 실패했습니다. 다시 시도해주세요.');
        }
    }

    openModal() {
        this.modal.style.display = 'flex';
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.modal.classList.remove('show');
        document.body.style.overflow = 'auto'; // 배경 스크롤 복원
        this.currentPostData = null;
    }

    showLoading() {
        this.modalTitle.textContent = '레시피 상세';
        this.modalBody.innerHTML = '<div class="loading">맛있는 레시피를 불러오는 중...</div>';
    }

    showError(message) {
        this.modalBody.innerHTML = `<div class="error">${message}</div>`;
    }

    renderPostDetail(post) {
        // 모달 제목 설정
        this.modalTitle.textContent = post.title;

        // 상세 내용 HTML 생성
        const detailHTML = this.createDetailHTML(post);
        this.modalBody.innerHTML = detailHTML;

        // 좋아요 버튼 이벤트 바인딩
        const likeBtn = this.modalBody.querySelector('.detail-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleLike(post._id));
        }
    }

    async handleLike(postId) {
        try {
            const response = await fetch(`/api/post/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    alert('로그인이 필요합니다.');
                    window.location.href = '/login';
                    return;
                }
                throw new Error(data.error || '좋아요 처리에 실패했습니다.');
            }
            
            if (data.success) {
                // 모달 내 좋아요 버튼 업데이트
                const likeBtn = this.modalBody.querySelector('.detail-like-btn');
                if (likeBtn) {
                    likeBtn.innerHTML = `❤️ ${data.likes}`;
                    if (data.user_liked) {
                        likeBtn.classList.add('liked');
                    } else {
                        likeBtn.classList.remove('liked');
                    }
                }
                
                // 검색 결과 페이지의 좋아요 버튼들도 업데이트
                const searchPageLikeBtns = document.querySelectorAll(`[data-post-id="${postId}"].like-btn`);
                searchPageLikeBtns.forEach(btn => {
                    btn.innerHTML = `❤️ ${data.likes}`;
                });
                
                // 현재 포스트 데이터 업데이트
                if (this.currentPostData) {
                    this.currentPostData.likes = data.likes;
                    this.currentPostData.user_liked = data.user_liked;
                }
            } else {
                alert(data.error || '좋아요 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('좋아요 처리 오류:', error);
            alert(error.message || '네트워크 오류가 발생했습니다.');
        }
    }

    createDetailHTML(post) {
        const {
            title,
            desc,
            author_name,
            servings,
            time_minutes,
            level,
            category,
            tags = [],
            ingredients = [],
            steps = [],
            likes = 0,
            image_url,
            created_at,
            user_liked = false
        } = post;

        // 날짜 포맷팅
        const createdDate = created_at ? 
            new Date(created_at.$date || created_at).toLocaleDateString('ko-KR') : '';

        // 이미지 HTML 생성 (단일 이미지)
        const imageHTML = image_url ? 
            `<img src="${image_url}" alt="${title}" class="detail-image-auto" onerror="this.style.display='none'">` :
            '<div class="detail-image-auto" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); color: #6c757d; font-size: 48px; height: 280px;">🍽️</div>';

        // 태그 HTML
        const tagsHTML = tags.length > 0 ? 
            `<div class="tags">${tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : '';

        // 재료 리스트 HTML
        const ingredientsHTML = ingredients.length > 0 ?
            `<ul class="ingredients-list">
                ${ingredients.map(ingredient => `<li>${this.escapeHtml(ingredient)}</li>`).join('')}
            </ul>` : '<p style="color: #6c757d; font-style: italic;">재료 정보가 없습니다.</p>';

        // 조리과정 HTML
        const stepsHTML = steps.length > 0 ?
            `<ol class="steps-list">
                ${steps.map((step, index) => `
                    <li class="step-item">
                        <div class="step-number">${index + 1}</div>
                        <div class="step-content">
                            <div class="step-text">${this.escapeHtml(step.text || step)}</div>
                            ${step.min ? `<div class="step-time">${step.min}분</div>` : ''}
                        </div>
                    </li>
                `).join('')}
            </ol>` : '<p style="color: #6c757d; font-style: italic;">조리과정 정보가 없습니다.</p>';

        // 좋아요 버튼 상태 설정
        const likeButtonClass = user_liked ? 'detail-like-btn liked' : 'detail-like-btn';

        return `
            ${imageHTML}
            
            <div class="detail-meta">
                <div class="detail-meta-item">
                    <div class="detail-meta-label">인분</div>
                    <div class="detail-meta-value">${servings || '-'}인분</div>
                </div>
                <div class="detail-meta-item">
                    <div class="detail-meta-label">조리시간</div>
                    <div class="detail-meta-value">${time_minutes || '-'}분</div>
                </div>
                <div class="detail-meta-item">
                    <div class="detail-meta-label">난이도</div>
                    <div class="detail-meta-value">${level || '-'}</div>
                </div>
                <div class="detail-meta-item">
                    <div class="detail-meta-label">분류</div>
                    <div class="detail-meta-value">${category || '-'}</div>
                </div>
            </div>

            ${desc ? `
                <div class="detail-section">
                    <h3>레시피 설명</h3>
                    <div class="detail-description">${this.escapeHtml(desc)}</div>
                </div>
            ` : ''}

            ${tagsHTML ? `
                <div class="detail-section">
                    <h3>태그</h3>
                    ${tagsHTML}
                </div>
            ` : ''}

            <div class="detail-section">
                <h3>재료 (${ingredients.length}개)</h3>
                ${ingredientsHTML}
            </div>

            <div class="detail-section">
                <h3>조리과정 (${steps.length}단계)</h3>
                ${stepsHTML}
            </div>

            <div class="detail-footer">
                <div class="detail-author-info">
                    작성자: <strong>${this.escapeHtml(author_name || '익명')}</strong>
                    ${createdDate ? ` • ${createdDate}` : ''}
                </div>
                <button class="${likeButtonClass}">
                    ❤️ ${likes}
                </button>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}