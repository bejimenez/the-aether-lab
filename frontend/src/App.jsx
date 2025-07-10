import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './api/mtgApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Library, Layers, TrendingUp, LogOut, Trophy } from 'lucide-react';
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
import { useAchievements } from './hooks/useAchievements';
import AchievementTab from './components/AchievementTab';
import { AchievementNotification } from './components/AchievementNotification';
import { AchievementCelebration } from './components/ConfettiCelebration';
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

  // TEMPORARY: Demo mode for testing layout (add ?demo=true to URL)
  const urlParams = new URLSearchParams(window.location.search);
  const demoMode = urlParams.get('demo') === 'true';
  
  // In demo mode, use user ID 1 for testing achievements
  const effectiveUserId = demoMode ? 1 : userProfile?.id;

  // Achievement hook
  const {
    achievements,
    notifications,
    loading: achievementsLoading,
    triggerAchievementCheck,
    checkAchievementsAfterCardAdd,
    fetchAchievements,
    unreadNotifications,
    totalPoints
  } = useAchievements(effectiveUserId);

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
  const [currentCelebration, setCurrentCelebration] = useState(null);
  
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
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      setActiveTab('search');
    }
  },
  'escape': () => {
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    if (activeTab === 'search') {
      clearSearch();
    }
  },
  // ADDED: Global enter handler for search tab when no card is focused
  'enter': () => {
    if (activeTab === 'search' && 
        searchResults.length > 0 && 
        document.activeElement.tagName !== 'INPUT' &&
        !document.activeElement.hasAttribute('tabindex')) { // No card focused
      
      const firstCard = searchResults[0];
      handleAddToCollection(firstCard);
    }
  },
  '1': () => setActiveTab('search'),
  '2': () => setActiveTab('collection'),
  '3': () => setActiveTab('decks'),
  '4': () => setActiveTab('stats'),
  '5': () => setActiveTab('achievements'),
  'ctrl+k': () => {
    if (activeTab === 'search') {
      clearSearch();
    }
  }
});

  // Updated loadUserData to use effectiveUserId instead of userProfile.id
  const loadUserData = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      const [collectionData, statsData, decksData] = await Promise.all([
        api.fetchCollection(effectiveUserId),
        api.fetchCollectionStats(effectiveUserId),
        api.fetchDecks(effectiveUserId)
      ]);
      setCollection(collectionData.collection_cards || []);
      setCollectionStats(statsData);
      setDecks(decksData.decks || []);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

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
// ✅ Define handleAchievementUnlocked FIRST
const handleAchievementUnlocked = useCallback((achievement) => {
  // Show confetti celebration
  setCurrentCelebration(achievement);
  
  // Show toast notification
  addToast(
    '🏆 Achievement Unlocked!',
    `${achievement.name}: ${achievement.description}`,
    'success'
  );
}, [addToast]);

// ✅ Define handleCelebrationComplete SECOND
const handleCelebrationComplete = useCallback(() => {
  setCurrentCelebration(null);
}, []);

