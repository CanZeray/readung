import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs, addDoc, setDoc } from 'firebase/firestore';

// Mock story data
const mockStoryContent = {
  'a1-1': {
    title: 'Meine Familie',
    level: 'a1',
    content: `Hallo! Ich heiße Anna. Ich bin 25 Jahre alt. Ich wohne in Berlin mit meiner Familie.

Meine Familie ist nicht groß. Ich habe eine Mutter, einen Vater und einen Bruder. Meine Mutter heißt Maria. Sie ist 50 Jahre alt. Sie ist Lehrerin. Mein Vater heißt Thomas. Er ist 52 Jahre alt. Er ist Ingenieur.

Mein Bruder heißt Max. Er ist 20 Jahre alt. Er studiert an der Universität. Er studiert Informatik. Max spielt gern Fußball.

Wir haben auch eine Katze. Sie heißt Luna. Luna ist 3 Jahre alt. Sie ist schwarz und weiß. Luna schläft gern auf dem Sofa.

Am Wochenende machen wir oft etwas zusammen. Wir gehen ins Kino oder in den Park. Manchmal besuchen wir meine Großeltern. Sie wohnen nicht in Berlin. Sie wohnen in München.

Ich liebe meine Familie sehr.`,
    wordCount: 120,
    readTime: 2,
  },
  'a1-2': {
    title: 'Im Restaurant',
    level: 'a1',
    content: `Heute gehe ich mit meinem Freund David ins Restaurant. Das Restaurant heißt "Zum goldenen Löwen". Es ist ein deutsches Restaurant.

Wir kommen um 19 Uhr an. Ein Kellner begrüßt uns: "Guten Abend! Haben Sie reserviert?"

David antwortet: "Ja, auf den Namen Schmidt, für zwei Personen."

Der Kellner sagt: "Ah ja, hier ist Ihre Reservierung. Bitte folgen Sie mir."

Wir setzen uns an einen Tisch am Fenster. Der Kellner gibt uns die Speisekarten. "Was möchten Sie trinken?", fragt er.

"Ich hätte gerne ein Glas Weißwein", sage ich.

"Und ich nehme ein Bier", sagt David.

Wir schauen auf die Speisekarte. Es gibt viele traditionelle deutsche Gerichte. Ich wähle Schnitzel mit Kartoffelsalat. David bestellt Bratwurst mit Sauerkraut.

Das Essen ist sehr lecker. Zum Nachtisch teilen wir uns einen Apfelstrudel mit Vanilleeis.

Am Ende bezahlen wir die Rechnung. Der Kellner sagt: "Vielen Dank für Ihren Besuch. Kommen Sie bald wieder!"

"Auf Wiedersehen!", antworten wir.`,
    wordCount: 150,
    readTime: 3,
  },
  'a2-1': {
    title: 'Ein Tag im Park',
    level: 'a2',
    content: `Es ist Samstag und das Wetter ist wunderschön. Die Sonne scheint und es ist 25 Grad warm. Ich beschließe, den Tag im Stadtpark zu verbringen.

Ich packe meinen Rucksack. Ich nehme ein Buch, eine Wasserflasche, einen Apfel und ein Sandwich mit. Ich ziehe meine Sportschuhe an und fahre mit dem Fahrrad zum Park.

Im Park sind viele Menschen. Einige joggen auf den Wegen, andere liegen auf der Wiese und sonnen sich. Eine Gruppe junger Leute spielt Volleyball. Kinder lachen und spielen auf dem Spielplatz.

Ich finde einen schönen Platz unter einem großen Baum. Ich lege meine Decke auf das Gras und setze mich. Zuerst lese ich ein bisschen in meinem Buch. Es ist ein spannender Roman über eine Detektivin.

Nach einer Weile mache ich eine Pause und esse mein Sandwich. Ich beobachte die Menschen um mich herum. Eine Familie grillt nicht weit von mir entfernt. Der Duft von gegrilltem Fleisch liegt in der Luft.

Plötzlich höre ich Musik. Eine kleine Band spielt am Pavillon in der Mitte des Parks. Ich beschließe, näher zu gehen und zuzuhören. Die Musik ist wirklich gut - eine Mischung aus Jazz und Folk.

Als die Sonne untergeht, wird es kühler. Die Menschen packen langsam ihre Sachen zusammen und gehen nach Hause. Auch ich fahre mit meinem Fahrrad zurück. Es war ein perfekter Tag im Park.`,
    wordCount: 250,
    readTime: 4,
  },
};

