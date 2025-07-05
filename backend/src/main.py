import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db, User
from src.models.card import Card, CollectionCard, Deck, DeckCard
from src.routes.user import user_bp
from src.routes.cards import cards_bp
from src.routes.decks import decks_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')


# Enable CORS for all routes with specific configuration
CORS(app, origins=["http://localhost:5173", "https://the-aether-lab-production.up.railway.app", "https://the-aether-lab.vercel.app", "https://*.vercel.app"], 
     allow_headers=["Content-Type", "Authorization"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(cards_bp, url_prefix='/api')
app.register_blueprint(decks_bp, url_prefix='/api')

# Use PostgreSQL instead of SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
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

with app.app_context():
    db.create_all()
    create_default_users()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Handle API routes first
    if path.startswith('api/'):
        return "API endpoint not found", 404
    
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.route('/health')
def health_check():
    return {"status": "healthy", "users": User.query.count()}

if __name__ == '__main__':
    # Use PORT environment variable for Railway deployment
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)