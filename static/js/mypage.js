// mypage.js - 마이페이지 기능 (클릭 이동 제거)
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const myRecipesList = document.getElementById('myRecipesList');
    const likedRecipesList = document.getElementById('likedRecipesList');

    let myRecipesLoaded = false;
    let likedRecipesLoaded = false;

    // 탭 전환 이벤트
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // 활성 탭 변경
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 탭 패널 전환
            tabPanels.forEach(panel => panel.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
            
            // 데이터 로드
            if (targetTab === 'my-recipes' && !myRecipesLoaded) {
                loadMyRecipes();
            } else if (targetTab === 'liked-recipes' && !likedRecipesLoaded) {
                loadLikedRecipes();
            }
        });
    });

    // 초기 로드 - 내 레시피
    loadMyRecipes();

    // 내 레시피 로드
    async function loadMyRecipes() {
        try {
            const response = await fetch('/api/my-recipes');
            const data = await response.json();
            
            if (data.success) {
                renderRecipes(data.recipes, myRecipesList, 'my');
                myRecipesLoaded = true;
            } else {
                showError(myRecipesList, '내 레시피를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('내 레시피 로드 오류:', error);
            showError(myRecipesList, '네트워크 오류가 발생했습니다.');
        }
    }

    // 좋아요한 레시피 로드
    async function loadLikedRecipes() {
        try {
            const response = await fetch('/api/liked-recipes');
            const data = await response.json();
            
            if (data.success) {
                renderRecipes(data.recipes, likedRecipesList, 'liked');
                likedRecipesLoaded = true;
            } else {
                showError(likedRecipesList, '좋아요한 레시피를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('좋아요 레시피 로드 오류:', error);
            showError(likedRecipesList, '네트워크 오류가 발생했습니다.');
        }
    }

    // 레시피 목록 렌더링 (클릭 이벤트 제거)
    function renderRecipes(recipes, container, type) {
        if (recipes.length === 0) {
            showEmpty(container, type);
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="recipe-card" data-recipe-id="${recipe._id}">
                <div class="recipe-image">
                    ${recipe.image_url ? 
                        `<img src="${recipe.image_url}" alt="${recipe.title}" onerror="this.parentNode.innerHTML='🍽️'">` : 
                        '🍽️'
                    }
                </div>
                <div class="recipe-info">
                    <div class="recipe-title">${escapeHtml(recipe.title)}</div>
                    <div class="recipe-meta">
                        <span class="recipe-category">${escapeHtml(recipe.category || '기타')}</span>
                        <div class="recipe-likes">❤️ ${recipe.likes || 0}</div>
                    </div>
                    ${type === 'my' && recipe.created_at ? 
                        `<div style="margin-top: 8px; font-size: 12px; color: #6b6b6b;">${recipe.created_at}</div>` : 
                        ''
                    }
                    ${type === 'liked' && recipe.author_name ? 
                        `<div style="margin-top: 8px; font-size: 12px; color: #6b6b6b;">by ${escapeHtml(recipe.author_name)}</div>` : 
                        ''
                    }
                    <div class="recipe-actions">
                        ${type === 'my' ? 
                            `<button class="action-btn delete-btn" onclick="deleteRecipe('${recipe._id}', event)">삭제</button>` :
                            `<button class="action-btn unlike-btn" onclick="unlikeRecipe('${recipe._id}', event)">좋아요 취소</button>`
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 빈 상태 표시
    function showEmpty(container, type) {
        const emptyMessages = {
            'my': {
                icon: '📝',
                text: '아직 작성한 레시피가 없습니다.',
                action: '첫 레시피 작성하기',
                link: '/post'
            },
            'liked': {
                icon: '❤️',
                text: '아직 좋아요한 레시피가 없습니다.',
                action: '레시피 둘러보기',
                link: '/search_result?q='
            }
        };

        const message = emptyMessages[type];
        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon">${message.icon}</div>
                <div class="empty-text">${message.text}</div>
                <a href="${message.link}" class="empty-action">${message.action}</a>
            </div>
        `;
    }

    // 에러 표시
    function showError(container, message) {
        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <div class="empty-text">${message}</div>
            </div>
        `;
    }

    // 내 레시피 삭제
    window.deleteRecipe = async function(recipeId, event) {
        event.stopPropagation(); // 카드 클릭 이벤트 방지
        
        if (!confirm('정말로 이 레시피를 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/delete-recipe/${recipeId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 화면에서 해당 카드 제거
                const recipeCard = document.querySelector(`[data-recipe-id="${recipeId}"]`);
                if (recipeCard) {
                    recipeCard.remove();
                }
                
                // 통계 업데이트 (페이지 새로고침 없이)
                updateStats();
                
                alert('레시피가 삭제되었습니다.');
            } else {
                alert(data.error || '레시피 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('레시피 삭제 오류:', error);
            alert('네트워크 오류가 발생했습니다.');
        }
    };

    // 좋아요 취소
    window.unlikeRecipe = async function(recipeId, event) {
        event.stopPropagation(); // 카드 클릭 이벤트 방지
        
        if (!confirm('좋아요를 취소하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/unlike-recipe/${recipeId}`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 화면에서 해당 카드 제거
                const recipeCard = document.querySelector(`[data-recipe-id="${recipeId}"]`);
                if (recipeCard) {
                    recipeCard.remove();
                }
                
                // 통계 업데이트
                updateStats();
                
                alert('좋아요를 취소했습니다.');
            } else {
                alert(data.error || '좋아요 취소에 실패했습니다.');
            }
        } catch (error) {
            console.error('좋아요 취소 오류:', error);
            alert('네트워크 오류가 발생했습니다.');
        }
    };

    // 통계 업데이트 함수
    async function updateStats() {
        try {
            // 현재 화면의 카드 개수로 간단히 업데이트
            const myRecipesCount = document.querySelectorAll('#my-recipes .recipe-card').length;
            const likedRecipesCount = document.querySelectorAll('#liked-recipes .recipe-card').length;
            
            const myCountEl = document.querySelector('.stat-card:first-child .stat-number');
            const likedCountEl = document.querySelector('.stat-card:last-child .stat-number');
            
            if (myCountEl) myCountEl.textContent = myRecipesCount;
            if (likedCountEl) likedCountEl.textContent = likedRecipesCount;
            
        } catch (error) {
            console.error('통계 업데이트 오류:', error);
        }
    }

    // HTML 이스케이프
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
});