// ✅ Now define handleAddToCollection AFTER handleAchievementUnlocked
const handleAddToCollection = useCallback(async (card, quantity = 1) => {
  if (!effectiveUserId) return;
 
  try {
    // Call the API to add the card
    const result = await api.addToCollection(effectiveUserId, card.scryfall_id, quantity);
    
    // CRITICAL FIX: Immediately update the collection state
    if (result && result.collection_card) {
      setCollection(prevCollection => {
        // Check if card already exists in collection
        const existingCardIndex = prevCollection.findIndex(c => c.scryfall_id === card.scryfall_id);
        
        if (existingCardIndex !== -1) {
          // Update existing card with the new data from server
          const newCollection = [...prevCollection];
          newCollection[existingCardIndex] = result.collection_card;
          return newCollection;
        } else {
          // Add new card to collection using the server response
          return [...prevCollection, result.collection_card];
        }
      });
      
      // Force immediate re-render of SearchTab
      setCollectionUpdateTrigger(prev => prev + 1);
    }
    
    // Show success toast immediately
    addToast('Card Added!', 'Your card has been added to your collection.', 'success');
   
    // Check for achievements
    const achievementResult = await checkAchievementsAfterCardAdd();
   
    if (achievementResult?.newly_completed?.length > 0) {
      achievementResult.newly_completed.forEach(achievement => {
        handleAchievementUnlocked(achievement);
      });
    }
    
    // Load full data in background (don't await)
    loadUserData();
    
  } catch (error) {
    console.error("Failed to add card:", error);
    addToast('Error', 'Failed to add card to collection.', 'error');
  }
}, [effectiveUserId, loadUserData, checkAchievementsAfterCardAdd, addToast, handleAchievementUnlocked]);

  const handleRemoveFromCollection = useCallback(async (cardId) => {
  if (!effectiveUserId) return;
  
  try {
    await api.removeFromCollection(effectiveUserId, cardId);
    await loadUserData();
    
    // Force SearchTab to update by incrementing trigger
    setCollectionUpdateTrigger(prev => prev + 1);
    
  } catch (error) {
    console.error("Failed to remove from collection:", error);
  }
}, [effectiveUserId, loadUserData]);

  const handleUpdateQuantity = useCallback(async (scryfallId, newQuantity) => {
  if (!effectiveUserId) return;
  
  try {
    // Call the API
    const result = await api.updateCardQuantity(effectiveUserId, scryfallId, newQuantity);
    
    // Immediate local state update
    setCollection(prevCollection => {
      if (newQuantity <= 0) {
        // Remove card from collection
        return prevCollection.filter(card => card.scryfall_id !== scryfallId);
      } else {
        // Update quantity
        return prevCollection.map(card => 
          card.scryfall_id === scryfallId 
            ? { ...card, quantity: newQuantity }
            : card
        );
      }
    });
    
    // Force SearchTab to refresh immediately
    setCollectionUpdateTrigger(prev => prev + 1);
    
    // Load full data in background (don't await)
    loadUserData();
    
  } catch (error) {
    console.error("Failed to update quantity:", error);
    addToast('Error', 'Failed to update card quantity.', 'error');
  }
}, [effectiveUserId, loadUserData, addToast]);

  const handleDeleteDeck = useCallback(async (deckId) => {
    if (!effectiveUserId) return;
    
    try {
      await api.deleteDeck(deckId);
      await loadUserData();
    } catch (error) {
      console.error("Failed to delete deck:", error);
    }
  }, [effectiveUserId, loadUserData]);

  const handleCreateDeck = useCallback(async (deckData) => {
    if (!effectiveUserId) return;
    
    try {
      await api.createDeck(effectiveUserId, deckData);
      await loadUserData();
      setCreateDeckOpen(false);
      addToast('Deck Created', 'Your new deck has been created successfully.', 'success');
    } catch (error) {
      console.error("Failed to create deck:", error);
      addToast('Error', 'Failed to create deck.', 'error');
    }
  }, [effectiveUserId, loadUserData, addToast]);

  const handleBuildAroundCard = useCallback(async (card) => {
    if (!effectiveUserId) return;
    
    try {
      const response = await api.buildDeckAroundCard(effectiveUserId, card.scryfall_id);
      if (response.deck) {
        setSelectedDeck(response.deck);
        setDeckBuilderOpen(true);
      }
    } catch (error) {
      console.error("Failed to build deck around card:", error);
    }
  }, [effectiveUserId]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const handleManualAchievementCheck = async () => {
    try {
      const result = await triggerAchievementCheck();
      
      if (result.newly_completed && result.newly_completed.length > 0) {
        addToast(
          '🏆 Achievement Check Complete!',
          `${result.newly_completed.length} new achievements earned!`,
          'success'
        );
        result.newly_completed.forEach(achievement => {
          addToast(
            '🏆 Achievement Unlocked!',
            `${achievement.name}: ${achievement.description}`,
            'success'
          );
        });
      } else {
        addToast(
          'Achievement Check Complete',
          'No new achievements earned at this time.',
          'info'
        );
      }
    } catch (error) {
      addToast('Error', 'Failed to check achievements.', 'error');
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>{totalPoints} pts</span>
              {unreadNotifications.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadNotifications.length}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualAchievementCheck}
              disabled={achievementsLoading}
            >
              <Trophy className="w-4 h-4 mr-2" />
              {achievementsLoading ? 'Checking...' : 'Check Achievements'}
            </Button>
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
              totalPoints={totalPoints}
              unreadNotifications={unreadNotifications}
              onCheckAchievements={handleManualAchievementCheck}
              achievementsLoading={achievementsLoading}
            />
          </div>
        </div>

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex md:grid md:grid-cols-5 gap-1 overflow-x-auto md:overflow-x-visible">
            <TabsTrigger value="search" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap">
              <Search className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Search</span>
              <span className="sm:hidden">Search</span>
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap">
              <Library className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Collection ({collection.length})</span>
              <span className="md:hidden">Collection</span>
            </TabsTrigger>
            <TabsTrigger value="decks" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap">
              <Layers className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Decks ({decks.length})</span>
              <span className="md:hidden">Decks</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Statistics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap">
              <div className="flex items-center gap-1 md:gap-2">
                <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Achievements</span>
                <span className="md:hidden">Awards</span>
                {unreadNotifications.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                    {unreadNotifications.length}
                  </span>
                )}
              </div>
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
              userId={effectiveUserId}
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

          <TabsContent value="achievements">
            <AchievementTab
              achievements={achievements}
              loading={achievementsLoading}
              onRefresh={fetchAchievements}
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

      <AchievementCelebration
        achievement={currentCelebration}
        onComplete={handleCelebrationComplete}
      />
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