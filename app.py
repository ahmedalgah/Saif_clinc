import os
from flask import Flask, send_from_directory, request, jsonify
import google.generativeai as genai

app = Flask(__name__, static_folder=".")

# تهيئة مفتاح الـ API من متغيرات البيئة في Render
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

@app.route("/")
def home():
    return send_from_directory(".", "index.html")

# مسار استقبال الأسئلة من المساعد الذكي في الموقع
@app.route("/ask-ai", methods=["POST"])
def ask_ai():
    try:
        data = request.get_json()
        user_message = data.get("message", "")
        
        if not api_key:
            return jsonify({"reply": "مفتاح API غير متوفر في السيرفر حالياً."})

        # استدعاء نموذج جيميناي
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(user_message)
        
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"reply": f"عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي: {str(e)}"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)


from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder=".")

@app.route("/")
def home():
    return send_from_directory(".", "index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
