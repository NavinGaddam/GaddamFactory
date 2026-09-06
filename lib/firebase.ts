import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '../config/firebase.config';

const isConfigured =
  Object.values(firebaseConfig).every(Boolean) &&
  !Object.values(firebaseConfig).some((value) => String(value).startsWith('PASTE_'));

export const configured = isConfigured;
export const app = configured ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null;

// The runtime can still be null before Firebase is configured, but the exported
// types are kept non-null so Firestore/Auth SDK calls type-check cleanly in pages
// that already guard the unconfigured state.
export const auth = (app ? getAuth(app) : null) as unknown as Auth;
export const db = (app ? getFirestore(app) : null) as unknown as Firestore;
export const storage = (app ? getStorage(app) : null) as unknown as FirebaseStorage;
export const googleProvider = new GoogleAuthProvider();
