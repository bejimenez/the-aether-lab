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
    """Get comprehensive collection statistics"""
    user_id = request.args.get('user_id', 1, type=int)
    
    try:
        # Basic collection info
        total_cards = db.session.query(db.func.sum(CollectionCard.quantity)).filter(
            CollectionCard.user_id == user_id
        ).scalar() or 0
        
        unique_cards = CollectionCard.query.filter_by(user_id=user_id).count()
        
        # Average CMC
        avg_cmc = db.session.query(
            db.func.avg(Card.cmc)
        ).join(CollectionCard).filter(
            CollectionCard.user_id == user_id,
            Card.cmc.isnot(None)
        ).scalar() or 0
        
        # === COLOR ANALYSIS ===
        # Enhanced color distribution with multi-color support
        color_results = db.session.query(
            Card.colors,
            db.func.sum(CollectionCard.quantity).label('count')
        ).join(CollectionCard).filter(
            CollectionCard.user_id == user_id
        ).group_by(Card.colors).all()
        
        # Process color combinations
        color_stats = analyze_color_distribution(color_results)
        
        # === RARITY ANALYSIS ===
        rarity_stats = db.session.query(
            Card.rarity,
            db.func.sum(CollectionCard.quantity).label('count')
        ).join(CollectionCard).filter(
            CollectionCard.user_id == user_id
        ).group_by(Card.rarity).all()
        
        rarity_distribution = [
            {'rarity': rarity, 'count': count, 'percentage': round((count / total_cards) * 100, 1)}
            for rarity, count in rarity_stats
        ]
        
        # === CARD TYPE ANALYSIS ===
        type_results = db.session.query(
            Card.type_line,
            db.func.sum(CollectionCard.quantity).label('count')
        ).join(CollectionCard).filter(
            CollectionCard.user_id == user_id
        ).group_by(Card.type_line).all()
        
        type_distribution = analyze_card_types(type_results, total_cards)
        
        # === CREATURE ANALYSIS ===
        creature_stats = analyze_creature_power_toughness(user_id)
        
        # === TRIBAL ANALYSIS ===
        tribal_stats = analyze_tribal_types(user_id)
        
        # === SET ANALYSIS ===
        set_stats = db.session.query(
            Card.set_name,
            Card.set_code,
            db.func.sum(CollectionCard.quantity).label('count'),
            db.func.count(db.distinct(Card.scryfall_id)).label('unique_count')
        ).join(CollectionCard).filter(
            CollectionCard.user_id == user_id
        ).group_by(Card.set_name, Card.set_code).order_by(
            db.func.sum(CollectionCard.quantity).desc()
        ).limit(10).all()
        
        set_distribution = [
            {
                'set_name': set_name,
                'set_code': set_code,
                'total_cards': count,
                'unique_cards': unique_count
            }
            for set_name, set_code, count, unique_count in set_stats
        ]
        
        # === KEYWORDS ANALYSIS ===
        keyword_stats = analyze_keywords(user_id)
        
        # === FORMAT LEGALITY (placeholder for now) ===
        format_legality = {
            'standard': 0,
            'modern': 0,
            'legacy': 0,
            'extended': 0,
            'other_formats': {}
        }
        
        return jsonify({
            # Basic overview
            'total_cards': total_cards,
            'unique_cards': unique_cards,
            'average_cmc': round(avg_cmc, 2),
            
            # Main distributions
            'color_distribution': color_stats,
            'rarity_distribution': rarity_distribution,
            'type_distribution': type_distribution,
            
            # Advanced analysis
            'creature_analysis': creature_stats,
            'tribal_analysis': tribal_stats,
            'set_distribution': set_distribution,
            'keyword_analysis': keyword_stats,
            'format_legality': format_legality
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500


def analyze_color_distribution(color_results):
    """Analyze color combinations including guilds, shards, and custom names"""
    
    # Guild and shard mappings
    GUILDS = {
        ('U', 'W'): 'Azorius',
        ('B', 'U'): 'Dimir', 
        ('B', 'R'): 'Rakdos',
        ('G', 'R'): 'Gruul',
        ('G', 'W'): 'Selesnya',
        ('B', 'G'): 'Golgari',
        ('R', 'U'): 'Izzet',
        ('R', 'W'): 'Boros',
        ('G', 'U'): 'Simic',
        ('B', 'W'): 'Orzhov'
    }
    
    SHARDS = {
        ('G', 'U', 'W'): 'Bant',
        ('B', 'R', 'U'): 'Grixis',
        ('B', 'G', 'R'): 'Jund',
        ('R', 'U', 'W'): 'Jeskai',
        ('B', 'G', 'W'): 'Abzan'
    }
    
    WEDGES = {
        ('B', 'G', 'W'): 'Abzan',
        ('R', 'U', 'W'): 'Jeskai', 
        ('B', 'G', 'R'): 'Sultai',
        ('G', 'R', 'W'): 'Mardu',
        ('B', 'U', 'R'): 'Temur'
    }
    
    color_breakdown = {
        'mono_color': {},
        'guilds': {},
        'shards_wedges': {},
        'quads': [],
        'reapers': [],
        'colorless': 0,
        'total_multicolor': 0
    }
    
    total_cards = sum(count for _, count in color_results)
    
    for colors, count in color_results:
        if not colors or len(colors) == 0:
            color_breakdown['colorless'] = count
        elif len(colors) == 1:
            color_breakdown['mono_color'][colors[0]] = count
        elif len(colors) == 2:
            sorted_colors = tuple(sorted(colors))
            guild_name = GUILDS.get(sorted_colors, f"{'-'.join(sorted_colors)}")
            color_breakdown['guilds'][guild_name] = count
            color_breakdown['total_multicolor'] += count
        elif len(colors) == 3:
            sorted_colors = tuple(sorted(colors))
            shard_name = SHARDS.get(sorted_colors) or WEDGES.get(sorted_colors) or f"{'-'.join(sorted_colors)}"
            color_breakdown['shards_wedges'][shard_name] = count
            color_breakdown['total_multicolor'] += count
        elif len(colors) == 4:
            color_breakdown['quads'].append({
                'colors': sorted(colors),
                'count': count
            })
            color_breakdown['total_multicolor'] += count
        elif len(colors) == 5:
            color_breakdown['reapers'].append({
                'colors': sorted(colors),
                'count': count
            })
            color_breakdown['total_multicolor'] += count
    
    # Add percentages
    for category in ['mono_color', 'guilds', 'shards_wedges']:
        for key, count in color_breakdown[category].items():
            color_breakdown[category][key] = {
                'count': count,
                'percentage': round((count / total_cards) * 100, 1)
            }
    
    return color_breakdown


def analyze_card_types(type_results, total_cards):
    """Analyze card types with categorization"""
    
    type_categories = {
        'creatures': 0,
        'instants': 0,
        'sorceries': 0,
        'artifacts': 0,
        'enchantments': 0,
        'planeswalkers': 0,
        'lands': 0,
        'other': 0
    }
    
    detailed_types = []
    
    for type_line, count in type_results:
        type_line_lower = type_line.lower()
        
        # Categorize
        if 'creature' in type_line_lower:
            type_categories['creatures'] += count
        elif 'instant' in type_line_lower:
            type_categories['instants'] += count
        elif 'sorcery' in type_line_lower:
            type_categories['sorceries'] += count
        elif 'artifact' in type_line_lower:
            type_categories['artifacts'] += count
        elif 'enchantment' in type_line_lower:
            type_categories['enchantments'] += count
        elif 'planeswalker' in type_line_lower:
            type_categories['planeswalkers'] += count
        elif 'land' in type_line_lower:
            type_categories['lands'] += count
        else:
            type_categories['other'] += count
        
        detailed_types.append({
            'type': type_line,
            'count': count,
            'percentage': round((count / total_cards) * 100, 1)
        })
    
    # Add percentages to categories
    for category, count in type_categories.items():
        type_categories[category] = {
            'count': count,
            'percentage': round((count / total_cards) * 100, 1)
        }
    
    return {
        'categories': type_categories,
        'detailed': sorted(detailed_types, key=lambda x: x['count'], reverse=True)[:15]
    }


def analyze_creature_power_toughness(user_id):
    """Analyze creature power and toughness ranges"""
    
    creatures = db.session.query(
        Card.power,
        Card.toughness,
        db.func.sum(CollectionCard.quantity).label('count')
    ).join(CollectionCard).filter(
        CollectionCard.user_id == user_id,
        Card.type_line.ilike('%creature%'),
        Card.power.isnot(None),
        Card.toughness.isnot(None)
    ).group_by(Card.power, Card.toughness).all()
    
    ranges = {
        'utility': 0,      # 0/1 to 1/1
        'efficient': 0,    # 2/2 to 3/3
        'threats': 0,      # 4/4+
        'high_power': 0,   # 5+ power
        'high_toughness': 0, # 5+ toughness
        'variable': 0      # */*, X/X, etc.
    }
    
    for power, toughness, count in creatures:
        try:
            if power == '*' or toughness == '*' or 'X' in str(power) or 'X' in str(toughness):
                ranges['variable'] += count
                continue
                
            p = int(power)
            t = int(toughness)
            
            if p >= 5:
                ranges['high_power'] += count
            if t >= 5:
                ranges['high_toughness'] += count
                
            if p <= 1 and t <= 1:
                ranges['utility'] += count
            elif 2 <= p <= 3 and 2 <= t <= 3:
                ranges['efficient'] += count
            elif p >= 4 or t >= 4:
                ranges['threats'] += count
                
        except (ValueError, TypeError):
            ranges['variable'] += count
    
    total_creatures = sum(ranges.values())
    
    # Add percentages
    for category, count in ranges.items():
        ranges[category] = {
            'count': count,
            'percentage': round((count / total_creatures) * 100, 1) if total_creatures > 0 else 0
        }
    
    return ranges


def analyze_tribal_types(user_id):
    """Analyze creature types for tribal analysis"""
    
    # Get all creatures with their type lines
    creatures = db.session.query(
        Card.type_line,
        db.func.sum(CollectionCard.quantity).label('count')
    ).join(CollectionCard).filter(
        CollectionCard.user_id == user_id,
        Card.type_line.ilike('%creature%')
    ).group_by(Card.type_line).all()
    
    tribal_counts = {}
    
    for type_line, count in creatures:
        # Extract creature types (after "—" if present)
        if '—' in type_line:
            creature_types = type_line.split('—')[1].strip()
        else:
            # Handle cases without — (shouldn't happen in modern cards)
            continue
            
        # Split multiple creature types
        types = [t.strip() for t in creature_types.split()]
        
        for creature_type in types:
            if creature_type.lower() not in ['creature']:  # Skip the word "creature" itself
                tribal_counts[creature_type] = tribal_counts.get(creature_type, 0) + count
    
    # Sort by count and take top 20
    top_tribes = sorted(tribal_counts.items(), key=lambda x: x[1], reverse=True)[:20]
    
    return [
        {
            'tribe': tribe,
            'count': count
        }
        for tribe, count in top_tribes
    ]


def analyze_keywords(user_id):
    """Analyze keywords and abilities"""
    
    keywords_data = db.session.query(
        Card.keywords,
        db.func.sum(CollectionCard.quantity).label('count')
    ).join(CollectionCard).filter(
        CollectionCard.user_id == user_id,
        Card.keywords.isnot(None)
    ).group_by(Card.keywords).all()
    
    keyword_counts = {}
    
    for keywords_list, count in keywords_data:
        if keywords_list:
            for keyword in keywords_list:
                keyword_counts[keyword] = keyword_counts.get(keyword, 0) + count
    
    # Sort by count and take top 20
    top_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:20]
    
    return [
        {
            'keyword': keyword,
            'count': count
        }
        for keyword, count in top_keywords
    ]