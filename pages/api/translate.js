import { Configuration, OpenAIApi } from 'openai';

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

    // API anahtarını güvenli şekilde kullan
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

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
            content: `You are a professional German-to-English translator. Analyze the given German word and provide:
            - Meaning: (English translation)
            - Explanation: (Brief explanation of usage)
            - Example sentence: (A simple German example)
            - Grammatical role: (Part of speech and grammatical details)`
          },
          {
            role: 'user',
            content: `Word: "${word}"${context ? `\nContext: "${context}"` : ''}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Translation failed');
    }

    const translation = data.choices[0].message.content.trim();

    return res.status(200).json({
      translation,
      raw: data
    });

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ 
      error: 'Translation failed', 
      message: error.message 
    });
  }
} 