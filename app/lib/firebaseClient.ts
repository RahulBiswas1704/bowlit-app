import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Replace these with your actual Firebase project configuration
// from the Firebase Console (Project Settings > General > Your Apps)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase only if it hasn't been initialized already
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firebaseAuth = getAuth(firebaseApp);

export { firebaseAuth };
