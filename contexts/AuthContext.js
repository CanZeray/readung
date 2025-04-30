import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kayıt olma fonksiyonu
  async function signup(email, password, name) {
    try {
      if (!auth) {
        const errorMsg = 'Firebase authentication is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Kullanıcı profilini güncelle (displayName)
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      if (!db) {
        const errorMsg = 'Firebase database is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Firestore'da kullanıcı dökümanı oluştur
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        name: name,
        membershipType: 'free',
        createdAt: new Date().toISOString(),
        storiesRead: 0,
        savedWords: [],
        savedWordsToday: 0,
        lastReadDate: new Date().toDateString()
      });
      
      return userCredential.user;
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message || "An error occurred during signup");
      throw error;
    }
  }
  
  // Giriş yapma fonksiyonu
  async function login(email, password) {
    try {
      if (!auth) {
        const errorMsg = 'Firebase authentication is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred during login");
      throw error;
    }
  }
  
  // Çıkış yapma fonksiyonu
  async function logout() {
    try {
      if (!auth) {
        const errorMsg = 'Firebase authentication is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      return await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      setError(error.message || "An error occurred during logout");
      throw error;
    }
  }
  
  // Kullanıcı bilgisini güncelleme
  async function getUserData() {
    if (!currentUser) return null;
    
    try {
      if (!db) {
        const errorMsg = 'Firebase database is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      setError(error.message || "An error occurred while getting user data");
      return null;
    }
  }

  // Auth durumu değişince çalış
  useEffect(() => {
    try {
      if (!auth) {
        console.warn("Firebase auth is not available");
        setLoading(false);
        setError('Firebase authentication is not available');
        return () => {};
      }
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        setLoading(false);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Auth state error:", error);
      setLoading(false);
      setError(error.message || "An error occurred in authentication");
      return () => {};
    }
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    getUserData,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 