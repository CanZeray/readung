import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ onLogout }) {
  const router = useRouter();
  const { currentUser, logout, getUserData } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      if (currentUser) {
        const data = await getUserData?.();
        setUserData(data);
      }
    }
    fetchUser();
  }, [currentUser, getUserData]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Geri tuşu gösterilecek sayfaları kontrol et
  const currentPath = router.asPath || router.pathname;
  const isHomePage = currentPath === '/home' || currentPath === '/';
  const isAuthPage = currentPath?.startsWith('/auth/');
  const showBackButton = !isHomePage && !isAuthPage;
  
  // Geri tuşu için hedef belirle
  const handleBack = () => {
    if (router.pathname.startsWith('/stories/read/')) {
      // Stories read sayfasından geri dön (genellikle stories listesine)
      router.back();
    } else if (router.pathname.startsWith('/stories/')) {
      router.push('/home');
    } else {
      router.back();
    }
  };

  return (
    <nav className="bg-gray-900 text-white px-4 py-2 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between relative">
        <div className="flex items-center min-w-[44px] md:min-w-[64px]">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="mr-2 p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 group flex items-center justify-center"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/home" legacyBehavior>
            <a className="text-xl md:text-2xl font-bold flex items-center group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-blue-500 font-bold">Readung</span>
            </a>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-5">
            {currentUser ? (
              <>
                <Link href="/profile" className={`font-medium cursor-pointer ${router.pathname === '/profile' ? 'text-blue-400' : ''}`}>
                  <div className="flex items-center gap-1 hover:text-blue-300 hover:bg-gray-800 transition-all duration-300 px-3 py-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile</span>
                  </div>
                </Link>
                {userData?.role === 'admin' && (
                  <Link href="/admin" className="hover:text-yellow-300 transition-colors font-medium cursor-pointer">
                    <span>Admin Paneli</span>
                  </Link>
                )}
                <button 
                  onClick={onLogout || handleLogout} 
                  className="hover:text-red-300 hover:bg-gray-700 transition-all duration-300 py-2 px-3 rounded-lg text-left flex items-center"
                >
                  <span>Log out</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <span className="relative inline-block py-2 px-4 rounded-lg font-medium text-white hover:text-blue-200 transition-all duration-300 cursor-pointer group border border-transparent hover:border-blue-400 hover:bg-gray-800/50">
                    Log In
                    <span className="absolute inset-0 rounded-lg bg-blue-600/0 group-hover:bg-blue-600/10 transition-all duration-300 pointer-events-none"></span>
                  </span>
                </Link>
                <Link href="/auth/register">
                  <span className="inline-block py-2 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5">
                    Sign Up
                  </span>
                </Link>
              </>
            )}
          </div>

          <button 
            className="md:hidden focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Modal */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-x-4 top-20 z-50 md:hidden animate-slideDown">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden backdrop-blur-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800">
                <div className="flex items-center gap-3">
                  {currentUser ? (
                    <>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {userData?.name ? userData.name.charAt(0).toUpperCase() : currentUser.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">
                          {userData?.name || 'User'}
                        </h3>
                        <p className="text-gray-400 text-xs">
                          {userData?.membershipType === 'premium' ? '✨ Premium' : 'Free Account'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">Welcome to Readung</h3>
                        <p className="text-gray-400 text-xs">Sign in to continue</p>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg active:bg-gray-600"
                  aria-label="Close menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Menu Content */}
              <div className="p-4">
                {currentUser ? (
                  <div className="flex flex-col gap-3">
                    <Link href="/profile" legacyBehavior>
                      <a
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 active:scale-95 ${
                          router.pathname === '/profile' 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          router.pathname === '/profile' ? 'bg-white/20' : 'bg-gray-600'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold block">Profile</span>
                          <span className="text-xs text-gray-400">View your account</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </Link>
                    {userData?.role === 'admin' && (
                      <Link href="/admin" legacyBehavior>
                        <a
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold block">Admin Panel</span>
                            <span className="text-xs text-gray-400">Manage content</span>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </Link>
                    )}
                    <div className="border-t border-gray-700 my-2"></div>
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        (onLogout || handleLogout)();
                      }}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 transition-all duration-300 active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold block">Log out</span>
                        <span className="text-xs text-red-400/70">Sign out of your account</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="mb-2">
                      <p className="text-gray-400 text-sm text-center">Get started with Readung</p>
                    </div>
                    <Link href="/auth/login" legacyBehavior>
                      <a
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span>Log In</span>
                      </a>
                    </Link>
                    <Link href="/auth/register" legacyBehavior>
                      <a
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <span>Sign Up</span>
                      </a>
                    </Link>
                    <div className="mt-2 pt-3 border-t border-gray-700">
                      <p className="text-gray-400 text-xs text-center">
                        By continuing, you agree to our Terms of Service
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
} 