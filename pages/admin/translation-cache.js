import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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
        <div className="text-xl font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-blue-500">Readung Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hover:text-gray-300">
            <span>Admin Paneli</span>
          </Link>
          <button onClick={handleLogout} className="hover:text-gray-300">
            Çıkış
          </button>
        </div>
      </div>
    </nav>
  );
};

export default function TranslationCache() {
  const router = useRouter();
  const { currentUser, getUserData } = useAuth();
  const [translations, setTranslations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWords: 0,
    estimatedTokensSaved: 0,
    oldestTranslation: null,
    newestTranslation: null
  });

  // Önbellekteki tüm çevirileri getir
  useEffect(() => {
    const fetchTranslations = async () => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      try {
        // Admin kontrolü
        const userData = await getUserData();
        if (!userData || userData.role !== 'admin') {
          router.push('/home');
          return;
        }

        setIsLoading(true);
        const translationsRef = collection(db, 'translations');
        const q = query(translationsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const translationData = [];
        querySnapshot.forEach((doc) => {
          translationData.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          });
        });
        
        setTranslations(translationData);
        
        // İstatistikleri hesapla
        if (translationData.length > 0) {
          const totalWords = translationData.length;
          // ChatGPT API'da bir çeviri için ortalama ~100 token harcanır
          const estimatedTokensSaved = totalWords * 100 - totalWords * 5; // İlk çeviride harcanan - önbellekten alırken harcanan
          
          const dates = translationData.map(t => t.timestamp);
          const oldestDate = new Date(Math.min(...dates));
          const newestDate = new Date(Math.max(...dates));
          
          setStats({
            totalWords,
            estimatedTokensSaved,
            oldestTranslation: oldestDate,
            newestTranslation: newestDate
          });
        }
      } catch (error) {
        console.error('Error fetching translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [currentUser, router, getUserData]);

  // API token maliyeti hesaplama (yaklaşık)
  const calculateCost = (tokens) => {
    // GPT-3.5-Turbo için her 1000 token yaklaşık $0.002
    return (tokens / 1000) * 0.002;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>Çeviri Önbelleği - Readung Admin</title>
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Çeviri Önbelleği</h1>
          <Link href="/admin" className="flex items-center text-blue-600 hover:text-blue-800">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              Admin Paneline Dön
            </span>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-10 w-10 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4">Çeviriler yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-semibold uppercase mb-1">Toplam Kelime</h3>
                <p className="text-3xl font-bold">{stats.totalWords}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-semibold uppercase mb-1">Yaklaşık Token Tasarrufu</h3>
                <p className="text-3xl font-bold">{stats.estimatedTokensSaved.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">~${calculateCost(stats.estimatedTokensSaved).toFixed(2)} tasarruf</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-semibold uppercase mb-1">İlk Çeviri</h3>
                <p className="text-xl font-semibold">
                  {stats.oldestTranslation ? stats.oldestTranslation.toLocaleDateString() : '-'}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm font-semibold uppercase mb-1">Son Çeviri</h3>
                <p className="text-xl font-semibold">
                  {stats.newestTranslation ? stats.newestTranslation.toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="font-bold text-xl">Çeviri Listesi</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelime</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Çeviri</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {translations.slice(0, 20).map((translation) => (
                      <tr key={translation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{translation.original}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{translation.translation.substring(0, 100)}{translation.translation.length > 100 ? '...' : ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {translation.timestamp ? translation.timestamp.toLocaleString() : '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {translations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Henüz çeviri önbelleği oluşturulmamış.
                  </div>
                )}
                
                {translations.length > 20 && (
                  <div className="px-6 py-3 text-sm text-gray-500 border-t">
                    Toplam {translations.length} çeviriden ilk 20 tanesi gösteriliyor.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
} 