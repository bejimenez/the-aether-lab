import { supabase } from '../lib/supabase';
import { getApiBaseUrl } from '../lib/utils.js';

const API_BASE_URL = getApiBaseUrl();

// Helper function to get authentication headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = {
    'Content-Type': 'application/json'
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
};

// Enhanced helper for handling API responses with authentication
const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    
    // Merge with any existing headers
    const headers = {
      ...authHeaders,
      ...options.headers
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle the response
    return await handleResponse(response);
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Helper for handling API responses
const handleResponse = async (response) => {
  if (response.ok) {
    return response.json();
  }
  
  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = { error: 'An unknown error occurred' };
  }
  
  console.error('API Error:', response.status, errorData);
  
  // Handle authentication errors
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    await supabase.auth.signOut();
    throw new Error('Authentication failed. Please log in again.');
  }
  
  if (response.status === 403) {
    throw new Error('Access denied. You do not have permission to perform this action.');
  }
  
  throw new Error(errorData.error || `Request failed with status ${response.status}`);
};

// --- User Functions ---
export const fetchUsers = () => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/users`);
};

// --- Card Search (No auth required for Scryfall search) ---
export const searchScryfallCards = (query) => {
  if (!query.trim()) return Promise.resolve({ cards: [] });
  
  // Scryfall search doesn't need authentication
  return fetch(`${API_BASE_URL}/cards/search?q=${encodeURIComponent(query)}`)
    .then(handleResponse);
};

// Convenience alias to match your App.jsx usage
export const searchCards = searchScryfallCards;

// --- Collection Management (All require authentication) ---

// Original fetchCollection function - still needed by App.jsx
export const fetchCollection = (userId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/collection/search?user_id=${userId}`);
};

// Enhanced collection fetch with pagination and filters
export const fetchCollectionPage = (userId, options = {}) => {
  const {
    page = 1,
    perPage = 20,
    search = '',
    colors = [],
    type = '',
    rarity = '',
    cmcRange = [0, 15],
    sortBy = 'name',
    sortOrder = 'asc'
  } = options;

  const params = new URLSearchParams({
    user_id: userId,
    page: page.toString(),
    per_page: perPage.toString(),
    q: search,
    type: type,
    sort_by: sortBy,
    sort_order: sortOrder
  });

  // Add colors as comma-separated list if provided
  if (colors.length > 0) {
    params.append('colors', colors.join(','));
  }

  if (rarity) {
    params.append('rarity', rarity);
  }

  // Add CMC range parameters
  if (cmcRange && (cmcRange[0] !== 0 || cmcRange[1] !== 15)) {
    params.append('cmc_min', cmcRange[0].toString());
    params.append('cmc_max', cmcRange[1].toString());
  }

  return makeAuthenticatedRequest(`${API_BASE_URL}/collection/search?${params.toString()}`);
};

// Fetch all card IDs for search/filter (lightweight)
export const fetchCollectionIndex = (userId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/collection/index?user_id=${userId}`);
};

export const fetchCollectionStats = (userId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/collection/stats?user_id=${userId}`);
};

export const addCardToCollection = (userId, scryfallId, quantity = 1) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/collection/add`, {
    method: 'POST',
    body: JSON.stringify({ 
      user_id: userId, 
      scryfall_id: scryfallId, 
      quantity: quantity 
    }),
  });
};

// Alias to match your App.jsx usage
export const addToCollection = addCardToCollection;

export const updateCardInCollection = (collectionCardId, newQuantity) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/collection/update`, {
    method: 'PUT',
    body: JSON.stringify({ 
      collection_card_id: collectionCardId, 
      quantity: newQuantity 
    }),
  });
};

// New function to match your App.jsx usage
export const updateCardQuantity = (userId, cardId, newQuantity) => {
  // This assumes you have an endpoint that updates by user_id and card_id
  // You might need to adjust this based on your actual backend implementation
  return makeAuthenticatedRequest(`${API_BASE_URL}/collection/update-quantity`, {
    method: 'PUT',
    body: JSON.stringify({ 
      user_id: userId,
      card_id: cardId,
      quantity: newQuantity 
    }),
  });
};

