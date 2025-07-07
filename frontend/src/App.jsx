import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './api/mtgApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Library, Layers, TrendingUp, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeSwitcher from './components/ThemeSwitcher';
import MobileMenu from './components/MobileMenu';
import SearchTab from './components/SearchTab';
import CollectionTab from './components/CollectionTab';
import CardDetailsModal from './components/CardDetailsModal';
import DecksTab from './components/DecksTab';
import StatsTab from './components/StatsTab';
import CreateDeckDialog from './components/CreateDeckDialog';
import DeckBuilder from './components/DeckBuilder';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './components/ui/toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './App.css';

// Optional: Help overlay component
const KeyboardShortcutsHelp = () => {
  const [showHelp, setShowHelp] = useState(false);

  // Show help with ? key
  useKeyboardShortcuts({
    'h': () => setShowHelp(true),
    'escape': () => setShowHelp(false),
  });

  if (!showHelp) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
          Press h for keyboard shortcuts
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
        <h3 className="font-bold mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">/</kbd></span>
            <span>Focus search</span>
          </div>
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd></span>
            <span>Clear search / Unfocus</span>
          </div>
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">1-4</kbd></span>
            <span>Switch tabs</span>
          </div>
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">a</kbd></span>
            <span>Add to collection</span>
          </div>
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">d</kbd></span>
            <span>Remove from collection</span>
          </div>
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">+/-</kbd></span>
            <span>Adjust quantity</span>
          </div>
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">b</kbd></span>
            <span>Build deck around card</span>
          </div>
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+K</kbd></span>
            <span>Clear search</span>
          </div>
          <div className="flex justify-between">
            <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">?</kbd></span>
            <span>Show this help</span>
          </div>
        </div>
        <button 
          onClick={() => setShowHelp(false)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Main App Content Component (this is what gets rendered when user is logged in)
function AppContent() {
  // Get authentication data from context
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  
  // Get toast functionality
  const { addToast } = useToast();

  // Keep all your existing state
  const [searchResults, setSearchResults] = useState([]);
  const [collection, setCollection] = useState([]);
  const [collectionStats, setCollectionStats] = useState({});
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [isCreateDeckOpen, setCreateDeckOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [isDeckBuilderOpen, setDeckBuilderOpen] = useState(false);
  const [selectedCardForDetails, setSelectedCardForDetails] = useState(null);
  const [isCardDetailsOpen, setCardDetailsOpen] = useState(false);
  const [collectionUpdateTrigger, setCollectionUpdateTrigger] = useState(0);
  
  // Ref for search input to enable focus via keyboard shortcut
  const searchInputRef = useRef(null);
  
  // Function to clear search - needed for keyboard shortcuts
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    // Clear search query in SearchTab
    if (searchInputRef.current && searchInputRef.current.clearSearch) {
      searchInputRef.current.clearSearch();
    }
  }, []);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    '/': () => {
      // Focus search input
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        setActiveTab('search');
      }
    },
    'escape': () => {
      // Clear search and unfocus
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      // Clear search if we're on search tab
      if (activeTab === 'search') {
        clearSearch();
      }
    },
    '1': () => setActiveTab('search'),
    '2': () => setActiveTab('collection'),
    '3': () => setActiveTab('decks'),
    '4': () => setActiveTab('stats'),
    'ctrl+k': () => {
      // Clear search
      if (activeTab === 'search') {
        clearSearch();
      }
    },
  });

  // Updated loadUserData to use userProfile.id instead of currentUser
  const loadUserData = useCallback(async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    try {
      const [collectionData, statsData, decksData] = await Promise.all([
        api.fetchCollection(userProfile.id),
        api.fetchCollectionStats(userProfile.id),
        api.fetchDecks(userProfile.id)
      ]);
      setCollection(collectionData.collection_cards || []);
      setCollectionStats(statsData);
      setDecks(decksData.decks || []);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  // Load user data when userProfile changes
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // --- Event Handlers ---
  const handleSearch = useCallback(async (query) => {
  if (!query.trim()) {
    setSearchResults([]);
    setLoading(false);
    return;
  }
  
  setLoading(true);
  try {
    const results = await api.searchCards(query);
    setSearchResults(Array.isArray(results) ? results : results.cards || []);
  } catch (error) {
    console.error("Search failed:", error);
    setSearchResults([]);
  } finally {
    setLoading(false);
  }
}, []);

  const handleShowCardDetails = (card) => {
  setSelectedCardForDetails(card);
  setCardDetailsOpen(true);
};

const handleCloseCardDetails = () => {
  setCardDetailsOpen(false);
  setSelectedCardForDetails(null);
};

  const handleAddToCollection = useCallback(async (card, quantity = 1) => {
  if (!userProfile?.id) return;
  
  try {
    // FIX: Use card.scryfall_id instead of card.id
    await api.addToCollection(userProfile.id, card.scryfall_id, quantity);
    await loadUserData();
    
    // Force SearchTab to update by incrementing trigger
    setCollectionUpdateTrigger(prev => prev + 1);
    
    // Show success toast
    addToast('Card Added!', 'Your card has been added to your collection.', 'success');
  } catch (error) {
    console.error("Failed to add to collection:", error);
    addToast('Error', 'Failed to add card to collection.', 'error');
  }
}, [userProfile?.id, loadUserData, addToast]);

  const handleRemoveFromCollection = useCallback(async (cardId) => {
  if (!userProfile?.id) return;
  
  try {
    await api.removeFromCollection(userProfile.id, cardId);
    await loadUserData();
    
    // Force SearchTab to update by incrementing trigger
    setCollectionUpdateTrigger(prev => prev + 1);
    
  } catch (error) {
    console.error("Failed to remove from collection:", error);
  }
}, [userProfile?.id, loadUserData]);

  const handleUpdateQuantity = useCallback(async (cardId, newQuantity) => {
  if (!userProfile?.id) return;
  
  try {
    if (newQuantity <= 0) {
      await api.removeFromCollection(userProfile.id, cardId);
    } else {
      await api.updateCardQuantity(userProfile.id, cardId, newQuantity);
    }
    await loadUserData();
    
    // Force SearchTab to update by incrementing trigger
    setCollectionUpdateTrigger(prev => prev + 1);
    
  } catch (error) {
    console.error("Failed to update quantity:", error);
  }
}, [userProfile?.id, loadUserData]);

  const handleCreateDeck = useCallback(async (deckData) => {
    if (!userProfile?.id) return;
    
    try {
      await api.createDeck(userProfile.id, deckData);
      await loadUserData();
      setCreateDeckOpen(false);
    } catch (error) {
      console.error("Failed to create deck:", error);
    }
  }, [userProfile?.id, loadUserData]);

  const handleDeleteDeck = useCallback(async (deckId) => {
    if (!userProfile?.id) return;
    
    try {
      await api.deleteDeck(deckId);
      await loadUserData();
    } catch (error) {
      console.error("Failed to delete deck:", error);
    }
  }, [userProfile?.id, loadUserData]);

  const handleBuildAroundCard = useCallback(async (card) => {
    if (!userProfile?.id) return;
    
    try {
      const response = await api.buildDeckAroundCard(userProfile.id, card.scryfall_id);
      if (response.deck) {
        setSelectedDeck(response.deck);
        setDeckBuilderOpen(true);
      }
    } catch (error) {
      console.error("Failed to build deck around card:", error);
    }
  }, [userProfile?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login component
  // TEMPORARY: Demo mode for testing layout (add ?demo=true to URL)
  const urlParams = new URLSearchParams(window.location.search);
  const demoMode = urlParams.get('demo') === 'true';
  
  if (!user && !demoMode) {
    return <Login />;
  }

  // Main app content for logged-in users
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with user info and sign out */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">The Aether Lab</h1>
          
          {/* Desktop Header Controls - hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {userProfile?.username || user?.email || 'Demo User'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <ThemeSwitcher />
          </div>

          {/* Mobile Menu - shown only on mobile */}
          <div className="md:hidden">
            <MobileMenu 
              userProfile={userProfile}
              user={user}
              onSignOut={handleSignOut}
            />
          </div>
        </div>

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              Collection ({collection.length})
            </TabsTrigger>
            <TabsTrigger value="decks" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Decks ({decks.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-6">
            <SearchTab
              onSearch={handleSearch}
              searchResults={searchResults}
              onAddCard={handleAddToCollection}
              onShowDetails={handleShowCardDetails}
              loading={loading}
              collection={collection}
              searchInputRef={searchInputRef}
              collectionUpdateTrigger={collectionUpdateTrigger} // Pass trigger to force update
            />
          </TabsContent>

          <TabsContent value="collection" className="mt-6">
            <CollectionTab
              collection={collection}
              onRemoveFromCollection={handleRemoveFromCollection}
              onUpdateQuantity={handleUpdateQuantity}
              onBuildAroundCard={handleBuildAroundCard}
              userId={userProfile?.id}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="decks" className="mt-6">
            <DecksTab
              decks={decks}
              onCreateDeckClick={() => setCreateDeckOpen(true)}
              onDeckClick={(deck) => {
                setSelectedDeck(deck);
                setDeckBuilderOpen(true);
              }}
              onDeleteDeck={handleDeleteDeck}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <StatsTab
              stats={collectionStats}
              collection={collection}
              decks={decks}
              loading={loading}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateDeckDialog
          open={isCreateDeckOpen}
          onOpenChange={setCreateDeckOpen}
          onCreateDeck={handleCreateDeck}
        />

        {isDeckBuilderOpen && selectedDeck && (
          <DeckBuilder
            deck={selectedDeck}
            collection={collection}
            userProfile={userProfile} // Pass userProfile instead of currentUser
            onClose={() => {
              setDeckBuilderOpen(false);
              setSelectedDeck(null);
              loadUserData();
            }}
          />
        )}
      </div>

      {/* Card Details Modal for Search Results */}
      {selectedCardForDetails && (
        <CardDetailsModal
          card={selectedCardForDetails}
          collectionCard={collection.find(cc => cc.scryfall_id === selectedCardForDetails.scryfall_id)}
          isOpen={isCardDetailsOpen}
          onClose={handleCloseCardDetails}
          onBuildAround={handleBuildAroundCard}
          onUpdateQuantity={handleUpdateQuantity}
        />
      )}
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />
    </div>
  );
}

// Main App Component with Authentication Provider
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;