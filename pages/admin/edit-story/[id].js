import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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

export default function EditStory() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, getUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [storyNotFound, setStoryNotFound] = useState(false);
  
  const [storyData, setStoryData] = useState({
    title: '',
    description: '',
    content: '',
    level: 'a1',
    wordCount: 0,
    readTime: 2
  });

  useEffect(() => {
    const checkAdminAndLoadStory = async () => {
      if (!currentUser || !id) {
        if (!currentUser) router.push('/auth/login');
        return;
      }

      try {
        // Admin kontrolü
        const userData = await getUserData();
        if (!userData || userData.role !== 'admin') {
          router.push('/home');
          return;
        }

        // Hikayeyi yükle
        const storyRef = doc(db, 'stories', id);
        const storySnap = await getDoc(storyRef);
        
        if (storySnap.exists()) {
          const story = storySnap.data();
          setStoryData({
            title: story.title || '',
            description: story.description || '',
            content: story.content || '',
            level: story.level || 'a1',
            wordCount: story.wordCount || 0,
            readTime: story.readTime || 2
          });
        } else {
          setStoryNotFound(true);
          setMessage({
            type: 'error',
            text: 'Hikaye bulunamadı.'
          });
        }
      } catch (error) {
        console.error('Error loading story:', error);
        setMessage({
          type: 'error',
          text: 'Hikaye yüklenirken bir hata oluştu.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndLoadStory();
  }, [currentUser, id, router, getUserData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStoryData(prev => ({ ...prev, [name]: value }));
    
    // İçerik değiştiyse kelime sayısını hesapla
    if (name === 'content') {
      const words = value.trim().split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.ceil(words / 100)); // 100 kelime başına 1 dakika (2 katı)
      
      setStoryData(prev => ({
        ...prev,
        wordCount: words,
        readTime
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Hikayeyi güncelle
      const storyRef = doc(db, 'stories', id);
      await updateDoc(storyRef, storyData);
      
      setMessage({
        type: 'success',
        text: 'Hikaye başarıyla güncellendi!'
      });
      
    } catch (error) {
      console.error('Error updating story:', error);
      setMessage({
        type: 'error',
        text: `Hikaye güncellenirken bir hata oluştu: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4">Hikaye yükleniyor...</p>
          </div>
        </main>
      </div>
    );
  }

  if (storyNotFound) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Head>
          <title>Hikaye Bulunamadı - Readung Admin</title>
        </Head>
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Hikaye Bulunamadı</h1>
            <p className="text-gray-600 mb-6">Aradığınız hikaye mevcut değil veya silinmiş olabilir.</p>
            <Link href="/admin/manage-stories" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md">
              Hikayeleri Yönet
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>Hikaye Düzenle - Readung Admin</title>
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Hikaye Düzenle</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/manage-stories" className="flex items-center text-blue-600 hover:text-blue-800">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
                Hikayeleri Yönet
              </span>
            </Link>
            <Link href="/admin" className="flex items-center text-gray-600 hover:text-gray-800">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
                </svg>
                Admin Paneli
              </span>
            </Link>
          </div>
        </div>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
            <button 
              onClick={() => setMessage({ type: '', text: '' })} 
              className="float-right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Hikaye Başlığı *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={storyData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Hikaye başlığını girin"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                  Seviye *
                </label>
                <select
                  id="level"
                  name="level"
                  value={storyData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="a1">A1 - Başlangıç</option>
                  <option value="a2">A2 - Temel</option>
                  <option value="b1">B1 - Orta Alt</option>
                  <option value="b2">B2 - Orta Üst</option>
                  <option value="c1">C1 - İleri</option>
                  <option value="c2">C2 - Üst Düzey</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Hikaye Açıklaması *
              </label>
              <textarea
                id="description"
                name="description"
                value={storyData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Hikaye hakkında kısa bir açıklama yazın"
                required
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Hikaye İçeriği *
              </label>
              <textarea
                id="content"
                name="content"
                value={storyData.content}
                onChange={handleInputChange}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Hikayenin tam içeriğini buraya yazın..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelime Sayısı
                </label>
                <input
                  type="number"
                  value={storyData.wordCount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
                <p className="text-sm text-gray-500 mt-1">Otomatik hesaplanır</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahmini Okuma Süresi (dakika)
                </label>
                <input
                  type="number"
                  value={storyData.readTime}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
                <p className="text-sm text-gray-500 mt-1">Otomatik hesaplanır</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <Link 
                href="/admin/manage-stories"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                İptal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Güncelleniyor...
                  </>
                ) : (
                  'Hikayeyi Güncelle'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 