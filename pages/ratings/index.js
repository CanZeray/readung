import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import RatingHistory from '../../components/RatingHistory';

export default function RatingsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>My Ratings - Readung</title>
        <meta name="description" content="View your rating history and feedback" />
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Ratings</h1>
            <p className="text-gray-600">Track your feedback and rating history</p>
          </div>
          
          <RatingHistory />
        </div>
      </main>

      <footer className="border-t py-6 text-center bg-white">
        <p>&copy; {new Date().getFullYear()} Readung. All rights reserved.</p>
      </footer>
    </div>
  );
} 