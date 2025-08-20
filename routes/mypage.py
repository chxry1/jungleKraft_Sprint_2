# routes/mypage.py
from flask import Blueprint, render_template, session, redirect, url_for, jsonify
from pymongo import MongoClient
from bson import ObjectId
import os

mypage_bp = Blueprint("mypage", __name__)

# DB 연결
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://rlaalsco8:UEqJNHZE4LRTRyAH@myowncloudmongodb.ls6rso4.mongodb.net/?retryWrites=true&w=majority&appName=MyOwnCloudMongoDB"
)
client = MongoClient(MONGO_URI)
db = client["O2A"]
users = db["users"]
posts = db["posts"]

@mypage_bp.route("/mypage")
def mypage():
    """마이페이지 메인"""
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("login.login_page"))
    
    try:
        # 사용자 정보 조회
        user = users.find_one({"_id": ObjectId(user_id)})
        if not user:
            session.clear()
            return redirect(url_for("login.login_page"))
        
        # 사용자가 작성한 레시피 개수
        my_recipes_count = posts.count_documents({"author_id": ObjectId(user_id)})
        
        # 사용자가 좋아요한 레시피 개수
        liked_recipes_count = posts.count_documents({"liked_by": ObjectId(user_id)})
        
        return render_template("mypage.html", 
                             user=user, 
                             my_recipes_count=my_recipes_count,
                             liked_recipes_count=liked_recipes_count)
    except Exception as e:
        print(f"마이페이지 오류: {e}")
        return redirect("/")

@mypage_bp.route("/api/my-recipes")
def get_my_recipes():
    """내가 작성한 레시피 목록 API"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "로그인이 필요합니다"}), 401
    
    try:
        # 내가 작성한 레시피들 조회
        my_posts = list(posts.find(
            {"author_id": ObjectId(user_id)},
            {"title": 1, "likes": 1, "created_at": 1, "category": 1, "image_url": 1}
        ).sort("created_at", -1).limit(20))
        
        # ObjectId를 문자열로 변환
        for post in my_posts:
            post["_id"] = str(post["_id"])
            if post.get("created_at"):
                post["created_at"] = post["created_at"].strftime("%Y-%m-%d")
        
        return jsonify({"success": True, "recipes": my_posts})
    except Exception as e:
        print(f"내 레시피 조회 오류: {e}")
        return jsonify({"error": "데이터를 불러올 수 없습니다"}), 500

@mypage_bp.route("/api/liked-recipes")
def get_liked_recipes():
    """내가 좋아요한 레시피 목록 API"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "로그인이 필요합니다"}), 401
    
    try:
        # 내가 좋아요한 레시피들 조회
        liked_posts = list(posts.find(
            {"liked_by": ObjectId(user_id)},
            {"title": 1, "likes": 1, "author_name": 1, "category": 1, "image_url": 1}
        ).sort("likes", -1).limit(20))
        
        # ObjectId를 문자열로 변환
        for post in liked_posts:
            post["_id"] = str(post["_id"])
        
        return jsonify({"success": True, "recipes": liked_posts})
    except Exception as e:
        print(f"좋아요 레시피 조회 오류: {e}")
        return jsonify({"error": "데이터를 불러올 수 없습니다"}), 500

@mypage_bp.route("/api/delete-recipe/<recipe_id>", methods=["DELETE"])
def delete_recipe(recipe_id):
    """내가 작성한 레시피 삭제 API"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "로그인이 필요합니다"}), 401
    
    try:
        # ObjectId 유효성 검사
        if not ObjectId.is_valid(recipe_id):
            return jsonify({"error": "잘못된 레시피 ID입니다"}), 400
        
        # 레시피 존재 여부 및 작성자 확인
        recipe = posts.find_one({
            "_id": ObjectId(recipe_id),
            "author_id": ObjectId(user_id)
        })
        
        if not recipe:
            return jsonify({"error": "레시피를 찾을 수 없거나 삭제 권한이 없습니다"}), 404
        
        # 레시피 삭제
        result = posts.delete_one({
            "_id": ObjectId(recipe_id),
            "author_id": ObjectId(user_id)
        })
        
        if result.deleted_count > 0:
            return jsonify({"success": True, "message": "레시피가 삭제되었습니다"})
        else:
            return jsonify({"error": "레시피 삭제에 실패했습니다"}), 500
            
    except Exception as e:
        print(f"레시피 삭제 오류: {e}")
        return jsonify({"error": "서버 오류가 발생했습니다"}), 500

@mypage_bp.route("/api/unlike-recipe/<recipe_id>", methods=["POST"])
def unlike_recipe(recipe_id):
    """좋아요 취소 API"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "로그인이 필요합니다"}), 401
    
    try:
        # ObjectId 유효성 검사
        if not ObjectId.is_valid(recipe_id):
            return jsonify({"error": "잘못된 레시피 ID입니다"}), 400
        
        # 좋아요 취소
        result = posts.update_one(
            {"_id": ObjectId(recipe_id)},
            {
                "$pull": {"liked_by": ObjectId(user_id)},
                "$inc": {"likes": -1}
            }
        )
        
        if result.modified_count > 0:
            return jsonify({"success": True, "message": "좋아요를 취소했습니다"})
        else:
            return jsonify({"error": "좋아요 취소에 실패했습니다"}), 500
            
    except Exception as e:
        print(f"좋아요 취소 오류: {e}")
        return jsonify({"error": "서버 오류가 발생했습니다"}), 500