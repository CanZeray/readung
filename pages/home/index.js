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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* A1 Level */}
            <Link href="/stories/A1" className="bg-green-50 rounded-lg p-6 hover:bg-green-100 transition duration-150 shadow">
              <h3 className="text-xl font-bold mb-1">A1 - Beginner</h3>
            </Link>
            
            {/* A2 Level */}
            <Link href="/stories/A2" className="bg-green-100 rounded-lg p-6 hover:bg-green-200 transition duration-150 shadow">
              <h3 className="text-xl font-bold mb-1">A2 - Elementary</h3>
            </Link>
            
            {/* B1 Level */}
            <div className="relative">
              <Link href={userData?.membershipType === 'premium' ? "/stories/B1" : "/upgrade/premium"} 
                className="bg-yellow-50 rounded-lg p-6 hover:bg-yellow-100 transition duration-150 block shadow">
                <h3 className="text-xl font-bold mb-1">B1 - Intermediate</h3>
              </Link>
              {userData?.membershipType !== 'premium' && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Premium
                </span>
              )}
            </div>
            
            {/* B2 Level */}
            <div className="relative">
              <Link href={userData?.membershipType === 'premium' ? "/stories/B2" : "/upgrade/premium"} 
                className="bg-yellow-100 rounded-lg p-6 hover:bg-yellow-200 transition duration-150 block shadow">
                <h3 className="text-xl font-bold mb-1">B2 - Upper Intermediate</h3>
              </Link>
              {userData?.membershipType !== 'premium' && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Premium
                </span>
              )}
            </div>
            
            {/* C1 Level */}
            <div className="relative">
              <Link href={userData?.membershipType === 'premium' ? "/stories/C1" : "/upgrade/premium"} 
                className="bg-red-50 rounded-lg p-6 hover:bg-red-100 transition duration-150 block shadow">
                <h3 className="text-xl font-bold mb-1">C1 - Advanced</h3>
              </Link>
              {userData?.membershipType !== 'premium' && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Premium
                </span>
              )}
            </div>
            
            {/* C2 Level */}
            <div className="relative">
              <Link href={userData?.membershipType === 'premium' ? "/stories/C2" : "/upgrade/premium"} 
                className="bg-red-100 rounded-lg p-6 hover:bg-red-200 transition duration-150 block shadow">
                <h3 className="text-xl font-bold mb-1">C2 - Proficiency</h3>
              </Link>
              {userData?.membershipType !== 'premium' && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Premium
                </span>
              )}
            </div>
          </div>
        </section>
        
        {/* Saved Words Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Saved Words</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Your Vocabulary
              </h3>
              <Link href="/vocabulary" className="text-primary hover:text-primary-700 text-sm">
                View All
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Daily limit: {userData?.membershipType === 'premium' ? 'Unlimited' : '3'} words remaining
            </p>
            
            {savedWords.length > 0 ? (
              <div className="space-y-3">
                {savedWords.map(word => (
                  <div key={word.id} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{word.word}</span>
                      <span className="text-gray-500 text-sm">{word.translation}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">You haven't saved any words yet.</p>
                <p className="text-sm text-gray-400">Read stories and save words to build your vocabulary.</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Membership and Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Membership Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500">
            <h2 className="text-lg font-semibold mb-3 text-blue-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Membership
            </h2>
            <p className="mb-3">{userData?.membershipType === 'premium' ? 'Premium' : 'Free'}</p>
            <p className="text-sm text-gray-600 mb-3">
              {userData?.membershipType === 'premium' 
                ? 'Access to all levels' 
                : 'Access to A1 and A2 levels only'}
            </p>
            {userData?.membershipType !== 'premium' && (
              <Link href="/upgrade/premium" className="text-primary hover:text-primary-700 flex items-center">
                Upgrade to Premium{' '}
                <span className="ml-1">✨</span>
              </Link>
            )}
          </div>
          
          {/* Statistics Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistics
            </h2>
            <p>Stories read: {userData?.storiesRead || 0}</p>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center">
        <p>&copy; {new Date().getFullYear()} Readung. All rights reserved.</p>
      </footer>
    </div>
  );
}    
 