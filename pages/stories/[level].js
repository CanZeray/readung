import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../../components/Navbar';

// Örnek hikayeler - seviyeye göre
const sampleStories = {
  a1: [
    {
      id: 'sample-a1-1',
      title: 'Mein erster Tag in Berlin',
      description: 'Eine einfache Geschichte über einen Tag in Berlin. Perfekt für Anfänger.',
      wordCount: 200,
      readTime: 5,
      level: 'a1'
    },
    {
      id: 'sample-a1-2',
      title: 'Die Familie Schmidt',
      description: 'Lerne die Familie Schmidt kennen. Eine Geschichte mit einfachen Vokabular.',
      wordCount: 180,
      readTime: 4,
      level: 'a1'
    },
    {
      id: 'sample-a1-3',
      title: 'Im Supermarkt',
      description: 'Eine Geschichte über einen Einkauf im Supermarkt mit grundlegendem Wortschatz.',
      wordCount: 220,
      readTime: 5,
      level: 'a1'
    }
  ],
  a2: [
    {
      id: 'sample-a2-1',
      title: 'Ein Wochenende in München',
      description: 'Eine Geschichte über einen Kurztrip nach München mit einfachen Sätzen.',
      wordCount: 300,
      readTime: 7,
      level: 'a2'
    },
    {
      id: 'sample-a2-2',
      title: 'Mein Lieblingshobby',
      description: 'Eine Person erzählt von ihrem Hobby mit Vokabular für Anfänger.',
      wordCount: 250,
      readTime: 6,
      level: 'a2'
    }
  ],
  b1: [
    {
      id: 'sample-b1-1',
      title: 'Eine Reise durch Deutschland',
      description: 'Entdecke verschiedene deutsche Städte in dieser interessanten Erzählung.',
      wordCount: 450,
      readTime: 10,
      level: 'b1'
    },
    {
      id: 'sample-b1-2',
      title: 'Das Vorstellungsgespräch',
      description: 'Eine Geschichte über ein Bewerbungsgespräch mit mittlerem Wortschatz.',
      wordCount: 400,
      readTime: 9,
      level: 'b1'
    }
  ],
  b2: [
    {
      id: 'sample-b2-1',
      title: 'Die verlorene Zeit',
      description: 'Eine philosophische Kurzgeschichte über den Wert der Zeit.',
      wordCount: 600,
      readTime: 12,
      level: 'b2'
    },
    {
      id: 'sample-b2-2',
      title: 'Umweltschutz im Alltag',
      description: 'Eine informative Geschichte über Nachhaltigkeit im täglichen Leben.',
      wordCount: 550,
      readTime: 11,
      level: 'b2'
    }
  ],
  c1: [
    {
      id: 'sample-c1-1',
      title: 'Die Kunst des Schreibens',
      description: 'Ein anspruchsvoller Text über literarisches Schreiben und Kreativität.',
      wordCount: 800,
      readTime: 15,
      level: 'c1'
    },
    {
      id: 'sample-c1-2',
      title: 'Deutsch in der globalen Welt',
      description: 'Ein Text über die Bedeutung der deutschen Sprache international.',
      wordCount: 750,
      readTime: 14,
      level: 'c1'
    }
  ],
  c2: [
    {
      id: 'sample-c2-1',
      title: 'Die Philosophie des 21. Jahrhunderts',
      description: 'Ein komplexer Text über moderne philosophische Strömungen.',
      wordCount: 1000,
      readTime: 20,
      level: 'c2'
    },
    {
      id: 'sample-c2-2',
      title: 'Wissenschaft und Ethik',
      description: 'Eine anspruchsvolle Diskussion über ethische Fragen in der modernen Wissenschaft.',
      wordCount: 950,
      readTime: 18,
      level: 'c2'
    }
  ]
};

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
          userData.membershipType === 'free' &&
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
        
        // Veritabanında hikaye yoksa örnek hikayeleri kullan
        if (storyData.length === 0) {
          const levelLower = level.toLowerCase();
          if (sampleStories[levelLower]) {
            setStories(sampleStories[levelLower]);
          } else {
            setStories([]);
          }
        } else {
          setStories(storyData);
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
        // Hata durumunda da örnek hikayeleri göster
        const levelLower = level.toLowerCase();
        if (sampleStories[levelLower]) {
          setStories(sampleStories[levelLower]);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserAndStories();
  }, [currentUser, level, router, getUserData]);

  // Hikaye okuma işleyicisi
  const handleReadStory = async (storyId) => {
    // Örnek hikayeler için özel durum
    if (storyId.startsWith('sample-')) {
      // URL'yi değiştir ama sayfayı yeniden yükleme
      window.history.pushState({}, '', `/stories/read/${storyId}`);
      
      // Kullanıcıya bilgi ver
      alert('This is a sample story. In the full version, you would be able to read the complete story.');
      return;
    }
    
    // Gerçek hikayeler için normal yönlendirme
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
    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
      <Link 
        href="/stories/a1"
        className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 
          ${level?.toLowerCase() === 'a1' 
          ? 'bg-gradient-to-r from-[#3B82F6] to-[#0EA5E9] text-white shadow-md transform scale-105' 
          : levelColors.a1} 
          hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]`}
      >
        A1
      </Link>
      <Link 
        href="/stories/a2"
        className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 
          ${level?.toLowerCase() === 'a2' 
          ? 'bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white shadow-md transform scale-105' 
          : levelColors.a2} 
          hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]`}
      >
        A2
      </Link>
      <Link 
        href={membershipType === 'premium' ? "/stories/b1" : "/upgrade/premium"}
        className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 
          ${level?.toLowerCase() === 'b1' 
          ? 'bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white shadow-md transform scale-105' 
          : levelColors.b1} 
          hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]
          ${membershipType !== 'premium' ? 'relative' : ''}`}
      >
        B1
        {membershipType !== 'premium' && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            PRO
          </span>
        )}
      </Link>
      <Link 
        href={membershipType === 'premium' ? "/stories/b2" : "/upgrade/premium"}
        className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 
          ${level?.toLowerCase() === 'b2' 
          ? 'bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white shadow-md transform scale-105' 
          : levelColors.b2} 
          hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]
          ${membershipType !== 'premium' ? 'relative' : ''}`}
      >
        B2
        {membershipType !== 'premium' && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            PRO
          </span>
        )}
      </Link>
      <Link 
        href={membershipType === 'premium' ? "/stories/c1" : "/upgrade/premium"}
        className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 
          ${level?.toLowerCase() === 'c1' 
          ? 'bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white shadow-md transform scale-105' 
          : levelColors.c1} 
          hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]
          ${membershipType !== 'premium' ? 'relative' : ''}`}
      >
        C1
        {membershipType !== 'premium' && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            PRO
          </span>
        )}
      </Link>
      <Link 
        href={membershipType === 'premium' ? "/stories/c2" : "/upgrade/premium"}
        className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 
          ${level?.toLowerCase() === 'c2' 
          ? 'bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white shadow-md transform scale-105' 
          : levelColors.c2} 
          hover:shadow-[0px_4px_12px_rgba(0,0,0,0.08)]
          ${membershipType !== 'premium' ? 'relative' : ''}`}
      >
        C2
        {membershipType !== 'premium' && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            PRO
          </span>
        )}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{levelName} Stories - Readung</title>
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
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