import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Select, SelectOption } from '@/components/ui/select.jsx'
import { Search, Plus, Minus, Library, TrendingUp, Layers, Hammer, Palette } from 'lucide-react'
import './App.css'

const API_BASE = '/api'

function App() {
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
      document.documentElement.classList.add(theme)
    }
    
    // Store preference
    localStorage.setItem('theme', theme)
    setCurrentTheme(theme)
  }

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
  }, [])

  // Debounced search function
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        searchCards(searchQuery)
      }, 400)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Load data on component mount
  useEffect(() => {
    loadCollection()
    loadCollectionStats()
    loadDecks()
  }, [])

  const searchCards = async (query) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/cards/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.cards || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const loadCollection = async () => {
    try {
      const response = await fetch(`${API_BASE}/collection/search?user_id=1`)
      const data = await response.json()
      setCollection(data.collection_cards || [])
    } catch (error) {
      console.error('Failed to load collection:', error)
    }
  }

  const loadCollectionStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/collection/stats?user_id=1`)
      const data = await response.json()
      setCollectionStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadDecks = async () => {
    try {
      const response = await fetch(`${API_BASE}/decks?user_id=1`)
      const data = await response.json()
      setDecks(data.decks || [])
    } catch (error) {
      console.error('Failed to load decks:', error)
    }
  }

  const loadDeckDetails = async (deckId) => {
    try {
      const response = await fetch(`${API_BASE}/decks/${deckId}`)
      const data = await response.json()
      setDeckDetails(data)
    } catch (error) {
      console.error('Failed to load deck details:', error)
    }
  }

  const createDeck = async () => {
    if (!newDeckName.trim()) return
    
    try {
      const response = await fetch(`${API_BASE}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDeckName,
          user_id: 1
        })
      })
      
      if (response.ok) {
        setNewDeckName('')
        setShowCreateDeck(false)
        loadDecks()
      }
    } catch (error) {
      console.error('Failed to create deck:', error)
    }
  }

  const buildAroundCard = async (card) => {
    try {
      const response = await fetch(`${API_BASE}/decks/build-around/${card.scryfall_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deck_name: `${card.name} Deck`,
          user_id: 1
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        loadDecks()
        setActiveTab('decks')
        setSelectedDeck(data.deck.id)
        loadDeckDetails(data.deck.id)
      }
    } catch (error) {
      console.error('Failed to build deck:', error)
    }
  }

  const addToCollection = async (card, quantity = 1) => {
    try {
      const response = await fetch(`${API_BASE}/collection/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scryfall_id: card.scryfall_id,
          quantity: quantity,
          user_id: 1
        })
      })
      
      if (response.ok) {
        loadCollection()
        loadCollectionStats()
      }
    } catch (error) {
      console.error('Failed to add card:', error)
    }
  }

  const updateCardQuantity = async (collectionCardId, newQuantity) => {
    try {
      const response = await fetch(`${API_BASE}/collection/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection_card_id: collectionCardId,
          quantity: newQuantity
        })
      })
      
      if (response.ok) {
        loadCollection()
        loadCollectionStats()
      }
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  const addCardToDeck = async (deckId, card) => {
    try {
      const response = await fetch(`${API_BASE}/decks/${deckId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scryfall_id: card.scryfall_id,
          quantity: 1
        })
      })
      
      if (response.ok) {
        loadDeckDetails(deckId)
      }
    } catch (error) {
      console.error('Failed to add card to deck:', error)
    }
  }

  const CardDisplay = ({ card, showAddButton = false, collectionCard = null, showBuildAround = false, showAddToDeck = false }) => (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{card.name}</CardTitle>
          <Badge variant="secondary">{card.rarity}</Badge>
        </div>
        <CardDescription className="text-sm">
          {card.mana_cost && (
            <span className="font-mono bg-muted px-2 py-1 rounded mr-2">
              {card.mana_cost}
            </span>
          )}
          CMC: {card.cmc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {card.image_uri && (
          <img 
            src={card.image_uri} 
            alt={card.name}
            className="w-full h-48 object-cover rounded-md mb-3"
          />
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium">{card.type_line}</p>
          {card.oracle_text && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {card.oracle_text}
            </p>
          )}
          {card.colors && card.colors.length > 0 && (
            <div className="flex gap-1">
              {card.colors.map(color => (
                <Badge key={color} variant="outline" className="text-xs">
                  {color}
                </Badge>
              ))}
            </div>
          )}
          {card.power && card.toughness && (
            <p className="text-sm font-medium">
              Power/Toughness: {card.power}/{card.toughness}
            </p>
          )}
        </div>
        
        <div className="space-y-2 mt-3">
          {showAddButton && (
            <Button 
              onClick={() => addToCollection(card)} 
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Collection
            </Button>
          )}
          
          {showBuildAround && (
            <Button 
              onClick={() => buildAroundCard(card)} 
              className="w-full"
              size="sm"
              variant="outline"
            >
              <Hammer className="w-4 h-4 mr-2" />
              Build Deck Around This
            </Button>
          )}
          
          {showAddToDeck && selectedDeck && (
            <Button 
              onClick={() => addCardToDeck(selectedDeck, card)} 
              className="w-full"
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Deck
            </Button>
          )}
        </div>
        
        {collectionCard && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-medium">Quantity: {collectionCard.quantity}</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateCardQuantity(collectionCard.id, collectionCard.quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateCardQuantity(collectionCard.id, collectionCard.quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Magic Card Collection Manager</h1>
              <p className="text-muted-foreground">Manage your Magic: The Gathering card collection and build decks</p>
            </div>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <Select 
                value={currentTheme} 
                onChange={(e) => setTheme(e.target.value)}
                className="w-48"
              >
                {themes.map(theme => (
                  <SelectOption key={theme.value} value={theme.value}>
                    {theme.icon} {theme.label}
                  </SelectOption>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Cards
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              My Collection
            </TabsTrigger>
            <TabsTrigger value="decks" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              My Decks
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search for Magic cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            {loading && (
              <div className="text-center py-8">
                <p>Searching cards...</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((card) => (
                <CardDisplay 
                  key={card.scryfall_id} 
                  card={card} 
                  showAddButton={true}
                />
              ))}
            </div>
            
            {searchQuery.length > 2 && !loading && searchResults.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No cards found for "{searchQuery}"</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collection" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Collection</h2>
              <Badge variant="secondary">
                {collection.length} unique cards
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {collection.map((collectionCard) => (
                <CardDisplay 
                  key={collectionCard.id} 
                  card={collectionCard.card} 
                  collectionCard={collectionCard}
                  showBuildAround={true}
                  showAddToDeck={selectedDeck ? true : false}
                />
              ))}
            </div>
            
            {collection.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Your collection is empty. Search for cards to add them!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Decks</h2>
              <Dialog open={showCreateDeck} onOpenChange={setShowCreateDeck}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Deck
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Deck</DialogTitle>
                    <DialogDescription>
                      Enter a name for your new deck.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Deck name..."
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={createDeck} className="flex-1">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck) => (
                <Card 
                  key={deck.id} 
                  className={`cursor-pointer transition-colors ${selectedDeck === deck.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setSelectedDeck(deck.id)
                    loadDeckDetails(deck.id)
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{deck.name}</CardTitle>
                    <CardDescription>{deck.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{deck.format}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(deck.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedDeck && deckDetails && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{deckDetails.deck.name}</CardTitle>
                  <CardDescription>{deckDetails.deck.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{deckDetails.statistics.total_cards}</div>
                      <div className="text-sm text-muted-foreground">Total Cards</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{deckDetails.statistics.mainboard_cards}</div>
                      <div className="text-sm text-muted-foreground">Mainboard</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{deckDetails.statistics.sideboard_cards}</div>
                      <div className="text-sm text-muted-foreground">Sideboard</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{Object.keys(deckDetails.statistics.color_distribution).length}</div>
                      <div className="text-sm text-muted-foreground">Colors</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {deckDetails.cards.map((deckCard) => (
                      <div key={deckCard.id} className="relative">
                        <CardDisplay 
                          card={deckCard.card}
                        />
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {deckCard.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {decks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't created any decks yet. Create your first deck!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <h2 className="text-2xl font-semibold">Collection Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{collectionStats.total_cards || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Unique Cards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{collectionStats.unique_cards || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{decks.length}</div>
                </CardContent>
              </Card>
            </div>
            
            {collectionStats.color_distribution && (
              <Card>
                <CardHeader>
                  <CardTitle>Color Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {collectionStats.color_distribution.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">
                          {item.colors && item.colors.length > 0 ? item.colors.join(', ') : 'Colorless'}
                        </span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App

