import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { currentUser } = useAuth();
  
  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.asPath]);

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">Readung</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${
                router.pathname === '/' 
                  ? 'text-primary-600' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}>
                Home
              </Link>
              <Link href="/books" className={`px-3 py-2 rounded-md text-sm font-medium ${
                router.pathname.startsWith('/books') 
                  ? 'text-primary-600' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}>
                Books
              </Link>
              <Link href="/premium" className={`px-3 py-2 rounded-md text-sm font-medium ${
                router.pathname === '/premium' 
                  ? 'text-primary-600' 
                  : 'text-gray-700 hover:text-primary-600'
              }`}>
                Premium
              </Link>
              {currentUser ? (
                <Link href="/profile" className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === '/profile' 
                    ? 'text-primary-600' 
                    : 'text-gray-700 hover:text-primary-600'
                }`}>
                  My Account
                </Link>
              ) : (
                <Link href="/auth/login" className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  Sign In
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg rounded-b-lg mt-2">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium ${
              router.pathname === '/' 
                ? 'text-primary-600 bg-primary-50' 
                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
            }`}>
              Home
            </Link>
            <Link href="/books" className={`block px-3 py-2 rounded-md text-base font-medium ${
              router.pathname.startsWith('/books') 
                ? 'text-primary-600 bg-primary-50' 
                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
            }`}>
              Books
            </Link>
            <Link href="/premium" className={`block px-3 py-2 rounded-md text-base font-medium ${
              router.pathname === '/premium' 
                ? 'text-primary-600 bg-primary-50' 
                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
            }`}>
              Premium
            </Link>
            {currentUser ? (
              <Link href="/profile" className={`block px-3 py-2 rounded-md text-base font-medium ${
                router.pathname === '/profile' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}>
                My Account
              </Link>
            ) : (
              <Link href="/auth/login" className="block w-full text-center px-4 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 