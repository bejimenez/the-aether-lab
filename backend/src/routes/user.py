from flask import Blueprint, jsonify, request
from src.models.user import db, User

user_bp = Blueprint("user", __name__)

@user_bp.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route("/users", methods=["POST"])
def create_user():
    data = request.get_json()
    if not data or not "username" in data or not "email" in data:
        return jsonify({"error": "Username and email are required"}), 400
    
    new_user = User(username=data["username"], email=data["email"])
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201