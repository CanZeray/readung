import Stripe from 'stripe';

// Stripe anahtarını kontrol et
const stripeKey = process.env.STRIPE_SECRET_KEY;
console.log('Stripe Key Check:', {
  exists: !!stripeKey,
  isTestMode: stripeKey?.startsWith('sk_test_'),
  keyStart: stripeKey?.substring(0, 10) + '...'
});

if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

if (!stripeKey.startsWith('sk_test_')) {
  throw new Error('Please use Stripe TEST mode API keys');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
  typescript: true
});

// Test modu price ID'leri
const PRODUCTS = {
  monthly: 'price_1RRYGgKSJSLdtZ64XK8Vyd0Z',
  annual: 'price_1RRYJ8KSJSLdtZ64wGt3pDPq'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, userId, userEmail } = req.body;
    
    // Gelen verileri kontrol et
    console.log('Request validation:', {
      hasPlan: !!plan,
      hasUserId: !!userId,
      hasEmail: !!userEmail,
      requestedPlan: plan
    });
    
    if (!plan || !userId || !userEmail) {
      console.error('Missing required fields:', { plan, userId, userEmail });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const priceId = PRODUCTS[plan];
    console.log('Price lookup:', { plan, priceId, availablePlans: Object.keys(PRODUCTS) });

    if (!priceId) {
      console.error('Invalid plan:', plan);
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Checkout session oluştur
    console.log('Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      locale: 'en',
      metadata: {
        userId: userId
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile`,
      custom_text: {
        submit: {
          message: 'By subscribing, you agree to our Terms of Service and authorize Readung to charge your account according to your selected plan.'
        }
      }
    });

    console.log('Checkout session created successfully:', { sessionId: session.id });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    // Detaylı hata bilgisi
    console.error('Checkout session error:', {
      name: error.name,
      message: error.message,
      type: error.type,
      code: error.code,
      requestId: error.requestId,
      statusCode: error.statusCode,
      raw: error
    });

    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message,
      code: error.code,
      type: error.type
    });
  }
} 