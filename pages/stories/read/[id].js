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
        <Link href="/home" className="text-xl font-bold flex items-center">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-blue-500">Readung</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="hover:text-gray-300">
            <span>Profile</span>
          </Link>
          <button onClick={handleLogout} className="hover:text-gray-300">
            Logout
          </button>
        </div>
      </div>
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
        
        {membershipType === 'free' && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold">Free account: {3 - savedWordsToday} words remaining today</p>
            {savedWordsToday >= 3 && (
              <p className="text-primary mt-1">
                <Link href="/upgrade" className="hover:underline">Upgrade to Premium</Link> for unlimited word saving
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
const WordConfirmation = ({ word, onConfirm, onCancel }) => {
  if (!word) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 w-full max-w-sm">
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
  
  // Çeviri limiti için yeni state'ler
  const [translationsToday, setTranslationsToday] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);

  // Tek/çift tıklama çakışmasını önlemek için timer
  let clickTimer = null;

  useEffect(() => {
    if (!currentUser || !id) return;
    
    async function loadStoryAndUserData() {
      try {
        setLoading(true);
        
        // Kullanıcı verilerini getir
        const userDataResult = await getUserData();
        if (!userDataResult) {
          router.push('/auth/login');
          return;
        }
        
        // Eğer viewedTranslations alanı yoksa, boş dizi olarak ekle
        if (!userDataResult.viewedTranslations) {
          userDataResult.viewedTranslations = [];
          
          // Veritabanını güncelle
          await updateDoc(doc(db, "users", currentUser.uid), {
            viewedTranslations: []
          });
        }
        
        setUserData(userDataResult);
        
        // Günlük kelime kayıt ve çeviri sayısını belirle
        const today = new Date().toDateString();
        const lastSaveDate = userDataResult.lastWordSaveDate || '';
        const lastTranslationDate = userDataResult.lastTranslationDate || '';
        
        if (lastSaveDate === today) {
          setSavedWordsToday(userDataResult.savedWordsToday || 0);
        } else {
          setSavedWordsToday(0);
        }
        
        if (lastTranslationDate === today) {
          setTranslationsToday(userDataResult.translationsToday || 0);
        } else {
          setTranslationsToday(0);
          
          // Günlük çeviri sayısını sıfırla
          if (userDataResult.translationsToday > 0) {
            await updateDoc(doc(db, "users", currentUser.uid), {
              translationsToday: 0,
              lastTranslationDate: today
            });
          }
        }
        
        // Ücretsiz kullanıcı B1 ve üzeri seviyelere erişemez
        if (userDataResult.membershipType !== 'premium') {
          // Örnek hikaye kontrolü
          if (!id.startsWith('sample-')) {
          // Hikayeyi kontrol et
          const storyDoc = await getDoc(doc(db, "stories", id));
          
          if (storyDoc.exists()) {
            const storyData = storyDoc.data();
              const storyLevel = storyData.level?.toLowerCase() || '';
              if (['b1', 'b2', 'c1', 'c2'].includes(storyLevel)) {
              alert('This level is only available for premium members');
              router.push('/home');
              return;
              }
            }
          }
        }
        
        // Kullanıcının tamamladığı hikayeleri kontrol et
        const completedStories = userDataResult.completedStories || [];
        if (completedStories.includes(id)) {
          setCompleted(true);
        }
        
        // Hikayeyi Firestore'dan getir
        const storySnapshot = await getDoc(doc(db, "stories", id));
        
        if (storySnapshot.exists()) {
          setStory({
            id: storySnapshot.id,
            ...storySnapshot.data()
          });
          
          // Kullanıcının okuduğu hikaye sayısını güncelle
          if (userDataResult.membershipType === 'free') {
            const today = new Date().toDateString();
            
            // Eğer bugün ilk kez hikaye okuyorsa
            if (userDataResult.lastReadDate !== today) {
              // Kullanıcı verilerini güncelle
              await updateDoc(doc(db, "users", currentUser.uid), {
                storiesRead: 1,
                lastReadDate: today
              });
            }
          }
        } else {
          alert('Story not found');
          router.push('/home');
        }
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
      setTranslationPosition({
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY
      });
      setShowTranslateButton(true);
    }, 200); // 200ms gecikme ile tek tık
  };

  // Kelimeye çift tıklama ile kaydetme modalı aç
  const handleWordDoubleClick = (e, word) => {
    e.preventDefault();
    if (clickTimer) clearTimeout(clickTimer);
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
    if (userData.membershipType === 'free' && savedWordsToday >= 3) {
      alert('Free users can save only 3 words per day. Upgrade to Premium for unlimited word saving.');
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
      // Ücretsiz kullanıcılar için çeviri limiti kontrolü (önce kontrol et)
      if (userData.membershipType === 'free' && translationsToday >= 10) {
        setShowAdModal(true);
        setTranslationLoading(false);
        return;
      }
      
      setShowTranslation(true);
      
      // Çeviri veritabanında arama yap
      const translationsRef = collection(db, "translations");
      const q = query(translationsRef, where("original", "==", selectedWordForTranslation));
      const querySnapshot = await getDocs(q);
      
      // Kullanıcının daha önce gördüğü çevirileri kontrol et
      const userViewedTranslations = userData.viewedTranslations || [];
      const hasSeenTranslation = userViewedTranslations.includes(selectedWordForTranslation);
      
      // Çeviri veritabanında var mı kontrol et
      if (!querySnapshot.empty) {
        const existingTranslation = querySnapshot.docs[0].data();
        setTranslatedWord(existingTranslation.translation);
        
        // Eğer kullanıcı bu çeviriyi daha önce görmemişse limit artır
        if (!hasSeenTranslation && userData.membershipType === 'free') {
          const newTranslationsToday = translationsToday + 1;
          setTranslationsToday(newTranslationsToday);
          
          // Kullanıcının gördüğü çeviriler listesine ekle
          const updatedViewedTranslations = [...userViewedTranslations, selectedWordForTranslation];
          
          // Veritabanını güncelle
          await updateDoc(doc(db, "users", currentUser.uid), {
            translationsToday: newTranslationsToday,
            lastTranslationDate: new Date().toDateString(),
            viewedTranslations: updatedViewedTranslations
          });
          
          // Yerel state'i güncelle
          const updatedUserData = { ...userData, viewedTranslations: updatedViewedTranslations };
          setUserData(updatedUserData);
        }
      } else {
        // Kelime daha önce çevrilmemişse - ChatGPT API ile çeviri yap
        console.log("Çevirisi yapılacak kelime:", selectedWordForTranslation);
        
        // Backend API'si üzerinden çeviri yap
        const idToken = await currentUser.getIdToken();
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            word: selectedWordForTranslation,
            context: story?.content || ''
          })
        });

        console.log("API Response Status:", response.status);
        
        if (!response.ok) {
          console.error("API Response Error:", response.status, response.statusText);
          const errorData = await response.json();
          console.error("Error details:", errorData);
          
          setTranslatedWord(errorData.translation || `
Meaning: Service error
Explanation: Translation service error (${response.status})
Example sentence: Not available  
Grammatical role: Not available
          `);
          setTranslationLoading(false);
          return;
        }

        const data = await response.json();
        console.log("API ham yanıt:", data);

        // Backend API'den gelen çeviri
        const translatedWord = data.translation?.trim() || '';
        console.log("Çeviri metni:", translatedWord);
        
        // Çeviri başarılı mı kontrol et
        if (!translatedWord || 
            translatedWord.includes('Service error') ||
            translatedWord.includes('Translation failed') ||
            translatedWord.includes('Error occurred') ||
            translatedWord.includes('Not available')) {
          setTranslatedWord(`
Meaning: Translation failed
Explanation: Empty or invalid response from translation service
Example sentence: Not available
Grammatical role: Not available
          `);
          setTranslationLoading(false);
          return;
        }

        // Çeviriyi veritabanına kaydet - SADECE BAŞARILI ÇEVIRILER
        await addDoc(collection(db, "translations"), {
          original: selectedWordForTranslation,
          translation: translatedWord,
          context: story?.content || '',
          timestamp: Timestamp.now()
        });
        
        // Yeni çeviri için her zaman limit artır ve listeye ekle (ücretsiz kullanıcılar için)
        if (userData.membershipType === 'free') {
          const newTranslationsToday = translationsToday + 1;
          setTranslationsToday(newTranslationsToday);
          
          // Kullanıcının gördüğü çeviriler listesine ekle
          const updatedViewedTranslations = [...userViewedTranslations, selectedWordForTranslation];
          
          // Veritabanını güncelle
          await updateDoc(doc(db, "users", currentUser.uid), {
            translationsToday: newTranslationsToday,
            lastTranslationDate: new Date().toDateString(),
            viewedTranslations: updatedViewedTranslations
          });
          
          // Yerel state'i güncelle
          const updatedUserData = { ...userData, viewedTranslations: updatedViewedTranslations };
          setUserData(updatedUserData);
        }
        
        // Çeviriyi state'e kaydet
        setTranslatedWord(translatedWord);
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

  // Reklam izleme fonksiyonu
  const handleWatchAd = async () => {
    setWatchingAd(true);
    
    // Gerçek bir reklam entegrasyonu yerine simülasyon yapıyoruz
    // Normalde burada AdMob, Unity Ads vb. reklam SDK'ları kullanılır
    setTimeout(async () => {
      setWatchingAd(false);
      setAdCompleted(true);
      
      // Kullanıcıya 10 çeviri hakkı daha ver
      await updateDoc(doc(db, "users", currentUser.uid), {
        translationsToday: 0 // veya 10 çeviriden devam etmesi için: translationsToday - 10
      });
      
      // State'i güncelle
      setTranslationsToday(0); // veya 10 çeviriden devam etmesi için: translationsToday - 10
      
      // 3 saniye sonra modal'ı kapat
      setTimeout(() => {
        setShowAdModal(false);
        setAdCompleted(false);
      }, 3000);
    }, 5000); // 5 saniyelik "reklam izleme" simülasyonu
  };

  // Reklam izleme modalını kapat
  const handleCloseAdModal = () => {
    setShowAdModal(false);
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
    const buttonHeight = 40;
    const buttonWidth = 100;
    let left = translationPosition.x;
    let top = translationPosition.y + 10;

    // Ekrandan taşmayı engelle
    if (typeof window !== 'undefined') {
      if (left + buttonWidth > window.innerWidth) {
        left = window.innerWidth - buttonWidth - 16;
      }
      if (top + buttonHeight > window.innerHeight) {
        top = translationPosition.y - buttonHeight - 10;
        if (top < 0) top = 10;
      }
    }
    return { left, top };
  };

  // Hikayeyi tamamlandı olarak işaretle
  const handleCompleteStory = async () => {
    try {
      if (!currentUser || !story) return;
      
      // Kullanıcının okuduğu hikayelerin listesine bu hikayeyi ekle
      const userRef = doc(db, "users", currentUser.uid);
      
      // Güncel kullanıcı verilerini al
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // Okunan hikayeler listesi
        const completedStories = userData.completedStories || [];
        
        // Hikaye zaten tamamlandıysa işlem yapma
        if (completedStories.includes(id)) {
          setCompleted(true);
          return;
        }
        
        // Hikayeyi tamamlandı olarak işaretle
        await updateDoc(userRef, {
          completedStories: arrayUnion(id),
          storiesRead: (userData.storiesRead || 0) + 1
        });
        
        setCompleted(true);
        
        // Başarılı mesaj göster
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
        notification.innerHTML = 'Congratulations! You have completed the story.';
        document.body.appendChild(notification);
        
        // 3 saniye sonra bildirim mesajını kaldır
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    } catch (error) {
      console.error("Error completing story:", error);
      alert('Hikaye tamamlanırken bir hata oluştu.');
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
            <button onClick={handleGoBack} className="btn btn-primary">
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
          className="flex items-center gap-2 text-[#60a5fa] hover:text-[#3b82f6] transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Stories
        </button>

        <div className="card">
          <h1 className="text-3xl font-bold mb-2">{story.title}</h1>
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
              {story.readTime} min read
            </span>
          </div>
          
          <div className="mb-4 p-4 rounded border border-[#cce7ff] bg-gradient-to-r from-blue-50 to-blue-50/70 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div>
              <h3 className="font-semibold mb-1">Reading Tip:</h3>
              <p>Double-click on any word to save it to your vocabulary!</p>
              <p className="mt-1">Long-press on any word to translate it!</p>
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
                        onDoubleClick={(e) => handleWordDoubleClick(e, word)}
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
              onClick={() => setShowSaveModal(true)} 
              className="btn btn-secondary"
            >
              Add Word to Vocabulary
            </button>
            
            <button 
              onClick={handleCompleteStory}
              disabled={completed}
              className={`px-5 py-2 rounded-lg shadow-md flex items-center justify-center font-medium transition-all ${
                completed ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'
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
          className="translation-button fixed bg-blue-600 text-white px-3 py-1 rounded-md shadow-md cursor-pointer z-50 hover:bg-blue-700"
          style={getTranslationButtonPosition()}
          onClick={handleTranslate}
        >
          Translate
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
            
            {/* Ücretsiz kullanıcılar için çeviri limiti göstergesi */}
            {userData && userData.membershipType === 'free' && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <span>Translations: {translationsToday}/10</span>
                {translationsToday >= 5 && (
                  <Link href="/upgrade/premium" className="ml-2 text-blue-600 hover:underline text-xs">
                    Upgrade to Premium
                  </Link>
                )}
              </div>
            )}
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
                // Meaning için esnek ve fallback
                let meaning = '';
                const meaningMatch = translatedWord.match(/Meaning:\s*([^\n]*)/i) 
                  || translatedWord.match(/Translation:\s*([^\n]*)/i);
                if (meaningMatch && meaningMatch[1]) {
                  meaning = meaningMatch[1].trim();
                } else {
                  meaning = 'Not available';
                }

                // Explanation
                let explanation = '';
                const explanationMatch = translatedWord.match(/Explanation:\s*([\s\S]*?)(Example sentence:|Grammatical role:|Grammatical function:|Grammar:|Function:|Role:|$)/i);
                explanation = explanationMatch && explanationMatch[1]?.trim() ? explanationMatch[1].trim() : 'Not available';

                // Example sentence için gelişmiş fallback
                let example = '';
                const exampleMatch = translatedWord.match(/Example sentence:\s*([\s\S]*?)(Grammatical role:|Grammatical function:|Grammar:|Function:|Role:|Meaning:|Explanation:|$)/i)
                  || translatedWord.match(/Example:\s*([\s\S]*?)(Grammatical role:|Grammatical function:|Grammar:|Function:|Role:|Meaning:|Explanation:|$)/i);

                if (exampleMatch && exampleMatch[1]?.trim()) {
                  example = exampleMatch[1].trim();
                } else {
                  if (explanationMatch && explanationMatch[1]) {
                    const quoteMatch = explanationMatch[1].match(/"([^"]+?)"/g);
                    if (quoteMatch) {
                      example = quoteMatch[0].replace(/"/g, '');
                    } else {
                      example = 'Not available';
                    }
                  } else {
                    example = 'Not available';
                  }
                }

                // Grammatical role için gelişmiş regex ve fallback
                let grammar = '';
                const grammarMatch = translatedWord.match(/Grammatical role:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|Grammatical function:|Grammar:|Function:|Role:|$)/i)
                  || translatedWord.match(/Grammatical function:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|Grammar:|Function:|Role:|$)/i)
                  || translatedWord.match(/Grammar:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|Function:|Role:|$)/i)
                  || translatedWord.match(/Function:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|Role:|$)/i)
                  || translatedWord.match(/Role:\s*([\s\S]*?)(Meaning:|Explanation:|Example sentence:|$)/i);
                if (grammarMatch && grammarMatch[1]?.trim()) {
                  grammar = grammarMatch[1].trim();
                  // Kısa veya tembel cevapları engelle
                  if (
                    grammar.toLowerCase().includes('see explanation above') ||
                    grammar.toLowerCase() === 'noun' ||
                    grammar.toLowerCase() === 'verb' ||
                    grammar.length < 15
                  ) {
                    grammar = '';
                  }
                }
                // Fallback: Explanation içinde gramatik bilgi ara
                if (!grammar) {
                  const lowerExp = explanation.toLowerCase();
                  if (lowerExp.includes('adverb')) grammar = 'Adverb (detected from explanation)';
                  else if (lowerExp.includes('verb')) grammar = 'Verb (detected from explanation)';
                  else if (lowerExp.includes('noun')) grammar = 'Noun (detected from explanation)';
                  else grammar = 'Not available';
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

      {/* Reklam İzleme Modalı */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md mx-auto p-6 w-full shadow-lg" style={{ maxWidth: '400px', borderRadius: '16px' }}>
            {!watchingAd && !adCompleted ? (
              <>
                <div className="flex items-center mb-4">
                  <span className="mr-2">🔒</span>
                  <h3 className="text-2xl font-bold text-gray-900">You've Reached Your Daily Limit</h3>
                </div>
                
                <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                
                <p className="mb-6 text-gray-600" style={{ lineHeight: '1.5', fontSize: '16px' }}>
                  You've reached your free daily translation limit (10 translations). Watch a short ad to unlock 10 more translations.
                </p>
                
                <button
                  onClick={handleWatchAd}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mb-3 font-medium"
                >
                  Watch Ad
                </button>
                
                <button
                  onClick={handleCloseAdModal}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg mb-4 font-medium"
                >
                  Cancel
                </button>
                
                <div className="text-center">
                  <Link href="/upgrade/premium" className="text-blue-600 hover:underline text-sm flex items-center justify-center">
                    <span>Go Premium for Unlimited Translations</span>
                    <span className="ml-1">💎</span>
                  </Link>
                </div>
              </>
            ) : watchingAd ? (
              <div className="text-center py-4">
                <svg className="animate-spin h-10 w-10 mx-auto text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="text-lg font-medium mb-2">Loading Ad</h3>
                <p className="text-gray-600">Please wait...</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Congratulations!</h3>
                <p className="text-gray-600">You've earned 10 more translations.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kelime kaydetme onayı */}
      {showConfirmation && (
        <WordConfirmation 
          word={selectedWord} 
          onConfirm={handleConfirmSave} 
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
} 