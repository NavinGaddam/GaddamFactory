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
  apiKey: "AIzaSyDo1usQaOXYQvdOx-4KIM11yWw9XmUtEFY",
  authDomain: "gaddamfactory.firebaseapp.com",
  projectId: "gaddamfactory",
  storageBucket: "gaddamfactory.firebasestorage.app",
  messagingSenderId: "295999645875",
  appId: "1:295999645875:web:7f06e1b0036a3cb0c468c6",
  measurementId: "G-P6MTN843P4"
} as const;
