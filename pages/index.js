import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { currentUser, error } = useAuth();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Handle Firebase errors gracefully
    if (error) {
      console.error("Auth error:", error);
      setAuthError(error);
    }
    
    // Giriş yapmış kullanıcıyı home sayfasına yönlendir
    if (currentUser) {
      router.push('/home');
    }
  }, [currentUser, router, error]);

  return (
    <div className="min-h-screen">
      <Head>
        <title>Readung - Learn German Through Stories</title>
        <meta name="description" content="Improve your German language skills by reading level-appropriate stories" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Readung</h1>
          <p className="text-xl mb-8 max-w-2xl">
            Improve your German language skills by reading stories appropriate for your level.
          </p>
          
          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>Firebase setup error. Please try again later.</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <Link href="/auth/login" className="btn btn-primary">
              Log In
            </Link>
            <Link href="/auth/register" className="btn btn-secondary">
              Sign Up
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center">
        <p>&copy; {new Date().getFullYear()} Readung. All rights reserved.</p>
      </footer>
    </div>
  );
} 