from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.card import Card, Deck, DeckCard, CollectionCard

decks_bp = Blueprint('decks', __name__)

@decks_bp.route('/decks', methods=['GET'])
def get_user_decks():
    """Get all decks for a user"""
    user_id = request.args.get('user_id', 1, type=int)
    
    try:
        decks = Deck.query.filter_by(user_id=user_id).all()
        return jsonify({
            'decks': [deck.to_dict() for deck in decks]
        })
    except Exception as e:
        return jsonify({'error': f'Failed to get decks: {str(e)}'}), 500

@decks_bp.route('/decks', methods=['POST'])
def create_deck():
    """Create a new deck"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Deck name is required'}), 400
    
    user_id = data.get('user_id', 1)
    name = data['name']
    description = data.get('description', '')
    format_type = data.get('format', 'casual')
    
    try:
        deck = Deck(
            user_id=user_id,
            name=name,
            description=description,
            format=format_type
        )
        db.session.add(deck)
        db.session.commit()
        
        return jsonify({
            'message': 'Deck created successfully',
            'deck': deck.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create deck: {str(e)}'}), 500

@decks_bp.route('/decks/<deck_id>', methods=['GET'])
def get_deck_details(deck_id):
    """Get deck details with cards"""
    try:
        deck = Deck.query.filter_by(id=deck_id).first()
        if not deck:
            return jsonify({'error': 'Deck not found'}), 404
        
        # Get deck cards
        deck_cards = db.session.query(DeckCard).join(Card).filter(
            DeckCard.deck_id == deck_id
        ).all()
        
        # Calculate deck statistics
        total_cards = sum(dc.quantity for dc in deck_cards)
        mainboard_cards = sum(dc.quantity for dc in deck_cards if dc.card_type == 'mainboard')
        sideboard_cards = sum(dc.quantity for dc in deck_cards if dc.card_type == 'sideboard')
        
        # Calculate mana curve
        mana_curve = {}
        color_distribution = {}
        
        for deck_card in deck_cards:
            if deck_card.card_type == 'mainboard':
                cmc = deck_card.card.cmc or 0
                mana_curve[cmc] = mana_curve.get(cmc, 0) + deck_card.quantity
                
                # Count colors
                colors = deck_card.card.colors or []
                for color in colors:
                    color_distribution[color] = color_distribution.get(color, 0) + deck_card.quantity
        
        return jsonify({
            'deck': deck.to_dict(),
            'cards': [dc.to_dict() for dc in deck_cards],
            'statistics': {
                'total_cards': total_cards,
                'mainboard_cards': mainboard_cards,
                'sideboard_cards': sideboard_cards,
                'mana_curve': mana_curve,
                'color_distribution': color_distribution
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get deck: {str(e)}'}), 500

@decks_bp.route('/decks/<deck_id>/cards', methods=['POST'])
def add_card_to_deck(deck_id):
    """Add a card to a deck"""
    data = request.get_json()
    
    if not data or 'scryfall_id' not in data:
        return jsonify({'error': 'scryfall_id is required'}), 400
    
    scryfall_id = data['scryfall_id']
    quantity = data.get('quantity', 1)
    card_type = data.get('card_type', 'mainboard')  # 'mainboard' or 'sideboard'
    
    try:
        # Check if deck exists
        deck = Deck.query.filter_by(id=deck_id).first()
        if not deck:
            return jsonify({'error': 'Deck not found'}), 404
        
        # Check if card exists
        card = Card.query.filter_by(scryfall_id=scryfall_id).first()
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Check if card is already in deck
        existing_deck_card = DeckCard.query.filter_by(
            deck_id=deck_id,
            scryfall_id=scryfall_id,
            card_type=card_type
        ).first()
        
        if existing_deck_card:
            # Update quantity
            existing_deck_card.quantity += quantity
            db.session.commit()
            return jsonify({
                'message': 'Card quantity updated in deck',
                'deck_card': existing_deck_card.to_dict()
            })
        else:
            # Add new card to deck
            deck_card = DeckCard(
                deck_id=deck_id,
                scryfall_id=scryfall_id,
                quantity=quantity,
                card_type=card_type
            )
            db.session.add(deck_card)
            db.session.commit()
            return jsonify({
                'message': 'Card added to deck',
                'deck_card': deck_card.to_dict()
            })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add card to deck: {str(e)}'}), 500

@decks_bp.route('/decks/<deck_id>/cards/<deck_card_id>', methods=['PUT'])
def update_deck_card(deck_id, deck_card_id):
    """Update card quantity in deck"""
    data = request.get_json()
    
    if not data or 'quantity' not in data:
        return jsonify({'error': 'quantity is required'}), 400
    
    new_quantity = data['quantity']
    
    try:
        deck_card = DeckCard.query.filter_by(id=deck_card_id).first()
        if not deck_card:
            return jsonify({'error': 'Deck card not found'}), 404
        
        if new_quantity <= 0:
            # Remove card from deck
            db.session.delete(deck_card)
            db.session.commit()
            return jsonify({'message': 'Card removed from deck'})
        else:
            # Update quantity
            deck_card.quantity = new_quantity
            db.session.commit()
            return jsonify({
                'message': 'Card quantity updated',
                'deck_card': deck_card.to_dict()
            })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update deck card: {str(e)}'}), 500

@decks_bp.route('/decks/<deck_id>', methods=['DELETE'])
def delete_deck(deck_id):
    """Delete a deck"""
    try:
        deck = Deck.query.filter_by(id=deck_id).first()
        if not deck:
            return jsonify({'error': 'Deck not found'}), 404
        
        # Delete all deck cards first
        DeckCard.query.filter_by(deck_id=deck_id).delete()
        
        # Delete the deck
        db.session.delete(deck)
        db.session.commit()
        
        return jsonify({'message': 'Deck deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete deck: {str(e)}'}), 500

@decks_bp.route('/decks/build-around/<scryfall_id>', methods=['POST'])
def build_around_card(scryfall_id):
    """Build a deck around a specific card from user's collection"""
    data = request.get_json()
    
    user_id = data.get('user_id', 1)
    deck_name = data.get('deck_name', 'New Deck')
    
    try:
        # Get the focus card
        focus_card = Card.query.filter_by(scryfall_id=scryfall_id).first()
        if not focus_card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Check if user owns this card
        collection_card = CollectionCard.query.filter_by(
            user_id=user_id,
            scryfall_id=scryfall_id
        ).first()
        if not collection_card:
            return jsonify({'error': 'Card not in your collection'}), 404
        
        # Create new deck
        deck = Deck(
            user_id=user_id,
            name=f"{deck_name} ({focus_card.name})",
            description=f"Deck built around {focus_card.name}",
            format='casual'
        )
        db.session.add(deck)
        db.session.flush()  # Get the deck ID
        
        # Add the focus card to the deck
        deck_card = DeckCard(
            deck_id=deck.id,
            scryfall_id=scryfall_id,
            quantity=min(4, collection_card.quantity),  # Max 4 copies
            card_type='mainboard'
        )
        db.session.add(deck_card)
        
        # Find synergistic cards from user's collection
        focus_colors = focus_card.colors or []
        focus_types = focus_card.type_line.lower() if focus_card.type_line else ''
        
        # Get user's collection for synergy analysis
        user_collection = db.session.query(CollectionCard).join(Card).filter(
            CollectionCard.user_id == user_id,
            CollectionCard.scryfall_id != scryfall_id
        ).all()
        
        # Add synergistic cards (this is a simplified version)
        cards_added = 1  # We already added the focus card
        
        for collection_card in user_collection:
            if cards_added >= 60:  # Standard deck size
                break
                
            card = collection_card.card
            card_colors = card.colors or []
            card_types = card.type_line.lower() if card.type_line else ''
            
            # Simple synergy check - same colors or complementary types
            is_synergistic = (
                # Same colors
                any(color in focus_colors for color in card_colors) or
                # Land cards (always useful)
                'land' in card_types or
                # Artifacts (colorless utility)
                'artifact' in card_types
            )
            
            if is_synergistic:
                # Add card to deck
                deck_card = DeckCard(
                    deck_id=deck.id,
                    scryfall_id=card.scryfall_id,
                    quantity=min(4, collection_card.quantity),
                    card_type='mainboard'
                )
                db.session.add(deck_card)
                cards_added += min(4, collection_card.quantity)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Deck created successfully',
            'deck': deck.to_dict(),
            'cards_added': cards_added
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to build deck: {str(e)}'}), 500

