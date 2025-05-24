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
          userEmail: currentUser.email
        })
      });

      const data = await response.json();
      console.log('Payment response:', data);
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Payment failed');
      }

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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Upgrade to Premium - Readung</title>
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Upgrade to Premium</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error === 'You already have a premium subscription.' ? 'You already have a premium subscription.' : 'An error occurred while loading user data.'}
              {userData?.membershipType === 'premium' && (
                <div className="mt-2">
                  <Link href="/home" className="text-red-700 font-semibold hover:underline">
                    <span>Return to Home</span>
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {paymentStatus === 'success' ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-6 rounded mb-6 text-center">
              <svg className="h-16 w-16 mx-auto text-green-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">Premium Membership Activated!</h2>
              <p className="mb-4">
                Congratulations! You now have access to all content.
              </p>
              <div className="mt-4">
                <Link href="/home" className="btn btn-primary">
                  <span>Return to Home</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {userData && userData.membershipType !== 'premium' && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6">
                    <h2 className="text-2xl font-bold mb-2">Premium Membership Benefits</h2>
                    <p>More content, more features, better learning experience.</p>
                  </div>
                  
                  <div className="p-6">
                    <ul className="mb-6 space-y-3">
                      <li className="flex items-start">
                        <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Access to all stories:</strong> Get access to advanced content at B1, B2, C1, and C2 levels.</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Unlimited word saving:</strong> Save as many words as you want without daily limits.</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Ad-free experience:</strong> Enjoy uninterrupted learning without annoying ads.</span>
                      </li>
                    </ul>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4">
                      {/* Aylık Plan */}
                      <div className="flex-1 border rounded-lg p-4 bg-white shadow text-center">
                        <h3 className="font-semibold text-lg mb-2">Premium Membership</h3>
                        <p className="text-3xl font-bold text-gray-800 mb-1">€4.9<span className="text-sm font-normal text-gray-600">/month</span></p>
                        <p className="text-gray-600 text-sm mb-4">Monthly plan, unlimited access</p>
                        <button
                          onClick={() => handlePayment('monthly')}
                          disabled={paymentStatus === 'processing'}
                          className="btn btn-primary w-full"
                        >
                          {paymentStatus === 'processing' ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : 'Upgrade Monthly'}
                        </button>
                      </div>
                      {/* Yıllık Plan */}
                      <div className="flex-1 border rounded-lg p-4 bg-white shadow text-center">
                        <h3 className="font-semibold text-lg mb-2">Premium Membership</h3>
                        <p className="text-3xl font-bold text-gray-800 mb-1">€50<span className="text-sm font-normal text-gray-600">/year</span></p>
                        <p className="text-gray-600 text-sm mb-4">Annual plan, unlimited access</p>
                        <button
                          onClick={() => handlePayment('annual')}
                          disabled={paymentStatus === 'processing'}
                          className="btn btn-primary w-full"
                        >
                          {paymentStatus === 'processing' ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : 'Upgrade Yearly'}
                        </button>
                      </div>
                    </div>

                    <div className="text-center mt-6">
                      <Link href="/home" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Return to Home
                        </span>
                      </Link>
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