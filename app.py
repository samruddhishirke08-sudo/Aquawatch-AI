from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)

@app.route("/")
def home():
    return redirect(url_for("login"))

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/signup")
def signup():
    return render_template("signup.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/monitoring")
def monitoring():
    return render_template("monitoring.html")

@app.route("/ai-insights")
def ai_insights():
    return render_template("ai_insights.html")

@app.route("/irrigation")
def irrigation():
    return render_template("irrigation.html")

@app.route("/security-reports")
def security_reports():
    return render_template("security_reports.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")

if __name__ == "__main__":
    app.run(debug=True)