import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-blue-500">Readung</span>
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

    onSave({ word, translation, notes, timestamp: new Date().toISOString() });
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
  const contentRef = useRef(null);
  const { currentUser, getUserData } = useAuth();
  
  // Çeviri işlemleri için yeni state değişkenleri
  const [selectedWordForTranslation, setSelectedWordForTranslation] = useState('');
  const [showTranslateButton, setShowTranslateButton] = useState(false);
  const [translatedWord, setTranslatedWord] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationPosition, setTranslationPosition] = useState({ x: 0, y: 0 });

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
        
        setUserData(userDataResult);
        
        // Günlük kelime kayıt sayısını belirle
        const today = new Date().toDateString();
        const lastSaveDate = userDataResult.lastWordSaveDate || '';
        
        if (lastSaveDate === today) {
          setSavedWordsToday(userDataResult.savedWordsToday || 0);
        } else {
          setSavedWordsToday(0);
        }
        
        // Ücretsiz kullanıcı B1 ve üzeri seviyelere erişemez
        if (userDataResult.membershipType === 'free') {
          // Hikayeyi kontrol et
          const storyDoc = await getDoc(doc(db, "stories", id));
          
          if (storyDoc.exists()) {
            const storyData = storyDoc.data();
            if (['b1', 'b2', 'c1', 'c2'].includes(storyData.level)) {
              alert('This level is only available for premium members');
              router.push('/home');
              return;
            }
          }
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

  // Kelimeye çift tıklama ile kaydetme modalı aç (timer iptal)
  const handleWordDoubleClick = (e, word) => {
    e.preventDefault();
    if (clickTimer) clearTimeout(clickTimer);
    setSelectedWord(word);
    setShowConfirmation(true);
  };

  // Çevir butonuna tıklandığında çağrılacak fonksiyon
  const handleTranslate = async () => {
    if (!selectedWordForTranslation) return;
    
    setTranslationLoading(true);
    setShowTranslateButton(false);
    setShowTranslation(true);
    
    try {
      // ChatGPT API ile çeviri yap
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional German-to-English translator.\n\nWhen given a German word and its surrounding sentence, return:\n- The most accurate meaning of the word based on the context,\n- A short explanation of the word if necessary,\n- Other possible translations if there are multiple meanings,\n- A simple English example sentence using the translated word.\n- Explain the grammatical role of the selected word within the sentence.\nOutput it cleanly and clearly, maximum 4-5 lines.`
            },
            {
              role: 'user',
              content: `Word: "${selectedWordForTranslation}"\nSentence: "${story?.content || ''}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 120
        })
      });

      const data = await response.json();
      if (!data.choices || !data.choices[0]) {
        setTranslatedWord('API limitine ulaşıldı veya başka bir hata oluştu.');
        return;
      }
      const translation = data.choices[0].message?.content?.trim();
      setTranslatedWord(translation || 'Translation not available');
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedWord('Error translating word');
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

  // Kelime kaydetme onayı
  const handleConfirmSave = () => {
    setShowConfirmation(false);
    setShowSaveModal(true);
  };

  // Kelime kaydetme
  const handleSaveWord = async (wordData) => {
    if (!currentUser || !userData) return;
    
    try {
      // Kullanıcı dökümanına kelimeyi ekle
      const userRef = doc(db, "users", currentUser.uid);
      
      // Kaydedilen kelimeleri güncelle
      await updateDoc(userRef, {
        savedWords: arrayUnion({
          ...wordData,
          timestamp: Timestamp.now()
        }),
        savedWordsToday: savedWordsToday + 1,
        lastWordSaveDate: new Date().toDateString()
      });
      
      // Yerel sayacı güncelle
      setSavedWordsToday(savedWordsToday + 1);
      
      alert('Word saved successfully!');
    } catch (error) {
      console.error("Error saving word:", error);
      alert('Failed to save word');
    }
  };

  // Kelime kaydetme modalını aç
  const openSaveWordModal = () => {
    // Ücretsiz kullanıcı günlük kelime limiti kontrolü
    if (userData.membershipType === 'free' && savedWordsToday >= 3) {
      alert('Free users can save only 3 words per day. Upgrade to Premium for unlimited word saving.');
      return;
    }
    
    setShowSaveModal(true);
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

  // Geri dönme
  const handleGoBack = () => {
    const storyLevel = story?.level || 'a1';
    router.push(`/stories/${storyLevel}`);
  };

  // Çeviri kutusu pozisyonunu dinamik ayarla
  const getTranslationBoxPosition = () => {
    const boxHeight = 260; // tahmini yükseklik (px)
    const padding = 16;
    let top = translationPosition.y + 40;
    if (typeof window !== 'undefined' && (top + boxHeight + padding > window.innerHeight)) {
      // Ekranın altına taşarsa yukarıda göster
      top = translationPosition.y - boxHeight - 10;
      if (top < 0) top = 10; // çok yukarı gitmesin
    }
    return { left: translationPosition.x, top };
  };

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
          
          <div className="flex justify-center mb-6">
            <button 
              onClick={openSaveWordModal} 
              className="btn btn-secondary"
            >
              Add Word to Vocabulary
            </button>
          </div>
        </div>
      </main>
      
      {/* Çeviri butonu */}
      {showTranslateButton && (
        <div 
          className="translation-button fixed bg-blue-600 text-white px-3 py-1 rounded-md shadow-md cursor-pointer z-50 hover:bg-blue-700"
          style={{ 
            left: `${translationPosition.x}px`, 
            top: `${translationPosition.y + 10}px` 
          }}
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
          <div className="text-sm font-medium mb-2">{selectedWordForTranslation}</div>
          {translationLoading ? (
            <div className="mt-1 text-gray-600 flex items-center">
              <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Çevriliyor...
            </div>
          ) : (
            <div className="mt-1" style={{lineHeight: '1.7'}}>
              {(() => {
                // Bölümleri ayır
                const meaningMatch = translatedWord.match(/Meaning:(.*?)(Explanation:|Example sentence:|Other possible translation:|$)/s);
                const explanationMatch = translatedWord.match(/Explanation:(.*?)(Example sentence:|Other possible translation:|$)/s);
                const exampleMatch = translatedWord.match(/Example sentence:(.*?)(Other possible translation:|$)/s);
                const otherMatch = translatedWord.match(/Other possible translation:(.*)/s);
                const grammarMatch = translatedWord.match(/Grammatical role:(.*?)(Meaning:|Explanation:|Example sentence:|Other possible translation:|$)/s);
                return (
                  <>
                    {meaningMatch && (
                      <div style={{fontWeight: 'bold', color: '#374151', fontSize: '1.1rem', marginBottom: 6}}>
                        Meaning
                        <div style={{fontWeight: 'normal', color: '#6b7280', fontSize: '1rem', marginTop: 2}}>{meaningMatch[1]?.trim()}</div>
                      </div>
                    )}
                    {explanationMatch && (
                      <div style={{borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 8, marginBottom: 6}}>
                        <span style={{fontWeight: 'bold', color: '#374151'}}>Explanation</span>
                        <div style={{color: '#6b7280', fontSize: '1rem', marginTop: 2}}>{explanationMatch[1]?.trim()}</div>
                      </div>
                    )}
                    {exampleMatch && (
                      <div style={{borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 8}}>
                        <span style={{fontWeight: 'bold', color: '#374151'}}>Example sentence</span>
                        <div style={{color: '#3B82F6', fontStyle: 'italic', fontSize: '1rem', marginTop: 2}}>{exampleMatch[1]?.trim()}</div>
                      </div>
                    )}
                    {otherMatch && (
                      <div style={{borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 8}}>
                        <span style={{fontWeight: 'bold', color: '#374151'}}>Other possible translation</span>
                        <div style={{color: '#6b7280', fontSize: '1rem', marginTop: 2}}>{otherMatch[1]?.trim()}</div>
                      </div>
                    )}
                    {grammarMatch && (
                      <div style={{borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 8, marginBottom: 6}}>
                        <span style={{fontWeight: 'bold', color: '#374151'}}>Grammatical role</span>
                        <div style={{color: '#6b7280', fontSize: '1rem', marginTop: 2}}>{grammarMatch[1]?.trim()}</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
      
      {/* Kelime kaydetme onay kutusu */}
      {showConfirmation && (
        <WordConfirmation 
          word={selectedWord} 
          onConfirm={handleConfirmSave} 
          onCancel={() => setShowConfirmation(false)} 
        />
      )}
      
      {/* Kelime kaydetme modalı */}
      <SaveWordModal 
        isOpen={showSaveModal} 
        onClose={() => setShowSaveModal(false)} 
        onSave={handleSaveWord}
        membershipType={userData?.membershipType || 'free'}
        savedWordsToday={savedWordsToday}
      />
    </div>
  );
} 