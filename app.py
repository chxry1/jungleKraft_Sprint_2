from flask import Flask, render_template, session, redirect, url_for
from datetime import timedelta
from routes.sign import sign_bp  
from routes.login import login_bp
from routes.post import post_bp
from routes.search import search_bp
from routes.post_detail import post_detail_bp  
from routes.mypage import mypage_bp

app = Flask(__name__)
app.secret_key = "dlehddnrWKdWKdaos"    # 비밀키 입니다 #
app.permanent_session_lifetime = timedelta(days=1) # 로그인 유지 기간 ( 하루 )

# 블루프린트 등록
app.register_blueprint(sign_bp)
app.register_blueprint(login_bp)
app.register_blueprint(post_bp)
app.register_blueprint(search_bp)
app.register_blueprint(post_detail_bp)  # 추가
app.register_blueprint(mypage_bp)

@app.route("/")
def home():
    return render_template("main.html", user_name=session.get("user_name"))

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/sign")
def sign_page():
    return render_template("sign.html")

@app.route("/sign_success")
def sign_success_page():
    return render_template("sign_success.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/search_result")
def search_result_page():
    return render_template("search_result.html")

@app.route("/post")
def recipe_writing_page():
    if "user_id" not in session:
        return redirect(url_for("login.login_page"))
    return render_template("post.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)