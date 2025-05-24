import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';

export default function ProfileTest() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Profile Test - Readung</title>
      </Head>

      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Link href="/home">
            <div className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors bg-white hover:bg-blue-50 rounded-lg px-4 py-2 shadow-sm border border-blue-200 hover:border-blue-300 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-4">Profile Test Page</h1>
          <p className="text-gray-600 mb-4">This is a test version of the profile page.</p>
          
          {currentUser && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">User logged in: {currentUser.email}</p>
            </div>
          )}
          
          {!currentUser && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">No user logged in</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 