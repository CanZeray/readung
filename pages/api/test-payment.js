export default async function handler(req, res) {
  // CORS headers ekle
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS request için
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST method is allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    const { plan, userId, userEmail } = req.body;
    
    console.log('Test payment request:', { plan, userId, userEmail });
    
    // Environment variables kontrol et
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const hasStripeKey = !!stripeKey;
    
    return res.status(200).json({ 
      success: true,
      message: 'Test payment endpoint working',
      data: {
        plan,
        userId,
        userEmail,
        hasStripeKey,
        stripeKeyStart: stripeKey ? stripeKey.substring(0, 10) + '...' : 'Not found'
      }
    });
  } catch (error) {
    console.error('Test payment error:', error);
    return res.status(500).json({ 
      error: 'Test payment failed',
      details: error.message
    });
  }
} 