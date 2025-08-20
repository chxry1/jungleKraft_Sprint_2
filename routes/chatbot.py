# routes/chatbot.py
from flask import Blueprint, request, jsonify
from openai import OpenAI
import os
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

chatbot_bp = Blueprint('chatbot', __name__)

# OpenAI 클라이언트 초기화 (환경변수에서 API 키 가져오기)
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        logger.error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        client = None
    else:
        client = OpenAI(api_key=api_key)
        logger.info("OpenAI 클라이언트 초기화 성공")
except Exception as e:
    logger.error(f"OpenAI 클라이언트 초기화 실패: {e}")
    client = None

@chatbot_bp.route('/api/chatbot', methods=['POST'])
def chat_with_bot():
    if not client:
        return jsonify({'error': 'OpenAI API가 설정되지 않았습니다.'}), 500
    
    try:
        # 요청 데이터 검증
        data = request.get_json()
        if not data:
            return jsonify({'error': '잘못된 요청 형식입니다.'}), 400
            
        user_message = data.get('message', '').strip()
        
        # 입력 검증
        if not user_message:
            return jsonify({'error': '메시지가 비어있습니다.'}), 400
            
        if len(user_message) > 500:
            return jsonify({'error': '메시지가 너무 깁니다. (최대 500자)'}), 400
        
        logger.info(f"사용자 메시지: {user_message}")
        
        # OpenAI API 호출 (최신 방식)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": """당신은 '밥심이'라는 이름의 친근한 요리 도우미입니다. 
한국어로 대화하며, 레시피, 요리 팁, 재료 정보, 음식 추천 등에 대해 도움을 줍니다. 
특히 날씨나 기분에 따른 음식 추천을 잘 해줍니다.
짧고 친근하게 대답하세요. 200자 이내로 답변해주세요.
따뜻하고 공감하는 톤으로 이야기하세요."""
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        bot_response = response.choices[0].message.content.strip()
        
        # 성공 로그
        logger.info(f"챗봇 응답 성공 - 사용자: {user_message[:50]}... / 응답: {bot_response[:50]}...")
        
        return jsonify({
            'success': True,
            'response': bot_response
        })
        
    except Exception as e:
        error_msg = str(e).lower()
        logger.error(f"챗봇 API 오류: {e}")
        
        # 구체적인 오류 처리
        if 'rate limit' in error_msg or 'quota' in error_msg:
            logger.warning("API 사용량 제한 도달")
            return jsonify({'error': 'API 사용량 제한에 도달했습니다. 잠시 후 다시 시도해주세요.'}), 429
            
        elif 'invalid request' in error_msg:
            logger.error(f"잘못된 요청: {e}")
            return jsonify({'error': '잘못된 요청입니다.'}), 400
            
        elif 'authentication' in error_msg or 'api key' in error_msg:
            logger.error("API 인증 실패")
            return jsonify({'error': 'API 인증에 실패했습니다.'}), 401
            
        elif 'timeout' in error_msg:
            logger.error("API 요청 타임아웃")
            return jsonify({'error': '요청 시간이 초과되었습니다. 다시 시도해주세요.'}), 408
            
        else:
            logger.error(f"챗봇 API 오류: {e}")
            return jsonify({'error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}), 500

# 헬스 체크 엔드포인트 (선택사항)
@chatbot_bp.route('/api/chatbot/health', methods=['GET'])
def health_check():
    if client:
        return jsonify({'status': 'healthy', 'service': '밥심이 챗봇'})
    else:
        return jsonify({'status': 'unhealthy', 'error': 'OpenAI API 설정 필요'}), 500