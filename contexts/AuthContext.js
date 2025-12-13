import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import app, { getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred during login");
      throw error;
    }
  }

  // Google ile giriş yapma fonksiyonu
  async function signInWithGoogle() {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        const errorMsg = 'Firebase authentication is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const db = getFirebaseDb();
      if (!db) {
        const errorMsg = 'Firebase database is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Kullanıcının Firestore'da kaydı var mı kontrol et
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Yeni kullanıcı ise Firestore'da kayıt oluştur
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || 'Google User',
          membershipType: 'free',
          createdAt: new Date().toISOString(),
          storiesRead: 0,
          savedWords: [],
          savedWordsToday: 0,
          lastReadDate: new Date().toDateString()
        });
      }
      
      return user;
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(error.message || "An error occurred during Google sign in");
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
  
  // Premium erişim kontrolü
  function isPremiumActive(userData) {
    if (!userData) return false;
    
    // Basic/free users are not premium
    if (userData.membershipType === 'basic' || userData.membershipType === 'free' || !userData.membershipType) {
      return false;
    }
    
    // Check if subscription is active
    if (userData.membershipType === 'premium') {
      // If subscription is cancelled, check if still within grace period
      if (userData.cancelledAt) {
        const cancelledDate = new Date(userData.cancelledAt);
        const gracePeriodEnd = new Date(cancelledDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days grace
        const now = new Date();
        
        if (now > gracePeriodEnd) {
          console.log('🚫 Premium subscription expired after grace period');
          return false;
        }
        console.log('⚠️ Premium subscription cancelled but still in grace period');
      }
      
      // Check subscription status
      if (userData.subscription?.status === 'canceled' || userData.subscription?.status === 'inactive') {
        console.log('🚫 Premium subscription status is inactive');
        return false;
      }
      
      return true;
    }
    
    return false;
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
        
        // Premium erişim kontrolü - Expired premium users'ı basic'e düşür
        if (userData.membershipType === 'premium' && !isPremiumActive(userData)) {
          console.log('🔄 Downgrading expired premium user to basic');
          await setDoc(docRef, { 
            membershipType: 'basic',
            updatedAt: new Date().toISOString()
          }, { merge: true });
          userData.membershipType = 'basic';
        }
        
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
    let timeoutId;
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        console.warn("Firebase auth is not available");
        setLoading(false);
        setError('Firebase authentication is not available');
        return () => {};
      }
      
      // Timeout ekle - 5 saniye içinde auth state değişmezse loading'i false yap
      timeoutId = setTimeout(() => {
        console.warn("Auth state change timeout - forcing loading to false");
        setLoading(false);
      }, 5000);
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        clearTimeout(timeoutId);
        setCurrentUser(user);
        setLoading(false);
      });
      
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error) {
      console.error("Auth state error:", error);
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
      setError(error.message || "An error occurred in authentication");
      return () => {};
    }
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout,
    getUserData,
    isPremiumActive,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 