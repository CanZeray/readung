// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "example.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "example-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "example.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

// Log config for debugging (remove in production)
console.log("Firebase Config:", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Set" : "Not Set",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Set" : "Not Set",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Set" : "Not Set",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "Set" : "Not Set",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "Set" : "Not Set",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "Set" : "Not Set"
});

// Initialize Firebase only if it hasn't been initialized already
let app;
let auth = null;
let db = null;

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
  app = null;
}

export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;
export default app; 