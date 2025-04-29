import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Navbar from '../../components/Navbar';

// Stripe public key (normally would be in .env file)
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

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

export default function Premium() {
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
    return value.replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  };

  const handleCardNumberChange = (e) => {
    let { value } = e.target;
    value = value.replace(/\D/g, '');
    if (value.length <= 16) {
      setCardDetails({
        ...cardDetails,
        cardNumber: formatCardNumber(value)
      });
    }
  };

  const handleExpiryDateChange = (e) => {
    let { value } = e.target;
    value = value.replace(/\D/g, '');
    
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
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
    return selectedPlan === 'monthly' ? '$9.99/month' : '$89.99/year';
  };

  const getPlanDetails = () => {
    return selectedPlan === 'monthly' 
      ? 'Monthly billing. Cancel anytime.' 
      : 'Yearly billing. 25% discount compared to monthly.';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>Upgrade to Premium | Readung</title>
        <meta name="description" content="Upgrade to Premium for unlimited access to all features" />
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Upgrade to Premium</h1>
            <button onClick={handleGoBack} className="text-gray-600 hover:text-gray-900">
              Back to Home
            </button>
          </div>
          
          {/* Plan comparison */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Compare Plans</h2>
            
            <div className="grid grid-cols-3 mb-4">
              <div className="col-span-1"></div>
              <div className="col-span-1 text-center font-semibold">
                Free
              </div>
              <div className="col-span-1 text-center font-semibold text-primary-600">
                Premium
              </div>
            </div>
            
            <PlanFeature feature="A1 & A2 Level Stories" isPremium={true} isFree={true} />
            <PlanFeature feature="B1 - C2 Level Stories" isPremium={true} isFree={false} />
            <PlanFeature feature="Save Words" isPremium={true} isFree={true} />
            <PlanFeature feature="Unlimited Word Saves" isPremium={true} isFree={false} />
            <PlanFeature feature="Progress Tracking" isPremium={true} isFree={true} />
            <PlanFeature feature="Audio Reading (Coming Soon)" isPremium={true} isFree={false} />
          </div>
          
          {/* Plan selection and payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Plan selection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>
              
              <div className="space-y-4">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="plan"
                    value="monthly"
                    checked={selectedPlan === 'monthly'}
                    onChange={() => setSelectedPlan('monthly')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Monthly</div>
                    <div className="text-sm text-gray-500">$9.99 per month</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="plan"
                    value="yearly"
                    checked={selectedPlan === 'yearly'}
                    onChange={() => setSelectedPlan('yearly')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Yearly <span className="text-green-600 text-sm font-normal">Save 25%</span></div>
                    <div className="text-sm text-gray-500">$89.99 per year</div>
                  </div>
                </label>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Plan</span>
                    <span className="font-medium">{selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price</span>
                    <span className="font-medium">{getPlanPrice()}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {getPlanDetails()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="nameOnCard" className="block mb-1 text-sm">Name on Card</label>
                  <input
                    type="text"
                    id="nameOnCard"
                    name="nameOnCard"
                    value={cardDetails.nameOnCard}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="John Doe"
                  />
                  {errors.nameOnCard && <p className="text-red-500 text-xs mt-1">{errors.nameOnCard}</p>}
                </div>
                
                <div>
                  <label htmlFor="cardNumber" className="block mb-1 text-sm">Card Number</label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="1234 5678 9012 3456"
                  />
                  {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiryDate" className="block mb-1 text-sm">Expiry Date</label>
                    <input
                      type="text"
                      id="expiryDate"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleExpiryDateChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="cvc" className="block mb-1 text-sm">CVC</label>
                    <input
                      type="text"
                      id="cvc"
                      name="cvc"
                      value={cardDetails.cvc}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 4) {
                          handleInputChange({
                            target: { name: 'cvc', value: val }
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="123"
                      maxLength={4}
                    />
                    {errors.cvc && <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleUpgrade}
                disabled={processing}
                className="w-full mt-6 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Upgrade for ${getPlanPrice()}`
                )}
              </button>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                Your payment is secured with SSL encryption. You can cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6 text-center">
        <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} Readung. All rights reserved.</p>
      </footer>
    </div>
  );
} 