// New function to match your App.jsx usage
export const removeFromCollection = (userId, cardId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/collection/remove`, {
    method: 'DELETE',
    body: JSON.stringify({ 
      user_id: userId,
      card_id: cardId
    }),
  });
};

// --- Deck Management (All require authentication) ---
export const fetchDecks = (userId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/decks?user_id=${userId}`);
};

export const fetchDeckDetails = (deckId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/decks/${deckId}`);
};

export const createDeck = (userId, deckData) => {
  // Handle both string (just name) and object (full data) inputs
  const payload = typeof deckData === 'string' 
    ? { 
        name: deckData, 
        user_id: userId, 
        format: 'casual', 
        description: '' 
      }
    : { 
        user_id: userId, 
        format: 'casual', 
        description: '', 
        ...deckData 
      };

  return makeAuthenticatedRequest(`${API_BASE_URL}/decks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const deleteDeck = (deckId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/decks/${deckId}`, {
    method: 'DELETE',
  });
};

export const addCardToDeck = (deckId, scryfallId, cardType = 'mainboard', quantity = 1) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/decks/${deckId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ 
      scryfall_id: scryfallId, 
      quantity: quantity, 
      card_type: cardType 
    }),
  });
};

export const updateDeckCard = (deckId, deckCardId, quantity) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/decks/${deckId}/cards/${deckCardId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
};

export const removeDeckCard = (deckId, deckCardId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/decks/${deckId}/cards/${deckCardId}`, {
    method: 'DELETE',
  });
};

// New function for "build around this card" functionality
export const buildDeckAroundCard = async (userId, scryfallId) => {
  return makeAuthenticatedRequest(`${API_BASE_URL}/decks/build-around/${scryfallId}`, {
    method: 'POST',
    body: JSON.stringify({ 
      user_id: userId
    }),
  });
};

// Basic lands function - adds basic land to deck by searching for it first
export const addBasicLandToDeck = async (deckId, landName) => {
  try {
    // First, search for the basic land to get its scryfall_id
    const searchResponse = await searchScryfallCards(landName);
    
    if (!searchResponse.cards || searchResponse.cards.length === 0) {
      throw new Error(`${landName} not found`);
    }
    
    // Find the basic land (usually the first result for basic lands)
    const basicLand = searchResponse.cards.find(card => 
      card.type_line && card.type_line.includes('Basic Land') && 
      card.name === landName
    ) || searchResponse.cards[0];
    
    if (!basicLand) {
      throw new Error(`Basic ${landName} not found`);
    }
    
    // Add the basic land to the deck
    return await addCardToDeck(deckId, basicLand.scryfall_id);
    
  } catch (error) {
    console.error('Error adding basic land to deck:', error);
    throw error;
  }
};

// --- Utility Functions ---

// Function to check if user is authenticated before making requests
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.access_token;
};

// Function to get current user info
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

// Function to refresh authentication token
export const refreshToken = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
  return data;
};

// --- Printing Variants Management ---

// Get all printing variants for a specific card
export const getCardPrintings = (scryfallId, userId) => {
  return fetch(`${API_BASE_URL}/collection/printings/by-card/${scryfallId}?user_id=${userId}`);
};

// Add a new printing variant
export const addPrintingVariant = (printingData) => {
  return fetch(`${API_BASE_URL}/collection/printings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(printingData),
  });
};

// Update a printing variant
export const updatePrintingVariant = (printingId, printingData) => {
  return fetch(`${API_BASE_URL}/collection/printings/${printingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(printingData),
  });
};

// Delete a printing variant
export const deletePrintingVariant = (printingId) => {
  return fetch(`${API_BASE_URL}/collection/printings/${printingId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};