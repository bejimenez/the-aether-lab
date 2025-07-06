from flask import Blueprint, request, jsonify
import requests
import time
from src.models.user import db
from src.models.card import Card, CollectionCard
from src.middleware.auth import require_auth

cards_bp = Blueprint('cards', __name__)

# Scryfall API base URL
SCRYFALL_API_BASE = 'https://api.scryfall.com'

@cards_bp.route("/collection/<int:user_id>", methods=["GET"])
@require_auth
def get_collection(user_id):
    # Verify user can only access their own collection
    if request.current_user.id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

@cards_bp.route('/cards/search', methods=['GET'])
def search_cards():
    """Search for cards using Scryfall API with local caching"""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'Query parameter q is required'}), 400
    
    try:
        # First check if we have cached results
        cached_cards = Card.query.filter(Card.name.ilike(f'%{query}%')).limit(20).all()
        
        if cached_cards:
            return jsonify({
                'cards': [card.to_dict() for card in cached_cards],
                'source': 'cache'
            })
        
        # If no cached results, search Scryfall API
        response = requests.get(
            f'{SCRYFALL_API_BASE}/cards/search',
            params={'q': query, 'order': 'name'},
            timeout=10
        )
        
        if response.status_code == 404:
            return jsonify({'cards': [], 'source': 'api'})
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to search cards'}), 500
        
        data = response.json()
        cards = []
        
        # Cache the results and return them
        for card_data in data.get('data', []):
            # Check if card already exists in cache
            existing_card = Card.query.filter_by(scryfall_id=card_data['id']).first()
            
            if not existing_card:
                # Create new card entry
                card = Card(
                    scryfall_id=card_data['id'],
                    name=card_data['name'],
                    mana_cost=card_data.get('mana_cost', ''),
                    cmc=card_data.get('cmc', 0),
                    type_line=card_data.get('type_line', ''),
                    oracle_text=card_data.get('oracle_text', ''),
                    colors=card_data.get('colors', []),
                    keywords=card_data.get('keywords', []),
                    image_uri=card_data.get('image_uris', {}).get('normal', ''),
                    power=card_data.get('power'),
                    toughness=card_data.get('toughness'),
                    rarity=card_data.get('rarity', ''),
                    set_code=card_data.get('set', ''),
                    set_name=card_data.get('set_name', '')
                )
                db.session.add(card)
                cards.append(card.to_dict())
            else:
                cards.append(existing_card.to_dict())
        
        db.session.commit()
        
        return jsonify({
            'cards': cards,
            'source': 'api'
        })
        
    except requests.RequestException as e:
        return jsonify({'error': f'API request failed: {str(e)}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@cards_bp.route('/collection/add', methods=['POST'])
def add_to_collection():
    """Add a card to user's collection"""
    data = request.get_json()
    
    if not data or 'scryfall_id' not in data:
        return jsonify({'error': 'scryfall_id is required'}), 400
    
    scryfall_id = data['scryfall_id']
    quantity = data.get('quantity', 1)
    user_id = data.get('user_id', 1)  # For now, use default user_id
    
    try:
        # Check if card exists in cache
        card = Card.query.filter_by(scryfall_id=scryfall_id).first()
        if not card:
            return jsonify({'error': 'Card not found in cache'}), 404
        
        # Check if user already has this card
        existing_entry = CollectionCard.query.filter_by(
            user_id=user_id,
            scryfall_id=scryfall_id
        ).first()
        
        if existing_entry:
            # Update quantity
            existing_entry.quantity += quantity
            db.session.commit()
            return jsonify({
                'message': 'Card quantity updated',
                'collection_card': existing_entry.to_dict()
            })
        else:
            # Add new entry
            collection_card = CollectionCard(
                user_id=user_id,
                scryfall_id=scryfall_id,
                quantity=quantity
            )
            db.session.add(collection_card)
            db.session.commit()
            return jsonify({
                'message': 'Card added to collection',
                'collection_card': collection_card.to_dict()
            })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add card: {str(e)}'}), 500

@cards_bp.route('/collection/search', methods=['GET'])
@require_auth
def search_collection():
    """Enhanced search with sorting and rarity filter"""
    user_id = request.args.get('user_id', type=int)
    
    # Verify user can only access their own collection
    if request.current_user.id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    query = request.args.get('q', '').strip()
    colors = request.args.get('colors', '').split(',') if request.args.get('colors') else []
    card_type = request.args.get('type', '').strip()
    rarity = request.args.get('rarity', '').strip()
    sort_by = request.args.get('sort_by', 'name')
    sort_order = request.args.get('sort_order', 'asc')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    try:
        # Build query
        collection_query = db.session.query(CollectionCard).join(Card).filter(
            CollectionCard.user_id == user_id
        )
        
        # Apply filters
        if query:
            collection_query = collection_query.filter(
                db.or_(
                    Card.name.ilike(f'%{query}%'),
                    Card.type_line.ilike(f'%{query}%'),
                    Card.oracle_text.ilike(f'%{query}%')
                )
            )
        
        if colors:
            color_filters = []
            for color in colors:
                if color.strip():
                    if color == 'Colorless':
                        color_filters.append(db.or_(Card.colors == None, Card.colors == []))
                    else:
                        color_filters.append(Card.colors.contains([color.strip().upper()]))
            if color_filters:
                collection_query = collection_query.filter(db.or_(*color_filters))
        
        if card_type:
            collection_query = collection_query.filter(Card.type_line.ilike(f'%{card_type}%'))
        
        if rarity:
            collection_query = collection_query.filter(Card.rarity == rarity)
        
        # Apply sorting
        if sort_by == 'name':
            order_column = Card.name
        elif sort_by == 'cmc':
            order_column = Card.cmc
        elif sort_by == 'quantity':
            order_column = CollectionCard.quantity
        else:
            order_column = Card.name
        
        if sort_order == 'desc':
            collection_query = collection_query.order_by(order_column.desc())
        else:
            collection_query = collection_query.order_by(order_column.asc())
        
        # Get total count before pagination
        total = collection_query.count()
        
        # Paginate results
        offset = (page - 1) * per_page
        collection_cards = collection_query.offset(offset).limit(per_page).all()
        
        return jsonify({
            'collection_cards': [cc.to_dict() for cc in collection_cards],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        })
        
    except Exception as e:
        return jsonify({'error': f'Collection search failed: {str(e)}'}), 500

@cards_bp.route('/collection/index', methods=['GET'])
@require_auth
def get_collection_index():
    """Get a lightweight index of all cards in collection for client-side search"""
    user_id = request.args.get('user_id', type=int)
    
    # Verify user can only access their own collection
    if request.current_user.id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        # Get minimal data for all cards
        collection_cards = db.session.query(
            CollectionCard.id,
            CollectionCard.scryfall_id,
            Card.name,
            Card.type_line,
            Card.colors,
            Card.rarity,
            Card.cmc
        ).join(Card).filter(
            CollectionCard.user_id == user_id
        ).all()
        
        index = [{
            'id': cc.id,
            'scryfall_id': cc.scryfall_id,
            'name': cc.name,
            'type_line': cc.type_line,
            'colors': cc.colors,
            'rarity': cc.rarity,
            'cmc': cc.cmc
        } for cc in collection_cards]
        
        return jsonify({
            'index': index,
            'total': len(index)
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get collection index: {str(e)}'}), 500

@cards_bp.route('/collection/update', methods=['PUT'])
def update_collection_card():
    """Update card quantity in collection"""
    data = request.get_json()
    
    if not data or 'collection_card_id' not in data:
        return jsonify({'error': 'collection_card_id is required'}), 400
    
    collection_card_id = data['collection_card_id']
    new_quantity = data.get('quantity', 1)
    
    try:
        collection_card = CollectionCard.query.filter_by(id=collection_card_id).first()
        if not collection_card:
            return jsonify({'error': 'Collection card not found'}), 404
        
        if new_quantity <= 0:
            # Remove card from collection
            db.session.delete(collection_card)
            db.session.commit()
            return jsonify({'message': 'Card removed from collection'})
        else:
            # Update quantity
            collection_card.quantity = new_quantity
            db.session.commit()
            return jsonify({
                'message': 'Card quantity updated',
                'collection_card': collection_card.to_dict()
            })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update card: {str(e)}'}), 500

@cards_bp.route('/collection/update-quantity', methods=['PUT'])
def update_card_quantity():
    """Update card quantity in collection by user_id and card_id"""
    data = request.get_json()
    
    if not data or 'user_id' not in data or 'card_id' not in data:
        return jsonify({'error': 'user_id and card_id are required'}), 400
    
    user_id = data['user_id']
    card_id = data['card_id']  # This is scryfall_id
    new_quantity = data.get('quantity', 1)
    
    try:
        # Find the collection card by user_id and scryfall_id
        collection_card = CollectionCard.query.filter_by(
            user_id=user_id,
            scryfall_id=card_id
        ).first()
        
        if not collection_card:
            return jsonify({'error': 'Collection card not found'}), 404
        
        if new_quantity <= 0:
            # Remove card from collection
            db.session.delete(collection_card)
            db.session.commit()
            return jsonify({'message': 'Card removed from collection'})
        else:
            # Update quantity
            collection_card.quantity = new_quantity
            db.session.commit()
            return jsonify({
                'message': 'Card quantity updated',
                'collection_card': collection_card.to_dict()
            })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update card: {str(e)}'}), 500

@cards_bp.route('/collection/remove', methods=['DELETE'])
def remove_from_collection():
    """Remove a card from user's collection"""
    data = request.get_json()
    
    if not data or 'user_id' not in data or 'card_id' not in data:
        return jsonify({'error': 'user_id and card_id are required'}), 400
    
    user_id = data['user_id']
    card_id = data['card_id']  # This is scryfall_id
    
    try:
        # Find the collection card by user_id and scryfall_id
        collection_card = CollectionCard.query.filter_by(
            user_id=user_id,
            scryfall_id=card_id
        ).first()
        
        if not collection_card:
            return jsonify({'error': 'Collection card not found'}), 404
        
        # Remove card from collection
        db.session.delete(collection_card)
        db.session.commit()
        return jsonify({'message': 'Card removed from collection'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to remove card: {str(e)}'}), 500

@cards_bp.route('/collection/stats', methods=['GET'])
def collection_stats():
    """Get collection statistics"""
    user_id = request.args.get('user_id', 1, type=int)
    
    try:
        # Get basic stats
        total_cards = db.session.query(db.func.sum(CollectionCard.quantity)).filter(
            CollectionCard.user_id == user_id
        ).scalar() or 0
        
        unique_cards = CollectionCard.query.filter_by(user_id=user_id).count()
        
        # Get color distribution
        color_stats = db.session.query(
            Card.colors,
            db.func.sum(CollectionCard.quantity).label('count')
        ).join(CollectionCard).filter(
            CollectionCard.user_id == user_id
        ).group_by(Card.colors).all()
        
        # Get type distribution
        type_stats = db.session.query(
            Card.type_line,
            db.func.sum(CollectionCard.quantity).label('count')
        ).join(CollectionCard).filter(
            CollectionCard.user_id == user_id
        ).group_by(Card.type_line).limit(10).all()
        
        return jsonify({
            'total_cards': total_cards,
            'unique_cards': unique_cards,
            'color_distribution': [{'colors': colors, 'count': count} for colors, count in color_stats],
            'type_distribution': [{'type': type_line, 'count': count} for type_line, count in type_stats]
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500

