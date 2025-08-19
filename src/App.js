import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

// Create Firebase Context
const FirebaseContext = createContext();

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqm7yPIB_IJrpCGem3L6DOhPwvCTQ38xI",
  authDomain: "reuse-hub-v2.firebaseapp.com",
  projectId: "reuse-hub-v2",
  storageBucket: "reuse-hub-v2.firebasestorage.app",
  messagingSenderId: "151231604754",
  appId: "1:151231604754:web:abcc4ed0bfa1a6761c50cb",
  measurementId: "G-C3T18P5B9S"
};

// Custom Message Box component
const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  const textColor = 'text-white';
  const borderColor = type === 'error' ? 'border-red-700' : 'border-green-700';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className={`relative ${bgColor} ${textColor} p-6 rounded-lg shadow-xl border-2 ${borderColor} max-w-sm w-full text-center`}
      >
        <p className="text-lg font-semibold mb-4">{message}</p>
        <button
          onClick={onClose}
          className="bg-white text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors duration-200"
        >
          OK
        </button>
      </motion.div>
    </motion.div>
  );
};

// Custom Loading Spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
  </div>
);

// Firebase Provider Component
const FirebaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingFirebase, setLoadingFirebase] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Function to show messages
  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
  };

  // Function to clear messages
  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Check if Firebase config is available and valid
        if (!firebaseConfig || !firebaseConfig.apiKey) {
          console.warn("Firebase config is missing or invalid. Running in demo mode.");
          showMessage("Running in demo mode. Firebase features are disabled. To enable Firebase, provide a valid configuration.", "error");
          
          // Set a mock user ID for demo mode
          setUserId('demo-user-' + Math.random().toString(36).substr(2, 9));
          setLoadingFirebase(false);
          return;
        }

        console.log("Initializing Firebase with config:", {
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain
        });

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestore);
        setAuth(firebaseAuth);

        console.log("Firebase initialized successfully. Attempting anonymous authentication...");

        // Sign in anonymously or with custom token
        const initialAuthToken = typeof window !== 'undefined' && window.__initial_auth_token ? window.__initial_auth_token : null;
        if (initialAuthToken) {
          console.log("Signing in with custom token...");
          await signInWithCustomToken(firebaseAuth, initialAuthToken);
        } else {
          console.log("Signing in anonymously...");
          await signInAnonymously(firebaseAuth);
        }

        // Listen for auth state changes
        onAuthStateChanged(firebaseAuth, (user) => {
          if (user) {
            setUserId(user.uid);
            console.log("User authenticated successfully. User ID:", user.uid);
            showMessage("Connected to Firebase successfully!", "success");
          } else {
            setUserId(null);
            console.log("No user signed in.");
          }
          setLoadingFirebase(false);
        });

      } catch (error) {
        console.error("Error initializing Firebase:", error);
        
        // Provide more specific error messages
        let errorMessage = `Failed to initialize Firebase: ${error.message}`;
        if (error.code === 'auth/configuration-not-found') {
          errorMessage = "Firebase Authentication is not configured. Please enable Anonymous authentication in the Firebase Console.";
        } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
          errorMessage = "Firebase Authentication is not supported in this environment.";
        } else if (error.code === 'auth/project-not-found') {
          errorMessage = "Firebase project not found. Please check your project configuration.";
        }
        
        showMessage(errorMessage, "error");
        setLoadingFirebase(false);
      }
    };

    initializeFirebase();
  }, []); // Run only once on component mount

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, loadingFirebase, showMessage, clearMessage }}>
      {children}
      <AnimatePresence>
        {message && <MessageBox message={message} type={messageType} onClose={clearMessage} />}
      </AnimatePresence>
    </FirebaseContext.Provider>
  );
};

// Utility function to get collection path based on user ID and app ID
const getCollectionPath = (collectionName, userId, appId) => {
  // For this app, all data is public for simplicity of sharing inventory
  // In a real app, borrowed_items might be private.
  return `artifacts/${appId}/public/data/${collectionName}`;
};

