import { createContext, useContext, useState, useCallback } from 'react';
import * as api from '../api/mtgApi';

const CollectionContext = createContext();

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
};

export const CollectionProvider = ({ children, userId }) => {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCollection = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const data = await api.fetchCollection(userId);
      setCollection(data.collection_cards || []);
    } catch (error) {
      console.error('Failed to refresh collection:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addToCollection = useCallback(async (cardId, quantity = 1) => {
    if (!userId) return;
    
    try {
      await api.addToCollection(userId, cardId, quantity);
      
      // Optimistically update the collection
      setCollection(prev => {
        const existingCard = prev.find(c => c.scryfall_id === cardId);
        if (existingCard) {
          return prev.map(c => 
            c.scryfall_id === cardId 
              ? { ...c, quantity: c.quantity + quantity }
              : c
          );
        } else {
          // For new cards, we'd need the full card data
          // For now, refresh from server
          refreshCollection();
          return prev;
        }
      });
    } catch (error) {
      console.error('Failed to add to collection:', error);
      // Refresh on error to ensure consistency
      refreshCollection();
    }
  }, [userId, refreshCollection]);

  const updateQuantity = useCallback(async (cardId, newQuantity) => {
    if (!userId) return;
    
    try {
      if (newQuantity <= 0) {
        await api.removeFromCollection(userId, cardId);
        setCollection(prev => prev.filter(c => c.scryfall_id !== cardId));
      } else {
        await api.updateCardQuantity(userId, cardId, newQuantity);
        setCollection(prev => prev.map(c => 
          c.scryfall_id === cardId 
            ? { ...c, quantity: newQuantity }
            : c
        ));
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // Refresh on error to ensure consistency
      refreshCollection();
    }
  }, [userId, refreshCollection]);

  const getCardQuantity = useCallback((cardId) => {
    const card = collection.find(c => c.scryfall_id === cardId);
    return card?.quantity || 0;
  }, [collection]);

  const getCollectionCard = useCallback((cardId) => {
    return collection.find(c => c.scryfall_id === cardId);
  }, [collection]);

  const value = {
    collection,
    loading,
    refreshCollection,
    addToCollection,
    updateQuantity,
    getCardQuantity,
    getCollectionCard
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};