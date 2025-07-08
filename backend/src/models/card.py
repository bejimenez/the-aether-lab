from src.models.user import db
from datetime import datetime
import uuid

class Card(db.Model):
    """Cache table for Magic cards from Scryfall API"""
    __tablename__ = 'cards_cache'
    
    scryfall_id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    mana_cost = db.Column(db.String(100))
    cmc = db.Column(db.Integer)
    type_line = db.Column(db.String(255))
    oracle_text = db.Column(db.Text)
    colors = db.Column(db.JSON)  # PostgreSQL supports JSON
    keywords = db.Column(db.JSON)  # PostgreSQL supports JSON
    image_uri = db.Column(db.String(500))
    local_image_url = db.Column(db.String(500))
    power = db.Column(db.String(10))
    toughness = db.Column(db.String(10))
    rarity = db.Column(db.String(20))
    set_code = db.Column(db.String(10))
    set_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Card {self.name}>'
    
    def to_dict(self):
        return {
            'scryfall_id': self.scryfall_id,
            'name': self.name,
            'mana_cost': self.mana_cost,
            'cmc': self.cmc,
            'type_line': self.type_line,
            'oracle_text': self.oracle_text,
            'colors': self.colors,
            'keywords': self.keywords,
            'image_uri': self.image_uri,
            'local_image_url': self.local_image_url,
            'power': self.power,
            'toughness': self.toughness,
            'rarity': self.rarity,
            'set_code': self.set_code,
            'set_name': self.set_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class CollectionCard(db.Model):
    """User's card collection"""
    __tablename__ = 'collection_cards'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    scryfall_id = db.Column(db.String(36), db.ForeignKey('cards_cache.scryfall_id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    is_foil = db.Column(db.Boolean, default=False, nullable=False)
    condition = db.Column(db.String(20), default='near_mint', nullable=False)
    printing_details = db.Column(db.JSON, nullable=True)
    added_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    card = db.relationship('Card', backref='collection_entries')
    
    # Updated unique constraint to allow multiple printings of the same card
    # We'll use a combination of user_id, scryfall_id, is_foil, condition, and printing details hash
    __table_args__ = (
        db.Index('idx_user_card_printing', 'user_id', 'scryfall_id', 'is_foil', 'condition'),
    )
    
    def __repr__(self):
        return f'<CollectionCard user_id={self.user_id} card={self.scryfall_id} qty={self.quantity}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'scryfall_id': self.scryfall_id,
            'quantity': self.quantity,
            'is_foil': self.is_foil,
            'condition': self.condition,
            'printing_details': self.printing_details,
            'added_at': self.added_at.isoformat() if self.added_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'card': self.card.to_dict() if self.card else None
        }

class Deck(db.Model):
    """User's decks"""
    __tablename__ = 'decks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    format = db.Column(db.String(50))  # 'standard', 'modern', 'commander', etc.
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Deck {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'format': self.format,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class DeckCard(db.Model):
    """Cards in decks"""
    __tablename__ = 'deck_cards'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    deck_id = db.Column(db.String(36), db.ForeignKey('decks.id'), nullable=False, index=True)
    scryfall_id = db.Column(db.String(36), db.ForeignKey('cards_cache.scryfall_id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    card_type = db.Column(db.String(20), default='mainboard')  # 'mainboard' or 'sideboard'
    added_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    deck = db.relationship('Deck', backref='cards')
    card = db.relationship('Card', backref='deck_entries')
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('deck_id', 'scryfall_id', 'card_type', name='unique_deck_card'),)
    
    def __repr__(self):
        return f'<DeckCard deck={self.deck_id} card={self.scryfall_id} qty={self.quantity}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'deck_id': self.deck_id,
            'scryfall_id': self.scryfall_id,
            'quantity': self.quantity,
            'card_type': self.card_type,
            'added_at': self.added_at.isoformat() if self.added_at else None,
            'card': self.card.to_dict() if self.card else None
        }