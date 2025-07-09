from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.achievement import Achievement, UserAchievement, AchievementNotification
from src.services.achievement_service import AchievementService

achievements_bp = Blueprint('achievements', __name__)

@achievements_bp.route('/achievements', methods=['GET'])
def get_user_achievements():
    """Get all achievements with user progress"""
    user_id = request.args.get('user_id', 1, type=int)
    
    try:
        # Get all achievements with user progress
        achievements = db.session.query(Achievement).outerjoin(
            UserAchievement, 
            (Achievement.id == UserAchievement.achievement_id) & 
            (UserAchievement.user_id == user_id)
        ).all()
        
        result = []
        for achievement in achievements:
            user_progress = UserAchievement.query.filter_by(
                user_id=user_id, 
                achievement_id=achievement.id
            ).first()
            
            achievement_data = achievement.to_dict()
            if user_progress:
                achievement_data.update({
                    'user_progress': user_progress.progress,
                    'is_completed': user_progress.is_completed,
                    'completed_at': user_progress.completed_at.isoformat() if user_progress.completed_at else None
                })
            else:
                achievement_data.update({
                    'user_progress': {'current': 0, 'target': achievement.criteria.get('target', 1), 'completed': False},
                    'is_completed': False,
                    'completed_at': None
                })
            
            result.append(achievement_data)
        
        return jsonify({'achievements': result})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get achievements: {str(e)}'}), 500

@achievements_bp.route('/achievements/notifications', methods=['GET'])
def get_achievement_notifications():
    """Get unviewed achievement notifications"""
    user_id = request.args.get('user_id', 1, type=int)
    
    try:
        notifications = AchievementNotification.query.filter_by(
            user_id=user_id, 
            is_viewed=False
        ).order_by(AchievementNotification.created_at.desc()).all()
        
        return jsonify({
            'notifications': [notif.to_dict() for notif in notifications]
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get notifications: {str(e)}'}'), 500

@achievements_bp.route('/achievements/notifications/<int:notification_id>/mark-viewed', methods=['PUT'])
def mark_notification_viewed(notification_id):
    """Mark notification as viewed"""
    try:
        notification = AchievementNotification.query.get(notification_id)
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.is_viewed = True
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as viewed'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to mark notification: {str(e)}'}), 500

@achievements_bp.route('/achievements/check', methods=['POST'])
def trigger_achievement_check():
    """Manually trigger achievement check for user"""
    data = request.get_json()
    user_id = data.get('user_id', 1)
    
    try:
        newly_completed = AchievementService.run_retroactive_check(user_id)
        
        return jsonify({
            'message': f'Achievement check complete. {len(newly_completed)} new achievements earned.',
            'newly_completed': [a.to_dict() for a in newly_completed]
        })
        
    except Exception as e:
        return jsonify({'error': f'Achievement check failed: {str(e)}'}), 500