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