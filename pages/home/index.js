import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, limit, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import Navbar from '../../components/Navbar';

// Vercel deployment verification
export default function Home() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [savedWords, setSavedWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Rating states
  const [ratings, setRatings] = useState({
    ease: 0,
    accuracy: 0,
    learning: 0,
    design: 0
  });
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState(null);
  const [hasRated, setHasRated] = useState(false);

  const isRatingComplete = Object.values(ratings).every(rating => rating > 0);

  // Load existing rating
  const loadExistingRating = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const existingRating = snapshot.docs[0];
        const data = existingRating.data();
        setExistingRatingId(existingRating.id);
        setRatings({
          ease: data.ease || 0,
          accuracy: data.accuracy || 0,
          learning: data.learning || 0,
          design: data.design || 0
        });
        setHasRated(true);
      }
    } catch (error) {
      console.error('Error loading existing rating:', error);
    }
  };

  const handleRating = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmitRating = async () => {
    if (!isRatingComplete) return;
    
    try {
      const ratingData = {
        ...ratings,
        userId: currentUser?.uid,
        timestamp: new Date().toISOString()
      };

      if (existingRatingId) {
        // Update existing rating
        const ratingRef = doc(db, 'ratings', existingRatingId);
        await updateDoc(ratingRef, ratingData);
      } else {
        // Create new rating
        const ratingsRef = collection(db, 'ratings');
        const docRef = await addDoc(ratingsRef, ratingData);
        setExistingRatingId(docRef.id);
        setHasRated(true);
      }
      
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('An error occurred while submitting your rating.');
    }
  };

  // Fetch saved words
  const fetchSavedWords = async () => {
    if (!currentUser?.uid) return;
    
    try {
      // Alt koleksiyondan kelimeleri çekme
      const savedWordsRef = collection(db, 'users', currentUser.uid, 'savedWords');
      const wordsQuery = query(savedWordsRef, limit(5));
      const wordsSnapshot = await getDocs(wordsQuery);
      const wordsList = wordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // En son eklenen 5 kelimeyi göster
      // dateAdded alanını güvenli şekilde işle
      const sortedWords = wordsList
        .map(word => {
          // Timestamp objelerini string'e çevir
          const processedWord = { ...word };
          if (processedWord.dateAdded && typeof processedWord.dateAdded === 'object' && processedWord.dateAdded.toDate) {
            processedWord.dateAdded = processedWord.dateAdded.toDate().toISOString();
          } else if (processedWord.dateAdded && typeof processedWord.dateAdded === 'object') {
            processedWord.dateAdded = new Date(processedWord.dateAdded.seconds * 1000).toISOString();
          }
          // Tüm alanları string'e çevir (eğer obje ise)
          if (processedWord.word && typeof processedWord.word === 'object') {
            processedWord.word = processedWord.word.word || String(processedWord.word);
          }
          if (processedWord.translation && typeof processedWord.translation === 'object') {
            processedWord.translation = processedWord.translation.meaning || processedWord.translation.translation || String(processedWord.translation);
          }
          return processedWord;
        })
        .sort((a, b) => {
          const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
          const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
      
      setSavedWords(sortedWords);
    } catch (error) {
      console.error('Error fetching saved words:', error);
    }
  };

  useEffect(() => {
    // Check for payment success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setShowSuccessMessage(true);
      // Remove the parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Hide message after 10 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);
    }

    async function fetchUserData() {
      // Üye girişi kontrolü kaldırıldı - kullanıcı giriş yapmamışsa da sayfa çalışır
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserData(userSnap.data());
            await fetchSavedWords();
            await loadExistingRating();
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
      
      setLoading(false);
    }
    
    fetchUserData();
  }, [currentUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-primary-200 h-16 w-16 mb-3"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Ana Sayfa - Readung</title>
        <meta name="description" content="Keşfedin, okuyun, kelimeler kaydedin" />
      </Head>
      
      <Navbar />
      
      {/* Payment Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-2xl border border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Payment Successful! 🎉</h3>
                  <p className="text-green-100 text-sm">Welcome to Premium! You can now access all features and story levels.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSuccessMessage(false)}
                className="text-white hover:text-green-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-1.5 md:py-5 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl mx-auto text-center">
              <h1 className="text-base md:text-4xl font-bold mb-0.5 md:mb-2 animate-fade-in">
                {currentUser && userData?.name ? (
                  <>
                    Welcome, <span className="text-yellow-300">{userData.name}</span>! 👋
                  </>
                ) : (
                  <>Ready to Learn German? 📚</>
                )}
              </h1>
              <p className="text-[10px] md:text-lg text-blue-100 font-light mb-1 md:mb-3 leading-tight">
                Improve your German skills by reading level-appropriate stories
              </p>
            </div>
          </div>
        </section>

        {/* Choose a Level Section */}
        <section className="container mx-auto px-4 pt-6 pb-12 md:pt-8 md:pb-16">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 md:mb-3">
              Choose a Level
            </h2>
            <p className="text-gray-600 text-sm md:text-lg max-w-2xl mx-auto px-2 md:px-0">
              Discover stories that match your German level and start learning
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {/* A1 Level */}
            <Link href="/stories/A1" className="group">
              <div className="relative h-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl md:rounded-2xl p-4 md:p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-emerald-100 hover:border-emerald-300 overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative z-10 flex-grow">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-lg md:text-xl">A1</span>
                    </div>
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-1 md:mb-2 group-hover:text-emerald-700 transition-colors">Beginner</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Perfect for complete beginners</p>
                </div>
                <div className="mt-auto pt-2 md:pt-4 border-t border-emerald-100">
                  <span className="text-xs text-emerald-600 font-semibold">FREE</span>
                </div>
              </div>
            </Link>
            
            {/* A2 Level */}
            <Link href="/stories/A2" className="group">
              <div className="relative h-full bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-xl md:rounded-2xl p-4 md:p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-teal-100 hover:border-teal-300 overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative z-10 flex-grow">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-lg md:text-xl">A2</span>
                    </div>
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-1 md:mb-2 group-hover:text-teal-700 transition-colors">Elementary</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Basic German knowledge required</p>
                </div>
                <div className="mt-auto pt-2 md:pt-4 border-t border-teal-100">
                  <span className="text-xs text-teal-600 font-semibold">FREE</span>
                </div>
              </div>
            </Link>
            
            {/* B1 Level */}
            <div 
              onClick={() => {
                if (!currentUser || ['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) {
                  router.push('/upgrade/premium');
                } else {
                  router.push('/stories/B1');
                }
              }}
              className="group cursor-pointer"
            >
              <div className="relative h-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl md:rounded-2xl p-4 md:p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-amber-100 hover:border-amber-300 overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative z-10 flex-grow">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-lg md:text-xl">B1</span>
                    </div>
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-1 md:mb-2 group-hover:text-amber-700 transition-colors">Intermediate</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Independent language use</p>
                </div>
                <div className="mt-auto pt-2 md:pt-4 border-t border-amber-100">
                  {(!currentUser || ['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) ? (
                    <span className="inline-flex items-center text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold shadow-md">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      PREMIUM
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold">ACCESS GRANTED</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* B2 Level */}
            <div 
              onClick={() => {
                if (!currentUser || ['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) {
                  router.push('/upgrade/premium');
                } else {
                  router.push('/stories/B2');
                }
              }}
              className="group cursor-pointer"
            >
              <div className="relative h-full bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 rounded-xl md:rounded-2xl p-4 md:p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-rose-100 hover:border-rose-300 overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative z-10 flex-grow">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-lg md:text-xl">B2</span>
                    </div>
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-1 md:mb-2 group-hover:text-rose-700 transition-colors">Upper Intermediate</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Complex topics and ideas</p>
                </div>
                <div className="mt-auto pt-2 md:pt-4 border-t border-rose-100">
                  {(!currentUser || ['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) ? (
                    <span className="inline-flex items-center text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold shadow-md">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      PREMIUM
                    </span>
                  ) : (
                    <span className="text-xs text-rose-600 font-semibold">ACCESS GRANTED</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Saved Words Section - Sadece giriş yapmış kullanıcılar için */}
        {currentUser && (
        <section className="container mx-auto px-4 pt-4 pb-12 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <div className="lg:col-span-2">
            <div className="text-center mb-4 md:mb-6">
              <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 text-gray-800 flex items-center justify-center">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center mr-2 md:mr-3 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                Saved Words
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4">
                <p className="text-xs md:text-base text-gray-600">View the words you've learned here</p>
                {userData?.membershipType !== 'premium' && (
                  <div className="flex items-center gap-1.5 md:gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs md:text-sm font-medium text-amber-800">
                      <span className="font-bold">3 words</span> per day limit
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="relative group">
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 transition-all duration-300 shadow-lg hover:shadow-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="text-base md:text-xl font-bold text-gray-800 flex items-center">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full mr-1.5 md:mr-2"></span>
                  Your Vocabulary
                </h3>
                <Link href="/vocabulary" className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-semibold transition-colors flex items-center group">
                  <span className="flex items-center">
                    View All
                    <svg className="w-3 h-3 md:w-4 md:h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6 border border-blue-100">
                <p className="text-xs md:text-sm text-gray-700">
                  Daily limit: <span className="font-bold text-blue-600">{userData?.membershipType === 'premium' ? 'Unlimited words' : '3 words remaining'}</span>
                </p>
              </div>
              
              {savedWords.length > 0 ? (
                <div className="space-y-1.5 md:space-y-2">
                  {savedWords.map((wordObj, index) => {
                    // Güvenli şekilde word'ü string'e çevir
                    let wordText = 'Unknown';
                    if (wordObj && wordObj.word) {
                      if (typeof wordObj.word === 'string') {
                        wordText = wordObj.word;
                      } else if (typeof wordObj.word === 'object' && wordObj.word !== null) {
                        if (wordObj.word.word) {
                          wordText = String(wordObj.word.word);
                        } else {
                          wordText = String(wordObj.word);
                        }
                      } else {
                        wordText = String(wordObj.word);
                      }
                    }
                    
                    // Güvenli şekilde translation'ı string'e çevir
                    let translationText = 'No translation';
                    if (wordObj && wordObj.translation) {
                      if (typeof wordObj.translation === 'string') {
                        translationText = wordObj.translation;
                      } else if (typeof wordObj.translation === 'object' && wordObj.translation !== null) {
                        // Eğer obje ise, anlamı çıkarmaya çalış
                        if (wordObj.translation.meaning) {
                          translationText = String(wordObj.translation.meaning);
                        } else if (wordObj.translation.translation) {
                          translationText = String(wordObj.translation.translation);
                        } else {
                          // Obje içindeki ilk string değeri bul
                          const firstStringValue = Object.values(wordObj.translation).find(val => typeof val === 'string');
                          translationText = firstStringValue || 'Translation available';
                        }
                      } else {
                        translationText = String(wordObj.translation);
                      }
                    }
                    
                    // Key için güvenli ID kullan
                    const safeKey = wordObj?.id || `word-${index}`;
                    
                    return (
                      <div key={safeKey} className="flex justify-between items-center py-2 md:py-3 px-3 md:px-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg md:rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-100 hover:border-blue-200 group">
                        <span className="font-bold text-sm md:text-base text-gray-800 group-hover:text-blue-700 transition-colors">
                          {wordText}
                        </span>
                        <span className="text-gray-600 text-xs md:text-sm font-medium group-hover:text-purple-600 transition-colors">
                          {translationText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-gray-700 mb-2 font-semibold text-base md:text-lg">No saved words yet</p>
                  <p className="text-xs md:text-sm text-gray-500">Read stories and save words to build your vocabulary</p>
                </div>
              )}
              </div>
            </div>
            </div>
            
            {/* Membership and Statistics Cards */}
            <div className="lg:col-span-1 space-y-3 md:space-y-6">
              {/* Membership Card */}
              <div 
                className={`relative group rounded-lg md:rounded-xl p-3 md:p-6 transition-all duration-300 shadow-md hover:shadow-xl border
                  ${userData?.membershipType === 'premium' 
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-yellow-200 hover:border-yellow-300' 
                    : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 hover:border-blue-300'}`}
              >
                <div className="flex items-center justify-between mb-2 md:mb-4">
                  <h2 className={`text-sm md:text-xl font-bold flex items-center
                    ${userData?.membershipType === 'premium' ? 'text-yellow-800' : 'text-blue-800'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="hidden sm:inline">Membership</span>
                    <span className="sm:hidden">Member</span>
                  </h2>
                  <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors
                    ${userData?.membershipType === 'premium' 
                      ? 'bg-yellow-200 group-hover:bg-yellow-300' 
                      : 'bg-blue-200 group-hover:bg-blue-300'}`}>
                    <span className={`font-bold text-xs md:text-sm
                      ${userData?.membershipType === 'premium' ? 'text-yellow-800' : 'text-blue-800'}`}>
                      {userData?.membershipType === 'premium' ? '✨' : '🆓'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 md:space-y-4">
                  {/* Free vs Premium Comparison */}
                  <div className="grid grid-cols-2 gap-1.5 md:gap-4 pt-1.5 md:pt-2 border-t border-gray-300">
                    {/* Free Column */}
                    <div className="text-center">
                      <h3 className="text-xs md:text-lg font-bold text-blue-800 mb-1 md:mb-3">Free</h3>
                      <ul className="space-y-0.5 md:space-y-2 text-left">
                        <li className="flex items-start gap-1 md:gap-2">
                          <svg className="h-2.5 w-2.5 md:h-4 md:w-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[9px] md:text-xs text-gray-700 leading-tight">Limited A1 & A2</span>
                        </li>
                        <li className="flex items-start gap-1 md:gap-2">
                          <svg className="h-2.5 w-2.5 md:h-4 md:w-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[9px] md:text-xs text-gray-700 leading-tight">Save 3 words/day</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Premium Column */}
                    <div className="text-center">
                      <h3 className="text-xs md:text-lg font-bold text-yellow-800 mb-1 md:mb-3">Premium</h3>
                      <ul className="space-y-0.5 md:space-y-2 text-left">
                        <li className="flex items-start gap-1 md:gap-2">
                          <svg className="h-2.5 w-2.5 md:h-4 md:w-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[9px] md:text-xs text-gray-700 leading-tight">All levels (A1-B2)</span>
                        </li>
                        <li className="flex items-start gap-1 md:gap-2">
                          <svg className="h-2.5 w-2.5 md:h-4 md:w-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[9px] md:text-xs text-gray-700 leading-tight">Unlimited words</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {(['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType) && (
                    <div className="pt-1.5 md:pt-3">
                      <Link href="/upgrade/premium">
                        <button className="w-full py-2 md:py-4 px-3 md:px-5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-extrabold text-xs md:text-lg text-center rounded-lg md:rounded-xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-all duration-300 border-[2px] md:border-[3px] border-yellow-300 hover:border-yellow-200 cursor-pointer ring-2 md:ring-4 ring-yellow-200/60 hover:ring-yellow-300/80 relative overflow-hidden"
                          style={{ boxShadow: '0 10px 25px -5px rgba(234, 179, 8, 0.5), 0 0 0 3px rgba(234, 179, 8, 0.3)' }}
                        >
                          <span className="flex items-center justify-center gap-1 md:gap-2 relative z-10">
                            <span className="hidden sm:inline">Upgrade to Premium</span>
                            <span className="sm:hidden">Upgrade</span>
                            <span className="text-sm md:text-xl">✨</span>
                          </span>
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
          
          {/* Statistics Card */}
          <div className="relative group">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg md:rounded-xl p-3 md:p-6 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-purple-200 hover:border-purple-300 cursor-default">
              
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <h2 className="text-sm md:text-xl font-bold text-purple-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 mr-1 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden sm:inline">Statistics</span>
                  <span className="sm:hidden">Stats</span>
                </h2>
                <div className="w-7 h-7 md:w-10 md:h-10 bg-purple-200 group-hover:bg-purple-300 rounded-full flex items-center justify-center transition-colors">
                  <span className="text-purple-800 font-bold text-xs md:text-sm">📊</span>
                </div>
              </div>
              
              <div className="space-y-0.5 md:space-y-2">
                <p className="text-sm md:text-lg font-semibold text-purple-800">
                  Stories read: {(Array.isArray(userData?.completedStories) 
                    ? userData.completedStories.filter(x => typeof x === 'string' && x).length 
                    : 0)}
                </p>
                <p className="text-[10px] md:text-sm text-purple-700">Your learning progress</p>
              </div>
            </div>
          </div>
            </div>
          </div>
        </section>
        )}

        {/* Contact and Rating Section - Sadece giriş yapmış kullanıcılar için */}
        {currentUser && (
        <section className="bg-gray-50 py-12 mt-12 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto px-6">
            {/* Contact Us */}
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-6">Have questions? We're here to help!</p>
              <a href="mailto:readung@hotmail.com" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                readung@hotmail.com
              </a>
            </div>

            {/* Rating Form */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 shadow-lg border border-purple-200">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-purple-800">Rate Your Experience</h2>
              </div>
              
              {hasRated && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-6 text-center">
                  <p className="text-green-700 text-sm font-medium">
                    ✅ You have already rated us! You can update your rating below.
                  </p>
                </div>
              )}
              
              <div className="space-y-6">
                {[
                  { id: 'ease', label: 'Ease of Use', color: 'blue', icon: '🎯' },
                  { id: 'accuracy', label: 'Translation Accuracy & Comprehension Aid', color: 'green', icon: '🎯' },
                  { id: 'learning', label: 'Learning Benefit', color: 'yellow', icon: '📚' },
                  { id: 'design', label: 'Website Design', color: 'purple', icon: '🎨' }
                ].map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{item.icon}</span>
                        <span className="text-gray-800 font-medium text-sm">{item.label}</span>
                      </div>
                    </div>
                    <div className="flex justify-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(item.id, star)}
                          className={`text-2xl transition-all duration-200 hover:scale-110 ${
                            ratings[item.id] >= star 
                              ? 'text-yellow-400 drop-shadow-sm' 
                              : 'text-gray-300 hover:text-yellow-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={handleSubmitRating}
                  disabled={!isRatingComplete}
                  className={`w-full mt-6 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                    isRatingComplete
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {hasRated ? '🔄 Update Rating' : '✨ Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Success Animation */}
        {showSuccessAnimation && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="animate-bounce bg-green-500 text-white px-6 py-3 rounded-full shadow-lg">
              Thank you for your feedback! ✨
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center">
        <p>&copy; {new Date().getFullYear()} Readung. All rights reserved.</p>
      </footer>
    </div>
  );
} 