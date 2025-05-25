import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import Navbar from '../../components/Navbar';

export default function Home() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [savedWords, setSavedWords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch saved words
  const fetchSavedWords = async () => {
    try {
      // Alt koleksiyondan kelimeleri çekme
      const savedWordsRef = collection(db, 'users', currentUser.uid, 'savedWords');
      const wordsQuery = query(savedWordsRef, limit(5));
      const wordsSnapshot = await getDocs(wordsQuery);
      const wordsList = wordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // En son eklenen 5 kelimeyi göster
      const sortedWords = wordsList.sort((a, b) => 
        new Date(b.dateAdded) - new Date(a.dateAdded)
      ).slice(0, 5);
      
      setSavedWords(sortedWords);
    } catch (error) {
      console.error('Error fetching saved words:', error);
    }
  };

  useEffect(() => {
    async function fetchUserData() {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          await fetchSavedWords();
        } else {
          console.log('No user data found!');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [currentUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-primary-200 h-16 w-16 mb-3"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Ana Sayfa - Readung</title>
        <meta name="description" content="Keşfedin, okuyun, kelimeler kaydedin" />
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Welcome, {userData?.name || 'admin'}!</h1>
        
        {/* Choose a Level Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Choose a Level
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* A1 Level */}
            <div className="relative group">
              <Link href="/stories/A1">
                <div className="block bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-green-200 hover:border-green-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-900">A1 - Beginner</h3>
                    <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center group-hover:bg-green-300 transition-colors">
                      <span className="text-green-700 font-bold text-sm">A1</span>
                    </div>
                  </div>
                  <p className="text-green-600 text-sm">Perfect for complete beginners</p>
                </div>
              </Link>
            </div>
            
            {/* A2 Level */}
            <div className="relative group">
              <Link href="/stories/A2">
                <div className="block bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 hover:from-green-200 hover:to-green-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-green-300 hover:border-green-400 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-green-800 group-hover:text-green-900">A2 - Elementary</h3>
                    <div className="w-8 h-8 bg-green-300 rounded-full flex items-center justify-center group-hover:bg-green-400 transition-colors">
                      <span className="text-green-800 font-bold text-sm">A2</span>
                    </div>
                  </div>
                  <p className="text-green-700 text-sm">Basic German knowledge</p>
                </div>
              </Link>
            </div>
            
            {/* B1 Level */}
            <div className="relative group">
              <Link href={userData?.membershipType === 'premium' ? "/stories/B1" : "/upgrade/premium"}>
                <div className="block bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-yellow-200 hover:border-yellow-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-yellow-800 group-hover:text-yellow-900">B1 - Intermediate</h3>
                    <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center group-hover:bg-yellow-300 transition-colors">
                      <span className="text-yellow-800 font-bold text-sm">B1</span>
                    </div>
                  </div>
                  <p className="text-yellow-600 text-sm">Independent language use</p>
                </div>
              </Link>
              {(['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-pulse">
                  ✨ Premium
                </span>
              )}
            </div>
            
            {/* B2 Level */}
            <div className="relative group">
              <Link href={userData?.membershipType === 'premium' ? "/stories/B2" : "/upgrade/premium"}>
                <div className="block bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-6 hover:from-yellow-200 hover:to-yellow-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-yellow-300 hover:border-yellow-400 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-yellow-800 group-hover:text-yellow-900">B2 - Upper Intermediate</h3>
                    <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                      <span className="text-yellow-800 font-bold text-sm">B2</span>
                    </div>
                  </div>
                  <p className="text-yellow-700 text-sm">Complex topics and ideas</p>
                </div>
              </Link>
              {(['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-pulse">
                  ✨ Premium
                </span>
              )}
            </div>
            
            {/* C1 Level */}
            <div className="relative group">
              <Link href={userData?.membershipType === 'premium' ? "/stories/C1" : "/upgrade/premium"}>
                <div className="block bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 hover:from-red-100 hover:to-red-200 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-red-200 hover:border-red-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-red-800 group-hover:text-red-900">C1 - Advanced</h3>
                    <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center group-hover:bg-red-300 transition-colors">
                      <span className="text-red-800 font-bold text-sm">C1</span>
                    </div>
                  </div>
                  <p className="text-red-600 text-sm">Fluent and precise language</p>
                </div>
              </Link>
              {(['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-pulse">
                  ✨ Premium
                </span>
              )}
            </div>
            
            {/* C2 Level */}
            <div className="relative group">
              <Link href={userData?.membershipType === 'premium' ? "/stories/C2" : "/upgrade/premium"}>
                <div className="block bg-gradient-to-br from-red-100 to-red-200 rounded-xl p-6 hover:from-red-200 hover:to-red-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-red-300 hover:border-red-400 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-red-800 group-hover:text-red-900">C2 - Proficiency</h3>
                    <div className="w-8 h-8 bg-red-300 rounded-full flex items-center justify-center group-hover:bg-red-400 transition-colors">
                      <span className="text-red-800 font-bold text-sm">C2</span>
                    </div>
                  </div>
                  <p className="text-red-700 text-sm">Native-like language mastery</p>
                </div>
              </Link>
              {(['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-pulse">
                  ✨ Premium
                </span>
              )}
            </div>
          </div>
        </section>
        
        {/* Saved Words Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Saved Words
          </h2>
          <div className="relative group">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 rounded-xl p-6 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 hover:border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Your Vocabulary
                </h3>
                <Link href="/vocabulary" className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors">
                  View All →
                </Link>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Daily limit: <span className="font-medium">{userData?.membershipType === 'premium' ? 'Unlimited' : '3'} words remaining</span>
              </p>
              
              {savedWords.length > 0 ? (
                <div className="space-y-3">
                  {savedWords.map(word => (
                    <div key={word.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium text-gray-800">{word.word}</span>
                      <span className="text-gray-500 text-sm">{word.translation}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-2 font-medium">No saved words yet</p>
                  <p className="text-sm text-gray-400">Read stories and save words to build your vocabulary</p>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Membership and Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Membership Card */}
          <div className="relative group">
            <div className={`bg-gradient-to-br rounded-xl p-6 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border cursor-default
              ${userData?.membershipType === 'premium' 
                ? 'from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-yellow-200 hover:border-yellow-300' 
                : 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 hover:border-blue-300'}`}>
              
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold flex items-center
                  ${userData?.membershipType === 'premium' ? 'text-yellow-800' : 'text-blue-800'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Membership
                </h2>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                  ${userData?.membershipType === 'premium' 
                    ? 'bg-yellow-200 group-hover:bg-yellow-300' 
                    : 'bg-blue-200 group-hover:bg-blue-300'}`}>
                  <span className={`font-bold text-sm
                    ${userData?.membershipType === 'premium' ? 'text-yellow-800' : 'text-blue-800'}`}>
                    {userData?.membershipType === 'premium' ? '✨' : '🆓'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className={`text-lg font-semibold
                  ${userData?.membershipType === 'premium' ? 'text-yellow-800' : 'text-blue-800'}`}>
                  {userData?.membershipType === 'premium' ? 'Premium' : 'Free'}
                </p>
                <p className={`text-sm
                  ${userData?.membershipType === 'premium' ? 'text-yellow-700' : 'text-blue-700'}`}>
                  {userData?.membershipType === 'premium' 
                    ? 'Access to all levels' 
                    : 'Access to A1 and A2 levels only'}
                </p>
                
                {(['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) && (
                  <div className="pt-2">
                    <Link href="/upgrade/premium" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm">
                      <span className="flex items-center">
                        Upgrade to Premium{' '}
                        <span className="ml-1">✨</span>
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Statistics Card */}
          <div className="relative group">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl p-6 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-purple-200 hover:border-purple-300 cursor-default">
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Statistics
                </h2>
                <div className="w-10 h-10 bg-purple-200 group-hover:bg-purple-300 rounded-full flex items-center justify-center transition-colors">
                  <span className="text-purple-800 font-bold text-sm">📊</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-semibold text-purple-800">Stories read: {userData?.completedStories?.length || 0}</p>
                <p className="text-sm text-purple-700">Your learning progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <section className="bg-gray-50 py-12 mt-12 rounded-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">Have questions? We're here to help!</p>
            <a href="mailto:readung@hotmail.com" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              readung@hotmail.com
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center">
        <p>&copy; {new Date().getFullYear()} Readung. All rights reserved.</p>
      </footer>
    </div>
  );
} 