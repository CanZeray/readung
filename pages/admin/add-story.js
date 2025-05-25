import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

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

export default function AddStory() {
  const router = useRouter();
  const { currentUser, getUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [storyData, setStoryData] = useState({
    title: '',
    description: '',
    content: '',
    level: 'a1',
    wordCount: 0,
    readTime: 2,
    customId: '',
    useCustomId: false
  });

  useEffect(() => {
    const checkAdmin = async () => {
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
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/home');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [currentUser, router, getUserData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setStoryData(prev => ({ ...prev, [name]: checked }));
    } else {
      setStoryData(prev => ({ ...prev, [name]: value }));
    }
    
    // İçerik değiştiyse kelime sayısını hesapla
    if (name === 'content') {
      const words = value.trim().split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.ceil(words / 200)); // 200 kelime başına 1 dakika
      
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
      // Hikaye verilerini hazırla
      const { useCustomId, customId, ...storyFields } = storyData;
      
      // Hikayeyi veritabanına ekle
      let storyId;
      
      if (useCustomId && customId.trim()) {
        storyId = customId.trim();
        await setDoc(doc(db, "stories", storyId), storyFields);
      } else {
        const docRef = await addDoc(collection(db, "stories"), storyFields);
        storyId = docRef.id;
      }
      
      setMessage({
        type: 'success',
        text: `Hikaye başarıyla eklendi! (ID: ${storyId})`
      });
      
      // Formu sıfırla
      setStoryData({
        title: '',
        description: '',
        content: '',
        level: 'a1',
        wordCount: 0,
        readTime: 2,
        customId: '',
        useCustomId: false
      });
      
    } catch (error) {
      console.error('Error adding story:', error);
      setMessage({
        type: 'error',
        text: `Hikaye eklenirken bir hata oluştu: ${error.message}`
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
            <p className="mt-4">Yükleniyor...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>Hikaye Ekle - Readung Admin</title>
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Yeni Hikaye Ekle</h1>
          <Link href="/admin" className="flex items-center text-blue-600 hover:text-blue-800">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              Admin Paneline Dön
            </span>
          </Link>
        </div>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={storyData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                  Seviye
                </label>
                <select
                  id="level"
                  name="level"
                  value={storyData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="a1">A1 - Başlangıç</option>
                  <option value="a2">A2 - Temel</option>
                  <option value="b1">B1 - Orta</option>
                  <option value="b2">B2 - İleri Orta</option>
                  <option value="c1">C1 - İleri</option>
                  <option value="c2">C2 - Uzman</option>
                </select>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={storyData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Hikaye İçeriği
              </label>
              <textarea
                id="content"
                name="content"
                value={storyData.content}
                onChange={handleInputChange}
                rows="12"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-1">
                  Kelime Sayısı
                </label>
                <input
                  type="number"
                  id="wordCount"
                  name="wordCount"
                  value={storyData.wordCount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="readTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Okuma Süresi (dakika)
                </label>
                <input
                  type="number"
                  id="readTime"
                  name="readTime"
                  value={storyData.readTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id="useCustomId"
                    name="useCustomId"
                    checked={storyData.useCustomId}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useCustomId" className="ml-2 block text-sm font-medium text-gray-700">
                    Özel ID Kullan
                  </label>
                </div>
                
                {storyData.useCustomId && (
                  <input
                    type="text"
                    id="customId"
                    name="customId"
                    value={storyData.customId}
                    onChange={handleInputChange}
                    placeholder="örn: b1-restaurant"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Kaydediliyor...' : 'Hikaye Ekle'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 