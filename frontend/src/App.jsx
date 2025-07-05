import { useState, useEffect, useCallback } from 'react';
import * as api from './api/mtgApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Library, Layers, TrendingUp } from 'lucide-react';
import ThemeSwitcher from './components/ThemeSwitcher';
import UserSwitcher from './components/UserSwitcher';
import SearchTab from './components/SearchTab';
import CollectionTab from './components/CollectionTab'; // Import the new component
import DecksTab from './components/DecksTab';
import StatsTab from './components/StatsTab';
import CreateDeckDialog from './components/CreateDeckDialog';
import './App.css';

function App() {
  // State Management
  const [currentUser, setCurrentUser] = useState(1);
  const [users, setUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [collection, setCollection] = useState([]);
  const [collectionStats, setCollectionStats] = useState({});
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [isCreateDeckOpen, setCreateDeckOpen] = useState(false);

  // --- Data Loading ---
  const loadUserData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [collectionData, statsData, decksData] = await Promise.all([
        api.fetchCollection(currentUser),
        api.fetchCollectionStats(currentUser),
        api.fetchDecks(currentUser)
      ]);
      setCollection(collectionData.collection_cards || []);
      setCollectionStats(statsData);
      setDecks(decksData.decks || []);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    api.fetchUsers()
      .then(data => setUsers(Array.isArray(data) ? data : data.users || []))
      .catch(err => console.error("Failed to fetch users:", err));
  }, []);

  useEffect(() => {
    loadUserData();
  }, [currentUser, loadUserData]);

  // --- Event Handlers ---
  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const data = await api.searchScryfallCards(query);
      setSearchResults(data.cards || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCardToCollection = async (card) => {
    try {
      await api.addCardToCollection(currentUser, card.scryfall_id || card.id);
      await loadUserData(); // Refresh all user data
    } catch (error) {
      console.error("Failed to add card:", error);
    }
  };

  const handleUpdateQuantity = async (scryfallId, newQuantity) => {
    const collectionCard = collection.find(c => c.card?.scryfall_id === scryfallId);
    if (!collectionCard) return;
    try {
      await api.updateCardInCollection(collectionCard.id, newQuantity);
      // For a faster UI response, you could update the state locally here
      // before re-fetching, but re-fetching ensures data consistency.
      await loadUserData();
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };
  
  const handleCreateDeck = async (deckName) => {
    try {
      await api.createDeck(currentUser, deckName);
      setCreateDeckOpen(false);
      await loadUserData();
    } catch (error) {
      console.error("Failed to create deck:", error);
    }
  };

  const handleBuildAround = async (card) => {
    try {
      const deckName = `${card.name} Deck`;
      const description = `A deck built around ${card.name}.`;
      const newDeckData = await api.createDeck(currentUser, deckName, 'casual', description);
      await api.addCardToDeck(newDeckData.deck.id, card.scryfall_id || card.id);
      await loadUserData();
      setActiveTab('decks');
    } catch (error) {
        console.error("Failed to build deck:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Magic Card Collection</h1>
          <ThemeSwitcher />
        </header>

        <UserSwitcher users={users} currentUser={currentUser} onUserChange={setCurrentUser} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search"><Search className="w-4 h-4 mr-2" />Search</TabsTrigger>
            <TabsTrigger value="collection"><Library className="w-4 h-4 mr-2" />Collection</TabsTrigger>
            <TabsTrigger value="decks"><Layers className="w-4 h-4 mr-2" />Decks</TabsTrigger>
            <TabsTrigger value="stats"><TrendingUp className="w-4 h-4 mr-2" />Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <SearchTab
              onSearch={handleSearch}
              searchResults={searchResults}
              loading={loading}
              onAddCard={handleAddCardToCollection}
            />
          </TabsContent>

          <TabsContent value="collection">
            {/* THIS IS THE KEY CHANGE: We are now using the CollectionTab component */}
            <CollectionTab
              collection={collection}
              onUpdateQuantity={handleUpdateQuantity}
              onBuildAround={handleBuildAround}
            />
          </TabsContent>

          <TabsContent value="decks">
            <DecksTab decks={decks} onCreateDeckClick={() => setCreateDeckOpen(true)} />
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab stats={collectionStats} deckCount={decks.length} />
          </TabsContent>
        </Tabs>

        <CreateDeckDialog
          open={isCreateDeckOpen}
          onOpenChange={setCreateDeckOpen}
          onCreate={handleCreateDeck}
        />
      </div>
    </div>
  );
}

export default App;