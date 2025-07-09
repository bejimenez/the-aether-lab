import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file (for local development)
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.models.user import db, User
from src.models.card import Card, CollectionCard, Deck, DeckCard
from src.routes.user import user_bp
from src.routes.cards import cards_bp
from src.routes.decks import decks_bp
from src.routes.achievements import achievements_bp
from src.models.achievement import Achievement, UserAchievement, AchievementNotification


app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')

# Enable CORS for all routes with specific configuration
CORS(app, origins=[
    "http://localhost:5173", 
    "https://the-aether-lab-production.up.railway.app", 
    "https://the-aether-lab.vercel.app",
    "https://*.vercel.app"
], 
     allow_headers=["Content-Type", "Authorization"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(cards_bp, url_prefix='/api')
app.register_blueprint(decks_bp, url_prefix='/api')
app.register_blueprint(achievements_bp, url_prefix='/api')

# Database configuration with better error handling
def configure_database():
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        print(f"Using PostgreSQL database")
        # Handle Supabase URLs that might need adjustment
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        print("Using SQLite database (development)")
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_timeout': 20,
        'pool_recycle': -1,
        'pool_pre_ping': True
    }

configure_database()
db.init_app(app)

def create_default_users():
    """Create default users if they don't exist"""
    try:
        # Check if users already exist
        if User.query.count() == 0:
            # Create default users
            user1 = User(username="Player1", email="player1@example.com")
            user2 = User(username="Player2", email="player2@example.com")
            
            db.session.add(user1)
            db.session.add(user2)
            db.session.commit()
            print("Created default users")
        else:
            print(f"Found {User.query.count()} existing users")
    except Exception as e:
        print(f"Error creating default users: {e}")
        db.session.rollback()

def initialize_database():
    """Initialize database with better error handling"""
    try:
        print("Initializing database...")
        db.create_all()
        print("Database tables created successfully")
        create_default_users()
        print("Database initialization complete")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        # Don't exit - let the app start anyway
        return False
    return True

# Initialize database
with app.app_context():
    db_initialized = initialize_database()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Handle API routes first
    if path.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404
    
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return jsonify({"error": "Static folder not configured"}), 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return jsonify({"error": "Frontend not found - please build and deploy frontend"}), 404

@app.route('/health')
def health_check():
    try:
        user_count = User.query.count()
        return jsonify({
            "status": "healthy", 
            "users": user_count,
            "database": "connected",
            "environment": "production" if os.environ.get('DATABASE_URL') else "development"
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy", 
            "error": str(e),
            "database": "disconnected"
        }), 500

@app.route('/api/test')
def test_endpoint():
    """Test endpoint to verify API is working"""
    return jsonify({
        "message": "API is working",
        "environment": "production" if os.environ.get('DATABASE_URL') else "development",
        "database_url_present": bool(os.environ.get('DATABASE_URL'))
    })

# Error handlers
@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Use PORT environment variable for Railway deployment
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)