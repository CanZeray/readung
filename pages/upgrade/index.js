import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Stripe public key (normally would be in .env file)
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

// Navbar component
const Navbar = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-dark text-white px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/home" className="text-xl font-bold">
          Readung
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="hover:text-gray-300">
            Profile
          </Link>
          <button onClick={handleLogout} className="hover:text-gray-300">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

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

export default function Upgrade() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [membershipType, setMembershipType] = useState('free');
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    nameOnCard: ''
  });
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    // Get user data from Firestore
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || currentUser.displayName || 'User');
          setUserEmail(userData.email || currentUser.email || 'user@example.com');
          setMembershipType(userData.membershipType || 'free');

          // If already premium, redirect to home
          if (userData.membershipType === 'premium') {
            alert('You already have a premium membership!');
            router.push('/home');
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [currentUser, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!cardDetails.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardDetails.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }
    
    if (!cardDetails.expiryDate.trim()) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      newErrors.expiryDate = 'Use format MM/YY';
    }
    
    if (!cardDetails.cvc.trim()) {
      newErrors.cvc = 'CVC is required';
    } else if (!/^\d{3,4}$/.test(cardDetails.cvc)) {
      newErrors.cvc = 'CVC must be 3-4 digits';
    }
    
    if (!cardDetails.nameOnCard.trim()) {
      newErrors.nameOnCard = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpgrade = async () => {
    if (!validateForm()) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // Simulating payment processing delay for this demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user data in Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      
      // Calculate next billing date
      const startDate = new Date();
      const nextBillingDate = new Date(startDate);
      
      if (selectedPlan === 'monthly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }
      
      // Update user data with subscription info
      await updateDoc(userDocRef, {
        membershipType: 'premium',
        subscription: {
          plan: selectedPlan,
          startDate: startDate.toISOString(),
          nextBillingDate: nextBillingDate.toISOString(),
          id: 'sub_' + Math.random().toString(36).substring(2, 15)
        }
      });
      
      alert('Congratulations! Your premium subscription is now active!');
      router.push('/home');
    } catch (error) {
      alert('Payment processing failed. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    // Format card number in groups of 4 digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardDetails({
      ...cardDetails,
      cardNumber: formattedValue
    });
  };

  const handleExpiryDateChange = (e) => {
    let { value } = e.target;
    value = value.replace(/\D/g, '');
    
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    
    setCardDetails({
      ...cardDetails,
      expiryDate: value
    });
  };

  const handleGoBack = () => {
    router.push('/home');
  };

  const getPlanPrice = () => {
    return selectedPlan === 'monthly' ? '€9.99/month' : '€95.88/year (€7.99/month)';
  };

  const getPlanDetails = () => {
    if (selectedPlan === 'monthly') {
      return {
        name: 'Monthly Premium',
        price: '€9.99',
        period: 'month',
        billingText: 'billed monthly'
      };
    } else {
      return {
        name: 'Annual Premium',
        price: '€95.88',
        period: 'year',
        billingText: 'billed annually (€7.99/month)'
      };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-light to-white">
      <Head>
        <title>Upgrade to Premium - Readung</title>
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Upgrade to Premium</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock all German levels and unlimited reading with our Premium membership
          </p>
        </div>

        {/* Main Content in Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Benefits and Plan Selection */}
          <div>
            {/* Premium Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card bg-blue-50 border-t-4 border-primary">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-primary bg-opacity-20 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">All Levels</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Access all German levels from A1 to C2
                </p>
              </div>

              <div className="card bg-green-50 border-t-4 border-secondary">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-secondary bg-opacity-20 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Unlimited Stories</h3>
                </div>
                <p className="text-sm text-gray-600">
                  No daily reading limits
                </p>
              </div>

              <div className="card bg-purple-50 border-t-4 border-purple-500">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-full bg-purple-500 bg-opacity-20 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Unlimited Vocabulary</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Save unlimited words to your vocabulary
                </p>
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div 
                className={`card flex-1 border-2 transition-transform hover:shadow-lg ${
                  selectedPlan === 'monthly' ? 'border-primary' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <div className="text-center">
                  <div className="inline-block p-2 rounded-full bg-primary bg-opacity-10 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-1">Monthly</h3>
                  <div className="text-2xl font-bold mb-1">€9.99<span className="text-sm text-gray-500">/month</span></div>
                  <p className="text-gray-600 text-sm mb-3">Perfect for short-term learning goals</p>
                  
                  <div className="flex justify-center">
                    <input 
                      type="radio" 
                      id="monthly" 
                      name="plan" 
                      checked={selectedPlan === 'monthly'} 
                      onChange={() => setSelectedPlan('monthly')}
                      className="mr-2"
                    />
                    <label htmlFor="monthly">Select Plan</label>
                  </div>
                </div>
              </div>

              <div 
                className={`card flex-1 border-2 transition-transform hover:shadow-lg ${
                  selectedPlan === 'annual' ? 'border-primary' : 'border-gray-200'
                } relative`}
                onClick={() => setSelectedPlan('annual')}
              >
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="bg-secondary text-white px-2 py-1 rounded-full text-xs font-medium">Save 20%</span>
                </div>
                <div className="text-center">
                  <div className="inline-block p-2 rounded-full bg-primary bg-opacity-10 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-1">Annual</h3>
                  <div className="text-2xl font-bold mb-1">€95.88<span className="text-sm text-gray-500">/year</span></div>
                  <p className="text-gray-600 text-sm">Only €7.99/month, billed annually</p>
                  <p className="text-secondary font-medium text-sm mb-3">Save €24 per year</p>
                  
                  <div className="flex justify-center">
                    <input 
                      type="radio" 
                      id="annual" 
                      name="plan" 
                      checked={selectedPlan === 'annual'} 
                      onChange={() => setSelectedPlan('annual')}
                      className="mr-2"
                    />
                    <label htmlFor="annual">Select Plan</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Brand Logos */}
            <div className="flex justify-center mt-4 space-x-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="h-8 w-auto">
                <path fill="#FFB600" d="M470.1 231.3s7.6 37.2 9.3 45H446c3.3-8.9 16-43 16-43--.2.3 3.3-9.1 5.3-14.9l2.8 13.4zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM152.5 331.2L215.7 176h-42.5l-39.3 106-4.3-21.5-14-71.4c-2.3-9.9-9.4-12.7-18.2-13.1H32.7l-.7 3.1c15.9 4 29.9 9.8 42.2 16.2l35.8 135-43.4.7L96 371.3l90.8-1.7-34.3-38.4zm224.7 5.9l43.2-104H384c-4.7 0-5.2-.6-7-5.7-.2.1-11.2-27.1-11.2-27.1l-39 132h42.5zm-79.2-7.5l22.1-21.5 12.5 21.5h37.5l-27.4-49.3c16.5-19.4 25.7-34.9 31.2-56.1h-31.7c-.9 13.7-6.9 27-13.7 37.8l-22.7-38.3h-43.3L182.2 270l-13 30.9c-1.9 5.7-3.5 8-8.3 8.9l-.2-.5c-4.8 8.6-61.9.9-61.9.9l-8.1 19.1h83.2c6.7-.1 10.5-5.9 16.1-19.1zm170.8-5.1c0-3.7-.7-10.5-7.7-10.5-6.8 0-7.6 6.8-7.6 10.5 0 3.3.7 9.8 7.7 9.8 6.3-.1 7.6-6.5 7.6-9.8zm7.4 15.5h-1.8v-3.4c-3.7 5.6-29.3 4.5-29.3-11.5 0-10.8 6.7-20.5 19.7-20.5 14.5 0 17.7 10.2 17.7 20.8 0 8.8-1.3 14.6-6.3 14.6zm-44.5-15.4c0-3.7-.7-10.4-7.7-10.4-6.8 0-7.6 6.8-7.6 10.4 0 3.4.7 9.8 7.7 9.8 6.4 0 7.6-6.4 7.6-9.8zm7.6 15.4c-5 0-6.2-5.7-6.2-14.5 0-8.9 2.9-21.1 18-21.1 15.6 0 19.1 10.2 19.1 20.7 0 6.5-1.5 14.8-6.3 14.8-.2 0-1.1.1-1.8.1v-3.4c-4 5.5-29.3 4.4-29.3-11.5 0-10.8 6.8-20.5 19.7-20.5 14.6 0 17.7 10.2 17.7 20.8 0 8.7-1.3 14.6-6.3 14.6h-24.6z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="h-8 w-auto">
                <path fill="#007CCD" d="M482.9 212.3h-58.4v-33.2h58.4v33.2zm0-65.2h-58.4v-33.2h58.4v33.2zm58.4 0V76.9h-26.3c-5.2 0-9.5-1.6-12.9-4.8-3.5-3.2-5.2-7.3-5.2-12.3V26.6c0-5-1.7-9.2-5.2-12.3C488.3 11.2 484 9.5 478.9 9.5h-98.6c-11.8 0-17.7 5.5-17.7 16.4v32.1c-9.6-9.3-23.6-13.9-41.8-13.9h-28.5c-9.1-16.2-25.9-24.2-50.3-24.2H125c-10.5 0-20.5 2-30 6.1V9.5H37.9C27.5 9.5 20 11.2 15.5 14.6 11 18.1 8.7 23.1 8.7 29.7v138.7c0 8.9 4.8 16.9 14.4 24l93.5 65.2c.6.4 1 .9 1 1.5v5.4c0 .4-.1.7-.3 1l-9.2 18.3c-5.2 10.5-7.8 18.5-7.8 24V308c0 6.5.4 11.7 1.2 15.6 10.9-14.9 27.8-22.4 50.7-22.4H279c11.7 0 21.3-3.7 28.8-11 7.5-7.3 11.2-16.5 11.2-27.6v-49c17.7 13.5 39.5 20.3 65.5 20.3h157.7v-39.8zm-452.6 92.6L39.4 186.4V61.6h19.7v144.7c0 7.4 1.7 13.2 5.2 17.4 3.4 4.2 9.9 4.2 19.4.1z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="h-8 w-auto">
                <path fill="#000" d="M302.2 218.4c0 17.2-10.5 27.1-29 27.1h-24.3v-54.2h24.4c18.4 0 28.9 9.8 28.9 27.1zm47.5 62.6c0 8.3 7.4 13.7 18.3 13.7 10.4 0 18.2-5.4 18.2-13.7 0-8.6-7.9-13.7-18.2-13.7-11 0-18.3 5.2-18.3 13.7zM448 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48zm-301.4 193.7H107.2v-68.5h41.1v-8.9H107.2V136h44.9v-9h-55.8v157.2h50.3zm69 0h14.6v-9h-56V136h14.6v128.7h26.8zm99.3 0c19.3 0 30.6-13.7 30.6-30.4 0-27.3-47.7-28.5-47.7-48 0-9 7.7-15.7 19.9-15.7 9.7 0 15.3 3.3 15.3 3.3l3.3-9.5s-7.5-4.3-19.2-4.3c-16.7 0-32.2 9.4-32.2 27.1 0 26.855 47.7 24.9 47.7 47.7 0 9.4-7.4 15.896-19.6 15.896-16.3 0-24.1-10.5-24.1-10.5l-4.6 9.4s10.5 12.1 28.6 12.1zm125.9-64.7c0-33.298-24.094-52.996-47.6-52.996h-38.3v118.7h14.6V217h23.7c42.511 0 47.6-35.427 47.6-51.896z"/>
              </svg>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div>
            <div className="card">
              <h2 className="text-xl font-bold mb-4 text-center">Complete Your Subscription</h2>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Selected Plan:</h3>
                    <p className="text-lg">{planDetails.name}</p>
                    <p className="text-sm text-gray-600">{planDetails.billingText}</p>
                  </div>
                  <p className="font-bold text-2xl">{planDetails.price}<span className="text-sm text-gray-600">/{planDetails.period}</span></p>
                </div>
              </div>
              
              <form>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1 text-sm">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength="19"
                      className={`w-full p-3 pl-10 border rounded ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm">Expiry Date</label>
                    <input
                      type="text"
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={cardDetails.expiryDate}
                      onChange={handleExpiryDateChange}
                      maxLength="5"
                      className={`w-full p-3 border rounded ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm">CVC</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cvc"
                        placeholder="123"
                        value={cardDetails.cvc}
                        onChange={handleInputChange}
                        maxLength="4"
                        className={`w-full p-3 pl-10 border rounded ${errors.cvc ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    {errors.cvc && <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1 text-sm">Name on Card</label>
                  <input
                    type="text"
                    name="nameOnCard"
                    placeholder="John Doe"
                    value={cardDetails.nameOnCard}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded ${errors.nameOnCard ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.nameOnCard && <p className="text-red-500 text-xs mt-1">{errors.nameOnCard}</p>}
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={processing}
                    className="btn-primary py-3 px-8 text-lg font-bold flex items-center justify-center"
                  >
                    {processing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>Start {selectedPlan === 'monthly' ? 'Monthly' : 'Annual'} Subscription</>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="border border-gray-300 bg-white text-gray-700 py-3 px-8 text-lg font-medium rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Go Back
                  </button>
                </div>

                <div className="mt-4 text-center text-xs text-gray-500">
                  <p>By subscribing, you agree to our terms of service and recurring billing conditions.</p>
                  <p className="mt-1">You will be charged {selectedPlan === 'monthly' ? '€9.99 every month' : '€95.88 every year'} until you cancel.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 