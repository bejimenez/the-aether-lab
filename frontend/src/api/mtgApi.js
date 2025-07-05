import { getApiBaseUrl } from '../lib/utils.js';

const API_BASE_URL = getApiBaseUrl();

// Helper for handling API responses
const handleResponse = async (response) => {
  if (response.ok) {
    return response.json();
  }
  const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
  console.error('API Error:', response.status, errorData);
  throw new Error(errorData.error || `Request failed with status ${response.status}`);
};

// --- User Functions ---
export const fetchUsers = () => fetch(`${API_BASE_URL}/users`).then(handleResponse);

// --- Card Search ---
export const searchScryfallCards = (query) => {
  if (!query.trim()) return Promise.resolve({ cards: [] });
  return fetch(`${API_BASE_URL}/cards/search?q=${encodeURIComponent(query)}`).then(handleResponse);
};

// --- Collection Management ---
export const fetchCollection = (userId) => fetch(`${API_BASE_URL}/collection/search?user_id=${userId}`).then(handleResponse);
export const fetchCollectionStats = (userId) => fetch(`${API_BASE_URL}/collection/stats?user_id=${userId}`).then(handleResponse);

export const addCardToCollection = (userId, scryfallId) => {
  return fetch(`${API_BASE_URL}/collection/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, scryfall_id: scryfallId, quantity: 1 }),
  }).then(handleResponse);
};

export const updateCardInCollection = (collectionCardId, newQuantity) => {
  return fetch(`${API_BASE_URL}/collection/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection_card_id: collectionCardId, quantity: newQuantity }),
  }).then(handleResponse);
};

// --- Deck Management ---
export const fetchDecks = (userId) => fetch(`${API_BASE_URL}/decks?user_id=${userId}`).then(handleResponse);

export const fetchDeckDetails = (deckId) => {
  return fetch(`${API_BASE_URL}/decks/${deckId}`)
    .then(handleResponse);
};

export const createDeck = (userId, deckName, format = 'casual', description = '') => {
  return fetch(`${API_BASE_URL}/decks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: deckName, user_id: userId, format, description }),
  }).then(handleResponse);
};

export const addCardToDeck = (deckId, scryfallId, cardType = 'mainboard') => {
  return fetch(`${API_BASE_URL}/decks/${deckId}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scryfall_id: scryfallId, quantity: 1, card_type: cardType }),
  }).then(handleResponse);
};

export const updateDeckCard = (deckId, deckCardId, quantity) => {
  return fetch(`${API_BASE_URL}/decks/${deckId}/cards/${deckCardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  }).then(handleResponse);
};

export const removeDeckCard = (deckId, deckCardId) => {
  return fetch(`${API_BASE_URL}/decks/${deckId}/cards/${deckCardId}`, {
    method: 'DELETE',
  }).then(handleResponse);
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