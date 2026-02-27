// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
