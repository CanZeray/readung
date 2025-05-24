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

      {/* Contact Section */}
      <section className="bg-gray-50 py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">Have questions? We're here to help!</p>
            <a href="mailto:readung@hotmail.com" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              readung@hotmail.com
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center">
        <p>&copy; {new Date().getFullYear()} Readung. All rights reserved.</p>
      </footer>
    </div>
  );
} 