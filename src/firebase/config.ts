import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const resolvedFirebaseConfig = firebaseConfig as typeof firebaseConfig & {
  firestoreDatabaseId?: string;
};

// Initialize Firebase
const app = initializeApp(resolvedFirebaseConfig);

// Initialize Firestore with specific database ID if present, otherwise default
export const db = resolvedFirebaseConfig.firestoreDatabaseId
  ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

export default app;
