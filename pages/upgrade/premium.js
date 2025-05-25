import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Navbar from '../../components/Navbar';

// Stripe public key from environment variable
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Feature comparison component
const PlanFeature = ({ feature, isPremium, isFree }) => {
  return (
    <div className="grid grid-cols-3 items-center border-b border-gray-200 py-3">
      <div className="col-span-1">{feature}</div>
      <div className="col-span-1 text-center">
        {isFree ? (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 font-bold text-lg">✓</span>
        ) : (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-400 font-bold text-lg">✗</span>
        )}
      </div>
      <div className="col-span-1 text-center">
        {isPremium ? (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600 font-bold text-lg">✓</span>
        ) : (
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-400 font-bold text-lg">✗</span>
        )}
      </div>
    </div>
  );
};

export default function PremiumUpgrade() {
  const router = useRouter();
  const { currentUser, getUserData } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('initial'); // initial, processing, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      if (!currentUser) {
        router.push('/auth/login', undefined, { shallow: true });
        return;
      }

      try {
        // Get user data
        const data = await getUserData();
        setUserData(data);
        
        // If user is already premium, block access
        if (data && data.membershipType === 'premium') {
          setError('You already have a premium subscription.');
        }
      } catch (error) {
        console.error('Error checking user data:', error);
        setError('An error occurred while loading user data.');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [currentUser, router, getUserData]);
  
  // Ödeme simülasyonu - gerçek bir ödeme entegrasyonu için burayı değiştirin
  const handlePayment = async (plan) => {
    if (!currentUser || !userData) {
      console.error('Missing user data:', { currentUser, userData });
      return;
    }
    
    setPaymentStatus('processing');
    try {
      console.log('Sending payment request:', { plan, userId: currentUser.uid, userEmail: currentUser.email });
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          returnUrl: window.location.href
        })
      });

      console.log('Payment response status:', response.status);
      
      // Response'u kontrol et
      if (!response.ok) {
        let errorMessage = 'Payment failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.log('Error data:', errorData);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Payment response:', data);
      
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      
      throw new Error('Stripe checkout URL not received');
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setError(error.message || 'Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <p className="text-lg font-medium text-gray-700">Loading your premium experience...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Head>
        <title>Upgrade to Premium - Readung</title>
        <meta name="description" content="Unlock unlimited German learning with Readung Premium" />
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back to Home */}
          <div className="mb-6">
            <Link href="/home" className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Home
              </span>
            </Link>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Upgrade to Premium
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock unlimited German learning with advanced stories, unlimited translations, and ad-free experience
            </p>
          </div>
          
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 shadow-sm">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">{error === 'You already have a premium subscription.' ? 'You already have a premium subscription.' : 'An error occurred while loading user data.'}</p>
                  {userData?.membershipType === 'premium' && (
                    <div className="mt-2">
                      <Link href="/home" className="text-red-700 font-semibold hover:underline">
                        <span>Return to Home</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {paymentStatus === 'success' ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-8 rounded-xl mb-8 text-center shadow-lg">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <svg className="h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-green-800">Premium Membership Activated!</h2>
              <p className="text-lg mb-6 text-green-700">
                Congratulations! You now have access to all content and premium features.
              </p>
              <div className="mt-6">
                <Link href="/home" className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg">
                  <span>Start Learning Now</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {userData && (['free', 'basic'].includes(userData.membershipType) || !userData.membershipType) && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  {/* Premium Benefits Header */}
                  <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 text-white p-8">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-3">Premium Membership Benefits</h2>
                      <p className="text-blue-100 text-lg">Transform your German learning experience</p>
                    </div>
                  </div>
                  
                  {/* Features Grid */}
                  <div className="p-8">
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-blue-800 mb-2">All Story Levels</h3>
                        <p className="text-blue-700">Access B1, B2, C1, and C2 advanced content</p>
                      </div>
                      
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-purple-800 mb-2">Unlimited Saves</h3>
                        <p className="text-purple-700">Save unlimited words to your vocabulary</p>
                      </div>
                      
                      <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-pink-800 mb-2">Ad-Free Experience</h3>
                        <p className="text-pink-700">Learn without interruptions</p>
                      </div>
                    </div>
                    
                    {/* Pricing Plans */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl mb-8">
                      <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Choose Your Plan</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Monthly Plan */}
                        <div className="relative bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                          <div className="text-center">
                            <h4 className="text-xl font-bold text-gray-800 mb-2">Monthly Plan</h4>
                            <div className="mb-4">
                              <span className="text-4xl font-bold text-gray-800">€4.9</span>
                              <span className="text-gray-600">/month</span>
                            </div>
                            <p className="text-gray-600 mb-6">Perfect for trying premium features</p>
                            <button
                              onClick={() => handlePayment('monthly')}
                              disabled={paymentStatus === 'processing'}
                              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {paymentStatus === 'processing' ? (
                                <span className="flex items-center justify-center">
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : 'Start Monthly Plan'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Annual Plan */}
                        <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                              Best Value
                            </span>
                          </div>
                          <div className="text-center">
                            <h4 className="text-xl font-bold text-gray-800 mb-2">Annual Plan</h4>
                            <div className="mb-2">
                              <span className="text-4xl font-bold text-gray-800">€50</span>
                              <span className="text-gray-600">/year</span>
                            </div>
                            <div className="mb-4">
                              <span className="text-green-600 font-semibold">Save €8.8 per year!</span>
                            </div>
                            <p className="text-gray-600 mb-6">Best value for serious learners</p>
                            <button
                              onClick={() => handlePayment('annual')}
                              disabled={paymentStatus === 'processing'}
                              className="w-full py-3 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {paymentStatus === 'processing' ? (
                                <span className="flex items-center justify-center">
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : 'Start Annual Plan'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
} 