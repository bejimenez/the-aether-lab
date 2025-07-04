# Magic Card Collection Management System

A comprehensive web application for managing Magic: The Gathering card collections and building decks.

## 🚀 Live Application

**Deployed URL**: https://xlhyimcj8y7v.manus.space

## ✨ Features

### Card Search & Management
- **Real-time Card Search**: Search for Magic cards using the Scryfall API with debounced input
- **Card Details**: View card images, mana costs, types, oracle text, and rarity
- **Collection Management**: Add cards to your collection and manage quantities
- **Visual Card Display**: High-quality card images with comprehensive information

### Deck Building
- **Create Decks**: Build custom decks with intuitive interface
- **Build Around Cards**: Automatically create decks focused on specific cards from your collection
- **Deck Statistics**: View deck composition, mana curve, and color distribution
- **Multiple Deck Support**: Manage multiple decks simultaneously

### Statistics & Analytics
- **Collection Statistics**: Track total cards, unique cards, and collection growth
- **Color Distribution**: Analyze the color composition of your collection
- **Deck Analytics**: Monitor deck count and composition statistics

### User Interface
- **Modern Design**: Clean, responsive interface using shadcn/ui components
- **Mobile Friendly**: Fully responsive design that works on all devices
- **Intuitive Navigation**: Tab-based interface for easy feature access
- **Real-time Updates**: Instant feedback and updates across all features

## 🎮 How to Use

### Getting Started
1. Visit the application at https://xlhyimcj8y7v.manus.space
2. Start by searching for Magic cards in the "Search Cards" tab
3. Add cards to your collection using the "Add to Collection" button

### Managing Your Collection
1. Navigate to "My Collection" to view all your cards
2. Use the +/- buttons to adjust card quantities
3. Click "Build Deck Around This" to create decks focused on specific cards

### Building Decks
1. Go to "My Decks" tab to view and manage your decks
2. Click "Create Deck" to build a new deck from scratch
3. Use the "Build Deck Around This" feature from your collection for automated deck building
4. Click on any deck to view its details and statistics

### Viewing Statistics
1. Check the "Statistics" tab for comprehensive collection analytics
2. Monitor your collection growth and composition
3. Track deck count and distribution

## 🛠 Technical Details

### Architecture
- **Frontend**: React with Vite, TypeScript, and Tailwind CSS
- **Backend**: Flask with SQLAlchemy and SQLite database
- **UI Components**: shadcn/ui for modern, accessible components
- **Icons**: Lucide React for consistent iconography
- **API Integration**: Scryfall API for Magic card data

### Features Implemented
- ✅ Card search with Scryfall API integration
- ✅ Collection management with CRUD operations
- ✅ Deck building and management system
- ✅ Real-time statistics and analytics
- ✅ Responsive design for all screen sizes
- ✅ Database persistence for collections and decks
- ✅ Build-around-card functionality with synergy analysis

### Database Schema
- **Cards**: Cached card data from Scryfall API
- **Collections**: User card collections with quantities
- **Decks**: User-created decks with metadata
- **Deck Cards**: Cards within specific decks with quantities

## 📁 Project Structure

```
magic-card-backend/
├── src/
│   ├── main.py              # Flask application entry point
│   ├── models/
│   │   ├── user.py          # User model and database setup
│   │   └── card.py          # Card, Collection, and Deck models
│   ├── routes/
│   │   ├── user.py          # User-related API endpoints
│   │   ├── cards.py         # Card search and collection endpoints
│   │   └── decks.py         # Deck management endpoints
│   ├── database/
│   │   └── app.db           # SQLite database file
│   └── static/              # Built frontend files
├── requirements.txt         # Python dependencies
└── README.md               # Project documentation

magic-card-frontend/
├── src/
│   ├── App.jsx             # Main React application
│   ├── App.css             # Application styles
│   └── components/ui/      # shadcn/ui components
├── package.json            # Node.js dependencies
└── dist/                   # Built production files
```

## 🔧 Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- pnpm package manager

### Backend Setup
```bash
cd magic-card-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

### Frontend Setup
```bash
cd magic-card-frontend
pnpm install
pnpm run dev
```

### Building for Production
```bash
# Build frontend
cd magic-card-frontend
pnpm run build

# Copy to Flask static directory
cp -r dist/* ../magic-card-backend/src/static/
```

## 🌟 Key Accomplishments

1. **Complete Implementation**: All requested features from the original requirements have been implemented and tested
2. **Modern Tech Stack**: Built with current best practices using React, Flask, and modern UI components
3. **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
4. **Real-time Functionality**: Instant search, updates, and feedback throughout the application
5. **Production Ready**: Fully deployed and accessible via permanent URL
6. **Extensible Architecture**: Clean, modular code structure for future enhancements

## 🎯 Future Enhancement Opportunities

- **Trading System**: Implement card trading between users
- **Advanced Deck Analysis**: Mana curve visualization and deck optimization suggestions
- **Format Legality**: Check deck legality for different Magic formats
- **Import/Export**: Deck import/export functionality
- **User Authentication**: Multi-user support with individual collections
- **Price Tracking**: Integration with card pricing APIs
- **Wishlist**: Card wishlist functionality for collection planning

## 📞 Support

The application is fully functional and ready for use. All core features have been implemented and thoroughly tested. The system provides a comprehensive solution for Magic: The Gathering collection and deck management.

---

**Built with ❤️ using modern web technologies**

