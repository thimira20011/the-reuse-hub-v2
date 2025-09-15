# The Reuse Hub v2 🌱

A sustainable item-sharing platform for university campuses that promotes responsible consumption and reduces waste through a community-based borrowing system.

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.1.0-FFCA28?style=flat-square&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## Direct Link to WebSite :- https://thimira20011.github.io/the-reuse-hub-v2/ 

## 🎯 Overview

The Reuse Hub is a web application designed to facilitate sharing and reusing items within university communities. Built with sustainability in mind, it supports **SDG 12: Responsible Consumption and Production** by enabling students and staff to borrow and return items easily, reducing the need for single-use purchases.

## ✨ Features

- **📱 Responsive Design**: Mobile-first interface that works across all devices
- **🔒 Anonymous Authentication**: No registration required - uses Firebase anonymous auth
- **⚡ Real-time Updates**: Live inventory updates using Firestore listeners
- **🎨 Modern UI**: Dark theme with smooth animations powered by Framer Motion
- **📊 Inventory Management**: Admin panel for adding, viewing, and managing items
- **🔄 Borrowing System**: Simple borrow and return workflow with quantity tracking
- **✨ AI Integration**: Generate usage tips and sustainability facts for items
- **📈 Live Dashboard**: Real-time tracking of available vs borrowed items

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Firebase Project** (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thimira20011/the-reuse-hub-v2.git
   cd the-reuse-hub-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase** (see [Firebase Setup](#-firebase-setup))

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Starts the development server at `http://localhost:3000` |
| `npm test` | Runs the test suite in interactive watch mode |
| `npm run build` | Builds the app for production to the `build` folder |
| `npm run deploy` | Deploys the app to GitHub Pages |
| `npm run eject` | **⚠️ One-way operation!** Ejects from Create React App |

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and create a new project named `reuse-hub-v2`
3. Enable Google Analytics (optional)

### 2. Enable Authentication

1. In the Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Anonymous** authentication
5. Click **Save**

### 3. Set up Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Click **Done**

### 4. Configure Security Rules (Optional)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Get Firebase Configuration

1. Go to **Project settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web app** icon
4. Register your app
5. Copy the configuration object
6. Update the `firebaseConfig` object in `src/App.js`

> 📋 **Note**: For detailed setup instructions, see `FIREBASE_SETUP.md`

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19.1.1 with functional components and hooks
- **Styling**: Tailwind CSS for utility-first styling
- **Animation**: Framer Motion for smooth UI transitions
- **Backend**: Firebase (Firestore + Authentication)
- **Testing**: React Testing Library + Jest
- **Build Tool**: Create React App
- **Deployment**: GitHub Pages

### Project Structure

```
the-reuse-hub-v2/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Styles (mostly unused due to Tailwind)
│   ├── index.js        # React DOM root
│   ├── index.css       # Global styles and Tailwind imports
│   └── setupTests.js   # Test configuration
├── FIREBASE_SETUP.md   # Detailed Firebase setup guide
├── WARP.md            # WARP development guide
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

### Data Model

The application uses Firestore with the following collection structure:

```
artifacts/{appId}/public/data/
├── inventory/              # Available items
│   ├── name               # Item name
│   ├── totalQuantity      # Total items in stock
│   ├── availableQuantity  # Currently available
│   ├── imageUrl          # Item image URL
│   └── createdAt         # Creation timestamp
└── borrowed_items/        # Borrowing transactions
    ├── itemId            # Reference to inventory item
    ├── itemName          # Cached item name
    ├── userId           # Anonymous user ID
    ├── borrowDate       # Borrow timestamp
    ├── returnDate       # Return timestamp (null if active)
    └── status           # 'borrowed' or 'returned'
```

## 🎮 Usage

### For Students/Staff

1. **Browse Items**: Visit the "Borrow" section to see available items
2. **Borrow Items**: Click "Borrow" on any available item
3. **Return Items**: Go to "Return" section and click "Return" on borrowed items
4. **Get Tips**: Click "✨ Get a Tip" for sustainability facts about items

### For Administrators

1. **Add Items**: Use the "Admin" panel to add new items to inventory
2. **Manage Stock**: View total and available quantities for all items
3. **Delete Items**: Remove items that are no longer available
4. **Monitor Usage**: Track borrowing patterns through the inventory view

## 🚀 Deployment

### GitHub Pages

The project is configured for GitHub Pages deployment:

```bash
npm run deploy
```

This will:
1. Build the production version
2. Deploy to the `gh-pages` branch
3. Make the app available at your GitHub Pages URL

### Other Platforms

The app can be deployed to:
- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop the `build` folder or connect via Git
- **Firebase Hosting**: Use Firebase CLI to deploy

## 🧪 Testing

```bash
# Run tests in watch mode
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests once (for CI)
npm test -- --watchAll=false
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Create React App** for the excellent development experience
- **Firebase** for backend infrastructure
- **Tailwind CSS** for rapid UI development
- **Framer Motion** for beautiful animations
- **The open-source community** for inspiration and tools

## 📞 Support

If you encounter any issues:

1. Check the [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for setup issues
2. Look at browser console for error messages
3. Open an issue on GitHub with detailed information

## 🌍 SDG Impact

This project contributes to **United Nations Sustainable Development Goal 12: Responsible Consumption and Production** by:

- Reducing single-use item purchases
- Promoting sharing economy principles
- Encouraging sustainable consumption habits
- Building community awareness about environmental impact

---

**Made with 💚 for a sustainable future**
