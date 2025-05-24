import { adminAuth, adminDb } from '../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Firebase Auth token doğrulama
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { word, context } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    console.log('Translation API called for word:', word);

    // OpenAI API key kontrol et
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found');
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
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `
You are a professional German-to-English translator.

When given a German word and its surrounding sentence, return:

Meaning: (the most accurate meaning in 1-2 words)
Explanation: (a short explanation, maximum 2 sentences)
Example sentence: (ALWAYS provide an ENGLISH sentence using the meaning of the word, even if you have to MAKE ONE UP)
Grammatical role: (ALWAYS give a full, specific, context-based grammatical explanation. NEVER say "see explanation above", NEVER just write "noun" or "verb". Always explain the grammatical function in the sentence, even if you have to invent details. If you skip the grammatical role section, repeat the header and write 'Not available'. Never merge with explanation. Always use the header.)

Always output ALL of these sections, no matter what.
If no data is available, write "Not available" under that section — never skip or merge sections.

If the surrounding sentence is missing or does not help, INVENT a simple context yourself to create the example sentence.

Keep each section clear, short, and consistent.
`
          },
          {
            role: 'user',
            content: `Word: "${word}"\nSentence: "${context || ''}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 120
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