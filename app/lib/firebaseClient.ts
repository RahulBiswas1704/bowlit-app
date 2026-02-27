import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * MANDATORY: Replace these values with your actual Firebase Project keys.
 * You can find these in the Firebase Console:
 * Project Settings (Gear Icon) -> General -> Scroll down to 'Your apps'
 */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBze4S5JI5wIayDFOM5PTmdAEdW5mnPbbE",
  authDomain: "bowlit-app-f8b5f.firebaseapp.com",
  projectId: "bowlit-app-f8b5f",
  storageBucket: "bowlit-app-f8b5f.firebasestorage.app",
  messagingSenderId: "576952120280",
  appId: "1:576952120280:web:66903c58882111844a38ad",
  measurementId: "G-6XLQK88835"
};

// Initialize Firebase (Singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);

// For debugging: This will log if the auth instance is ready
if (typeof window !== "undefined") {
  console.log("Firebase Auth initialized");
}

export { firebaseAuth };
