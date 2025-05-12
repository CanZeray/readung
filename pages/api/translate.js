// API endpoint for secure OpenAI API calls
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word, context } = req.body;

    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    // Call OpenAI API
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

When given ANY German word (including prepositions, articles, conjunctions, pronouns, particles, proper names, etc.) and its surrounding sentence, return:

Meaning: (the most accurate meaning in 1-2 words)
Explanation: (a short explanation, maximum 2 sentences)
Example sentence: (ALWAYS provide an ENGLISH sentence using the meaning of the word, even if you have to MAKE ONE UP)
Grammatical role: (ALWAYS give a full, specific, context-based grammatical explanation. NEVER say "see explanation above", NEVER just write "noun" or "verb". Always explain the grammatical function in the sentence, even if you have to invent details. If you skip the grammatical role section, repeat the header and write 'Not available'. Never merge with explanation. Always use the header.)

Always output ALL of these sections, no matter what.
If no data is available, write "Not available" under that section — never skip or merge sections.

VERY IMPORTANT: Even simple words like "zu", "und", "ein", "das", etc. MUST be translated properly. Never respond with "not available".

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
        max_tokens: 150
      })
    });

    const data = await response.json();
    
    // Error handling
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return res.status(500).json({ error: data.error.message || 'Translation failed' });
    }
    
    // Extract translation
    const translatedWord = data.choices?.[0]?.message?.content?.trim() || '';
    
    return res.status(200).json({ translation: translatedWord, raw: data });
  } catch (error) {
    console.error('Translation API error:', error);
    return res.status(500).json({ error: 'Translation failed' });
  }
} 