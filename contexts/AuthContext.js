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

  // Kayıt olma fonksiyonu
  async function signup(email, password, name) {
    try {
      // Firebase Auth ile kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Kullanıcı profilini güncelle (displayName)
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
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
      throw error;
    }
  }
  
  // Giriş yapma fonksiyonu
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  // Çıkış yapma fonksiyonu
  function logout() {
    return signOut(auth);
  }
  
  // Kullanıcı bilgisini güncelleme
  async function getUserData() {
    if (!currentUser) return null;
    
    try {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  // Auth durumu değişince çalış
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    getUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 