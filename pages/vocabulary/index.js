import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import Navbar from '../../components/Navbar';

// Silme onay modalı
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, word }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in duration-200">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Word</h3>
          <p className="text-gray-600">
            Are you sure you want to delete "<span className="font-semibold text-gray-800">{word}</span>"?
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Vocabulary Card bileşeni
const VocabularyCard = ({ word, onRemove, index }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDelete = () => {
    setShowConfirmation(true);
  };

  const confirmDelete = () => {
    onRemove(index);
    setShowConfirmation(false);
  };

  return (
    <div className="relative group">
      <div className="bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 rounded-xl p-5 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-gray-200 hover:border-gray-300">
        {/* Silme butonu */}
        <button 
          onClick={handleDelete}
          className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors opacity-70 hover:opacity-100 bg-red-50 hover:bg-red-100 rounded-full p-1.5"
          aria-label="Remove word"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        {/* Kelime bilgileri */}
        <div className="pr-8">
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">{word.word}</h3>
          <p className="text-gray-600 mb-3 font-medium">{word.translation}</p>
          
          {/* Ekleme tarihi */}
          <div className="flex items-center text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {word.dateAdded ? new Date(word.dateAdded).toLocaleDateString() : "Recently added"}
          </div>
        </div>
      </div>
      
      {/* Silme onay modalı */}
      <DeleteConfirmationModal 
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmDelete}
        word={word.word}
      />
    </div>
  );
};

export default function Vocabulary() {
  const router = useRouter();
  const [savedWords, setSavedWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredWords, setFilteredWords] = useState([]);
  const [filter, setFilter] = useState('all');
  const [membershipType, setMembershipType] = useState('free');
  const [wordLimit, setWordLimit] = useState(100);
  const [freeLimit, setFreeLimit] = useState(false);
  const [savedWordsToday, setSavedWordsToday] = useState(0);
  const { currentUser } = useAuth();

  // Fetch saved words from Firestore
  const fetchSavedWords = async () => {
    try {
      // Alt koleksiyondan kelimeleri çek
      const savedWordsRef = collection(db, 'users', currentUser.uid, 'savedWords');
      const wordsSnapshot = await getDocs(savedWordsRef);
      const wordsData = wordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort words by date added (newest first)
      wordsData.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      setSavedWords(wordsData);
      setFilteredWords(wordsData);
      
      // Check if free limit reached
      if (membershipType === 'free' && wordsData.length >= wordLimit) {
        setFreeLimit(true);
      }
    } catch (error) {
      console.error("Error fetching saved words:", error);
    }
  };
  
  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    // Get user data from Firestore
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setMembershipType(userData.membershipType || 'free');
          
          // Set word limit based on membership
          setWordLimit(userData.membershipType === 'premium' ? 1000 : 100);
          
          // Günlük kelime sayısını kontrol et ve gerekirse sıfırla
          const today = new Date().toDateString();
          const lastSaveDate = userData.lastWordSaveDate || '';
          
          if (lastSaveDate === today) {
            setSavedWordsToday(userData.savedWordsToday || 0);
          } else {
            setSavedWordsToday(0);
            // Günlük kelime sayısını da sıfırla
            if (userData.savedWordsToday > 0) {
              await updateDoc(userDocRef, {
                savedWordsToday: 0,
                lastWordSaveDate: today
              });
            }
          }
          
          // Fetch saved words
          await fetchSavedWords();
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [currentUser, router]);

  // Function to filter words based on search term and filter
  useEffect(() => {
    let filtered = [...savedWords];
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(word => 
        word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.translation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(word => word.level === filter);
    }
    
    setFilteredWords(filtered);
  }, [searchTerm, filter, savedWords]);

  // Handle removing a word
  const handleRemoveWord = async (index) => {
    try {
      const wordToDelete = filteredWords[index];
      
      if (!wordToDelete || !wordToDelete.id) {
        console.error("Cannot delete word: Invalid word ID");
        return;
      }
      
      // Firestore'dan kelimeyi sil
      const wordDocRef = doc(db, "users", currentUser.uid, "savedWords", wordToDelete.id);
      await deleteDoc(wordDocRef);
      
      // UI'ı güncelle
      const newWords = [...filteredWords];
      newWords.splice(index, 1);
      setFilteredWords(newWords);
      
      // savedWords array'ini de güncelle ki diğer taraflarda da güncel olsun
      setSavedWords(savedWords.filter(word => word.id !== wordToDelete.id));
      
      // Başarı mesajı (opsiyonel)
      console.log(`Word '${wordToDelete.word}' successfully deleted`);
    } catch (error) {
      console.error("Error deleting word:", error);
      alert("Failed to delete word. Please try again.");
    }
  };

  const handleGoBack = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>My Vocabulary - Readung</title>
        <meta name="description" content="Your saved German vocabulary words" />
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/home">
                  <div className="inline-flex items-center gap-2 text-white hover:text-blue-100 transition-colors mr-6 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Home</span>
                  </div>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold">My Vocabulary</h1>
                  <p className="text-blue-100 mt-1">{filteredWords.length} words saved</p>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          {(['free', 'basic'].includes(membershipType) || !membershipType) && (
            <div className="relative group mb-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200 rounded-xl p-6 transition-all duration-300 shadow-md hover:shadow-lg border border-amber-200 hover:border-amber-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-800">Free Account Limit</h3>
                      <p className="text-sm text-amber-700">You can save 3 words per day. ({3 - savedWordsToday} remaining today)</p>
                    </div>
                  </div>
                  <Link href="/upgrade" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Upgrade to Premium ✨
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-md border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    placeholder="Search words in German or English"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none"
                >
                  <option value="all">All Categories</option>
                  <option value="recent">Recent</option>
                  <option value="a1">A1 Level</option>
                  <option value="a2">A2 Level</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vocabulary List - Kart Görünümü */}
          {filteredWords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredWords.map((word, index) => (
                <VocabularyCard 
                  key={index} 
                  word={word} 
                  onRemove={handleRemoveWord} 
                  index={index} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-semibold mb-2 text-[#212121]">
                {searchTerm ? "No words found matching your search" : "Your vocabulary list is empty"}
              </h3>
              <p className="text-[#616161] mb-4">
                {searchTerm 
                  ? "Try searching with a different term or clear your search" 
                  : "Save words while reading stories to build your vocabulary"
                }
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/stories/a1" className="bg-[#1976D2] hover:bg-[#0D47A1] text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Start Reading Stories
                </Link>
                <button
                  onClick={handleGoBack}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6 text-center">
        <p>&copy; {new Date().getFullYear()} Readung. All rights reserved.</p>
      </footer>
    </div>
  );
} 