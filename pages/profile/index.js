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

        // Fetch subscription details if user is premium
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
        // Create user document if it doesn't exist
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
        // Delete user document
        await deleteDoc(doc(db, 'users', currentUser.uid));
        
        // Delete user auth account
        await currentUser.delete();
        
        // Redirect to login
        router.push('/auth/login');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert("Error deleting account. You may need to re-login before deleting your account.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>My Profile - Readung</title>
        <meta name="description" content="Manage your account and subscription" />
      </Head>

      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-gradient-to-r from-[#4facfe] to-[#00f2fe] rounded-t-lg p-6 text-white shadow-sm">
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
                  <h2 className="text-xl font-medium leading-tight">{user?.name || 'admin'}</h2>
                  <p className="text-[0.9rem] text-[#6b7280] leading-tight mt-1">{user?.email || 'admin@example.com'}</p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Account Details</h3>
            <div className="flex">
              <div className="w-full md:w-1/2">
                <div className={`p-3 border-b ${router.pathname === '/profile' ? 'border-blue-500 text-blue-600' : 'text-gray-600'}`}>
                  Membership
                </div>
                <div className="p-3 text-gray-700">
                  {membershipType === 'premium' ? 'Premium' : 'Basic'}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-4">Membership</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Plan */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-base font-semibold text-gray-900">Basic</h4>
                </div>
                <ul className="space-y-0 mb-4">
                  <li className="flex items-center py-3 border-b border-gray-100">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Access to A1 and A2 levels</span>
                  </li>
                  <li className="flex items-center py-3 border-b border-gray-100">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Translate 20 words a day</span>
                  </li>
                  <li className="flex items-center py-3 border-b border-gray-100">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Save 3 words a day</span>
                  </li>
                  <li className="flex items-center py-3 border-b border-gray-100">
                    <svg className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-400">Access to premium levels (B1-C2)</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Current Plan:</p>
                  <p className="text-lg font-semibold text-gray-800">Free</p>
                </div>
              </div>
              
              {/* Premium Plan */}
              <div className="rounded-lg p-5 bg-[#fffdea] relative before:absolute before:inset-0 before:rounded-lg before:border before:border-transparent before:bg-gradient-to-r before:from-[#facc15] before:to-[#fcd34d] before:p-[1px] before:-z-[1] before:pointer-events-none">
                <div className="flex items-center gap-2 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h4 className="text-base font-semibold text-gray-900">Premium</h4>
                </div>
                <ul className="space-y-0 mb-4">
                  <li className="flex items-center py-3 border-b border-yellow-100/50">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Access to all levels (A1-C2)</span>
                  </li>
                  <li className="flex items-center py-3 border-b border-yellow-100/50">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Unlimited word translations</span>
                  </li>
                  <li className="flex items-center py-3 border-b border-yellow-100/50">
                    <svg className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Unlimited saved words</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-yellow-100/50">
                  <p className="text-sm text-gray-500 mb-1">Plan:</p>
                  <p className="text-lg font-semibold text-gray-800">9.99€/month</p>
                </div>
                <button className="mt-4 w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-md hover:from-yellow-500 hover:to-yellow-600 transition-all flex items-center justify-center text-base font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>

          <hr className="my-8" />

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-4">Account Settings</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Change Password</h4>
                  <p className="text-sm text-gray-600">Update your password regularly for security</p>
                </div>
                <button className="px-4 py-2 border rounded-md hover:bg-gray-50">
                  Change
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Manage your email preferences</p>
                </div>
                <button className="px-4 py-2 border rounded-md hover:bg-gray-50">
                  Manage
                </button>
              </div>
              
              <div className="flex justify-between items-center">
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
          </div>

          <div className="text-center mt-6">
            <button 
              onClick={handleLogout} 
              className="px-8 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 