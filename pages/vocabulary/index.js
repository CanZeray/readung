import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';

// Navbar component
const Navbar = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-dark text-white px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/home" className="text-xl font-bold">
          Readung
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="hover:text-gray-300">
            Profile
          </Link>
          <button onClick={handleLogout} className="hover:text-gray-300">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

// Silme onay modalı
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, word }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Delete Word</h3>
        <p className="text-gray-600 mb-5">
          Are you sure you want to delete "<span className="font-semibold">{word}</span>"?
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-3 w-full overflow-hidden">
      <div className="p-3 relative">
        {/* Silme butonu */}
        <button 
          onClick={handleDelete}
          className="absolute top-2 right-2 text-[#E57373] hover:text-[#D32F2F] transition-colors"
          aria-label="Remove word"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        {/* Kelime ve çevirisi */}
        <h3 className="font-bold text-[22px] text-[#212121] mb-2 pr-7 font-[Inter,sans-serif]">{word.word}</h3>
        <p className="text-[16px] text-[#424242] mb-2 font-[Inter,sans-serif]">{word.translation}</p>
        
        {/* Ekleme tarihi */}
        <p className="text-[12px] text-[#616161]">
          {word.dateAdded ? new Date(word.dateAdded).toLocaleDateString() : "-"}
        </p>
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
          
          // Set saved words today for daily limit
          setSavedWordsToday(userData.savedWordsToday || 0);
          
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
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <Head>
        <title>My Vocabulary - Readung</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 max-w-[1024px] mx-auto">
          <div className="flex items-center mb-6">
            <button 
              onClick={handleGoBack}
              className="flex items-center gap-2 text-[#1976D2] hover:text-[#0D47A1] transition-colors mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </button>
            <h1 className="text-2xl font-bold text-[#212121]">My Vocabulary</h1>
          </div>

          {membershipType === 'free' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Free Account Limit</h3>
                  <p className="text-sm text-gray-600">You can save 3 words per day. ({3 - savedWordsToday} remaining today)</p>
                </div>
                <Link href="/upgrade" className="bg-[#1976D2] hover:bg-[#0D47A1] text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                  Upgrade to Premium
                </Link>
              </div>
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1976D2] focus:border-[#1976D2]"
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
                className="w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1976D2] focus:border-[#1976D2]"
              >
                <option value="all">All</option>
                <option value="recent">Recent</option>
                <option value="a1">A1</option>
                <option value="a2">A2</option>
              </select>
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