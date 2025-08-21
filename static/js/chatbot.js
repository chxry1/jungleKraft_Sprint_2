// static/js/chatbot.js - 드래그 가능한 챗봇 버튼

class ChatBot {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.initElements();
        this.initEventListeners();
        this.initDraggable();
    }

    initElements() {
        this.button = document.getElementById('chatbotButton');
        this.window = document.getElementById('chatbotWindow');
        this.closeBtn = document.getElementById('chatbotClose');
        this.messages = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatbotInput');
        this.sendBtn = document.getElementById('chatbotSend');
        this.typingIndicator = document.getElementById('typingIndicator');
    }

    initEventListeners() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    initDraggable() {
        if (!this.button) return;

        let startTime, startX, startY;
        let isDragging = false;

        this.button.addEventListener('mousedown', (e) => {
            startTime = Date.now();
            startX = e.clientX;
            startY = e.clientY;
            isDragging = false;
            
            this.startDrag(e.clientX, e.clientY);
            
            const onMouseMove = (e) => {
                const deltaX = Math.abs(e.clientX - startX);
                const deltaY = Math.abs(e.clientY - startY);
                
                if (deltaX > 10 || deltaY > 10) {
                    isDragging = true;
                    this.drag(e.clientX, e.clientY);
                }
            };
            
            const onMouseUp = (e) => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                this.endDrag();
                
                // 드래그하지 않았고 빠른 클릭이면 토글
                const timeElapsed = Date.now() - startTime;
                if (!isDragging && timeElapsed < 200) {
                    this.toggle();
                }
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            e.preventDefault();
        });

        // 터치 이벤트
        this.button.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startTime = Date.now();
            startX = touch.clientX;
            startY = touch.clientY;
            isDragging = false;
            
            this.startDrag(touch.clientX, touch.clientY);
            e.preventDefault();
        });

        this.button.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - startX);
            const deltaY = Math.abs(touch.clientY - startY);
            
            if (deltaX > 10 || deltaY > 10) {
                isDragging = true;
                this.drag(touch.clientX, touch.clientY);
            }
            e.preventDefault();
        });

        this.button.addEventListener('touchend', (e) => {
            this.endDrag();
            
            const timeElapsed = Date.now() - startTime;
            if (!isDragging && timeElapsed < 200) {
                this.toggle();
            }
            e.preventDefault();
        });
    }

    startDrag(clientX, clientY) {
        this.isDragging = false; // 일단 false로 시작
        
        const rect = this.button.getBoundingClientRect();
        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;
        
        // 드래그 시작 시 애니메이션 제거
        this.button.style.transition = 'none';
        this.button.style.cursor = 'grabbing';
    }

    drag(clientX, clientY) {
        this.isDragging = true; // 실제로 움직이기 시작하면 true
        
        const newX = clientX - this.dragOffset.x;
        const newY = clientY - this.dragOffset.y;
        
        // 화면 경계 체크
        const buttonSize = 60; // 버튼 크기
        const maxX = window.innerWidth - buttonSize;
        const maxY = window.innerHeight - buttonSize;
        
        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));
        
        // 절대 위치로 설정
        this.button.style.position = 'fixed';
        this.button.style.left = boundedX + 'px';
        this.button.style.top = boundedY + 'px';
        this.button.style.right = 'auto';
        this.button.style.bottom = 'auto';
    }

    endDrag() {
        // 드래그 종료 후 애니메이션 복원
        this.button.style.transition = 'all 0.3s ease';
        this.button.style.cursor = 'pointer';
        
        // 화면 가장자리에 스냅
        this.snapToEdge();
        
        // 잠시 후 드래그 상태 리셋
        setTimeout(() => {
            this.isDragging = false;
        }, 100);
    }

    snapToEdge() {
        const rect = this.button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 가장 가까운 가장자리 찾기
        const distances = {
            left: centerX,
            right: windowWidth - centerX,
            top: centerY,
            bottom: windowHeight - centerY
        };
        
        const minDistance = Math.min(...Object.values(distances));
        const closestEdge = Object.keys(distances).find(key => distances[key] === minDistance);
        
        // 가장자리에 스냅
        const margin = 20;
        
        switch (closestEdge) {
            case 'left':
                this.button.style.left = margin + 'px';
                break;
            case 'right':
                this.button.style.left = (windowWidth - 60 - margin) + 'px';
                break;
            case 'top':
                this.button.style.top = margin + 'px';
                break;
            case 'bottom':
                this.button.style.top = (windowHeight - 60 - margin) + 'px';
                break;
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.window) {
            this.window.classList.add('open');
            this.isOpen = true;
            if (this.input) {
                this.input.focus();
            }
        }
    }

    close() {
        if (this.window) {
            this.window.classList.remove('open');
            this.isOpen = false;
        }
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message || this.isTyping) return;

        this.addMessage(message, 'user');
        this.input.value = '';
        this.setTyping(true);

        try {
            const response = await this.callBackendAPI(message);
            this.setTyping(false);
            this.addMessage(response, 'bot');
        } catch (error) {
            this.setTyping(false);
            this.addMessage('죄송해요, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'bot');
            console.error('챗봇 API 오류:', error);
        }
    }

    async callBackendAPI(message) {
        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data.response;
    }

    addMessage(text, type) {
        if (!this.messages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;
        
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    setTyping(typing) {
        this.isTyping = typing;
        if (this.sendBtn) {
            this.sendBtn.disabled = typing;
        }
        if (this.typingIndicator) {
            this.typingIndicator.style.display = typing ? 'block' : 'none';
        }
        
        if (typing && this.messages) {
            this.messages.scrollTop = this.messages.scrollHeight;
        }
    }
}

// 챗봇 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chatbotButton')) {
        if (!window.chatBot) {
            window.chatBot = new ChatBot();
        }
    }
});