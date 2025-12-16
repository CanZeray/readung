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
  const [completedStories, setCompletedStories] = useState([]);
  const { currentUser, getUserData } = useAuth();

  useEffect(() => {
    // Level yoksa işlem yapma
    if (!level) return;

    async function fetchUserAndStories() {
      try {
        setLoading(true);
        
        // Kullanıcı varsa verilerini getir
        let userData = null;
        if (currentUser) {
          userData = await getUserData();
          if (userData) {
            setMembershipType(userData.membershipType || 'free');
            setCompletedStories(userData.completedStories || []);
          }
        } else {
          setMembershipType('free');
          setCompletedStories([]);
        }
        
        // Ücretli hikayeler için kontrol (sadece giriş yapmamış veya free/basic kullanıcılar için)
        const isPremiumLevel = ['b1', 'b2'].includes(level.toLowerCase());
        const isFreeUser = !userData || ['free', 'basic'].includes(userData.membershipType) || !userData.membershipType;
        
        if (isPremiumLevel && isFreeUser) {
          // Ücretli hikayeler için giriş yapılması gerekiyor
          alert('Bu seviye için üye girişi ve premium üyelik gereklidir. Üye olmak için lütfen giriş yapın.');
          router.push('/auth/login');
          return;
        }
        
        // Seviye adını ayarla
        const levelNames = {
          a1: 'A1 - Beginner',
          a2: 'A2 - Elementary',
          b1: 'B1 - Intermediate',
          b2: 'B2 - Upper Intermediate',
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
        
        // Hikayeleri sırala (timestamp veya dateAdded varsa ona göre, yoksa id'ye göre)
        storyData.sort((a, b) => {
          const dateA = a.dateAdded?.toDate ? a.dateAdded.toDate() : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0));
          const dateB = b.dateAdded?.toDate ? b.dateAdded.toDate() : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0));
          return dateB - dateA; // En yeni önce
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

  // URL'den completed parametresini kontrol et ve bildirim göster
  useEffect(() => {
    if (router.query.completed) {
      // Overlay oluştur
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center';
      
      // Bildirim kartı
      const notification = document.createElement('div');
      notification.className = 'bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100';
      notification.innerHTML = `
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl p-6 text-center">
          <div class="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">Story Completed! 🎉</h3>
        </div>
        <div class="p-6 text-center">
          <p class="text-gray-700 text-lg mb-4">Congratulations! You have successfully completed this story.</p>
          <p class="text-gray-500 text-sm">Keep up the great work and continue learning!</p>
        </div>
        <div class="px-6 pb-6">
          <button class="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
            Continue Learning
          </button>
        </div>
      `;
      
      // Butona tıklama olayı
      const handleClose = () => {
        overlay.style.opacity = '0';
        notification.style.transform = 'scale(0.9)';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.remove();
          }
          // URL'den completed parametresini kaldır
          router.replace(`/stories/${level}`, undefined, { shallow: true });
        }, 300);
      };
      
      // Overlay'e tıklama (sadece overlay'e direkt tıklanırsa)
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleClose();
        }
      });
      
      // Notification'a tıklama olaylarını durdur (overlay'e yayılmasın)
      notification.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      overlay.appendChild(notification);
      document.body.appendChild(overlay);
      
      // Buton event listener'ı - DOM'a eklendikten sonra
      setTimeout(() => {
        const button = notification.querySelector('button');
        if (button) {
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            handleClose();
          });
        }
      }, 10);
      
      // Animasyon için küçük gecikme
      setTimeout(() => {
        notification.style.transform = 'scale(1)';
      }, 10);
      
      // Otomatik kapanma
      const autoCloseTimeout = setTimeout(() => {
        if (overlay.parentNode) {
          handleClose();
        }
      }, 5000);
      
      // Cleanup function
      return () => {
        clearTimeout(autoCloseTimeout);
        if (overlay.parentNode) {
          overlay.remove();
        }
      };
    }
  }, [router.query.completed, router, level]);

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
  };

  // Hikaye kartları için pastel arka plan renkleri
  const storyCardBgColors = {
    a1: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-100',
    a2: 'bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 border-teal-100',
    b1: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-100',
    b2: 'bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 border-rose-100',
  };

  // Buton renkleri - seviyeye göre
  const buttonColors = {
    a1: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
    a2: 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
    b1: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
    b2: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700',
  };

  // Seviye butonları
  const LevelButtons = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 mb-2 group text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back to Homepage</span>
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
            {stories.map((story, index) => {
              // A1 seviyesinde ilk 3 hikayeden sonrakiler için premium kontrolü
              // A2 seviyesinde ilk 3 hikayeden sonrakiler için premium kontrolü
              const levelLower = level?.toLowerCase();
              const isA1 = levelLower === 'a1';
              const isA2 = levelLower === 'a2';
              const isA1AfterFirst3 = isA1 && index >= 3;
              const isA2AfterFirst3 = isA2 && index >= 3;
              const requiresPremium = isA1AfterFirst3 || isA2AfterFirst3;
              const isFreeUser = !currentUser || ['free', 'basic'].includes(membershipType) || !membershipType;
              const isLocked = requiresPremium && isFreeUser;
              const isCompleted = completedStories.includes(story.id);
              
              // Tamamlanmış hikayeler için özel renkler
              const completedCardColors = {
                a1: 'bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 border-green-300',
                a2: 'bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100 border-cyan-300',
                b1: 'bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-100 border-yellow-300',
                b2: 'bg-gradient-to-br from-pink-100 via-rose-100 to-fuchsia-100 border-pink-300',
              };
              
              const cardBgColor = isCompleted 
                ? (completedCardColors[level?.toLowerCase()] || completedCardColors.a1)
                : (storyCardBgColors[level?.toLowerCase()] || 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-100');
              
              return (
                <div 
                  key={story.id} 
                  className={`${cardBgColor} rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-102 transform flex flex-col border-2 relative ${isLocked ? 'opacity-75' : ''} ${isCompleted ? 'ring-2 ring-green-400' : ''}`}
                >
                  {isLocked && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-2xl flex items-center justify-center z-10">
                      <div className="text-center text-white p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="font-bold mb-3 text-lg">Premium Required</p>
                        <Link href="/upgrade/premium">
                          <button className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-6 py-3 rounded-xl text-base font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-yellow-300 hover:border-yellow-400 ring-2 ring-yellow-200/50 hover:ring-yellow-300/70">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <span>Upgrade to Premium</span>
                            <span className="text-lg">✨</span>
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </div>
                  )}
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
                          {typeof story.readTime === 'string' && story.readTime.includes('min') ? story.readTime : `${story.readTime} min`} read
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (isLocked) {
                            router.push('/upgrade/premium');
                          } else {
                            handleReadStory(story.id);
                          }
                        }}
                        className={`w-full py-2 px-4 ${isLocked ? 'bg-gray-400 cursor-not-allowed' : buttonColors[level?.toLowerCase()] || 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'} text-white rounded-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 flex items-center justify-center gap-2`}
                        disabled={isLocked}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {isLocked ? 'Premium Required' : 'Read Story'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
} 