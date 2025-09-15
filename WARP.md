# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core Commands

### Development
```bash
npm start          # Start development server (opens http://localhost:3000)
npm test           # Run tests in interactive watch mode
npm run build      # Build for production
npm run eject      # Eject from Create React App (irreversible)
```

### Deployment
```bash
npm run predeploy  # Build the app before deployment
npm run deploy     # Deploy to GitHub Pages using gh-pages
```

### Testing
```bash
npm test           # Run all tests in watch mode
npm test -- --coverage  # Run tests with coverage report
npm test -- --watchAll=false  # Run tests once without watch mode
```

## Architecture Overview

This is a React-based university reuse hub application built with Create React App. The application follows a single-page architecture with client-side routing implemented through state management.

### Key Technologies
- **Frontend**: React 19.1.1 with functional components and hooks
- **Styling**: Tailwind CSS 3.4.17 for utility-first styling
- **Animation**: Framer Motion 12.23.12 for UI animations and transitions
- **Backend**: Firebase 12.1.0 (Firestore database, Authentication)
- **Testing**: React Testing Library and Jest
- **Build Tool**: Create React App with React Scripts 5.0.1

### Application Structure

The entire application is contained in a single large `App.js` file (~885 lines) that includes:

1. **Firebase Integration**: Configuration, authentication, and Firestore operations
2. **Context Management**: FirebaseContext provides global state for auth and database
3. **Component Architecture**: All components are defined in the same file
4. **State-based Routing**: Navigation handled through React state, not React Router

### Core Components

#### Firebase Provider (`FirebaseProvider`)
- Manages Firebase initialization and authentication
- Provides anonymous authentication
- Handles error states and loading states
- Creates global context for database and auth access

#### Main Application Pages
- **Home**: Landing page with feature overview and navigation
- **Borrow**: Browse and borrow available items
- **Return**: View and return borrowed items
- **Inventory**: View all items in the system
- **AdminPanel**: Add, view, and delete inventory items

#### Shared Components
- **ItemCard**: Reusable component for displaying items with borrow/return actions
- **MessageBox**: Modal notifications for success/error messages
- **LoadingSpinner**: Loading state indicator

### Data Architecture

#### Firebase Collections Structure
```
artifacts/{appId}/public/data/
├── inventory/          # All available items
│   ├── name           # Item name
│   ├── totalQuantity  # Total number of items
│   ├── availableQuantity  # Currently available
│   ├── imageUrl       # Item image URL
│   └── createdAt      # Timestamp
└── borrowed_items/     # Borrowing transactions
    ├── itemId         # Reference to inventory item
    ├── itemName       # Cached item name
    ├── userId         # Anonymous user ID
    ├── borrowDate     # When item was borrowed
    ├── returnDate     # When item was returned (null if still borrowed)
    └── status         # 'borrowed' or 'returned'
```

#### Authentication Strategy
- Uses Firebase Anonymous Authentication
- Each user gets a unique anonymous ID
- No user registration or login required
- Demo mode fallback if Firebase is unavailable

### State Management Patterns

1. **Global State**: Firebase context provides db, auth, userId across components
2. **Local State**: Each component manages its own loading, form data, and UI state
3. **Real-time Updates**: Firestore onSnapshot listeners for live data updates
4. **Error Handling**: Centralized message system through Firebase context

### UI/UX Patterns

1. **Dark Theme**: Gray-900 background with green-400 accent colors
2. **Responsive Design**: Mobile-first with Tailwind responsive classes
3. **Animations**: Framer Motion for page transitions and hover effects
4. **Loading States**: Consistent spinner and loading messages
5. **Error States**: Modal notifications for user feedback

## Firebase Configuration

The app requires Firebase setup with:
- **Authentication**: Anonymous auth must be enabled
- **Firestore**: Database with appropriate security rules
- **Project ID**: Currently configured for `reuse-hub-v2`

For detailed Firebase setup, see `FIREBASE_SETUP.md`.

## Development Notes

### Component Organization
- All components are in single `App.js` file - consider splitting for maintainability
- No React Router - uses simple state-based navigation
- Inline styles with Tailwind classes throughout

### Data Flow
- Real-time Firestore listeners update UI automatically
- Optimistic UI updates for better user experience
- Firebase security rules allow authenticated reads/writes

### Testing Strategy
- Uses React Testing Library and Jest (standard CRA setup)
- Tests are in `src/App.test.js` and `src/setupTests.js`
- No custom test configuration

### Performance Considerations
- Large single-file component may impact bundle size
- Real-time listeners on all collection changes
- Image fallbacks to placeholder service for missing images

## Common Development Patterns

### Adding New Features
1. Add new page component in `App.js`
2. Update `renderPage()` function with new route
3. Add navigation button in header
4. Ensure Firebase context access for data operations

### Database Operations
```javascript
// Adding data
await addDoc(collection(db, collectionPath), data);

// Updating data  
await updateDoc(doc(db, collectionPath, docId), updates);

// Real-time listening
onSnapshot(collection(db, collectionPath), (snapshot) => {
  // Handle updates
});
```

### Error Handling
```javascript
const { showMessage } = useContext(FirebaseContext);
showMessage("Success message", "success");
showMessage("Error message", "error");
```

## Deployment

Currently configured for GitHub Pages deployment:
- Build output goes to `/build` directory
- `gh-pages` package handles deployment
- Homepage URL set in package.json

The application can also be deployed to other static hosting services like Vercel, Netlify, or Firebase Hosting without modification.
