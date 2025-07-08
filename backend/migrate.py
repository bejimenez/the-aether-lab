#!/usr/bin/env python3
"""
Migration script to add printing variant support to collection_cards table
"""

import sqlite3
import sys
import os

# Add the parent directory to sys.path so we can import from src
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def migrate_collection_cards():
    """Add new columns for printing variant support"""
    db_path = 'src/database/app.db'
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Starting migration for printing variants...")
        
        # Check if the new columns already exist
        cursor.execute("PRAGMA table_info(collection_cards)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add new columns if they don't exist
        new_columns = [
            ('is_foil', 'BOOLEAN NOT NULL DEFAULT 0'),
            ('condition', 'VARCHAR(20) NOT NULL DEFAULT "near_mint"'),
            ('printing_details', 'JSON')
        ]
        
        for column_name, column_def in new_columns:
            if column_name not in columns:
                print(f"Adding column {column_name}...")
                cursor.execute(f"ALTER TABLE collection_cards ADD COLUMN {column_name} {column_def}")
            else:
                print(f"Column {column_name} already exists, skipping...")
        
        # Drop the old unique constraint that prevents multiple printings of the same card
        print("Updating constraints...")
        
        # First, check if the constraint exists
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='collection_cards'")
        table_sql = cursor.fetchone()[0]
        
        if 'unique_user_card' in table_sql:
            print("Removing old unique constraint...")
            
            # SQLite doesn't support dropping constraints directly, so we need to recreate the table
            # 1. Create new table with updated schema
            cursor.execute("""
                CREATE TABLE collection_cards_new (
                    id VARCHAR(36) NOT NULL,
                    user_id INTEGER NOT NULL,
                    scryfall_id VARCHAR(36) NOT NULL,
                    quantity INTEGER NOT NULL,
                    is_foil BOOLEAN NOT NULL DEFAULT 0,
                    condition VARCHAR(20) NOT NULL DEFAULT 'near_mint',
                    printing_details JSON,
                    added_at DATETIME,
                    updated_at DATETIME,
                    PRIMARY KEY (id),
                    FOREIGN KEY(user_id) REFERENCES users (id),
                    FOREIGN KEY(scryfall_id) REFERENCES cards_cache (scryfall_id)
                )
            """)
            
            # 2. Copy data from old table to new table
            cursor.execute("""
                INSERT INTO collection_cards_new 
                (id, user_id, scryfall_id, quantity, is_foil, condition, printing_details, added_at, updated_at)
                SELECT id, user_id, scryfall_id, quantity, 
                       COALESCE(is_foil, 0), 
                       COALESCE(condition, 'near_mint'), 
                       printing_details, 
                       added_at, updated_at
                FROM collection_cards
            """)
            
            # 3. Drop old table
            cursor.execute("DROP TABLE collection_cards")
            
            # 4. Rename new table
            cursor.execute("ALTER TABLE collection_cards_new RENAME TO collection_cards")
            
            # 5. Recreate indexes
            cursor.execute("CREATE INDEX ix_collection_cards_user_id ON collection_cards (user_id)")
            cursor.execute("CREATE INDEX ix_collection_cards_scryfall_id ON collection_cards (scryfall_id)")
            cursor.execute("CREATE INDEX idx_user_card_printing ON collection_cards (user_id, scryfall_id, is_foil, condition)")
            
            print("Constraint updated successfully")
        else:
            print("Old constraint not found, adding new index...")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_card_printing ON collection_cards (user_id, scryfall_id, is_foil, condition)")
        
        # Commit changes
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()
    
    return True

if __name__ == "__main__":
    if migrate_collection_cards():
        print("Database migration completed successfully")
        sys.exit(0)
    else:
        print("Database migration failed")
        sys.exit(1)