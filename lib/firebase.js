// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration with fallback values for safety
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDDRWeYmHBvcIAR5AGG7XpfzdVCnccGOt8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "readung-606c9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "readung-606c9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "readung-606c9.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "96213734868",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:96213734868:web:a70467df5dc913a4c5f241",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-7N66LS8V4S"
};

// For debugging
console.log("Firebase Config (API key):", {
  apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + "..." : "Not Set"
});

// Initialize Firebase only if it hasn't been initialized already
let app;
let auth;
let db;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);

  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create dummy objects if Firebase fails
  app = null;
  auth = null;
  db = null;
}

// Export both the original approach and the new function-based approach
export { auth, db };
export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;
export default app; 