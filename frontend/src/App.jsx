import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import CollectionTabFixed from './components/CollectionTab.jsx'
import { Select, SelectOption } from '@/components/ui/select.jsx'
import { Search, Filter, X, SortAsc, SortDesc, Grid, List, Plus, Minus, Library, TrendingUp, Layers, Hammer, Palette, User } from 'lucide-react'
import './App.css'

const getApiBaseUrl = () => {
  // Check for Vite environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback for production
  if (import.meta.env.PROD) {
    return 'https://your-railway-app-name.up.railway.app/api';
  }
  
  // Development fallback
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

function App() {
  const [currentUser, setCurrentUser] = useState(1); // Default to user 1
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [collection, setCollection] = useState([])
  const [collectionStats, setCollectionStats] = useState({})
  const [decks, setDecks] = useState([])
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [deckDetails, setDeckDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('search')
  const [newDeckName, setNewDeckName] = useState('')
  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('light')

  // Theme switching logic
  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'white', label: 'White Mana', icon: '⚪' },
    { value: 'blue', label: 'Blue Mana', icon: '🔵' },
    { value: 'black', label: 'Black Mana', icon: '⚫' },
    { value: 'green', label: 'Green Mana', icon: '🟢' },
    { value: 'red', label: 'Red Mana', icon: '🔴' }
  ]

  const setTheme = (theme) => {
    // Remove all theme classes
    document.documentElement.className = ''
    
    // Add new theme class (except for light which uses :root)
    if (theme !== 'light') {
      document.documentElement.classList.add(`theme-${theme}`)
    }
    setCurrentTheme(theme)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadCollection()
      loadCollectionStats()
      loadDecks()
    }
  }, [currentUser])

  const loadCollection = async () => {
  try {
    console.log('Loading collection for user:', currentUser);
    const response = await fetch(`${API_BASE_URL}/collection/search?user_id=${currentUser}`)
    if (response.ok) {
      const data = await response.json()
      console.log('Collection data received:', data);
      // FIXED: Backend returns 'collection_cards', not 'cards'
      setCollection(data.collection_cards || [])
    } else {
      console.error('Failed to load collection:', response.status)
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('Failed to load collection:', error)
  }
}

  const loadCollectionStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/collection/stats?user_id=${currentUser}`)
    if (response.ok) {
      const data = await response.json()
      // This is correct - backend returns stats directly
      setCollectionStats(data)
    } else {
      console.error('Failed to load stats:', response.status)
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

  const loadDecks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/decks?user_id=${currentUser}`)
    if (response.ok) {
      const data = await response.json()
      // This is correct - backend returns 'decks'
      setDecks(data.decks || [])
    } else {
      console.error('Failed to load decks:', response.status)
    }
  } catch (error) {
    console.error('Failed to load decks:', error)
  }
}

  const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (response.ok) {
      const data = await response.json();
      // Backend likely returns array directly, not {users: [...]}
      setUsers(Array.isArray(data) ? data : data.users || []);
      
      // If no users exist, create default ones
      if ((Array.isArray(data) ? data : data.users || []).length === 0) {
        await createDefaultUsers()
      }
    } else {
      console.error('Error fetching users:', response.status);
      // Try to create default users if endpoint fails
      await createDefaultUsers()
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    // Fallback to default users for development
    setUsers([
      { id: 1, username: 'Player1', email: 'player1@example.com' },
      { id: 2, username: 'Player2', email: 'player2@example.com' }
    ]);
  }
}

  const createDefaultUsers = async () => {
    const defaultUsers = [
      { username: 'Player1', email: 'player1@example.com' },
      { username: 'Player2', email: 'player2@example.com' }
    ];

    for (const user of defaultUsers) {
      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        if (response.ok) {
          const newUser = await response.json();
          console.log('Created user:', newUser);
        }
      } catch (error) {
        console.error('Error creating user:', error);
      }
    }
    // Refresh users list
    fetchUsers();
  }

  const buildAroundCard = async (card) => {
  try {
    const response = await fetch(`${API_BASE_URL}/decks/build-around/${card.scryfall_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser,
        deck_name: `${card.name} Deck`
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Deck created:', data.message);
      loadDecks();
      setActiveTab('decks'); // Switch to decks tab
    } else {
      const errorData = await response.json();
      console.error('Failed to build deck:', errorData.error);
    }
  } catch (error) {
    console.error('Failed to build deck:', error);
  }
}

  const searchCards = async (query) => {
  if (!query.trim()) {
    setSearchResults([])
    return
  }

  setLoading(true)
  try {
    const response = await fetch(`${API_BASE_URL}/cards/search?q=${encodeURIComponent(query)}`)
    if (response.ok) {
      const data = await response.json()
      // This is correct - backend returns 'cards'
      setSearchResults(data.cards || [])
    } else {
      console.error('Search failed:', response.status)
      setSearchResults([])
    }
  } catch (error) {
    console.error('Search error:', error)
    setSearchResults([])
  } finally {
    setLoading(false)
  }
}

  const updateCardQuantity = async (cardId, newQuantity) => {
  try {
    // Find the collection card by scryfall_id
    const collectionCard = collection.find(cc => cc.card?.scryfall_id === cardId);
    
    if (!collectionCard) {
      console.error('Collection card not found for cardId:', cardId);
      return;
    }

    // FIXED: Use '/collection/update' with collection_card_id
    const response = await fetch(`${API_BASE_URL}/collection/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        collection_card_id: collectionCard.id,
        quantity: newQuantity 
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Card updated:', data.message);
      loadCollection();
      loadCollectionStats();
    } else {
      const errorData = await response.json();
      console.error('Failed to update card:', errorData.error);
    }
  } catch (error) {
    console.error('Failed to update card:', error)
  }
}

  const addCardToCollection = async (card) => {
  try {
    // FIXED: Use '/collection/add' endpoint, not '/collection'
    const response = await fetch(`${API_BASE_URL}/collection/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser,
        scryfall_id: card.scryfall_id || card.id,
        quantity: 1
      })
    })
    
    if (response.ok) {
      const data = await response.json();
      console.log('Card added:', data.message);
      loadCollection();
      loadCollectionStats();
    } else {
      const errorData = await response.json();
      console.error('Failed to add card:', errorData.error);
    }
  } catch (error) {
    console.error('Failed to add card:', error)
  }
}

  const UserSwitcher = () => (
    <div className="flex items-center gap-3 mb-4 p-3 bg-slate-100 rounded-lg">
      <User className="w-4 h-4" />
      <label className="text-sm font-medium">Current User:</label>
      <select 
        value={currentUser} 
        onChange={(e) => setCurrentUser(parseInt(e.target.value))}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
      >
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.username}
          </option>
        ))}
      </select>
    </div>
  );

  const CardDisplay = ({ 
  card, 
  showAddButton = false, 
  showBuildAround = false, 
  showAddToDeck = false,
  collectionCard = null,
  updateCardQuantity = null,
  buildAroundCard = null,
  addCardToDeck = null,
  selectedDeck = null
}) => (
  <Card className="w-full max-w-sm">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg">{card.name}</CardTitle>
        <Badge variant="secondary">{card.rarity}</Badge>
      </div>
      <CardDescription className="text-sm">
        {card.mana_cost && (
          <span className="font-mono">{card.mana_cost}</span>
        )}
        {card.type_line && (
          <div className="mt-1">{card.type_line}</div>
        )}
      </CardDescription>
    </CardHeader>
    <CardContent>
      {card.image_uri && (
        <img 
          src={card.image_uri} 
          alt={card.name}
          className="w-full h-auto rounded-md mb-3"
          loading="lazy"
        />
      )}
      
      {/* Card text */}
      {card.oracle_text && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {card.oracle_text}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {showAddButton && (
          <Button 
            onClick={() => addCardToCollection(card)} 
            className="w-full"
          >
            Add to Collection
          </Button>
        )}
        
        {collectionCard && updateCardQuantity && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateCardQuantity(card.scryfall_id, collectionCard.quantity - 1)}
              disabled={collectionCard.quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 bg-muted rounded text-sm font-medium">
              {collectionCard.quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateCardQuantity(card.scryfall_id, collectionCard.quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {showBuildAround && buildAroundCard && (
          <Button 
            variant="outline" 
            onClick={() => buildAroundCard(card)}
            className="w-full"
          >
            <Hammer className="w-4 h-4 mr-2" />
            Build Deck Around This
          </Button>
        )}

        {showAddToDeck && addCardToDeck && selectedDeck && (
          <Button 
            variant="outline" 
            onClick={() => addCardToDeck(card, selectedDeck)}
            className="w-full"
          >
            Add to {selectedDeck.name}
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Magic Card Collection</h1>
          
          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <select 
              value={currentTheme} 
              onChange={(e) => setTheme(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {themes.map(theme => (
                <option key={theme.value} value={theme.value}>
                  {theme.icon} {theme.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <UserSwitcher />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Cards
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              My Collection ({collection.length})
            </TabsTrigger>
            <TabsTrigger value="decks" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              My Decks ({decks.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for Magic cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCards(searchQuery)}
                  className="flex-1"
                />
                <Button onClick={() => searchCards(searchQuery)} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchResults.map(card => (
                    <CardDisplay
                      key={card.scryfall_id || card.id}
                      card={card}
                      showAddButton={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="collection">
            <CollectionTabFixed 
              collection={collection}
              updateCardQuantity={updateCardQuantity}
              buildAroundCard={buildAroundCard}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="decks">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Decks</h2>
                <Button onClick={() => setShowCreateDeck(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Deck
                </Button>
              </div>

              {decks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No decks yet. Create your first deck!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decks.map(deck => (
                    <Card key={deck.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle>{deck.name}</CardTitle>
                        <CardDescription>{deck.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Format: {deck.format}</span>
                          <span>Updated: {new Date(deck.updated_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Collection Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Cards:</span>
                      <span className="font-semibold">{collectionStats.total_cards || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Cards:</span>
                      <span className="font-semibold">{collectionStats.unique_cards || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Decks:</span>
                      <span className="font-semibold">{decks.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Deck Dialog */}
        <Dialog open={showCreateDeck} onOpenChange={setShowCreateDeck}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
              <DialogDescription>
                Enter a name for your new deck
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Deck name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={async () => {
                    if (newDeckName.trim()) {
                      try {
                        const response = await fetch(`${API_BASE_URL}/decks`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: newDeckName,
                            user_id: currentUser,
                            format: 'casual'
                          })
                        });
                        if (response.ok) {
                          setNewDeckName('');
                          setShowCreateDeck(false);
                          loadDecks();
                        }
                      } catch (error) {
                        console.error('Failed to create deck:', error);
                      }
                    }
                  }}
                  className="flex-1"
                >
                  Create Deck
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDeck(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default App