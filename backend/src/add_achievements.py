#!/usr/bin/env python3
"""
Achievement Management Script
Run this script to add achievements to your database easily.

Usage:
    python add_achievements.py                    # Add basic achievements
    python add_achievements.py --all              # Add all achievements
    python add_achievements.py --test             # Test achievement checking
    python add_achievements.py --clear            # Clear all achievements
"""

import sys
import os
import argparse

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.models.user import db
from src.models.achievement import Achievement, UserAchievement, AchievementNotification
from src.services.achievement_service import AchievementService
from src.main import app

def create_basic_achievements():
    """Create basic collection and deck achievements"""
    basic_achievements = [
        {
            'name': 'First Steps',
            'description': 'Add your first card to the collection',
            'category': 'collection',
            'icon': 'star',
            'rarity': 'common',
            'criteria': {'type': 'collection_count', 'target': 1, 'unique': True},
            'points': 5
        },
        {
            'name': 'Getting Started',
            'description': 'Collect 10 unique cards',
            'category': 'collection',
            'icon': 'bookmark',
            'rarity': 'common',
            'criteria': {'type': 'collection_count', 'target': 10, 'unique': True},
            'points': 10
        },
        {
            'name': 'Century Club',
            'description': 'Collect 100 unique cards',
            'category': 'collection',
            'icon': 'trophy',
            'rarity': 'uncommon',
            'criteria': {'type': 'collection_count', 'target': 100, 'unique': True},
            'points': 25
        },
        {
            'name': 'Deck Builder',
            'description': 'Create your first deck',
            'category': 'deck',
            'icon': 'layers',
            'rarity': 'common',
            'criteria': {'type': 'deck_count', 'target': 1},
            'points': 10
        },
        {
            'name': 'Master Builder',
            'description': 'Create 5 decks',
            'category': 'deck',
            'icon': 'construction',
            'rarity': 'uncommon',
            'criteria': {'type': 'deck_count', 'target': 5},
            'points': 25
        }
    ]
    
    return basic_achievements

def create_mtg_achievements():
    """Create MTG-specific achievements"""
    mtg_achievements = [
        {
            'name': 'Rare Collector',
            'description': 'Collect 10 rare cards',
            'category': 'discovery',
            'icon': 'gem',
            'rarity': 'uncommon',
            'criteria': {'type': 'card_criteria', 'target': 10, 'filter': {'rarity': 'rare'}},
            'points': 20
        },
        {
            'name': 'Mythic Hunter',
            'description': 'Collect your first mythic rare',
            'category': 'discovery',
            'icon': 'crown',
            'rarity': 'rare',
            'criteria': {'type': 'card_criteria', 'target': 1, 'filter': {'rarity': 'mythic'}},
            'points': 30
        },
        {
            'name': 'Dragon Tamer',
            'description': 'Collect 5 Dragon creatures',
            'category': 'discovery',
            'icon': 'zap',
            'rarity': 'uncommon',
            'criteria': {'type': 'card_criteria', 'target': 5, 'filter': {'type_line': 'Dragon'}},
            'points': 15
        },
        {
            'name': 'Planeswalker',
            'description': 'Collect 3 Planeswalker cards',
            'category': 'discovery',
            'icon': 'user',
            'rarity': 'uncommon',
            'criteria': {'type': 'card_criteria', 'target': 3, 'filter': {'type_line': 'Planeswalker'}},
            'points': 20
        },
        {
            'name': 'Artifact Collector',
            'description': 'Collect 25 artifact cards',
            'category': 'discovery',
            'icon': 'cpu',
            'rarity': 'uncommon',
            'criteria': {'type': 'card_criteria', 'target': 25, 'filter': {'type_line': 'Artifact'}},
            'points': 20
        },
        {
            'name': 'The Hoarder',
            'description': 'Collect 500 total cards (including quantities)',
            'category': 'collection',
            'icon': 'archive',
            'rarity': 'rare',
            'criteria': {'type': 'collection_count', 'target': 500, 'unique': False},
            'points': 50
        }
    ]
    
    return mtg_achievements

def create_fun_achievements():
    """Create fun/challenge achievements"""
    fun_achievements = [
        {
            'name': 'Creature Feature',
            'description': 'Collect 50 creature cards',
            'category': 'discovery',
            'icon': 'heart',
            'rarity': 'uncommon',
            'criteria': {'type': 'card_criteria', 'target': 50, 'filter': {'type_line': 'Creature'}},
            'points': 25
        },
        {
            'name': 'Spell Slinger',
            'description': 'Collect 30 instant and sorcery cards',
            'category': 'discovery',
            'icon': 'wand',
            'rarity': 'uncommon',
            'criteria': {'type': 'card_criteria', 'target': 30, 'filter': {'type_line': 'Instant'}},
            'points': 20
        },
        {
            'name': 'Enchantment Enthusiast',
            'description': 'Collect 20 enchantment cards',
            'category': 'discovery',
            'icon': 'sparkles',
            'rarity': 'uncommon',
            'criteria': {'type': 'card_criteria', 'target': 20, 'filter': {'type_line': 'Enchantment'}},
            'points': 20
        }
    ]
    
    return fun_achievements

