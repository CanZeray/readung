import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../../components/Navbar';

export default function StoryList() {
  const router = useRouter();
  const { level } = router.query;
  const [stories, setStories] = useState([]);
  const [levelName, setLevelName] = useState('');
  const [membershipType, setMembershipType] = useState('free');
  const [loading, setLoading] = useState(true);
  const { currentUser, getUserData } = useAuth();

  useEffect(() => {
    // Kullanıcı ve level yoksa işlem yapma
    if (!currentUser || !level) return;

    async function fetchUserAndStories() {
      try {
        setLoading(true);
        
        // Kullanıcı verilerini getir
        const userData = await getUserData();
        if (!userData) {
          router.push('/auth/login');
          return;
        }
        
        setMembershipType(userData.membershipType);
        
        // Ücretsiz kullanıcı kısıtlamalarını kontrol et
        if (
          (['free', 'basic'].includes(userData.membershipType) || !userData.membershipType) &&
          ['b1', 'b2', 'c1', 'c2'].includes(level.toLowerCase())
        ) {
          alert('This level is only available for premium members');
          router.push('/home');
          return;
        }
        
        // Seviye adını ayarla
        const levelNames = {
          a1: 'A1 - Beginner',
          a2: 'A2 - Elementary',
          b1: 'B1 - Intermediate',
          b2: 'B2 - Upper Intermediate',
          c1: 'C1 - Advanced',
          c2: 'C2 - Proficiency',
        };
        setLevelName(levelNames[level.toLowerCase()] || level.toUpperCase());
        
        // Firestore'dan hikayeleri çek
        const storiesQuery = query(
          collection(db, "stories"), 
          where("level", "==", level.toLowerCase())
        );
        
        const querySnapshot = await getDocs(storiesQuery);
        const storyData = [];
        
        querySnapshot.forEach((doc) => {
          storyData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setStories(storyData);
      } catch (error) {
        console.error("Error fetching stories:", error);
        setStories([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserAndStories();
  }, [currentUser, level, router, getUserData]);

  // Hikaye okuma işleyicisi
  const handleReadStory = async (storyId) => {
    router.push(`/stories/read/${storyId}`);
  };

  // Seviye renkleri
  const levelColors = {
    a1: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    a2: 'bg-green-50 text-green-600 hover:bg-green-100',
    b1: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
    b2: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    c1: 'bg-red-50 text-red-600 hover:bg-red-100',
    c2: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
  };

  // Hikaye kartları için pastel arka plan renkleri
  const storyCardBgColors = {
    a1: 'bg-blue-50',
    a2: 'bg-green-50',
    b1: 'bg-yellow-50',
    b2: 'bg-orange-50',
    c1: 'bg-red-50',
    c2: 'bg-purple-50'
  };

  // Seviye butonları
  const LevelButtons = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* A1 Level */}
      <div className="relative group">
        <Link href="/stories/a1">
          <div className={`block bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 hover:from-green-100 hover:to-green-200 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-green-200 hover:border-green-300 cursor-pointer
            ${level?.toLowerCase() === 'a1' ? 'ring-2 ring-green-400 shadow-lg' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-green-800 group-hover:text-green-900">A1</h3>
              <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center group-hover:bg-green-300 transition-colors">
                <span className="text-green-700 font-bold text-xs">A1</span>
              </div>
            </div>
            <p className="text-green-600 text-xs">Beginner</p>
          </div>
        </Link>
      </div>

      {/* A2 Level */}
      <div className="relative group">
        <Link href="/stories/a2">
          <div className={`block bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-4 hover:from-green-200 hover:to-green-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-green-300 hover:border-green-400 cursor-pointer
            ${level?.toLowerCase() === 'a2' ? 'ring-2 ring-green-400 shadow-lg' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-green-800 group-hover:text-green-900">A2</h3>
              <div className="w-6 h-6 bg-green-300 rounded-full flex items-center justify-center group-hover:bg-green-400 transition-colors">
                <span className="text-green-800 font-bold text-xs">A2</span>
              </div>
            </div>
            <p className="text-green-700 text-xs">Elementary</p>
          </div>
        </Link>
      </div>

      {/* B1 Level */}
      <div className="relative group">
        <Link href={membershipType === 'premium' ? "/stories/b1" : "/upgrade/premium"}>
          <div className={`block bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-yellow-200 hover:border-yellow-300 cursor-pointer
            ${level?.toLowerCase() === 'b1' ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-yellow-800 group-hover:text-yellow-900">B1</h3>
              <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center group-hover:bg-yellow-300 transition-colors">
                <span className="text-yellow-800 font-bold text-xs">B1</span>
              </div>
            </div>
            <p className="text-yellow-600 text-xs">Intermediate</p>
          </div>
        </Link>
        {(['free', 'basic'].includes(membershipType) || !membershipType) && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse">
            ✨ PRO
          </span>
        )}
      </div>

      {/* B2 Level */}
      <div className="relative group">
        <Link href={membershipType === 'premium' ? "/stories/b2" : "/upgrade/premium"}>
          <div className={`block bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-4 hover:from-yellow-200 hover:to-yellow-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-yellow-300 hover:border-yellow-400 cursor-pointer
            ${level?.toLowerCase() === 'b2' ? 'ring-2 ring-yellow-400 shadow-lg' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-yellow-800 group-hover:text-yellow-900">B2</h3>
              <div className="w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                <span className="text-yellow-800 font-bold text-xs">B2</span>
              </div>
            </div>
            <p className="text-yellow-700 text-xs">Upper Inter.</p>
          </div>
        </Link>
        {(['free', 'basic'].includes(membershipType) || !membershipType) && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse">
            ✨ PRO
          </span>
        )}
      </div>

      {/* C1 Level */}
      <div className="relative group">
        <Link href={membershipType === 'premium' ? "/stories/c1" : "/upgrade/premium"}>
          <div className={`block bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 hover:from-red-100 hover:to-red-200 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-red-200 hover:border-red-300 cursor-pointer
            ${level?.toLowerCase() === 'c1' ? 'ring-2 ring-red-400 shadow-lg' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-red-800 group-hover:text-red-900">C1</h3>
              <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center group-hover:bg-red-300 transition-colors">
                <span className="text-red-800 font-bold text-xs">C1</span>
              </div>
            </div>
            <p className="text-red-600 text-xs">Advanced</p>
          </div>
        </Link>
        {(['free', 'basic'].includes(membershipType) || !membershipType) && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse">
            ✨ PRO
          </span>
        )}
      </div>

      {/* C2 Level */}
      <div className="relative group">
        <Link href={membershipType === 'premium' ? "/stories/c2" : "/upgrade/premium"}>
          <div className={`block bg-gradient-to-br from-red-100 to-red-200 rounded-xl p-4 hover:from-red-200 hover:to-red-300 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-red-300 hover:border-red-400 cursor-pointer
            ${level?.toLowerCase() === 'c2' ? 'ring-2 ring-red-400 shadow-lg' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-red-800 group-hover:text-red-900">C2</h3>
              <div className="w-6 h-6 bg-red-300 rounded-full flex items-center justify-center group-hover:bg-red-400 transition-colors">
                <span className="text-red-800 font-bold text-xs">C2</span>
              </div>
            </div>
            <p className="text-red-700 text-xs">Proficiency</p>
          </div>
        </Link>
        {(['free', 'basic'].includes(membershipType) || !membershipType) && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse">
            ✨ PRO
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{levelName} Stories - Readung</title>
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-2 text-[#60a5fa] hover:text-[#3b82f6] transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Homepage
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{levelName} Stories</h1>
          <p className="mb-6">
            Select a level to browse stories or read one from the list below.
          </p>
          
          <LevelButtons />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : stories.length === 0 ? (
          <p>No stories available for this level yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div 
                key={story.id} 
                className={`${storyCardBgColors[level?.toLowerCase()] || 'bg-blue-50'} rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-102 transform flex flex-col`}
              >
                <div className="p-6 flex flex-col h-full">
                  <h2 className="text-xl font-bold mb-3 pb-3 border-b border-gray-200">{story.title}</h2>
                  <p className="text-gray-600 mb-4">{story.description}</p>
                  <div className="mt-auto">
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {story.wordCount} words
                      </span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {story.readTime} min read
                      </span>
                    </div>
                    <button
                      onClick={() => handleReadStory(story.id)}
                      className="w-full py-2 px-4 bg-gradient-to-r from-[#3B82F6] to-[#0EA5E9] text-white rounded-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Read Story
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 