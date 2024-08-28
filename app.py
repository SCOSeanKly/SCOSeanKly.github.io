from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
from functools import wraps

app = Flask(__name__)
CORS(app)

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "secure_password"

def authenticate(username, password):
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not authenticate(auth.username, auth.password):
            return jsonify({"message": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/')
def serve_html():
    return send_file('cj2011.html')

@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    with open('schedule.json', 'r') as file:
        schedule = json.load(file)
    return jsonify(schedule)

@app.route('/api/schedule', methods=['POST'])
@require_auth
def update_schedule():
    new_schedule = request.json
    with open('schedule.json', 'w') as file:
        json.dump(new_schedule, file, indent=2)
    return jsonify({"message": "Schedule updated successfully"})

if __name__ == '__main__':
    app.run(debug=True)