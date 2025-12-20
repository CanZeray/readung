import { auth } from '../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Firebase Auth token doğrulama - opsiyonel, auth yoksa ya da token yoksa yine de devam et
    let userId = null;
    const authHeader = req.headers.authorization;
    if (auth && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (err) {
        console.error('Auth verification failed, proceeding without userId:', err);
      }
    } else {
      if (!auth) {
        console.warn('Firebase admin not initialized, proceeding without userId');
      } else {
        console.warn('No auth token provided, proceeding without userId');
      }
    }

    const { word, context, targetLanguage = 'english' } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }
    
    // Target language'a göre çeviri dili belirle
    const isTurkish = targetLanguage === 'turkish';
    const targetLang = isTurkish ? 'Turkish' : 'English';
    
    console.log('Translation request - Word:', word, 'Target Language:', targetLanguage, 'isTurkish:', isTurkish);

    // OpenAI API key - sadece server-side key kullan (NEXT_PUBLIC fallback yok, güvenlik için)
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('Translation API called for word:', word, 'API key exists:', !!apiKey, 'env:', process.env.NODE_ENV);

    // OpenAI API key kontrol et
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in server environment variables');
      console.error('Set OPENAI_API_KEY in Vercel Project -> Settings -> Environment Variables (Production). NEXT_PUBLIC_OPENAI_API_KEY is not used.');
      return res.status(500).json({ 
        error: 'Translation service not configured',
        translation: `
Meaning: Service unavailable
Explanation: Translation service is not properly configured on the server.
Example sentence: Not available
Grammatical role: Not available
        `.trim()
      });
    }

    // OpenAI API'ye istek at
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: isTurkish ? `
Sen profesyonel bir Almanca-Türkçe çevirmenisin. ÇEVİRİLERİNİ MUTLAKA TÜRKÇE YAP.

Bir Almanca kelime ve çevresindeki cümle verildiğinde, şunu TÜRKÇE olarak döndür:

Anlam: (1-2 kelimede en doğru TÜRKÇE anlam)
Açıklama: (kısa bir TÜRKÇE açıklama, maksimum 2 cümle - TÜMÜ TÜRKÇE OLMALI)
Örnek cümle: (KELİMENİN ANLAMINI KULLANARAK HER ZAMAN TÜRKÇE bir cümle ver, gerekirse UYDUR - CÜMLE TAMAMEN TÜRKÇE OLMALI)
Gramer rolü: (HER ZAMAN tam, spesifik, bağlam temelli bir TÜRKÇE gramer açıklaması ver. ASLA "yukarıdaki açıklamaya bakın" deme, ASLA sadece "isim" veya "fiil" yazma. Cümledeki gramer fonksiyonunu her zaman TÜRKÇE olarak açıkla, detay icat etmen gerekse bile. Gramer rolü bölümünü atlarsan, başlığı tekrarla ve 'Mevcut değil' yaz. Açıklama ile birleştirme. Her zaman başlığı kullan.)

ÖNEMLİ: 
1. Tüm başlıkları İngilizce değil TÜRKÇE kullan: "Anlam:", "Açıklama:", "Örnek cümle:", "Gramer rolü:"
2. TÜM içerik TÜRKÇE olmalı - hiçbir İngilizce kelime veya cümle kullanma
3. Anlam, Açıklama, Örnek cümle ve Gramer rolü bölümlerinin TAMAMI TÜRKÇE olmalı

Her zaman TÜM bu bölümleri TÜRKÇE olarak çıktıla, ne olursa olsun.
Veri yoksa, o bölümün altına "Mevcut değil" yaz — bölümleri asla atlama veya birleştirme.

Çevredeki cümle eksikse veya yardımcı olmuyorsa, örnek cümleyi oluşturmak için kendin basit bir bağlam UYDUR.

Her bölümü açık, kısa ve tutarlı tut. UNUTMA: HER ŞEY TÜRKÇE OLMALI!
` : `
You are a professional German-to-English translator and grammar expert.

When given a German word and its surrounding sentence, return ALL of the following sections in this EXACT format:

Word type: (ONE word only: noun, verb, adjective, adverb, pronoun, preposition, conjunction, article, or other)
Meaning: (the most accurate meaning in 1-2 words)
Explanation: (a short explanation, maximum 2 sentences)
Grammatical function: (the grammatical function in the sentence: subject, object, predicate, attribute, adverbial, etc. If not applicable, write "Not applicable")
Tense: (ONLY for verbs: present, past, perfect, pluperfect, future, conditional, etc. For non-verbs, write "Not applicable")
Conjugation/Inflection: (explain the word's conjugation or inflection. Examples: "gehen → past participle: gegangen", "ihnen + dem → ihnen", "der → dative masculine: dem". If not applicable, write "Not applicable")
Example sentence: (ALWAYS provide a SIMPLE German sentence using the word, even if you have to MAKE ONE UP)
Example translation: (the English translation of the example sentence above)

CRITICAL RULES:
1. ALWAYS output ALL sections in the exact order above
2. Word type must be exactly ONE word from the list: noun, verb, adjective, adverb, pronoun, preposition, conjunction, article, other
3. For Tense: only fill if it's a verb, otherwise write "Not applicable"
4. For Conjugation/Inflection: provide specific examples like "gehen → v3: gegangen" or "der → dative: dem"
5. Example sentence must be SIMPLE and in German
6. Example translation must be the English translation of the example sentence
7. If any section has no data, write "Not available" (except Tense and Conjugation which use "Not applicable" when not relevant)
8. NEVER skip sections or merge them together
9. Keep each section clear, short, and consistent

Format example:
Word type: verb
Meaning: to go
Explanation: A common verb meaning to move from one place to another.
Grammatical function: predicate
Tense: present
Conjugation/Inflection: gehen → past participle: gegangen, 3rd person singular present: geht
Example sentence: Ich gehe zur Schule.
Example translation: I go to school.
`
          },
          {
            role: 'user',
            content: `Word: "${word}"\nSentence: "${context || ''}"`
          }
        ],
        temperature: 0.4,
        max_tokens: 250
      })
    });

    console.log('OpenAI API Response Status:', response.status);

    if (!response.ok) {
      console.error('OpenAI API Error:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      
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
      
      return res.status(500).json({
        error: 'Translation failed',
        translation: `
Meaning: Service error
Explanation: ${errorMessage}
Example sentence: Not available
Grammatical role: Not available
        `.trim()
      });
    }

    const data = await response.json();
    console.log('OpenAI Success Response received');

    const translation = data.choices?.[0]?.message?.content?.trim() || '';
    
    if (!translation) {
      return res.status(500).json({
        error: 'Empty translation response',
        translation: `
Meaning: Translation failed
Explanation: Empty response from translation service
Example sentence: Not available
Grammatical role: Not available
        `.trim()
      });
    }

    return res.status(200).json({
      success: true,
      translation: translation,
      word: word
    });

  } catch (error) {
    console.error('Translation API Error:', error);
    
    let errorMessage = 'Unknown translation error';
    if (error.message.includes('fetch')) {
      errorMessage = 'Network connection error to translation service';
    } else if (error.message.includes('JSON')) {
      errorMessage = 'Invalid response from translation service';
    } else if (error.name === 'FirebaseAuthError') {
      errorMessage = 'Authentication failed';
    }
    
    return res.status(500).json({
      error: 'Translation failed',
      translation: `
Meaning: Error occurred
Explanation: ${errorMessage}
Example sentence: Not available
Grammatical role: Not available
      `.trim()
    });
  }
}