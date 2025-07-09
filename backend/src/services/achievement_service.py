from src.models.user import db
from src.models.achievement import Achievement, UserAchievement, AchievementNotification
from src.models.card import Card, CollectionCard, Deck, DeckCard
from datetime import datetime
import requests

class AchievementService:
    
    @staticmethod
    def check_and_update_achievements(user_id, trigger_type='collection_update'):
        """Check all achievements for a user and update progress"""
        achievements = Achievement.query.filter_by(is_active=True).all()
        newly_completed = []
        
        for achievement in achievements:
            if AchievementService._should_check_achievement(achievement, trigger_type):
                progress = AchievementService._calculate_progress(user_id, achievement)
                newly_completed.extend(
                    AchievementService._update_user_progress(user_id, achievement, progress)
                )
        
        return newly_completed
    
    @staticmethod
    def _should_check_achievement(achievement, trigger_type):
        """Determine if achievement should be checked based on trigger"""
        trigger_map = {
            'collection_update': ['collection', 'discovery', 'mastery'],
            'deck_update': ['deck', 'mastery'],
            'retroactive': ['collection', 'deck', 'discovery', 'mastery']
        }
        return achievement.category in trigger_map.get(trigger_type, [])
    
    @staticmethod
    def _calculate_progress(user_id, achievement):
        """Calculate current progress for an achievement"""
        criteria = achievement.criteria
        achievement_type = criteria.get('type')
        
        if achievement_type == 'collection_count':
            return AchievementService._check_collection_count(user_id, criteria)
        elif achievement_type == 'deck_count':
            return AchievementService._check_deck_count(user_id, criteria)
        elif achievement_type == 'card_criteria':
            return AchievementService._check_card_criteria(user_id, criteria)
        elif achievement_type == 'deck_criteria':
            return AchievementService._check_deck_criteria(user_id, criteria)
        elif achievement_type == 'banned_cards':
            return AchievementService._check_banned_cards(user_id, criteria)
        
        return {'current': 0, 'target': criteria.get('target', 1), 'completed': False}
    
    @staticmethod
    def _check_collection_count(user_id, criteria):
        """Check collection size achievements"""
        target = criteria.get('target', 1)
        
        if criteria.get('unique', False):
            # Count unique cards
            current = CollectionCard.query.filter_by(user_id=user_id).count()
        else:
            # Count total cards including quantities
            result = db.session.query(db.func.sum(CollectionCard.quantity)).filter_by(user_id=user_id).scalar()
            current = result or 0
        
        return {
            'current': current,
            'target': target,
            'completed': current >= target
        }
    
    @staticmethod
    def _check_deck_count(user_id, criteria):
        """Check deck count achievements"""
        target = criteria.get('target', 1)
        current = Deck.query.filter_by(user_id=user_id).count()
        
        return {
            'current': current,
            'target': target,
            'completed': current >= target
        }
    
    @staticmethod
    def _check_card_criteria(user_id, criteria):
        """Check achievements based on card properties"""
        target = criteria.get('target', 1)
        card_filter = criteria.get('filter', {})
        
        # Build query based on filter criteria
        query = db.session.query(CollectionCard).join(Card).filter(CollectionCard.user_id == user_id)
        
        if 'rarity' in card_filter:
            query = query.filter(Card.rarity == card_filter['rarity'])
        if 'colors' in card_filter:
            # Handle color filtering logic
            colors = card_filter['colors']
            if colors == 'mono':
                query = query.filter(db.func.json_array_length(Card.colors) == 1)
            elif isinstance(colors, list):
                query = query.filter(Card.colors.contains(colors))
        if 'type_line' in card_filter:
            query = query.filter(Card.type_line.like(f"%{card_filter['type_line']}%"))
        
        current = query.count()
        
        return {
            'current': current,
            'target': target,
            'completed': current >= target
        }
    
    @staticmethod
    def _check_deck_criteria(user_id, criteria):
        """Check deck-specific achievements"""
        target = criteria.get('target', 1)
        deck_filter = criteria.get('filter', {})
        
        # Example: Check for standard legal decks, creature type diversity, etc.
        if deck_filter.get('type') == 'creature_types':
            return AchievementService._check_creature_type_diversity(user_id, criteria)
        elif deck_filter.get('type') == 'format_legal':
            return AchievementService._check_format_legal_decks(user_id, criteria)
        
        return {'current': 0, 'target': target, 'completed': False}
    
    @staticmethod
    def _check_banned_cards(user_id, criteria):
        """Check for banned cards achievement"""
        target = criteria.get('target', 1)
        
        # This would require a banned cards database or API call
        # For now, implement as a placeholder
        banned_cards_in_collection = 0  # TODO: Implement banned card checking
        
        return {
            'current': banned_cards_in_collection,
            'target': target,
            'completed': banned_cards_in_collection >= target
        }
    
    @staticmethod
    def _update_user_progress(user_id, achievement, progress):
        """Update or create user achievement progress"""
        user_achievement = UserAchievement.query.filter_by(
            user_id=user_id, 
            achievement_id=achievement.id
        ).first()
        
        newly_completed = []
        
        if not user_achievement:
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id,
                progress=progress
            )
            db.session.add(user_achievement)
        else:
            user_achievement.progress = progress
            user_achievement.updated_at = datetime.utcnow()
        
        # Check if newly completed
        if progress['completed'] and not user_achievement.is_completed:
            user_achievement.is_completed = True
            user_achievement.completed_at = datetime.utcnow()
            
            # Create notification
            notification = AchievementNotification(
                user_id=user_id,
                achievement_id=achievement.id
            )
            db.session.add(notification)
            
            newly_completed.append(achievement)
        
        db.session.commit()
        return newly_completed
    
    @staticmethod
    def run_retroactive_check(user_id):
        """Run complete achievement check for existing data"""
        return AchievementService.check_and_update_achievements(user_id, 'retroactive')