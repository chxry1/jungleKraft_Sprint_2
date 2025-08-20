// static/js/post_detail.js - 레시피 상세보기 모달 관리 (리뷰 시스템 통합)

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
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('detail-btn')) {
                const postId = e.target.dataset.postId;
                this.showPostDetail(postId);
            }
        });

        this.closeBtn.addEventListener('click', () => this.closeModal());
        
        this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
        
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

        this.openModal();
        this.showLoading();

        try {
            const response = await fetch(`/api/post/${postId}`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('로그인이 필요합니다');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const post = await response.json();
            this.currentPostData = post;
            
            this.renderPostDetail(post);
            
        } catch (error) {
            console.error('게시물을 불러오는데 실패했습니다:', error);
            this.showError(error.message || '게시물을 불러오는데 실패했습니다. 다시 시도해주세요.');
        }
    }

    openModal() {
        this.modal.style.display = 'flex';
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.modal.classList.remove('show');
        document.body.style.overflow = 'auto';
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
        this.modalTitle.textContent = post.title;

        const detailHTML = this.createDetailHTML(post);
        this.modalBody.innerHTML = detailHTML;

        const likeBtn = this.modalBody.querySelector('.detail-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleLike(post._id));
        }

        // 리뷰 섹션 렌더링
        const reviewSection = this.modalBody.querySelector('#reviewSection');
        if (reviewSection && window.reviewSystem) {
            window.reviewSystem.renderReviewSection(post._id, reviewSection);
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
                const likeBtn = this.modalBody.querySelector('.detail-like-btn');
                if (likeBtn) {
                    likeBtn.innerHTML = `❤️ ${data.likes}`;
                    if (data.user_liked) {
                        likeBtn.classList.add('liked');
                    } else {
                        likeBtn.classList.remove('liked');
                    }
                }
                
                const searchPageLikeBtns = document.querySelectorAll(`[data-post-id="${postId}"].like-btn`);
                searchPageLikeBtns.forEach(btn => {
                    btn.innerHTML = `❤️ ${data.likes}`;
                });
                
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
            user_liked = false,
            avg_rating = 0,
            review_count = 0
        } = post;

        const createdDate = created_at ? 
            new Date(created_at.$date || created_at).toLocaleDateString('ko-KR') : '';

        const imageHTML = image_url ? 
            `<img src="${image_url}" alt="${title}" class="detail-image-auto" onerror="this.style.display='none'">` :
            '<div class="detail-image-auto" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); color: #6c757d; font-size: 48px; height: 280px;">🍽️</div>';

        const tagsHTML = tags.length > 0 ? 
            `<div class="tags">${tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : '';

        const ingredientsHTML = ingredients.length > 0 ?
            `<ul class="ingredients-list">
                ${ingredients.map(ingredient => `<li>${this.escapeHtml(ingredient)}</li>`).join('')}
            </ul>` : '<p style="color: #6c757d; font-style: italic;">재료 정보가 없습니다.</p>';

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
                ${avg_rating > 0 ? `
                <div class="detail-meta-item">
                    <div class="detail-meta-label">평점</div>
                    <div class="detail-meta-value">⭐ ${avg_rating} (${review_count}개)</div>
                </div>
                ` : ''}
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

            <!-- 리뷰 섹션 추가 -->
            <div class="detail-section">
                <div id="reviewSection"></div>
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