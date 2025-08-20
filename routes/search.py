from flask import Blueprint, request, jsonify
from pymongo import MongoClient
import re
from bson import ObjectId
from datetime import datetime

search_bp = Blueprint('search', __name__)

# MongoDB 연결 (Atlas 클라우드 DB)
try:
    MONGO_URI = "mongodb+srv://rlaalsco8:UEqJNHZE4LRTRyAH@myowncloudmongodb.ls6rso4.mongodb.net/?retryWrites=true&w=majority&appName=MyOwnCloudMongoDB"
    client = MongoClient(MONGO_URI)
    db = client["O2A"]  # 데이터베이스 이름
    posts_collection = db["posts"]
    # 연결 테스트
    client.admin.command('ping')
    print("MongoDB Atlas 연결 성공")
except Exception as e:
    print(f"MongoDB Atlas 연결 실패: {e}")
    client = None
    db = None
    posts_collection = None

@search_bp.route('/api/search', methods=['GET'])
def search_posts():
    try:
        # MongoDB 연결 확인
        if posts_collection is None:
            return jsonify({'error': '데이터베이스 연결 오류'}), 500
            
        # 쿼리 파라미터 가져오기
        query = request.args.get('q', '').strip()
        sort_by = request.args.get('sort', 'likes')  # likes, recent, time
        
        print(f"검색 요청: query='{query}', sort='{sort_by}'")  # 디버깅용
        
        if not query:
            return jsonify({'error': '검색어를 입력해주세요.'}), 400
        
        # 검색 조건 설정 (제목에서 부분 일치 검색, 대소문자 구분 없음)
        search_filter = {
            'title': {'$regex': query, '$options': 'i'},  # re.escape 제거로 부분 일치 가능
            'status': 'published',
            'visibility': 'public'
        }
        
        print(f"검색 필터: {search_filter}")  # 디버깅용
        
        # 정렬 조건 설정
        sort_options = {
            'likes': [('likes', -1), ('created_at', -1)],  # 좋아요 많은 순, 최신순
            'recent': [('created_at', -1)],                # 최신순
            'time': [('time_minutes', 1), ('created_at', -1)]  # 조리시간 짧은 순, 최신순
        }
        
        sort_criteria = sort_options.get(sort_by, sort_options['likes'])
        
        # 데이터베이스에서 검색
        posts = list(posts_collection.find(search_filter).sort(sort_criteria).limit(50))
        
        print(f"검색 결과 개수: {len(posts)}")  # 디버깅용
        
        # 결과 포맷팅
        results = []
        for post in posts:
            try:
                # created_at이 문자열일 수도 있으므로 처리
                if isinstance(post.get('created_at'), str):
                    created_date = post['created_at'][:10]  # YYYY-MM-DD 형태로 자름
                else:
                    created_date = post['created_at'].strftime('%Y-%m-%d')
                
                results.append({
                    'id': str(post['_id']),
                    'title': post.get('title', '제목 없음'),
                    'author_name': post.get('author_name', '익명'),
                    'created_at': created_date,
                    'likes': post.get('likes', 0),
                    'time_minutes': post.get('time_minutes', 0),
                    'level': post.get('level', ''),
                    'category': post.get('category', ''),
                    'tags': post.get('tags', []),
                    'desc': post.get('desc', ''),
                    'servings': post.get('servings', 1)
                })
            except Exception as post_error:
                print(f"게시글 처리 오류: {post_error}")
                continue
        
        return jsonify({
            'success': True,
            'query': query,
            'count': len(results),
            'results': results
        })
        
    except Exception as e:
        print(f"검색 API 오류: {e}")  # 디버깅용
        return jsonify({'error': f'검색 중 오류가 발생했습니다: {str(e)}'}), 500

@search_bp.route('/api/top10', methods=['GET'])
def get_top10():
    try:
        # MongoDB 연결 확인
        if posts_collection is None:
            return jsonify({'error': '데이터베이스 연결 오류'}), 500
            
        # TOP 10 인기 게시글 가져오기
        top_posts = list(posts_collection.find(
            {'status': 'published', 'visibility': 'public'}
        ).sort([('likes', -1), ('created_at', -1)]).limit(10))
        
        results = []
        for post in top_posts:
            results.append({
                'id': str(post['_id']),
                'title': post.get('title', '제목 없음'),
                'likes': post.get('likes', 0)
            })
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        print(f"TOP 10 API 오류: {e}")  # 디버깅용
        return jsonify({'error': f'TOP 10 조회 중 오류가 발생했습니다: {str(e)}'}), 500