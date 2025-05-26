import Stripe from 'stripe';
import { buffer } from 'micro';
import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Use environment variables for Stripe keys
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function updateUserSubscription(userId, status, subscriptionId = null) {
  try {
    console.log('Attempting to update user subscription:', { userId, status, subscriptionId });
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      console.log('User found in Firestore, updating membership...');
      const updateData = {
        membershipType: status === 'active' ? 'premium' : 'basic',
        subscription: status === 'active' ? {
          id: subscriptionId,
          status: 'active',
          updatedAt: new Date().toISOString()
        } : null
      };
      
      // Eğer subscriptionId varsa, ayrı bir alan olarak da kaydet
      if (subscriptionId) {
        updateData.subscriptionId = subscriptionId;
      }
      
      await updateDoc(userRef, updateData);
      console.log('✅ User subscription updated successfully:', userId, 'to', status === 'active' ? 'premium' : 'basic', 'with subscriptionId:', subscriptionId);
    } else {
      console.error('❌ User not found in Firestore:', userId);
    }
  } catch (err) {
    console.error('❌ Error updating user subscription:', err.message, 'for userId:', userId);
    console.error('Full error:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;
        console.log('Checkout session details:', {
          sessionId: session.id,
          metadata: session.metadata,
          userId: userId,
          subscriptionId: subscriptionId,
          hasMetadata: !!session.metadata,
          metadataKeys: session.metadata ? Object.keys(session.metadata) : []
        });
        
        if (userId) {
          await updateUserSubscription(userId, 'active', subscriptionId);
          console.log('User updated to premium:', userId, 'with subscription:', subscriptionId);
        } else {
          console.error('No userId found in session metadata', {
            metadata: session.metadata,
            sessionId: session.id
          });
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        console.log('Subscription status:', subscription.status);
        await updateUserSubscription(subscription.metadata.userId, subscription.status);
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        console.log('Subscription canceled');
        await updateUserSubscription(canceledSubscription.metadata.userId, 'canceled');
        break;

      case 'payment_intent.succeeded':
        // Ödeme başarılı olduğunda yapılacak işlemler
        break;

      case 'payment_intent.payment_failed':
        // Ödeme başarısız olduğunda yapılacak işlemler
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
} 