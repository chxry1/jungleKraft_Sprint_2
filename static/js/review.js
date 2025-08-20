// static/js/review.js - 수정된 리뷰 시스템
class ReviewSystem {
    constructor() {
        this.currentPostId = null;
        this.myReview = null;
        this.currentContainer = null; // 현재 컨테이너 참조 저장
        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('star')) {
                this.handleStarClick(e.target);
            }
            
            if (e.target.classList.contains('submit-review-btn')) {
                this.submitReview();
            }
            
            if (e.target.classList.contains('delete-review-btn')) {
                const reviewId = e.target.dataset.reviewId;
                this.deleteReview(reviewId);
            }
        });
    }

    async renderReviewSection(postId, container) {
        this.currentPostId = postId;
        this.currentContainer = container; // 컨테이너 참조 저장
        
        try {
            const [reviewsData, myReviewData] = await Promise.all([
                fetch(`/api/review/${postId}`).then(r => r.json()),
                fetch(`/api/my-review/${postId}`).then(r => r.json())
            ]);
            
            this.myReview = myReviewData.my_review;
            
            const reviewHTML = this.generateReviewHTML(reviewsData, myReviewData.my_review);
            container.innerHTML = reviewHTML;
            
            if (this.myReview) {
                // 약간의 지연 후 별점 설정 (DOM이 완전히 렌더링된 후)
                setTimeout(() => {
                    this.setStarRating(this.myReview.rating);
                }, 100);
            }
            
        } catch (error) {
            console.error('리뷰 로드 오류:', error);
            container.innerHTML = '<div class="error">리뷰를 불러올 수 없습니다.</div>';
        }
    }

    generateReviewHTML(reviewsData, myReview) {
        const { reviews, stats } = reviewsData;
        
        return `
            <div class="review-section">
                <div class="review-header">
                    <h3>리뷰 (${stats.total_reviews})</h3>
                    <div class="rating-summary">
                        ${stats.avg_rating > 0 ? `
                            <div class="avg-rating">
                                <span class="rating-number">${stats.avg_rating}</span>
                                <div class="stars-display">${this.generateStarsDisplay(stats.avg_rating)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="review-form">
                    <h4>${myReview ? '내 리뷰 수정' : '리뷰 작성하기'}</h4>
                    <div class="star-rating">
                        ${[1, 2, 3, 4, 5].map(i => 
                            `<span class="star" data-rating="${i}">☆</span>`
                        ).join('')}
                    </div>
                    <textarea 
                        id="reviewComment" 
                        placeholder="이 레시피는 어떠셨나요? (선택사항, 500자 이내)"
                        maxlength="500"
                        rows="3"
                    >${myReview ? myReview.comment : ''}</textarea>
                    <div class="form-actions">
                        <button class="submit-review-btn">${myReview ? '수정하기' : '리뷰 등록'}</button>
                        ${myReview ? `<button class="delete-review-btn" data-review-id="${myReview.id}">삭제</button>` : ''}
                    </div>
                </div>

                <div class="reviews-list">
                    ${reviews.length > 0 ? reviews.map(review => `
                        <div class="review-item">
                            <div class="review-header-item">
                                <div class="reviewer-info">
                                    <span class="reviewer-name">${review.user_name}</span>
                                    <div class="review-rating">${this.generateStarsDisplay(review.rating)}</div>
                                </div>
                                <span class="review-date">${review.created_at}</span>
                            </div>
                            ${review.comment ? `<div class="review-comment">${this.escapeHtml(review.comment)}</div>` : ''}
                            ${review.is_updated ? '<div class="review-updated">수정됨</div>' : ''}
                        </div>
                    `).join('') : '<div class="no-reviews">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</div>'}
                </div>
            </div>
        `;
    }

    generateStarsDisplay(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<span class="star filled">★</span>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '<span class="star half">★</span>';
            } else {
                stars += '<span class="star empty">☆</span>';
            }
        }
        
        return stars;
    }

    handleStarClick(starElement) {
        const rating = parseInt(starElement.dataset.rating);
        this.setStarRating(rating);
    }

    setStarRating(rating) {
        const stars = document.querySelectorAll('.star-rating .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('selected');
                star.textContent = '★';
            } else {
                star.classList.remove('selected');
                star.textContent = '☆';
            }
        });
    }

    async submitReview() {
        const selectedStars = document.querySelectorAll('.star-rating .star.selected');
        const rating = selectedStars.length;
        const comment = document.getElementById('reviewComment').value.trim();
        
        if (rating === 0) {
            alert('별점을 선택해주세요.');
            return;
        }
        
        try {
            const response = await fetch('/api/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    post_id: this.currentPostId,
                    rating: rating,
                    comment: comment
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                alert(data.message);
                // 저장된 컨테이너 참조를 사용하여 새로고침
                if (this.currentContainer) {
                    await this.renderReviewSection(this.currentPostId, this.currentContainer);
                }
            } else {
                alert(data.error || '리뷰 등록에 실패했습니다.');
            }
            
        } catch (error) {
            console.error('리뷰 등록 오류:', error);
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('리뷰를 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/review/${reviewId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                alert(data.message);
                // 저장된 컨테이너 참조를 사용하여 새로고침
                if (this.currentContainer) {
                    await this.renderReviewSection(this.currentPostId, this.currentContainer);
                }
            } else {
                alert(data.error || '리뷰 삭제에 실패했습니다.');
            }
            
        } catch (error) {
            console.error('리뷰 삭제 오류:', error);
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.reviewSystem = new ReviewSystem();