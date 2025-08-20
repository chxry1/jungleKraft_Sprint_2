// mypage.js - 마이페이지 기능
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

    // 레시피 목록 렌더링
    function renderRecipes(recipes, container, type) {
        if (recipes.length === 0) {
            showEmpty(container, type);
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="recipe-card" onclick="viewRecipe('${recipe._id}')">
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

    // 레시피 상세보기
    window.viewRecipe = function(recipeId) {
        window.location.href = `/search_result?q=&recipe_id=${recipeId}`;
    };

    // HTML 이스케이프
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
});