import Stripe from 'stripe';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../../lib/firebase-admin';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
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
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log('Reactivate subscription - User ID:', userId);

    // Firestore'dan kullanıcı bilgilerini al
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('User document not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const subscriptionId = userData.subscriptionId || userData.subscription?.id;

    if (!subscriptionId) {
      return res.status(400).json({ 
        error: 'No active subscription found',
        message: 'You do not have an active subscription to reactivate. Please create a new subscription.'
      });
    }

    // Stripe'da subscription'ı kontrol et
    let existingSubscription;
    try {
      existingSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log('Existing subscription:', {
        id: existingSubscription.id,
        status: existingSubscription.status,
        cancel_at_period_end: existingSubscription.cancel_at_period_end,
        current_period_end: existingSubscription.current_period_end
      });
    } catch (stripeError) {
      console.error('Stripe subscription retrieve error:', stripeError);
      return res.status(400).json({ error: 'Subscription not found in Stripe' });
    }

    // Subscription zaten aktif ve cancel_at_period_end false ise
    if (existingSubscription.status === 'active' && !existingSubscription.cancel_at_period_end) {
      return res.status(400).json({ 
        error: 'Subscription is already active',
        message: 'Your subscription is already active and not scheduled for cancellation.'
      });
    }

    // Subscription zaten tamamen iptal edilmişse
    if (existingSubscription.status === 'canceled') {
      return res.status(400).json({ 
        error: 'Subscription is already canceled',
        message: 'This subscription has been canceled. Please create a new subscription.'
      });
    }

    // Reactivate: cancel_at_period_end'i false yap
    if (existingSubscription.cancel_at_period_end) {
      const reactivatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      console.log('Subscription reactivated successfully:', {
        id: reactivatedSubscription.id,
        status: reactivatedSubscription.status,
        cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
        current_period_end: reactivatedSubscription.current_period_end
      });

      // Firestore'da güncelle
      try {
        await updateDoc(userRef, {
          cancelledAt: null, // İptal tarihini temizle
          subscription: {
            ...userData.subscription,
            cancel_at_period_end: false,
            status: 'active',
            current_period_end: new Date(reactivatedSubscription.current_period_end * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        });
        console.log('User subscription reactivated in Firestore successfully');
      } catch (updateError) {
        console.error('Error updating Firestore:', updateError);
      }

      res.json({
        message: 'Subscription reactivated successfully',
        status: reactivatedSubscription.status,
        cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
        current_period_end: new Date(reactivatedSubscription.current_period_end * 1000).toISOString()
      });
    } else {
      return res.status(400).json({ 
        error: 'Subscription cannot be reactivated',
        message: 'This subscription is not scheduled for cancellation.'
      });
    }
  } catch (error) {
    console.error('Reactivate subscription error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack
    });
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token. Please login again.' });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid subscription. It may have been canceled.' });
    }
    
    res.status(500).json({ 
      error: 'Failed to reactivate subscription',
      details: error.message,
      code: error.code
    });
  }
}

