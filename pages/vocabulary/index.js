import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

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

  // Effect to check if user is logged in and retrieve membership type
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
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();

    // Fetch saved words from Firestore
    const fetchSavedWords = async () => {
      try {
        const wordsQuery = query(
          collection(db, "savedWords"), 
          where("userId", "==", currentUser.uid)
        );
        
        const wordsSnapshot = await getDocs(wordsQuery);
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
    
    fetchSavedWords();
  }, [currentUser, router, membershipType, wordLimit]);

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
    // Implement Firebase removal logic here
    // For now, just update the UI
    const newWords = [...filteredWords];
    newWords.splice(index, 1);
    setFilteredWords(newWords);
    setSavedWords(savedWords.filter((_, i) => i !== index));
  };

  const handleGoBack = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>My Vocabulary - Readung</title>
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <button 
              onClick={handleGoBack}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </button>
            <h1 className="text-2xl font-bold">My Vocabulary</h1>
          </div>

          {membershipType === 'free' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Free Account Limit</h3>
                  <p className="text-sm text-gray-600">You can save 3 words per day. ({3 - savedWordsToday} remaining today)</p>
                </div>
                <Link href="/upgrade" className="btn btn-primary text-sm">
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
                  className="input pl-10"
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
                className="input"
              >
                <option value="all">All</option>
                <option value="recent">Recent</option>
                <option value="a1">A1</option>
                <option value="a2">A2</option>
              </select>
            </div>
          </div>

          {/* Vocabulary List */}
          {filteredWords.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      German Word
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Translation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWords.map((word, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{word.word}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{word.translation}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-500 text-sm truncate max-w-xs">
                          {word.notes || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {word.dateAdded ? new Date(word.dateAdded).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleRemoveWord(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "No words found matching your search" : "Your vocabulary list is empty"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Try searching with a different term or clear your search" 
                  : "Save words while reading stories to build your vocabulary"
                }
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/stories/a1" className="btn btn-primary">
                  Start Reading Stories
                </Link>
                <button
                  onClick={handleGoBack}
                  className="btn btn-secondary"
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