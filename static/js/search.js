document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소들
    const queryText = document.getElementById('queryText');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('q');
    const resultList = document.getElementById('resultList');
    const rankList = document.getElementById('rankList');
    const emptyDiv = document.getElementById('empty');
    const sortTabs = document.querySelectorAll('.tab');
    const fabAdd = document.getElementById('fabAdd');
    const addBtn = document.getElementById('addBtn');

    let currentQuery = '';
    let currentSort = 'likes';

    // URL에서 검색어 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');

    // 초기화
    if (initialQuery) {
        currentQuery = initialQuery;
        searchInput.value = initialQuery;
        queryText.textContent = `"${initialQuery}" 검색 결과`;
        performSearch(initialQuery, currentSort);
    }

    // TOP 10 로드
    loadTop10();

    // 검색 폼 제출 이벤트
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            currentQuery = query;
            queryText.textContent = `"${query}" 검색 결과`;
            performSearch(query, currentSort);
            
            // URL 업데이트
            const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
            window.history.pushState({}, '', newUrl);
        }
    });

    // 정렬 탭 클릭 이벤트
    sortTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 활성 탭 변경
            sortTabs.forEach(t => t.setAttribute('aria-selected', 'false'));
            this.setAttribute('aria-selected', 'true');
            
            currentSort = this.getAttribute('data-sort');
            
            // 검색 다시 실행
            if (currentQuery) {
                performSearch(currentQuery, currentSort);
            }
        });
    });

    // 플로팅 버튼 클릭 이벤트
    if (fabAdd) {
        fabAdd.addEventListener('click', function() {
            window.location.href = '/post';
        });
    }

    // 검색 실행 함수
    async function performSearch(query, sortBy = 'likes') {
        try {
            showLoading();
            
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&sort=${sortBy}`);
            const data = await response.json();
            
            if (data.success) {
                displayResults(data.results);
            } else {
                showError(data.error || '검색 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('검색 오류:', error);
            showError('네트워크 오류가 발생했습니다.');
        }
    }

    // TOP 10 로드 함수
    async function loadTop10() {
        try {
            const response = await fetch('/api/top10');
            const data = await response.json();
            
            if (data.success) {
                displayTop10(data.results);
            }
        } catch (error) {
            console.error('TOP 10 로드 오류:', error);
        }
    }

    // 검색 결과 표시
    function displayResults(results) {
        resultList.innerHTML = '';
        emptyDiv.hidden = true;

        if (results.length === 0) {
            emptyDiv.hidden = false;
            return;
        }

        results.forEach(post => {
            const card = createPostCard(post);
            resultList.appendChild(card);
        });
    }

    // 게시글 카드 생성
    function createPostCard(post) {
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
        <div class="card-content">
            <div class="title">${escapeHtml(post.title)}</div>
            <div class="meta">
                <span class="author">${escapeHtml(post.author_name)}</span>
                <span class="date">${post.created_at}</span>
                <span class="time">${post.time_minutes}분</span>
                <span class="level">${escapeHtml(post.level)}</span>
            </div>
            <div class="tags">
                <span class="tag">${escapeHtml(post.category)}</span>
                ${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        </div>
        <div class="actions">
            <button class="detail-btn" data-post-id="${post._id || post.id}">자세히</button>
            <button class="like-btn" data-post-id="${post._id || post.id}">
                ❤️ ${post.likes || 0}
            </button>
        </div>
        `;

        // 좋아요 버튼 이벤트 추가
        const likeBtn = card.querySelector('.like-btn');
        likeBtn.addEventListener('click', function() {
            likePost(post._id || post.id);
        });

        return card;
    }

    // TOP 10 표시
    function displayTop10(results) {
        rankList.innerHTML = '';
        
        results.forEach((post, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="r-left">
                    <div class="badge">${index + 1}</div>
                    <div class="r-name">${escapeHtml(post.title)}</div>
                </div>
                <div class="r-like">❤️ ${post.likes}</div>
            `;
            rankList.appendChild(li);
        });
    }

    // 로딩 표시
    function showLoading() {
        resultList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div>검색 중...</div>
            </div>
        `;
        emptyDiv.hidden = true;
    }

    // 에러 표시
    function showError(message) {
        resultList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <div>${escapeHtml(message)}</div>
            </div>
        `;
        emptyDiv.hidden = true;
    }

    // HTML 이스케이프 함수
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});