// Item Card Component
const ItemCard = ({ item, onBorrow, onReturn, showBorrowButton, showReturnButton }) => {
  const { showMessage } = useContext(FirebaseContext);
  const [generatingFact, setGeneratingFact] = useState(false);

  // Ensure item.name is a string before using charAt
  const itemName = item.name || '';

  const handleGenerateFact = async () => {
    setGeneratingFact(true);
    const prompt = `Generate a short, engaging usage tip or sustainability fact about "${itemName}" for a university reuse hub. Focus on responsible consumption and environmental benefits. Keep it concise, around 1-2 sentences.`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiKey = ""; // Canvas will provide this
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    let retries = 0;
    const maxRetries = 3;
    let delay = 1000; // 1 second

    while (retries < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          if (response.status === 429) { // Too Many Requests
            console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; // Exponential backoff
            retries++;
            continue;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          const fact = result.candidates[0].content.parts[0].text;
          showMessage(fact, 'success');
        } else {
          showMessage("Could not generate a tip/fact for this item. Please try again.", "error");
        }
        break; // Exit loop on success
      } catch (error) {
        console.error("Error generating fact:", error);
        showMessage(`Failed to generate tip/fact: ${error.message}`, "error");
        break; // Exit loop on unrecoverable error
      }
    }
    if (retries === maxRetries) {
      showMessage("Failed to generate tip/fact after multiple retries. Please try again later.", "error");
      setGeneratingFact(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-700 p-4 rounded-xl shadow-lg flex flex-col items-center justify-between text-center min-h-[250px] border border-gray-600 hover:border-green-400 transition-colors duration-200"
    >
      <img
        src={item.imageUrl || `https://placehold.co/120x120/374151/D1D5DB?text=${itemName.charAt(0)}`}
        alt={itemName}
        className="w-28 h-28 object-cover rounded-full mb-3 border-4 border-green-600 shadow-md"
        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/120x120/374151/D1D5DB?text=${itemName.charAt(0)}`; }}
      />
      <h3 className="text-2xl font-semibold text-white mb-1">{itemName}</h3>
      {item.availableQuantity !== undefined && (
        <p className="text-gray-300 text-sm mb-2">Available: <span className="font-bold text-green-400">{item.availableQuantity}</span></p>
      )}
      <div className="flex flex-col gap-2 w-full mt-auto">
        {showBorrowButton && item.availableQuantity > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBorrow(item)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-200 shadow-lg"
          >
            Borrow
          </motion.button>
        )}
        {showReturnButton && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onReturn(item)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-200 shadow-lg"
          >
            Return
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerateFact}
          disabled={generatingFact}
          className={`
            ${generatingFact ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}
            text-white font-bold py-2 px-4 rounded-full transition-all duration-200 shadow-lg text-sm
          `}
        >
          {generatingFact ? 'Generating...' : '✨ Get a Tip'}
        </motion.button>
      </div>
      {showBorrowButton && item.availableQuantity === 0 && (
        <p className="mt-2 text-red-400 font-semibold text-sm">Out of Stock</p>
      )}
    </motion.div>
  );
};


// Home Component
const Home = ({ navigate }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight"
      >
        Welcome to <span className="text-green-400">The Reuse Hub</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl"
      >
        Your eco-friendly corner for sharing and reusing on campus. Our goal is to reduce single-use waste and promote responsible consumption by offering reusable items for students and staff to borrow and return with ease.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12"
      >
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center transform transition-transform hover:scale-105 border border-gray-700 hover:border-green-400">
          <svg className="w-16 h-16 text-green-400 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/></svg>
          <h2 className="text-2xl font-bold text-white mb-2">Purpose</h2>
          <p className="text-gray-400 text-center">Promoting sustainability and reducing waste by making reusable items accessible for temporary use.</p>
        </div>
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center transform transition-transform hover:scale-105 border border-gray-700 hover:border-green-400">
          <svg className="w-16 h-16 text-green-400 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <h2 className="text-2xl font-bold text-white mb-2">How to Use</h2>
          <p className="text-gray-400 text-center">Simply borrow what you need, use it responsibly, and return it on time. It's a system built on trust and community.</p>
        </div>
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center transform transition-transform hover:scale-105 border border-gray-700 hover:border-green-400">
          <svg className="w-16 h-16 text-green-400 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/></svg>
          <h2 className="text-2xl font-bold text-white mb-2">Benefits</h2>
          <p className="text-gray-400 text-center">Save money, reduce waste, and build a more sustainable campus community by sharing resources with others.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="flex flex-wrap justify-center gap-6"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('borrow')}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-full text-xl shadow-lg transition-all duration-300 transform"
        >
          Borrow an Item
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('inventory')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-xl shadow-lg transition-all duration-300 transform"
        >
          View Inventory
        </motion.button>
      </motion.div>
    </div>
  );
};


// Inventory Component
const Inventory = () => {
  const { db, userId, loadingFirebase, showMessage } = useContext(FirebaseContext);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  useEffect(() => {
    if (!db || loadingFirebase || !userId) return;

    const inventoryRef = collection(db, getCollectionPath('inventory', userId, appId));
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      showMessage(`Failed to load inventory: ${error.message}`, "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, loadingFirebase, appId, showMessage]);

  if (loading || loadingFirebase) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Full Inventory</h2>
      {inventory.length === 0 ? (
        <p className="text-gray-400 text-center text-lg">No items in inventory yet. Add some items to get started!</p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {inventory.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

// Borrow Component
const Borrow = () => {
  const { db, userId, loadingFirebase, showMessage } = useContext(FirebaseContext);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  useEffect(() => {
    if (!db || loadingFirebase || !userId) return;

    const inventoryRef = collection(db, getCollectionPath('inventory', userId, appId));
    const q = query(inventoryRef, where('availableQuantity', '>', 0));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvailableItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching available items:", error);
      showMessage(`Failed to load available items: ${error.message}`, "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, loadingFirebase, appId, showMessage]);

  const handleBorrow = async (item) => {
    if (!db || !userId) {
      showMessage("Authentication error. Please try again.", "error");
      return;
    }

    if (item.availableQuantity <= 0) {
      showMessage("This item is currently out of stock.", "error");
      return;
    }

    try {
      const itemDocRef = doc(db, getCollectionPath('inventory', userId, appId), item.id);
      await updateDoc(itemDocRef, {
        availableQuantity: item.availableQuantity - 1
      });

      const borrowedItemsRef = collection(db, getCollectionPath('borrowed_items', userId, appId));
      await addDoc(borrowedItemsRef, {
        itemId: item.id,
        itemName: item.name,
        userId: userId,
        borrowDate: serverTimestamp(),
        returnDate: null,
        status: 'borrowed'
      });

      showMessage(`You have successfully borrowed a ${item.name}!`);
    } catch (error) {
      console.error("Error borrowing item:", error);
      showMessage(`Failed to borrow ${item.name}: ${error.message}`, "error");
    }
  };

  if (loading || loadingFirebase) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Available Items</h2>
      {availableItems.length === 0 ? (
        <p className="text-gray-400 text-center text-lg">No items currently available for borrowing.</p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {availableItems.map(item => (
            <ItemCard key={item.id} item={item} onBorrow={handleBorrow} showBorrowButton={true} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

// Return Component
const Return = () => {
  const { db, userId, loadingFirebase, showMessage } = useContext(FirebaseContext);
  const [borrowedItems, setBorrowedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  useEffect(() => {
    if (!db || loadingFirebase || !userId) return;

    const borrowedItemsRef = collection(db, getCollectionPath('borrowed_items', userId, appId));
    const q = query(borrowedItemsRef, where('userId', '==', userId), where('status', '==', 'borrowed'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBorrowedItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching borrowed items:", error);
      showMessage(`Failed to load your borrowed items: ${error.message}`, "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, loadingFirebase, appId, showMessage]);

  const handleReturn = async (borrowRecord) => {
    if (!db || !userId) {
      showMessage("Authentication error. Please try again.", "error");
      return;
    }

    try {
      const borrowDocRef = doc(db, getCollectionPath('borrowed_items', userId, appId), borrowRecord.id);
      await updateDoc(borrowDocRef, {
        returnDate: serverTimestamp(),
        status: 'returned'
      });

      const itemDocRef = doc(db, getCollectionPath('inventory', userId, appId), borrowRecord.itemId);
      const itemSnapshot = await getDoc(itemDocRef);

      if (itemSnapshot.exists()) {
        const currentAvailable = itemSnapshot.data().availableQuantity || 0;
        await updateDoc(itemDocRef, {
          availableQuantity: currentAvailable + 1
        });
      } else {
        console.warn(`Inventory item ${borrowRecord.itemId} not found for return.`);
        showMessage("Could not find the original item in inventory. Please contact support.", "error");
      }

      showMessage(`You have successfully returned the ${borrowRecord.itemName}!`);
    } catch (error) {
      console.error("Error returning item:", error);
      showMessage(`Failed to return ${borrowRecord.itemName}: ${error.message}`, "error");
    }
  };

  if (loading || loadingFirebase) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">My Borrowed Items</h2>
      {borrowedItems.length === 0 ? (
        <p className="text-gray-400 text-center text-lg">You currently have no items borrowed.</p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {borrowedItems.map(item => (
            <ItemCard key={item.id} item={item} onReturn={handleReturn} showReturnButton={true} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

// Admin Panel
const AdminPanel = () => {
  const { db, userId, loadingFirebase, showMessage } = useContext(FirebaseContext);
  const [itemName, setItemName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

  useEffect(() => {
    if (!db || loadingFirebase || !userId) return;

    const inventoryRef = collection(db, getCollectionPath('inventory', userId, appId));
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory for admin:", error);
      showMessage(`Failed to load admin inventory: ${error.message}`, "error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, loadingFirebase, appId, showMessage]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!db || !userId || !itemName || !totalQuantity) {
      showMessage("Please fill all fields to add an item.", "error");
      return;
    }
    const quantity = parseInt(totalQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      showMessage("Quantity must be a positive number.", "error");
      return;
    }

    try {
      const inventoryRef = collection(db, getCollectionPath('inventory', userId, appId));
      await addDoc(inventoryRef, {
        name: itemName,
        totalQuantity: quantity,
        availableQuantity: quantity,
        imageUrl: itemImageUrl || `https://placehold.co/120x120/374151/D1D5DB?text=${itemName.charAt(0)}`,
        createdAt: serverTimestamp()
      });
      showMessage(`${itemName} added to inventory!`);
      setItemName('');
      setTotalQuantity('');
      setItemImageUrl('');
    } catch (error) {
      console.error("Error adding item:", error);
      showMessage(`Failed to add item: ${error.message}`, "error");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!db || !userId) {
      showMessage("Authentication error. Please try again.", "error");
      return;
    }
    try {
      const itemDocRef = doc(db, getCollectionPath('inventory', userId, appId), id);
      await deleteDoc(itemDocRef);
      showMessage("Item deleted successfully!");
    } catch (error) {
      console.error("Error deleting item:", error);
      showMessage(`Failed to delete item: ${error.message}`, "error");
    }
  };

  if (loading || loadingFirebase) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Admin Panel</h2>
      <p className="text-gray-400 text-center mb-6">Manage all items in the inventory from this page.</p>
      
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg mb-10 max-w-xl mx-auto border border-gray-700">
        <h3 className="text-2xl font-semibold text-white mb-6 text-center">Add New Item</h3>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-gray-400 text-sm font-bold mb-2">Item Name:</label>
            <input
              type="text"
              id="itemName"
              className="w-full px-4 py-3 rounded-md bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-green-400"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="totalQuantity" className="block text-gray-400 text-sm font-bold mb-2">Total Quantity:</label>
            <input
              type="number"
              id="totalQuantity"
              className="w-full px-4 py-3 rounded-md bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-green-400"
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(e.target.value)}
              min="1"
              required
            />
          </div>
          <div>
            <label htmlFor="itemImageUrl" className="block text-gray-400 text-sm font-bold mb-2">Image URL (Optional):</label>
            <input
              type="text"
              id="itemImageUrl"
              className="w-full px-4 py-3 rounded-md bg-gray-700 text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-green-400"
              value={itemImageUrl}
              onChange={(e) => setItemImageUrl(e.target.value)}
              placeholder="e.g., https://example.com/umbrella.png"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-full transition-all duration-200 shadow-lg text-lg"
          >
            Add Item
          </motion.button>
        </form>
      </div>

      <h3 className="text-2xl font-bold text-white mb-6 text-center">Existing Items</h3>
      {items.length === 0 ? (
        <p className="text-gray-400 text-center text-lg">No items in inventory.</p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-700 p-6 rounded-xl shadow-lg flex flex-col items-center justify-between text-center border border-gray-600 hover:border-red-400 transition-colors duration-200"
            >
              <img
                src={item.imageUrl || `https://placehold.co/100x100/374151/D1D5DB?text=${item.name ? item.name.charAt(0) : ''}`}
                alt={item.name || 'Item'}
                className="w-24 h-24 object-cover rounded-full mb-3 border-4 border-white shadow-md"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x100/374151/D1D5DB?text=${item.name ? item.name.charAt(0) : ''}`; }}
              />
              <h4 className="text-xl font-semibold text-white mt-2">{item.name || 'Unknown Item'}</h4>
              <p className="text-gray-400 text-sm mt-1">Total: {item.totalQuantity}</p>
              <p className="text-gray-400 text-sm">Available: <span className="font-bold text-green-400">{item.availableQuantity}</span></p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDeleteItem(item.id)}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full text-sm transition-all duration-200 shadow-md"
              >
                Delete
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { userId, loadingFirebase } = useContext(FirebaseContext);

  const navigate = (page) => {
    setCurrentPage(page);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 50 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -50 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  if (loadingFirebase) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center font-inter p-4">
        <LoadingSpinner />
        <p className="text-white mt-4 text-lg">Loading The Reuse Hub...</p>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home navigate={navigate} />;
      case 'borrow':
        return <Borrow />;
      case 'return':
        return <Return />;
      case 'inventory':
        return <Inventory />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Home navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col font-inter text-gray-100">
      <header className="bg-gray-900 p-4 shadow-xl sticky top-0 z-40 border-b border-gray-700">
        <nav className="container mx-auto flex flex-wrap justify-between items-center">
          <h1 className="text-3xl font-bold text-green-400">The Reuse Hub</h1>
          <div className="flex flex-wrap gap-2 md:gap-4 mt-2 sm:mt-0 text-sm md:text-base">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('home')}
              className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${currentPage === 'home' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              Home
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('borrow')}
              className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${currentPage === 'borrow' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              Borrow
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('return')}
              className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${currentPage === 'return' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              Return
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('inventory')}
              className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${currentPage === 'inventory' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              Inventory
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('admin')}
              className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${currentPage === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            >
              Admin
            </motion.button>
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-6 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="bg-gray-900 p-4 text-center text-gray-400 text-sm border-t border-gray-700">
        <p>&copy; {new Date().getFullYear()} The Reuse Hub. All rights reserved.</p>
        <p>Promoting SDG 12: Responsible Consumption and Production</p>
        {userId && (
          <p className="mt-2 text-xs">User ID: <span className="font-mono break-all">{userId}</span></p>
        )}
      </footer>
    </div>
  );
};

// Root component for the FirebaseProvider
const RootApp = () => (
  <FirebaseProvider>
    <App />
  </FirebaseProvider>
);

export default RootApp;
