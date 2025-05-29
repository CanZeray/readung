import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import RatingStats from '../../components/RatingStats';

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
            <span>Dashboard</span>
          </Link>
          <Link href="/home" className="hover:text-gray-300">
            <span>Ana Sayfa</span>
          </Link>
          <button onClick={handleLogout} className="hover:text-gray-300">
            Çıkış
          </button>
        </div>
      </div>
    </nav>
  );
};

export default function AdminRatings() {
  const router = useRouter();
  const { currentUser, getUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      try {
        // Admin kontrolü
        const userData = await getUserData();
        setUserData(userData);
        
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
        <title>Rating Statistics - Admin - Readung</title>
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span>Rating Statistics</span>
          </div>
          <h1 className="text-3xl font-bold">User Rating Statistics</h1>
          <p className="text-gray-600 mt-2">
            View and analyze user feedback and ratings for the platform
          </p>
        </div>
        
        <div className="max-w-7xl">
          <RatingStats />
        </div>
      </main>
    </div>
  );
} 