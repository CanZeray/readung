import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import app, { getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
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
      const auth = getFirebaseAuth();
      if (!auth) {
        const errorMsg = 'Firebase authentication is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Firebase Auth ile kullanıcı oluştur
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        console.error("Error in createUserWithEmailAndPassword:", error);
        
        // reCAPTCHA hatasını kontrol et ve işle
        if (error.message && error.message.includes("_getRecaptchaConfig is not a function")) {
          throw new Error("Authentication error: reCAPTCHA configuration issue. Please try again later.");
        }
        throw error;
      }
      
      // Kullanıcı profilini güncelle (displayName)
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      const db = getFirebaseDb();
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
      const auth = getFirebaseAuth();
      if (!auth) {
        const errorMsg = 'Firebase authentication is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // reCAPTCHA hatası için koruma
      if (auth._getRecaptchaConfig === undefined) {
        console.warn("reCAPTCHA issue detected, using workaround");
        // Basit bir polyfill tanımlama
        auth._getRecaptchaConfig = function() {
          return null;
        };
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
      const auth = getFirebaseAuth();
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
      const db = getFirebaseDb();
      if (!db) {
        const errorMsg = 'Firebase database is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Admin rolünü kontrol et
        const userData = docSnap.data();
        
        // Eğer userData içinde role alanı yoksa ve currentUser.email
        // admin@readung.app veya geliştirici emailiniz ile eşleşiyorsa
        // admin rolünü otomatik olarak ekleyin (sadece ilk kontrol için)
        if (!userData.role && 
            (currentUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || 
             currentUser.email === 'admin@readung.app')) {
          userData.role = 'admin';
          
          // Bu rolü veritabanına kaydet
          try {
            await setDoc(docRef, { role: 'admin' }, { merge: true });
            console.log('Admin role added to user');
          } catch (error) {
            console.error('Error updating admin role:', error);
          }
        }
        
        return userData;
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
      const auth = getFirebaseAuth();
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