import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Giriş yapmış kullanıcıyı home sayfasına yönlendir
    if (currentUser) {
      router.push('/home');
    }
  }, [currentUser, router]);

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