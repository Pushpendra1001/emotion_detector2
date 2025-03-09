import os
import cv2
import numpy as np
from flask import Flask, Response, jsonify, request, session
from flask_cors import CORS
import tensorflow as tf
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
from datetime import datetime
import json


app = Flask(__name__)
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_HTTPONLY=True
)
app.secret_key = 'your-secret-key-change-this'

CORS(app, 
     supports_credentials=True,
     resources={
         r"/*": {
             "origins": ["http://localhost:5173", "http://localhost:5005"],
             "methods": ["GET", "POST", "OPTIONS"],
             "allow_headers": ["Content-Type"],
             "expose_headers": ["Content-Type"],
             "max_age": 3600
         }
     })


USERS_CSV = 'data/users.csv'
EMOTIONS_CSV = 'data/emotions.csv'


os.makedirs('data', exist_ok=True)


if not os.path.exists(USERS_CSV):
    pd.DataFrame(columns=['email', 'password']).to_csv(USERS_CSV, index=False)
if not os.path.exists(EMOTIONS_CSV):
    pd.DataFrame(columns=['email', 'timestamp', 'emotion', 'confidence', 'model_type']).to_csv(EMOTIONS_CSV, index=False)


model = None
face_cascade = None
emotion_labels = ['anger', 'contempt', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

def load_model_file(model_path):
    global model, face_cascade
    try:
        # Add error checking for file existence
        if not os.path.exists(model_path):
            print(f"Model file not found at: {model_path}")
            return False
            
        # Load model with custom_objects if needed
        model = tf.keras.models.load_model(model_path, compile=False)
        # Recompile the model
        model.compile(
            optimizer='rmsprop',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        if face_cascade.empty():
            print("Error: Could not load face cascade classifier")
            return False
            
        return True
        
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def save_emotion(email, emotion, confidence, model_type):
    try:
        new_data = {
            'email': email,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'emotion': emotion,
            'confidence': confidence,
            'model_type': model_type
        }
        df = pd.read_csv(EMOTIONS_CSV)
        df = pd.concat([df, pd.DataFrame([new_data])], ignore_index=True)
        df.to_csv(EMOTIONS_CSV, index=False)
    except Exception as e:
        print(f"Error saving emotion: {str(e)}")

def process_frame(frame, email, model_type):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(50, 50))
    
    for (x, y, w, h) in faces:
        face = frame[y:y + h, x:x + w]
        face = cv2.resize(face, (96, 96))
        face = face / 255.0
        face = np.expand_dims(face, axis=0)
        face = np.expand_dims(face, axis=0)
        
        prediction = model.predict(face)
        emotion_idx = np.argmax(prediction)
        emotion = emotion_labels[emotion_idx]
        confidence = float(prediction[0][emotion_idx])
        
        
        save_emotion(email, emotion, confidence, model_type)
        
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        label = f"{emotion} ({confidence:.2f})"
        cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    return frame

def generate_frames(email, model_type):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not start camera.")
    
    while True:
        success, frame = cap.read()
        if not success:
            break
        
        try:
            processed_frame = process_frame(frame, email, model_type)
            _, buffer = cv2.imencode('.jpg', processed_frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                   
        except Exception as e:
            print(f"Error processing frame: {str(e)}")
            continue

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
            
        df = pd.read_csv(USERS_CSV)
        if email in df['email'].values:
            return jsonify({"error": "User already exists"}), 400
            
        hashed_password = generate_password_hash(password)
        new_user = pd.DataFrame([{'email': email, 'password': hashed_password}])
        df = pd.concat([df, new_user], ignore_index=True)
        df.to_csv(USERS_CSV, index=False)
        
        session['user'] = email
        return jsonify({"status": "success", "email": email})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
            
        df = pd.read_csv(USERS_CSV)
        user = df[df['email'] == email]
        
        if user.empty or not check_password_hash(user.iloc[0]['password'], password):
            return jsonify({"error": "Invalid credentials"}), 401
            
        session['user'] = email
        return jsonify({"status": "success", "email": email})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analytics', methods=['GET'])
def get_analytics():
    if not session.get('user'):
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        email = session['user']
        df = pd.read_csv(EMOTIONS_CSV)
        user_data = df[df['email'] == email]
        
        
        emotions_by_time = user_data.groupby(['timestamp', 'emotion']).size().reset_index(name='count')
        emotions_by_model = user_data.groupby(['model_type', 'emotion']).size().reset_index(name='count')
        
        return jsonify({
            "emotionsByTime": emotions_by_time.to_dict('records'),
            "emotionsByModel": emotions_by_model.to_dict('records')
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"status": "success"})

@app.route('/check-auth')
def check_auth():
    user = session.get('user')
    if user:
        return jsonify({"status": "authenticated", "email": user})
    return jsonify({"status": "unauthenticated"}), 401

@app.route('/')
def index():
    return jsonify({"status": "running"})

@app.route('/load-model', methods=['POST'])
def load_model_endpoint():
    if not session.get('user'):
        return jsonify({"error": "Unauthorized"}), 401
        
    try:
        data = request.get_json()
        model_path = data.get('modelPath')
        
        print(f"Attempting to load model from: {model_path}")  # Debug print
        print(f"Current working directory: {os.getcwd()}")     # Debug print
        
        if not model_path:
            return jsonify({"error": "Model path not provided"}), 400
            
        success = load_model_file(model_path)
        
        if success:
            return jsonify({"status": "Model loaded successfully"})
        else:
            return jsonify({"error": "Failed to load model"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/video_feed')
def video_feed():
    if not session.get('user'):
        return jsonify({"error": "Unauthorized"}), 401
    
    email = session['user']
    model_type = request.args.get('model_type', 'unknown')
    
    response = Response(
        generate_frames(email, model_type),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5005)