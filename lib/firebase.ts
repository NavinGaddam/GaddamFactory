import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '../config/firebase.config';

const isConfigured =
  Object.values(firebaseConfig).every(Boolean) &&
  !Object.values(firebaseConfig).some((value) => String(value).startsWith('PASTE_'));

export const configured = isConfigured;
export const app = configured ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null;
export const auth = app ? getAuth(app) : null;
// Imported module bindings do not reliably narrow from `if (!db)` at call sites.
// Keep the runtime null for the unconfigured/demo state while exposing the Firebase type to TypeScript.
export const db = (app ? getFirestore(app) : null) as Firestore | null;
export const storage = (app ? getStorage(app) : null) as FirebaseStorage | null;
export const googleProvider = new GoogleAuthProvider();