def add_achievements(achievements):
    """Add achievements to the database"""
    added_count = 0
    skipped_count = 0
    
    for achievement_data in achievements:
        # Check if achievement already exists
        existing = Achievement.query.filter_by(name=achievement_data['name']).first()
        if existing:
            print(f"⚠️  Skipping existing achievement: {achievement_data['name']}")
            skipped_count += 1
            continue
        
        # Create new achievement
        achievement = Achievement(**achievement_data)
        db.session.add(achievement)
        print(f"✅ Added achievement: {achievement_data['name']}")
        added_count += 1
    
    # Commit all changes
    db.session.commit()
    
    print(f"\n🎉 Summary: Added {added_count} achievements, skipped {skipped_count} existing ones")
    return added_count

def clear_achievements():
    """Clear all achievements from the database"""
    count = Achievement.query.count()
    Achievement.query.delete()
    UserAchievement.query.delete()
    AchievementNotification.query.delete()
    db.session.commit()
    print(f"🧹 Cleared {count} achievements and all related data")

def test_achievements():
    """Test achievement checking for user 1"""
    print("🧪 Testing achievement system...")
    
    # Check if we have any achievements
    achievement_count = Achievement.query.count()
    print(f"📊 Found {achievement_count} achievements in database")
    
    if achievement_count == 0:
        print("❌ No achievements found! Run with --basic first.")
        return
    
    # Test checking achievements for user 1
    user_id = 1
    print(f"🔍 Checking achievements for user {user_id}...")
    
    try:
        newly_completed = AchievementService.run_retroactive_check(user_id)
        print(f"🎯 Newly completed achievements: {len(newly_completed)}")
        
        for achievement in newly_completed:
            print(f"  🏆 {achievement.name}: {achievement.description}")
        
        # Show all achievements with progress
        achievements = Achievement.query.all()
        for achievement in achievements:
            user_progress = UserAchievement.query.filter_by(
                user_id=user_id, 
                achievement_id=achievement.id
            ).first()
            
            if user_progress:
                progress = user_progress.progress
                status = "✅ COMPLETED" if user_progress.is_completed else "🔄 IN PROGRESS"
                print(f"  {status} {achievement.name}: {progress['current']}/{progress['target']}")
            else:
                print(f"  ⚪ NOT STARTED: {achievement.name}")
                
    except Exception as e:
        print(f"❌ Error during testing: {e}")

def main():
    parser = argparse.ArgumentParser(description='Manage MTG Collection achievements')
    parser.add_argument('--basic', action='store_true', help='Add basic achievements')
    parser.add_argument('--mtg', action='store_true', help='Add MTG-specific achievements')
    parser.add_argument('--fun', action='store_true', help='Add fun achievements')
    parser.add_argument('--all', action='store_true', help='Add all achievements')
    parser.add_argument('--test', action='store_true', help='Test achievement checking')
    parser.add_argument('--clear', action='store_true', help='Clear all achievements')
    
    args = parser.parse_args()
    
    with app.app_context():
        if args.clear:
            clear_achievements()
        elif args.test:
            test_achievements()
        elif args.basic or args.all:
            achievements = create_basic_achievements()
            add_achievements(achievements)
        elif args.mtg or args.all:
            achievements = create_mtg_achievements()
            add_achievements(achievements)
        elif args.fun or args.all:
            achievements = create_fun_achievements()
            add_achievements(achievements)
        elif args.all:
            # Add all types
            all_achievements = (
                create_basic_achievements() + 
                create_mtg_achievements() + 
                create_fun_achievements()
            )
            add_achievements(all_achievements)
        else:
            # Default: show help and add basic achievements
            print("🎯 MTG Achievement Manager")
            print("Usage examples:")
            print("  python add_achievements.py --basic     # Add basic achievements")
            print("  python add_achievements.py --all       # Add all achievements")
            print("  python add_achievements.py --test      # Test the system")
            print("  python add_achievements.py --clear     # Clear all achievements")
            print("\nAdding basic achievements by default...")
            achievements = create_basic_achievements()
            add_achievements(achievements)

if __name__ == "__main__":
    main()