// Gaddam Factory Firebase configuration
// Replace the placeholder values below with the values from:
// Firebase Console -> Project settings -> General -> Your apps -> Web app.
//
// This file is intentionally client-side.
// Firebase Web API keys are not treated as server secrets;
// access is protected by Firebase Authentication + Firestore/Storage rules.
//
// NEVER put a Firebase service-account private key or private certificate here.

export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY_HERE",
  authDomain: "PASTE_FIREBASE_AUTH_DOMAIN_HERE",
  projectId: "PASTE_FIREBASE_PROJECT_ID_HERE",
  storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_FIREBASE_APP_ID_HERE",
} as const;
