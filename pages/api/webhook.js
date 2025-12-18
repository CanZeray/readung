import Stripe from 'stripe';
import { buffer } from 'micro';
import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
      
      if (status === 'canceled') {
        // ❌ Subscription cancelled - Set cancelled date and keep premium until end of billing cycle
        const updateData = {
          membershipType: 'basic', // ⚠️ Immediately downgrade to basic
          cancelledAt: new Date().toISOString(),
          subscription: {
            status: 'canceled',
            cancelledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          subscriptionId: null // Clear subscription ID
        };
        
        await updateDoc(userRef, updateData);
        console.log('✅ User subscription cancelled and downgraded to basic:', userId);
        
      } else if (status === 'active') {
        // ✅ Subscription active - Full premium access
        const updateData = {
          membershipType: 'premium',
          subscription: {
            id: subscriptionId,
            status: 'active',
            updatedAt: new Date().toISOString()
          },
          subscriptionId: subscriptionId,
          // Clear any previous cancellation data
          cancelledAt: null
        };
        
        await updateDoc(userRef, updateData);
        console.log('✅ User subscription updated successfully:', userId, 'to premium with subscriptionId:', subscriptionId);
        
      } else {
        // Other status - Set to basic
        const updateData = {
          membershipType: 'basic',
          subscription: {
            status: status,
            updatedAt: new Date().toISOString()
          },
          subscriptionId: null
        };
        
        await updateDoc(userRef, updateData);
        console.log('✅ User subscription updated:', userId, 'to basic with status:', status);
      }
      
    } else {
      console.error('❌ User not found in Firestore:', userId);
    }
  } catch (err) {
    console.error('❌ Error updating user subscription:', err.message, 'for userId:', userId);
    console.error('Full error:', err);
  }
}

async function findUserIdByCustomerId(customerId) {
  try {
    console.log('🔍 Searching for user with Stripe customer ID:', customerId);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('stripeCustomerId', '==', customerId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userId = querySnapshot.docs[0].id;
      console.log('✅ Found user ID:', userId, 'for customer:', customerId);
      return userId;
    } else {
      console.error('❌ No user found with stripeCustomerId:', customerId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error finding user by customer ID:', error);
    return null;
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
    // Webhook secret kontrolü eksik
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not defined');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

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
        console.log('Subscription status:', subscription.status, 'ID:', subscription.id, 'cancel_at_period_end:', subscription.cancel_at_period_end);
        
        let userIdForUpdate = subscription.metadata?.userId;
        if (!userIdForUpdate && subscription.customer) {
          userIdForUpdate = await findUserIdByCustomerId(subscription.customer);
        }
        
        if (userIdForUpdate) {
          // Eğer cancel_at_period_end true ise, premium kalmalı ama cancelledAt kaydedilmeli
          if (subscription.cancel_at_period_end && subscription.status === 'active') {
            const userRef = doc(db, 'users', userIdForUpdate);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const updateData = {
                membershipType: 'premium', // Premium kalmalı
                subscription: {
                  id: subscription.id,
                  status: 'active',
                  cancel_at_period_end: true,
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  updatedAt: new Date().toISOString()
                },
                subscriptionId: subscription.id,
                cancelledAt: userDoc.data().cancelledAt || new Date().toISOString() // İptal tarihi kaydedilmeli
              };
              
              await updateDoc(userRef, updateData);
              console.log('✅ Subscription set to cancel at period end, premium access maintained until:', new Date(subscription.current_period_end * 1000).toISOString());
            }
          } else if (!subscription.cancel_at_period_end && subscription.status === 'active') {
            // Reactivate durumu: cancel_at_period_end false ve status active
            const userRef = doc(db, 'users', userIdForUpdate);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const updateData = {
                membershipType: 'premium',
                subscription: {
                  id: subscription.id,
                  status: 'active',
                  cancel_at_period_end: false,
                  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  updatedAt: new Date().toISOString()
                },
                subscriptionId: subscription.id,
                cancelledAt: null // İptal tarihini temizle
              };
              
              await updateDoc(userRef, updateData);
              console.log('✅ Subscription reactivated, premium access continues');
            }
          } else {
            // Normal subscription update
            await updateUserSubscription(userIdForUpdate, subscription.status, subscription.id);
          }
        } else {
          console.error('❌ Could not find userId for subscription:', subscription.id);
        }
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        console.log('🚫 Subscription canceled:', canceledSubscription.id, 'Customer:', canceledSubscription.customer);
        
        // Önce metadata'dan userId'yi bulmaya çalış
        let userIdForCancel = canceledSubscription.metadata?.userId;
        
        // Metadata'da yoksa customer ID ile ara
        if (!userIdForCancel && canceledSubscription.customer) {
          userIdForCancel = await findUserIdByCustomerId(canceledSubscription.customer);
        }
        
        if (userIdForCancel) {
          await updateUserSubscription(userIdForCancel, 'canceled');
          console.log('✅ User subscription canceled successfully:', userIdForCancel);
        } else {
          console.error('❌ Could not find userId for canceled subscription:', canceledSubscription.id);
          
          // Son çare: tüm premium kullanıcıları kontrol et
          try {
            const usersRef = collection(db, 'users');
            const premiumQuery = query(usersRef, where('membershipType', '==', 'premium'));
            const premiumSnapshot = await getDocs(premiumQuery);
            
            for (const userDoc of premiumSnapshot.docs) {
              const userData = userDoc.data();
              if (userData.subscriptionId === canceledSubscription.id || 
                  userData.subscription?.id === canceledSubscription.id) {
                await updateUserSubscription(userDoc.id, 'canceled');
                console.log('✅ Found and canceled subscription for user:', userDoc.id);
                break;
              }
            }
          } catch (searchError) {
            console.error('❌ Error in fallback user search:', searchError);
          }
        }
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