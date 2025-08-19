# Firebase Setup Instructions

## The Error You're Seeing

The error "Failed to initialize Firebase: Firebase: Error (auth/configuration-not-found)" means that Firebase Authentication is not properly configured in your Firebase Console.

## Step-by-Step Fix

### 1. Enable Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `reuse-hub-v2`
3. In the left sidebar, click **"Authentication"**
4. Click **"Get started"** if you haven't set up Authentication yet
5. Go to the **"Sign-in method"** tab
6. Find **"Anonymous"** in the list
7. Click on **"Anonymous"**
8. Toggle the **"Enable"** switch to ON
9. Click **"Save"**

### 2. Set Up Firestore Database
1. In the Firebase Console, go to **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location close to your users (e.g., us-central1)
5. Click **"Done"**

### 3. Configure Firestore Rules (Optional)
In Firestore Database → Rules, replace the default rules with:

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

### 4. Verify Your Setup
1. Restart your development server: `npm start`
2. Open your browser console (F12)
3. Look for these console messages:
   - "Initializing Firebase with config..."
   - "Firebase initialized successfully..."
   - "User authenticated successfully..."

## What Should Happen Next

After enabling Authentication:
1. The error message should disappear
2. You should see a green success message: "Connected to Firebase successfully!"
3. A User ID should appear in the footer of your app
4. You can start using all features:
   - Add items in the Admin panel
   - Borrow items
   - Return items
   - View inventory

## Troubleshooting

### If you still see errors:
1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Check the browser console** for specific error messages
3. **Verify your project ID** matches: `reuse-hub-v2`
4. **Ensure you're signed in** to the correct Google account in Firebase Console

### If Firestore permissions fail:
1. Go to Firestore Database → Rules
2. Temporarily use these test rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Your Current Configuration
- **Project ID**: reuse-hub-v2
- **Auth Domain**: reuse-hub-v2.firebaseapp.com
- **Database**: Firestore
- **Authentication**: Anonymous (needs to be enabled)

## Need Help?
Check the browser console for detailed error messages and logs that start with:
- "Initializing Firebase with config:"
- "Error initializing Firebase:"
