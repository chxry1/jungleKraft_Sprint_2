// static/js/chatbot.js

class ChatBot {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        
        this.initElements();
        this.initEventListeners();
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
        if (this.button) {
            this.button.addEventListener('click', () => this.toggle());
        }
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