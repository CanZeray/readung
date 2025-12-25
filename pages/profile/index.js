import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Navbar from '../../components/Navbar';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [membershipType, setMembershipType] = useState('basic');
  const [subscriptionEnds, setSubscriptionEnds] = useState(null);
  const { currentUser, logout } = useAuth();
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [testModeData, setTestModeData] = useState(null);
  const [subscriptionCancelled, setSubscriptionCancelled] = useState(false);
  const [cancelDate, setCancelDate] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  // Edit profile handler
  const handleEditProfile = () => {
    // For now, we'll navigate to a simple edit page or show a modal
    // You can expand this to show a modal or navigate to a dedicated edit page
    router.push('/profile/edit');
  };

  const fetchUserData = async () => {
    try {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUser({
          name: userData.displayName || currentUser.displayName || 'User',
          email: userData.email || currentUser.email,
          membershipType: userData.membershipType || 'basic'
        });
        setMembershipType(userData.membershipType || 'basic');

        // İptal durumunu kontrol et - subscription.current_period_end kullan
        if (userData.subscription?.cancel_at_period_end && userData.membershipType === 'premium') {
          setSubscriptionCancelled(true);
          
          // current_period_end varsa onu kullan, yoksa cancelledAt + 30 gün
          if (userData.subscription?.current_period_end) {
            const endDate = new Date(userData.subscription.current_period_end);
            setCancelDate(endDate);
            
            const today = new Date();
            const timeDiff = endDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            setDaysRemaining(Math.max(0, daysDiff));
          } else if (userData.cancelledAt) {
            const cancelledDate = new Date(userData.cancelledAt);
            const endDate = new Date(cancelledDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 gün sonra
            setCancelDate(endDate);
            
            const today = new Date();
            const timeDiff = endDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            setDaysRemaining(Math.max(0, daysDiff));
          }
        } else if (userData.cancelledAt && userData.membershipType === 'premium') {
          // Eski format için fallback
          const hasActiveSubscription = userData.subscription?.status === 'active';
          const hasSubscriptionId = userData.subscriptionId && !userData.subscriptionId.startsWith('sub_test_');
          
          if (!hasActiveSubscription && !userData.subscriptionId?.startsWith('sub_test_')) {
            setSubscriptionCancelled(true);
            const cancelledDate = new Date(userData.cancelledAt);
            const endDate = new Date(cancelledDate.getTime() + (30 * 24 * 60 * 60 * 1000));
            setCancelDate(endDate);
            
            const today = new Date();
            const timeDiff = endDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            setDaysRemaining(Math.max(0, daysDiff));
          }
        }

        if (userData.membershipType === 'premium') {
          setIsLoadingSubscription(true);
          const subscriptionRef = doc(db, 'subscriptions', currentUser.uid);
          const subscriptionSnap = await getDoc(subscriptionRef);
          
          if (subscriptionSnap.exists()) {
            const subscriptionData = subscriptionSnap.data();
            setSubscriptionEnds(subscriptionData.endDate?.toDate() || null);
          }
          setIsLoadingSubscription(false);
        }
      } else {
        setUser({
          name: currentUser.displayName || 'User',
          email: currentUser.email,
          membershipType: 'basic'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  // Countdown timer - gerçek zamanlı güncelleme
  useEffect(() => {
    if (subscriptionCancelled && cancelDate) {
      const updateCountdown = () => {
        const today = new Date();
        const timeDiff = cancelDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        setDaysRemaining(Math.max(0, daysDiff));
      };

      // İlk güncelleme
      updateCountdown();

      // Her saat başı güncelle
      const interval = setInterval(updateCountdown, 3600000); // 1 saat

      return () => clearInterval(interval);
    }
  }, [subscriptionCancelled, cancelDate]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid));
        await currentUser.delete();
        router.push('/auth/login');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert("Error deleting account. You may need to re-login before deleting your account.");
      }
    }
  };

  const handleCancelSubscription = async () => {
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async () => {
    setShowCancelModal(false);
    setCancellingSubscription(true);
    try {
      const token = await currentUser.getIdToken();
      
      // Dynamic API URL - current window location kullan
      const apiUrl = `${window.location.origin}/api/cancel-subscription`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message || 'Your subscription will be cancelled at the end of the current billing period.');
        setShowSuccessModal(true);
        // Test mode bilgisini saklayalım
        setTestModeData(data.isTestMode ? data : null);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      alert('An error occurred while cancelling your subscription. Please try again later.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    try {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      // Kullanıcının aktif subscription'ı var mı kontrol et
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const subscriptionId = userData.subscriptionId || userData.subscription?.id;
        const cancelAtPeriodEnd = userData.subscription?.cancel_at_period_end;
        
        // Eğer aktif subscription var ve cancel_at_period_end: true ise, reactivate et
        if (subscriptionId && cancelAtPeriodEnd && userData.membershipType === 'premium') {
          try {
            const token = await currentUser.getIdToken();
            const reactivateUrl = `${window.location.origin}/api/reactivate-subscription`;
            
            const response = await fetch(reactivateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || errorData.error || 'Reactivation failed');
            }

            const data = await response.json();
            console.log('Subscription reactivated:', data);
            
            // Başarılı - modal göster
            setShowReactivateModal(true);
            return;
          } catch (reactivateError) {
            console.error('Reactivate error:', reactivateError);
            // Reactivate başarısız olursa yeni checkout session oluştur
            console.log('Reactivate failed, creating new checkout session...');
          }
        }
      }

      // Yeni checkout session oluştur (subscription yoksa veya reactivate başarısız olduysa)
      const apiUrl = `${window.location.origin}/api/create-checkout-session`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: 'monthly',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          returnUrl: window.location.href
        })
      });

      // Response'u kontrol et
      if (!response.ok) {
        let errorMessage = 'Payment page could not be created';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Payment URL not found');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred while processing your request. Please try again later.');
    }
  };

  // Test amaçlı manuel güncelleme
  const handleManualUpgrade = async () => {
    try {
      const token = await currentUser.getIdToken();
      
      const response = await fetch(`${window.location.origin}/api/update-user-membership`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Membership updated to Premium! Page will refresh.');
        router.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Manual upgrade error:', error);
      alert('Manual upgrade failed: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>My Profile - Readung</title>
        <meta name="description" content="Manage your account and subscription" />
        <style jsx>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
          .animate-in {
            animation: modalIn 0.3s ease-out;
          }
          @keyframes modalIn {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </Head>

      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-lg p-6 text-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
              <p className="text-sm text-gray-200">Personalize your learning experience</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-b-lg p-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mr-4 shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-medium leading-tight">{user?.name || 'User'}</h2>
                  <p className="text-sm text-gray-600 leading-tight mt-1">{user?.email}</p>
                </div>
              </div>
              <button 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={handleEditProfile}
              >
                Edit Profile
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Current Membership</h3>
            <div className="p-4 border rounded-lg">
              <p className="font-medium">{membershipType === 'premium' ? 'Premium' : 'Basic'}</p>
              <p className="text-sm text-gray-600">
                {membershipType === 'premium' 
                  ? 'Access to all levels and unlimited features' 
                  : 'Access to A1-A2 levels with daily limits'
                }
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-4">Membership Plans</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Plan */}
              <div className={`border-2 relative transition-all duration-300 ease-in-out rounded-lg p-5 bg-white
                ${membershipType === 'basic' || !membershipType ? 'border-blue-500 shadow-lg' : 'border-gray-200 opacity-80'}
              `}>
                {(membershipType === 'basic' || !membershipType) && (
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-lg absolute -top-2.5 -left-2.5 shadow-md">
                    Current Plan
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-base font-semibold text-gray-900">Basic</h4>
                </div>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Access to limited A1 and A2 levels</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Save 3 words a day</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-400">Access to premium levels (B1-B2)</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Current Plan:</p>
                  <p className="text-lg font-semibold text-gray-800">Free</p>
                </div>
              </div>
              
              {/* Premium Plan */}
              <div className={`border-2 relative transition-all duration-300 ease-in-out rounded-lg p-5 bg-yellow-50
                ${membershipType === 'premium' ? 'border-yellow-500 shadow-lg' : 'border-gray-200 opacity-80'}
              `}>
                {membershipType === 'premium' && (
                  <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-lg absolute -top-2.5 -left-2.5 shadow-md">
                    Current Plan
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h4 className="text-base font-semibold text-gray-900">Premium</h4>
                </div>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Access to all levels and stories (A1-B2)</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Unlimited saved words</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-yellow-200">
                  <p className="text-sm text-gray-500 mb-1">Plan:</p>
                  <p className="text-lg font-semibold text-gray-800">€4.99/month</p>
                  {subscriptionEnds && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ends: {subscriptionEnds.toLocaleDateString()}
                    </p>
                  )}
                </div>
                {membershipType === 'premium' && !subscriptionCancelled && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancellingSubscription}
                    className="mt-4 w-full py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all flex items-center justify-center text-base font-medium disabled:opacity-50"
                  >
                    {cancellingSubscription ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                )}
                
                {membershipType === 'premium' && subscriptionCancelled && (
                  <div className="mt-4 space-y-3">
                    {/* İptal durumu bilgisi - Countdown ile */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-5 shadow-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-base font-bold text-orange-900 mb-2">Subscription Cancelled</p>
                          
                          {/* Countdown */}
                          <div className="bg-white rounded-lg p-3 mb-2 border border-orange-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Premium Access Remaining:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-orange-600">{daysRemaining}</span>
                                <span className="text-sm text-gray-600">{daysRemaining === 1 ? 'day' : 'days'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {cancelDate && (
                            <p className="text-xs text-orange-700 mt-2 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Premium expires on <span className="font-semibold">{cancelDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tekrar premium ol butonu */}
                    <button 
                      onClick={handleUpgradeToPremium}
                      className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-md hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center justify-center gap-2 text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Reactivate Premium
                    </button>
                    
                    {/* Teşvik mesajı */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 text-center">
                        <span className="font-medium">💡 Don't lose your progress!</span><br/>
                        Reactivate now to continue unlimited learning and keep all your saved words.
                      </p>
                    </div>
                  </div>
                )}
                {(['free', 'basic'].includes(membershipType) || !membershipType) && (
                  <button 
                    onClick={handleUpgradeToPremium}
                    className="mt-4 w-full py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-all flex items-center justify-center gap-2 text-base font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Upgrade to Premium
                  </button>
                )}
                {/* Test amaçlı manuel güncelleme butonu - sadece development'da */}
                {process.env.NODE_ENV === 'development' && (['free', 'basic'].includes(membershipType) || !membershipType) && (
                  <button 
                    onClick={handleManualUpgrade}
                    className="mt-2 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all text-sm font-medium"
                  >
                    🧪 Test: Activate Premium (Local Development)
                  </button>
                )}

              </div>
            </div>
            <p className={`text-center mt-3 font-medium ${membershipType === 'premium' ? 'text-yellow-500' : 'text-blue-500'}`}>
              You are currently on the {membershipType === 'premium' ? 'Premium' : 'Basic'} plan
            </p>
          </div>

          <hr className="my-8" />

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-4">Account Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Change Password</h4>
                <p className="text-sm text-gray-600">Update your password regularly for security</p>
              </div>
              <button className="px-4 py-2 border rounded-md hover:bg-gray-50">
                Change
              </button>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-gray-600">Manage your email preferences</p>
              </div>
              <button className="px-4 py-2 border rounded-md hover:bg-gray-50">
                Manage
              </button>
            </div>
            
            <div className="flex justify-between items-center p-4 border border-red-200 rounded-lg">
              <div>
                <h4 className="font-medium text-red-600">Delete Account</h4>
                <p className="text-sm text-gray-600">Permanently delete your account and data</p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>

          <div className="text-center mt-8">
            <button 
              onClick={handleLogout} 
              className="px-8 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
              Log out
            </button>
          </div>
        </div>

        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in duration-200">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Subscription</h3>
                <p className="text-gray-600 leading-relaxed">
                  Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">What happens next?</p>
                      <ul className="text-sm text-amber-700 mt-1 space-y-1">
                        <li>• Your subscription continues until the end of the billing period</li>
                        <li>• You'll keep premium access until then</li>
                        <li>• No future charges will be made</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Keep Subscription
                  </button>
                  <button
                    onClick={confirmCancelSubscription}
                    disabled={cancellingSubscription}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {cancellingSubscription ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel Subscription'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
              {/* Success Icon */}
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Success Content */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Subscription Cancelled</h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  {successMessage}
                </p>
                {testModeData && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">🧪 Test Mode:</span> This is a test subscription cancellation. In production, this would cancel a real subscription.
                    </p>
                  </div>
                )}
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Note:</span> You can continue using premium features until the end of your current billing period.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.reload();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Continue
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Reactivate Success Modal */}
        {showReactivateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative transform transition-all duration-300 scale-100">
              {/* Success Icon */}
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Success Content */}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Subscription Reactivated! 🎉
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg mb-4">
                  Your premium access will continue seamlessly.
                </p>
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">✨ Great news!</span> Your subscription is now active again. You'll continue to enjoy all premium features.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowReactivateModal(false);
                    window.location.reload();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <span>Continue</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
} 