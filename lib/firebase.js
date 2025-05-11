// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Create basic mock objects for auth and db
const mockAuth = {
  onAuthStateChanged: (callback) => {
    callback(null);
    return () => {};
  },
  signInWithEmailAndPassword: () => Promise.resolve({ user: null }),
  createUserWithEmailAndPassword: () => Promise.resolve({ user: null }),
  signOut: () => Promise.resolve()
};

const mockDb = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) })
    })
  })
};

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
let app = null;
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
  
  // Disable reCAPTCHA verification for development environment
  // This is critical to fix the "_getRecaptchaConfig is not a function" error
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    auth.settings = {
      ...auth.settings,
      appVerificationDisabledForTesting: true
    };
  }

  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create dummy objects if Firebase fails
  app = null;
  auth = mockAuth;
  db = mockDb;
}

// Make sure we export auth and db correctly
export { auth, db };
export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;
export default app; 