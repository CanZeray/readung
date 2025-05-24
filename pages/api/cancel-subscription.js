import Stripe from 'stripe';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../../lib/firebase-admin';

// Stripe anahtarını kontrol et
const stripeKey = process.env.STRIPE_SECRET_KEY;
console.log('Cancel Subscription - Stripe Key Check:', {
  exists: !!stripeKey,
  isTestMode: stripeKey?.startsWith('sk_test_'),
  keyStart: stripeKey?.substring(0, 10) + '...'
});

if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(stripeKey);

export default async function handler(req, res) {
  console.log('Cancel subscription request received:', {
    method: req.method,
    headers: Object.keys(req.headers),
    hasAuth: !!req.headers.authorization,
    firebaseAdminAvailable: !!auth
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Firebase admin yoksa hata döndür
    if (!auth) {
      console.error('Firebase admin not initialized - missing credentials');
      return res.status(500).json({ 
        error: 'Server configuration error - Firebase admin not available',
        details: 'Missing Firebase credentials'
      });
    }

    // Firebase token'dan kullanıcı bilgisini al
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token received:', token.substring(0, 20) + '...');
    
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log('User ID:', userId);

    // Firestore'dan kullanıcı bilgilerini al
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('User document not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    console.log('User data structure:', {
      hasSubscriptionId: !!userData.subscriptionId,
      hasSubscriptionObject: !!userData.subscription,
      subscriptionId: userData.subscriptionId,
      subscriptionObjectId: userData.subscription?.id,
      membershipType: userData.membershipType
    });
    
    // Subscription bilgisini kontrol et
    if (!userData.subscriptionId && !userData.subscription?.id) {
      console.log('No subscription found in user data');
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const subscriptionId = userData.subscriptionId || userData.subscription?.id;
    console.log('Using subscription ID:', subscriptionId);

    // Test subscription ID kontrolü - gerçek Stripe isteği yapmadan mock response döndür
    if (subscriptionId && subscriptionId.startsWith('sub_test_')) {
      console.log('Test subscription detected, returning mock response');
      
      // Test subscription için Firebase dokümanını güncelle
      try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
          membershipType: 'basic',
          subscriptionId: null,
          subscription: null,
          cancelledAt: new Date().toISOString()
        });
        
        console.log('Test user membership updated to basic');
      } catch (updateError) {
        console.error('Error updating test user membership:', updateError);
      }
      
      // Mock successful cancellation response
      const mockCancelDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 gün sonra
      
      return res.json({
        message: 'Your subscription will be canceled at the end of the billing period',
        cancelDate: mockCancelDate.toISOString(),
        status: 'active',
        isTestMode: true
      });
    }

    // Önce Stripe'da subscription'ı kontrol et
    let existingSubscription;
    try {
      existingSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log('Existing subscription status:', existingSubscription.status);
      
      if (existingSubscription.status === 'canceled') {
        return res.status(400).json({ error: 'Subscription is already canceled' });
      }
      
      if (existingSubscription.cancel_at_period_end) {
        return res.status(400).json({ error: 'Subscription is already set to cancel at period end' });
      }
    } catch (stripeError) {
      console.error('Stripe subscription retrieve error:', stripeError);
      return res.status(400).json({ error: 'Subscription not found in Stripe' });
    }

    // Stripe'da aboneliği iptal et
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    console.log('Subscription canceled successfully:', {
      id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end
    });

    res.json({
      message: 'Subscription will be canceled at the end of the billing period',
      cancelDate: new Date(subscription.current_period_end * 1000).toISOString(),
      status: subscription.status
    });
  } catch (error) {
    console.error('Cancel subscription error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    });
    
    // More specific error messages
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token. Please login again.' });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid subscription. It may already be canceled.' });
    }
    
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message,
      code: error.code
    });
  }
} 