// Navbar component
const Navbar = () => {
  const router = useRouter();
  const { currentUser, logout, getUserData } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/home" className="text-3xl font-bold flex items-center group hover:scale-105 transition-transform">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-500 group-hover:text-blue-300 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-blue-500 font-bold group-hover:text-blue-300 transition-colors duration-300">Readung</span>
          </span>
        </Link>
        
        {/* Desktop Menu */}
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
                onClick={handleLogout} 
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
        
        {/* Mobile Menu Button */}
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
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-2 py-3 px-4 bg-gray-800 rounded-lg border border-gray-700 animate-fade-in">
          <div className="flex flex-col gap-3">
            {currentUser ? (
              <>
                <Link href="/profile" className={`cursor-pointer ${router.pathname === '/profile' ? 'text-blue-400' : ''}`}>
                  <div className="flex items-center gap-1 hover:text-blue-300 hover:bg-gray-700 transition-all duration-300 py-2 px-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile</span>
                  </div>
                </Link>
                {userData?.role === 'admin' && (
                  <Link href="/admin" className="hover:text-yellow-300 transition-colors py-2 cursor-pointer">
                    <span>Admin Paneli</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="hover:text-red-300 transition-colors py-2 text-left flex items-center"
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
                  <span className="relative inline-block py-2 px-4 rounded-lg text-white hover:text-blue-200 transition-all duration-300 cursor-pointer group border border-transparent hover:border-blue-400 hover:bg-gray-700/50">
                    Log In
                    <span className="absolute inset-0 rounded-lg bg-blue-600/0 group-hover:bg-blue-600/10 transition-all duration-300 pointer-events-none"></span>
                  </span>
                </Link>
                <Link href="/auth/register">
                  <span className="inline-block py-2 px-4 rounded-lg text-center text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5">
                    Sign Up
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// Word Saving Modal Component
const SaveWordModal = ({ isOpen, onClose, onSave, membershipType, savedWordsToday }) => {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef();

  // Free user daily word limit check
  const canSaveMore = membershipType === 'premium' || savedWordsToday < 3;

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!word.trim() || !translation.trim()) {
      setError('Please enter both word and translation');
      return;
    }

    if (!canSaveMore) {
      setError('Daily limit reached. Upgrade to Premium for unlimited word saving.');
      return;
    }

    onSave({
      word,
      translation,
      notes,
      timestamp: new Date().toISOString()
    });
    setWord('');
    setTranslation('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Save New Word</h2>
        
        {(['free', 'basic'].includes(membershipType) || !membershipType) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold">Free account: {3 - savedWordsToday} words remaining today</p>
            {savedWordsToday >= 3 && (
              <p className="text-primary mt-1">
                <Link href="/upgrade/premium" className="hover:underline">Upgrade to Premium</Link> for unlimited word saving
              </p>
            )}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="word" className="block mb-1 font-medium">German Word</label>
            <input
              type="text"
              id="word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="input"
              placeholder="e.g. Haus"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="translation" className="block mb-1 font-medium">Translation</label>
            <input
              type="text"
              id="translation"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="input"
              placeholder="e.g. house"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="notes" className="block mb-1 font-medium">Notes (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input h-24"
              placeholder="Add any notes about this word"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!canSaveMore}
            >
              Save Word
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Kelime kaydetme onay komponenti
const WordConfirmation = ({ word, onConfirm, onCancel, currentUser, router }) => {
  if (!word) return null;
  
  // Kullanıcı giriş yapmamışsa login prompt göster
  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md mx-auto p-6 w-full shadow-2xl transform transition-all">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-600 mb-6">
              You need to log in to save words to your vocabulary.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={onCancel} 
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => router.push('/auth/login')} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 w-full max-w-sm z-50">
      <p className="mb-3 text-center">
        Save "<span className="font-bold">{word}</span>" to your vocabulary?
      </p>
      <div className="flex justify-center gap-3">
        <button 
          onClick={onCancel} 
          className="btn bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm} 
          className="btn btn-primary"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default function ReadStory() {
  const router = useRouter();
  const { id } = router.query;
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [savedWordsToday, setSavedWordsToday] = useState(0);
  const [completed, setCompleted] = useState(false);
  const contentRef = useRef(null);
  const { currentUser, getUserData } = useAuth();
  
  // Çeviri işlemleri için state değişkenleri
  const [selectedWordForTranslation, setSelectedWordForTranslation] = useState('');
  const [showTranslateButton, setShowTranslateButton] = useState(false);
  const [translatedWord, setTranslatedWord] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationPosition, setTranslationPosition] = useState({ x: 0, y: 0 });
  const [translatedWords, setTranslatedWords] = useState(new Set()); // Translate edilmiş kelimeleri tut
  const [savedWords, setSavedWords] = useState(new Set()); // Kaydedilmiş kelimeleri tut
  const [translationLanguage, setTranslationLanguage] = useState('english'); // 'english' veya 'turkish'
  
  // Kelime kaydetme limiti için state (translate limiti kaldırıldı)
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Tek/çift tıklama çakışmasını önlemek için timer
  let clickTimer = null;

  useEffect(() => {
    if (!id) return;
    
    async function loadStoryAndUserData() {
      try {
        setLoading(true);
        
        // Önce hikayeyi yükle
        const storySnapshot = await getDoc(doc(db, "stories", id));
        
        if (!storySnapshot.exists()) {
          alert('Story not found');
          router.push('/home');
          setLoading(false);
          return;
        }
        
        const storyData = {
          id: storySnapshot.id,
          ...storySnapshot.data()
        };
        
        // Ücretli hikayeler için kontrol
        const storyLevel = storyData.level?.toLowerCase() || '';
        const isPremiumLevel = ['b1', 'b2'].includes(storyLevel);
        
        // A1 seviyesinde ilk 5 hikayeden sonrakiler için premium kontrolü
        // A2 seviyesinde ilk 3 hikayeden sonrakiler için premium kontrolü
        let requiresPremiumForA1A2 = false;
        if (['a1', 'a2'].includes(storyLevel)) {
          const storiesQuery = query(
            collection(db, "stories"), 
            where("level", "==", storyLevel)
          );
          const storiesSnapshot = await getDocs(storiesQuery);
          const allStories = [];
          storiesSnapshot.forEach((doc) => {
            allStories.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // Hikayeleri sırala
          allStories.sort((a, b) => {
            const dateA = a.dateAdded?.toDate ? a.dateAdded.toDate() : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0));
            const dateB = b.dateAdded?.toDate ? b.dateAdded.toDate() : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0));
            return dateB - dateA;
          });
          
          // Bu hikayenin index'ini bul
          const storyIndex = allStories.findIndex(s => s.id === id);
          // A1 için ilk 5, A2 için ilk 3 hikaye ücretsiz
          if (storyLevel === 'a1') {
            requiresPremiumForA1A2 = storyIndex >= 5;
          } else if (storyLevel === 'a2') {
            requiresPremiumForA1A2 = storyIndex >= 3;
          }
        }
        
        // Kullanıcı varsa verilerini getir
        let userDataResult = null;
        if (currentUser) {
          userDataResult = await getUserData();
          
          if (userDataResult) {
            // Günlük kelime kayıt ve çeviri sayısını belirle
            const today = new Date().toDateString();
            const lastSaveDate = userDataResult.lastWordSaveDate || '';
            const lastTranslationDate = userDataResult.lastTranslationDate || '';
            
            if (lastSaveDate === today) {
              setSavedWordsToday(userDataResult.savedWordsToday || 0);
            } else {
              setSavedWordsToday(0);
              if (userDataResult.savedWordsToday > 0) {
                await updateDoc(doc(db, "users", currentUser.uid), {
                  savedWordsToday: 0,
                  lastWordSaveDate: today
                });
              }
            }
            
            // Translate limiti kaldırıldı - translationsToday takibi artık gerekli değil
            
            // Ücretli hikayeler için premium kontrolü
            const isFreeUser = ['free', 'basic'].includes(userDataResult.membershipType) || !userDataResult.membershipType;
            if ((isPremiumLevel || requiresPremiumForA1A2) && isFreeUser) {
              alert('Bu hikaye için premium üyelik gereklidir. Üye olmak için lütfen giriş yapın.');
              router.push('/upgrade/premium');
              setLoading(false);
              return;
            }
            
            // Kullanıcının tamamladığı hikayeleri kontrol et
            const completedStories = userDataResult.completedStories || [];
            if (completedStories.includes(id)) {
              setCompleted(true);
            }
            
            // Kullanıcının okuduğu hikaye sayısını güncelle
            if (isFreeUser) {
              const today = new Date().toDateString();
              if (userDataResult.lastReadDate !== today) {
                await updateDoc(doc(db, "users", currentUser.uid), {
                  storiesRead: 1,
                  lastReadDate: today
                });
              }
            }
            
            // Eğer translationHistory alanı yoksa, eski viewedTranslations'dan migrate et
            if (!userDataResult.translationHistory) {
              const now = new Date().toISOString();
              const translationHistory = {};
              
              if (userDataResult.viewedTranslations && Array.isArray(userDataResult.viewedTranslations)) {
                userDataResult.viewedTranslations.forEach(word => {
                  translationHistory[word] = now;
                });
              }
              
              userDataResult.translationHistory = translationHistory;
              await updateDoc(doc(db, "users", currentUser.uid), {
                translationHistory: translationHistory
              });
            }
            
            setUserData(userDataResult);
            
            // Kullanıcının kaydedilmiş kelimelerini yükle
            try {
              const userRef = doc(db, "users", currentUser.uid);
              const savedWordsRef = collection(userRef, "savedWords");
              const savedWordsSnapshot = await getDocs(savedWordsRef);
              const savedWordsSet = new Set();
              savedWordsSnapshot.forEach((doc) => {
                const wordData = doc.data();
                if (wordData.word) {
                  savedWordsSet.add(wordData.word.toLowerCase());
                }
              });
              setSavedWords(savedWordsSet);
            } catch (error) {
              console.error("Error loading saved words:", error);
            }
          }
        } else {
          // Kullanıcı giriş yapmamış ve ücretli hikaye ise
          if (isPremiumLevel || requiresPremiumForA1A2) {
            if (requiresPremiumForA1A2) {
              alert('Bu hikaye için premium üyelik gereklidir. Premium üyelik satın almak için lütfen giriş yapın.');
              router.push('/auth/login');
            } else {
              alert('Bu hikaye için üye girişi gereklidir. Üye olmak için lütfen giriş yapın.');
              router.push('/auth/login');
            }
            setLoading(false);
            return;
          }
        }
        
        // Hikayeyi set et
        setStory(storyData);
      } catch (error) {
        console.error("Error fetching story:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadStoryAndUserData();
  }, [currentUser, id, router, getUserData]);

  // Kelimeye tıklama ile çeviri butonunu göster (timer ile)
  const handleWordClick = (e, word) => {
    e.preventDefault();
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      setSelectedWordForTranslation(word);
      const rect = e.target.getBoundingClientRect();
      
      // Viewport'a göre pozisyon hesapla (scroll offset dahil)
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setTranslationPosition({
        x: rect.left + scrollLeft,
        y: rect.bottom + scrollTop
      });
      setShowTranslateButton(true);
    }, 200); // 200ms gecikme ile tek tık
  };

  // Kelimeye çift tıklama ile kaydetme modalı aç
  const handleWordDoubleClick = (e, word) => {
    e.preventDefault();
    if (clickTimer) clearTimeout(clickTimer);
    
    // Kullanıcı giriş yapmamışsa uyarı göster
    if (!currentUser || !userData) {
      setShowLoginPrompt(true);
      setSelectedWord(word);
      return;
    }
    
    setSelectedWord(word);
    setShowConfirmation(true); // Onay modalını göster
  };

  // Kelime kaydetme onayı
  const handleConfirmSave = () => {
    setShowConfirmation(false);
    // Onay sonrası kelimeyi kaydet
    handleDirectSave(selectedWord);
  };

  // Kelimeyi direkt kaydet
  const handleDirectSave = async (word) => {
    if (!currentUser || !userData) return;
    
    // Ücretsiz kullanıcı günlük kelime limiti kontrolü
    const isFreeUser = ['free', 'basic'].includes(userData.membershipType) || !userData.membershipType;
    if (isFreeUser && savedWordsToday >= 3) {
      setShowLimitModal(true);
      return;
    }
    
    try {
      // Kelime çevirisini al
      let translation = '';
      
      // Önce Firestore'da kelimenin çevirisini ara
      const translationsRef = collection(db, "translations");
      const q = query(translationsRef, where("original", "==", word));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Mevcut çeviriyi al
        const existingTranslation = querySnapshot.docs[0].data();
        translation = existingTranslation.translation;
        
        // Veritabanından alınan çeviriden anlamı çıkar
        const meaningMatch = translation.match(/Meaning:(.*?)(Explanation:|Example sentence:|Other possible translation:|$)/s);
        if (meaningMatch && meaningMatch[1]) {
          translation = meaningMatch[1].trim();
        }
      } else {
        // Çeviri bulunamazsa
        translation = "Translation not available";
      }
      
      // Kelimeyi kaydet - Artık savedWords array yerine savedWords subcollection'a kaydedelim
      const userRef = doc(db, "users", currentUser.uid);
      const wordRef = doc(collection(userRef, "savedWords"));
      
      // Yeni kelimeyi alt koleksiyona ekle
      await setDoc(wordRef, {
        word: word,
        translation: translation,
        notes: "",
        dateAdded: new Date().toISOString()
      });
      
      // Ana kullanıcı dokümanını da güncelle (günlük sayaç)
      await updateDoc(userRef, {
        savedWordsToday: savedWordsToday + 1,
        lastWordSaveDate: new Date().toDateString()
      });
      
      // Yerel sayacı güncelle
      setSavedWordsToday(savedWordsToday + 1);
      
      // Kelimeyi savedWords set'ine ekle
      setSavedWords(prev => new Set([...prev, word.toLowerCase()]));
      
      // Başarılı mesajı göster
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      notification.innerHTML = `Word <b>${word}</b> saved to vocabulary!`;
      document.body.appendChild(notification);
      
      // 3 saniye sonra bildirim mesajını kaldır
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
    } catch (error) {
      console.error("Error saving word:", error);
      alert('Failed to save word');
    }
  };

  // Çevir butonuna tıklandığında çağrılacak fonksiyon
  const handleTranslate = async () => {
    if (!selectedWordForTranslation) return;
    
    setTranslationLoading(true);
    
    try {
      // Kullanıcı giriş yapmamışsa veya userData yoksa, ücretsiz kullanıcı olarak kabul et
      const isFreeUser = !currentUser || !userData || ['free', 'basic'].includes(userData?.membershipType) || !userData?.membershipType;
      
      // Kullanıcının çeviri geçmişini kontrol et (24 saatlik süre kontrolü) - sadece giriş yapmış kullanıcılar için
      const userTranslationHistory = userData?.translationHistory || {};
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Bu kelimeyi daha önce çevirmiş mi ve 24 saat geçmiş mi kontrol et
      const lastTranslationTime = userTranslationHistory[selectedWordForTranslation];
      const hasRecentTranslation = lastTranslationTime && new Date(lastTranslationTime) > twentyFourHoursAgo;
      
      // Translate limiti kaldırıldı - herkes limitsiz translate yapabilir
      
      setShowTranslation(true);
      
      // Çeviri veritabanında arama yap
      const translationsRef = collection(db, "translations");
      const q = query(translationsRef, where("original", "==", selectedWordForTranslation));
      const querySnapshot = await getDocs(q);
      
      // Çeviri veritabanında var mı kontrol et
      // NOT: Dil seçimi değiştiğinde yeni çeviri yapılması için mevcut çeviriyi kullanmıyoruz
      // Her zaman seçilen dile göre yeni çeviri yapıyoruz
      const useExistingTranslation = false; // Dil seçimi nedeniyle her zaman yeni çeviri yap
      
      if (useExistingTranslation && !querySnapshot.empty) {
        const existingTranslation = querySnapshot.docs[0].data();
        setTranslatedWord(existingTranslation.translation);
        
        // Mevcut çeviriyi de set'e ekle
        if (selectedWordForTranslation) {
          setTranslatedWords(prev => new Set([...prev, selectedWordForTranslation.toLowerCase()]));
        }
        
        // Çeviri geçmişini güncelle (limit kontrolü kaldırıldı)
        // Sadece giriş yapmış kullanıcılar için
        if (userData && currentUser && !hasRecentTranslation) {
          // Kullanıcının çeviri geçmişini güncelle
          const updatedTranslationHistory = {
            ...userTranslationHistory,
            [selectedWordForTranslation]: now.toISOString()
          };
          
          // Veritabanını güncelle (translationsToday artık güncellenmiyor)
          await updateDoc(doc(db, "users", currentUser.uid), {
            translationHistory: updatedTranslationHistory
          });
          
          // Yerel state'i güncelle
          const updatedUserData = { 
            ...userData, 
            translationHistory: updatedTranslationHistory 
          };
          setUserData(updatedUserData);
        }
      } else {
        // Kelime daha önce çevrilmemişse - ChatGPT API ile çeviri yap
        // API key kontrolü server-side'da yapılıyor, client-side kontrolü kaldırıldı
        
        console.log("Çevirisi yapılacak kelime:", selectedWordForTranslation);
        console.log("Seçilen dil:", translationLanguage);
        
        // API endpoint'ini kullan
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Kullanıcı giriş yapmışsa token ekle
        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            word: selectedWordForTranslation,
            context: story?.content || '',
            targetLanguage: translationLanguage // 'english' veya 'turkish'
          })
        });
        
        console.log("API Request body:", {
          word: selectedWordForTranslation,
          context: story?.content || '',
          targetLanguage: translationLanguage
        });

        console.log("API Response Status:", response.status);
        
        if (!response.ok) {
          console.error("API Response Error:", response.status, response.statusText);
          const errorData = await response.text();
          console.error("Error details:", errorData);
          
          let errorMessage = '';
          if (response.status === 401) {
            errorMessage = 'API key is invalid or expired';
          } else if (response.status === 429) {
            errorMessage = 'Translation service rate limit exceeded. Please try again later.';
          } else if (response.status === 500) {
            errorMessage = 'Translation service is temporarily unavailable';
          } else {
            errorMessage = `Translation service error (${response.status})`;
          }
          
          setTranslatedWord(`
Meaning: Service error
Explanation: ${errorMessage}
Example sentence: Not available
Grammatical role: Not available
          `);
          setTranslationLoading(false);
          return;
        }

        const data = await response.json();
        console.log("API Response:", data);

        // API'den gelen çeviri
        const translatedWord = data.translation || '';
        console.log("Çeviri metni:", translatedWord);
        
        // Hata kontrolü
        if (data.error || !translatedWord || 
            translatedWord.includes('Translation failed') ||
            translatedWord.includes('Error occurred') ||
            translatedWord.includes('Not available') ||
            translatedWord.includes('Çeviri başarısız') ||
            translatedWord.includes('Hata oluştu') ||
            translatedWord.includes('Mevcut değil')) {
          setTranslatedWord(data.translation || `
Meaning: Translation failed
Explanation: ${data.error || 'Empty or invalid response from translation service'}
Example sentence: Not available
Grammatical role: Not available
          `);
          setTranslationLoading(false);
          return;
        }

        // Çeviriyi veritabanına kaydet - SADECE BAŞARILI ÇEVIRILER (sadece giriş yapmış kullanıcılar için)
        if (currentUser) {
          await addDoc(collection(db, "translations"), {
            original: selectedWordForTranslation,
            translation: translatedWord,
            context: story?.content || '',
            timestamp: Timestamp.now()
          });
        }
        
        // Çeviri geçmişini güncelle (limit kontrolü kaldırıldı)
        // Sadece giriş yapmış kullanıcılar için
        if (userData && currentUser) {
          // Kullanıcının çeviri geçmişini güncelle
          const updatedTranslationHistory = {
            ...userTranslationHistory,
            [selectedWordForTranslation]: now.toISOString()
          };
          
          // Veritabanını güncelle (translationsToday artık güncellenmiyor)
          await updateDoc(doc(db, "users", currentUser.uid), {
            translationHistory: updatedTranslationHistory
          });
          
          // Yerel state'i güncelle
          const updatedUserData = { 
            ...userData, 
            translationHistory: updatedTranslationHistory 
          };
          setUserData(updatedUserData);
        }
        
        // Çeviriyi state'e kaydet
        setTranslatedWord(translatedWord);
        
        // Translate edilmiş kelimeyi set'e ekle
        if (selectedWordForTranslation) {
          setTranslatedWords(prev => new Set([...prev, selectedWordForTranslation.toLowerCase()]));
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      let errorMessage = 'Unknown translation error';
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Invalid response from translation service';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Translation service configuration error';
      }
      
      setTranslatedWord(`
Meaning: Error occurred
Explanation: ${errorMessage}
Example sentence: Not available
Grammatical role: Not available
      `);
    } finally {
      setTranslationLoading(false);
    }
  };


  // Belge tıklandığında çeviri UI'ı kapat
  const handleDocumentClick = (e) => {
    if (showTranslateButton || showTranslation) {
      // Çeviri butonu ve çeviri kutucuğu dışına tıklandığında kapat
      if (!e.target.closest('.translation-button') && !e.target.closest('.translation-box')) {
        setShowTranslateButton(false);
        setShowTranslation(false);
      }
    }
  };

  // Belge tıklama event listener'ı
  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showTranslateButton, showTranslation]);

  // Geri dönme
  const handleGoBack = () => {
    const storyLevel = story?.level || 'a1';
    router.push(`/stories/${storyLevel}`);
  };

  // Çeviri butonunun pozisyonunu ekrana göre ayarla
  const getTranslationButtonPosition = () => {
    const buttonHeight = 40; // Her buton için yükseklik
    const totalHeight = buttonHeight * 2 + 4; // İki buton + gap (4px)
    const buttonWidth = 100;
    let left = translationPosition.x;
    let top = translationPosition.y + 5; // Kelimeye daha yakın

    // Ekrandan taşmayı engelle
    if (typeof window !== 'undefined') {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Viewport sınırlarını hesapla
      const rightBoundary = scrollLeft + viewportWidth;
      const bottomBoundary = scrollTop + viewportHeight;
      const leftBoundary = scrollLeft;
      const topBoundary = scrollTop;
      
      // Sağ taraftan taşmayı engelle
      if (left + buttonWidth > rightBoundary) {
        left = rightBoundary - buttonWidth - 10;
      }
      
      // Sol taraftan taşmayı engelle
      if (left < leftBoundary) {
        left = leftBoundary + 10;
      }
      
      // Alt taraftan taşmayı engelle - buton kelimeden yukarı çıksın
      if (top + totalHeight > bottomBoundary) {
        top = translationPosition.y - totalHeight - 5;
      }
      
      // Üst taraftan da taşarsa, viewport içinde güvenli bir yere koy
      if (top < topBoundary) {
        top = topBoundary + 10;
      }
    }
    return { left, top };
  };

  // Hikayeyi tamamlandı olarak işaretle veya tamamlanmamış yap (toggle)
  const handleCompleteStory = async () => {
    // Kullanıcı giriş yapmamışsa uyarı göster
    if (!currentUser || !userData) {
      setShowLoginPrompt(true);
      return;
    }
    
    try {
      if (!story) return;
      
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const completedStories = userData.completedStories || [];
        
        if (completedStories.includes(id)) {
          // Hikaye tamamlandıysa, tamamlanmamış yap
          const updatedStories = completedStories.filter(storyId => storyId !== id);
          await updateDoc(userRef, {
            completedStories: updatedStories
          });
          setCompleted(false);
          
          // Bildirim göster
          const notification = document.createElement('div');
          notification.className = 'fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50';
          notification.innerHTML = 'Story marked as not completed.';
          document.body.appendChild(notification);
          setTimeout(() => { notification.remove(); }, 2000);
        } else {
          // Hikaye tamamlanmamışsa, tamamla
          await updateDoc(userRef, {
            completedStories: arrayUnion(id)
          });
          setCompleted(true);
          
          // Başarılı mesaj göster
          const notification = document.createElement('div');
          notification.className = 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
          notification.innerHTML = 'Congratulations! You have completed the story.';
          document.body.appendChild(notification);
          setTimeout(() => { notification.remove(); }, 2000);
        }
      }
    } catch (error) {
      console.error("Error toggling story completion:", error);
      alert('Bir hata oluştu.');
    }
  };

  // Hikayenin tamamlandı durumunu kontrol et
  useEffect(() => {
    if (currentUser && story && userData) {
      const completedStories = userData.completedStories || [];
      if (completedStories.includes(id)) {
        setCompleted(true);
      } else {
        setCompleted(false);
      }
    }
  }, [currentUser, story, userData, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <p>Loading story...</p>
        </main>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
            <p className="mb-6">Sorry, we couldn't find the story you're looking for.</p>
            <button 
              onClick={handleGoBack} 
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Stories
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{story.title} - Readung</title>
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <button 
          onClick={handleGoBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 mb-2 group text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back to Stories</span>
        </button>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">{story.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Translation:</span>
              <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setTranslationLanguage('english')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    translationLanguage === 'english'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setTranslationLanguage('turkish')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    translationLanguage === 'turkish'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Türkçe
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <span className="px-2 py-1 bg-primary text-white text-sm rounded-md shadow-md" style={{boxShadow: '0px 2px 8px rgba(0,0,0,0.08)'}}>
              Level {story.level.toUpperCase()}
            </span>
            <span className="text-gray-500 text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {story.wordCount} words 
              <span className="mx-2">|</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {typeof story.readTime === 'string' && story.readTime.includes('min') ? story.readTime : `${story.readTime} min`} read
            </span>
          </div>
          
          <div className="mb-4 p-4 rounded border border-[#cce7ff] bg-gradient-to-r from-blue-50 to-blue-50/70 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div>
              <h3 className="font-semibold mb-1">Reading Tip:</h3>
              <p>Click on any word to translate it, then click Save to add it to your vocabulary!</p>
              {!currentUser && (
                <p className="mt-2 text-sm text-blue-600 font-medium">
                  💡 <Link href="/auth/login" className="underline hover:text-blue-700">Log in</Link> to save words and access more features!
                </p>
              )}
            </div>
          </div>
          
          <div 
            ref={contentRef}
            className="story-content mb-6 leading-relaxed text-lg"
            style={{ position: 'relative' }}
          >
            {story.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-6">
                {(paragraph.match(/\p{L}+|\d+|[^\p{L}\d\s]+|\s+/gu) || []).map((word, widx) => {
                  // Sadece harf içeren kelimeler (Almanca karakterler dahil), sayı içerenler hariç
                  if (/^\p{L}+$/u.test(word)) {
                    return (
                      <span
                        key={widx}
                        className="hover:bg-yellow-200 transition rounded cursor-pointer px-1 inline-block word-hover"
                        onClick={(e) => handleWordClick(e, word)}
                      >
                        {word}
                      </span>
                    );
                  } else {
                    // Boşluk, noktalama veya sayı ise direkt yaz
                    return word;
                  }
                })}
              </p>
            ))}
          </div>
          
          <div className="flex flex-col items-center gap-4 mb-6">
            <button 
              onClick={() => {
                if (!currentUser || !userData) {
                  setShowLoginPrompt(true);
                } else {
                  setShowSaveModal(true);
                }
              }} 
              className="btn btn-secondary"
            >
              Add Word to Vocabulary
            </button>
            
            <button 
              onClick={handleCompleteStory}
              className={`px-5 py-2 rounded-lg shadow-md flex items-center justify-center font-medium transition-all cursor-pointer ${
                completed ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {completed ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Completed
                </>
              ) : (
                'Complete Story!'
              )}
            </button>
          </div>
        </div>
      </main>
      
      {/* Çeviri butonu */}
      {showTranslateButton && (
        <div 
          className="translation-button absolute z-50 flex flex-col gap-1"
          style={{
            left: `${getTranslationButtonPosition().left}px`,
            top: `${getTranslationButtonPosition().top}px`,
            pointerEvents: 'auto'
          }}
        >
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded-md shadow-lg cursor-pointer hover:bg-blue-700 transition-all duration-200"
            style={{
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
            onClick={handleTranslate}
          >
            Translate
          </button>
          <button
            className={`px-3 py-1 rounded-md shadow-lg transition-all duration-200 ${
              savedWords.has(selectedWordForTranslation.toLowerCase())
                ? 'bg-gray-500 text-white cursor-not-allowed'
                : translatedWords.has(selectedWordForTranslation.toLowerCase())
                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed hover:bg-gray-400'
            }`}
            style={{
              fontSize: '14px',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
            onClick={() => {
              if (!currentUser || !userData) {
                setShowLoginPrompt(true);
                setShowTranslateButton(false);
                return;
              }
              
              // Zaten kaydedilmiş mi kontrol et
              if (savedWords.has(selectedWordForTranslation.toLowerCase())) {
                return; // Zaten kaydedilmiş, hiçbir şey yapma
              }
              
              // Önce translate edilmiş mi kontrol et
              if (!translatedWords.has(selectedWordForTranslation.toLowerCase())) {
                alert('Please translate the word first before saving it!');
                return;
              }
              
              handleDirectSave(selectedWordForTranslation);
              setShowTranslateButton(false);
            }}
            disabled={!translatedWords.has(selectedWordForTranslation.toLowerCase()) || savedWords.has(selectedWordForTranslation.toLowerCase())}
          >
            {savedWords.has(selectedWordForTranslation.toLowerCase()) ? 'Already Saved' : 'Save'}
          </button>
        </div>
      )}
      
      {/* Çeviri sonucu kutusu */}
      {showTranslation && (
        <div 
          className="translation-box fixed z-50 max-w-xs"
          style={{ 
            right: 32,
            bottom: 32,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
            padding: 16,
            textAlign: 'left'
          }}
        >
          {/* Kapatma butonu */}
          <button
            onClick={() => setShowTranslation(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
          <div className="text-sm font-medium mb-2">
            {selectedWordForTranslation}
          </div>
          
          {translationLoading ? (
            <div className="mt-1 text-gray-600 flex items-center">
              <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Translating...
            </div>
          ) : (
            <div className="mt-1" style={{lineHeight: '1.7'}}>
              {(() => {
                const isTr = translationLanguage === 'turkish';
                const na = isTr ? 'Mevcut değil' : 'Not available';

                // Meaning için esnek ve fallback (TR başlıkları dahil)
                let meaning = '';
                const meaningMatch = translatedWord.match(/Meaning:\s*([^\n]*)/i) 
                  || translatedWord.match(/Translation:\s*([^\n]*)/i)
                  || translatedWord.match(/Anlam:\s*([^\n]*)/i);
                if (meaningMatch && meaningMatch[1]) {
                  meaning = meaningMatch[1].trim();
                } else {
                  meaning = na;
                }

                // Explanation (TR başlıkları dahil)
                let explanation = '';
                const explanationMatch = translatedWord.match(/Explanation:\s*([\s\S]*?)(Example sentence:|Grammatical role:|Grammatical function:|Grammar:|Function:|Role:|$)/i)
                  || translatedWord.match(/Açıklama:\s*([\s\S]*?)(Örnek cümle:|Gramer rolü:|Example sentence:|Grammatical role:|$)/i);
                explanation = explanationMatch && explanationMatch[1]?.trim() ? explanationMatch[1].trim() : na;

                // Example sentence (TR başlıkları dahil)
                let example = '';
                const exampleMatch = translatedWord.match(/Example sentence:\s*([\s\S]*?)(Grammatical role:|Grammatical function:|Grammar:|Function:|Role:|Meaning:|Explanation:|$)/i)
                  || translatedWord.match(/Example:\s*([\s\S]*?)(Grammatical role:|Grammatical function:|Grammar:|Function:|Role:|Meaning:|Explanation:|$)/i)
                  || translatedWord.match(/Örnek cümle:\s*([\s\S]*?)(Gramer rolü:|Meaning:|Explanation:|Grammatical role:|$)/i);

                if (exampleMatch && exampleMatch[1]?.trim()) {
                  example = exampleMatch[1].trim();
                } else {
                  if (explanationMatch && explanationMatch[1]) {
                    const quoteMatch = explanationMatch[1].match(/"([^"]+?)"/g);
                    if (quoteMatch) {
                      example = quoteMatch[0].replace(/"/g, '');
                    } else {
                      example = na;
                    }
                  } else {
                    example = na;
                  }
                }

                // Grammatical role / Gramer rolü
                let grammar = '';
                const grammarMatch = translatedWord.match(/Grammatical role:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|Grammatical function:|Grammar:|Function:|Role:|$)/i)
                  || translatedWord.match(/Grammatical function:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|Grammar:|Function:|Role:|$)/i)
                  || translatedWord.match(/Grammar:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|Function:|Role:|$)/i)
                  || translatedWord.match(/Function:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|Role:|$)/i)
                  || translatedWord.match(/Role:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|$)/i)
                  || translatedWord.match(/Gramer rolü:\s*([\s\S]*?)(Anlam:|Açıklama:|Örnek cümle:|Meaning:|Explanation:|Example sentence:|$)/i);
                if (grammarMatch && grammarMatch[1]?.trim()) {
                  grammar = grammarMatch[1].trim();
                  if (
                    grammar.toLowerCase().includes('see explanation above') ||
                    grammar.length < 8
                  ) {
                    grammar = '';
                  }
                }
                // Fallback: Explanation içinde gramatik bilgi ara
                if (!grammar) {
                  const lowerExp = explanation.toLowerCase();
                  if (lowerExp.includes('adverb')) grammar = isTr ? 'Zarf (açıktan yakalandı)' : 'Adverb (detected from explanation)';
                  else if (lowerExp.includes('verb')) grammar = isTr ? 'Fiil (açıktan yakalandı)' : 'Verb (detected from explanation)';
                  else if (lowerExp.includes('noun')) grammar = isTr ? 'İsim (açıktan yakalandı)' : 'Noun (detected from explanation)';
                  else grammar = na;
                }

                return (
                  <>
                      <div style={{fontWeight: 'bold', color: '#374151', fontSize: '1.1rem', marginBottom: 6}}>
                        Meaning
                      <div style={{fontWeight: 'normal', color: '#6b7280', fontSize: '1rem', marginTop: 2}}>
                        {meaning}
                      </div>
                    </div>
                      <div style={{borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 8, marginBottom: 6}}>
                        <span style={{fontWeight: 'bold', color: '#374151'}}>Explanation</span>
                      <div style={{color: '#6b7280', fontSize: '1rem', marginTop: 2}}>
                        {explanation}
                      </div>
                    </div>
                      <div style={{borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 8}}>
                        <span style={{fontWeight: 'bold', color: '#374151'}}>Example sentence</span>
                      <div style={{color: '#3B82F6', fontStyle: 'italic', fontSize: '1rem', marginTop: 2}}>
                        {example}
                      </div>
                      </div>
                      <div style={{borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 8, marginBottom: 6}}>
                        <span style={{fontWeight: 'bold', color: '#374151'}}>Grammatical role</span>
                      <div style={{color: '#6b7280', fontSize: '1rem', marginTop: 2}}>
                        {grammar}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
      
      {/* Kelime kaydetme modalı */}
      <SaveWordModal 
        isOpen={showSaveModal} 
        onClose={() => setShowSaveModal(false)} 
        onSave={handleDirectSave}
        membershipType={userData?.membershipType || 'free'}
        savedWordsToday={savedWordsToday}
      />


      {/* Kelime kaydetme onayı */}
      {showConfirmation && (
        <WordConfirmation 
          word={selectedWord} 
          onConfirm={handleConfirmSave} 
          onCancel={() => setShowConfirmation(false)}
          currentUser={currentUser}
          router={router}
        />
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md mx-auto p-6 w-full shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
              <p className="text-gray-600 mb-6">
                Please log in to use this feature. You can save words, translate, and access more features after logging in.
              </p>
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setShowLoginPrompt(false)} 
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => router.push('/auth/login')} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kelime kaydetme limit modal'i */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md mx-auto p-6 w-full shadow-2xl transform transition-all">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">Daily Word Limit Reached</h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Free users can save only <span className="font-semibold text-yellow-600">3 words per day</span>. 
                Upgrade to Premium for unlimited word saving and access to all features.
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              
              {/* Buttons */}
              <div className="space-y-3">
                <Link href="/upgrade/premium">
                  <button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Upgrade to Premium
                    </span>
                  </button>
                </Link>
                
                <button 
                  onClick={() => setShowLimitModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Continue Reading
                </button>
              </div>
              
              {/* Benefits */}
              <div className="mt-6 text-left">
                <p className="text-sm font-semibold text-gray-700 mb-2">Premium Benefits:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited word saving
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Access to all story levels (B1-C2)
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited translations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 