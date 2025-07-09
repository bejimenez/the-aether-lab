# Create a simple script to add test achievements
def seed_test_achievements():
    achievements = [
        {
            'name': 'First Card',
            'description': 'Add your first card to the collection',
            'category': 'collection',
            'rarity': 'common',
            'points': 5,
            'criteria': {'type': 'collection_count', 'target': 1, 'unique': True}
        },
        {
            'name': 'Getting Started',
            'description': 'Collect 10 unique cards',
            'category': 'collection', 
            'rarity': 'common',
            'points': 10,
            'criteria': {'type': 'collection_count', 'target': 10, 'unique': True}
        }
    ]
    
    for ach_data in achievements:
        ach = Achievement(**ach_data)
        db.session.add(ach)
    
    db.session.commit()