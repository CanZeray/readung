import Stripe from 'stripe';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';

// Use environment variable for Stripe secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe ürün ID'leri (Stripe Dashboard'dan oluşturulmalı)
const PRODUCTS = {
  monthly: 'price_1RQq3dKSJSLdtZ64j0qDgK1v', // Stripe'da oluşturulan aylık ürün ID'si
  annual: 'price_1RQq3dKSJSLdtZ64afIe5eeF'    // Stripe'da oluşturulan yıllık ürün ID'si
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentMethod, plan } = req.body;
    
    // Kullanıcı doğrulama
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Stripe'da müşteri oluştur veya mevcut müşteriyi bul
    let customer;
    const userRef = doc(db, 'users', userId);
    
    if (!req.body.customerId) {
      customer = await stripe.customers.create({
        payment_method: paymentMethod,
        email: decodedToken.email,
        invoice_settings: {
          default_payment_method: paymentMethod,
        },
        metadata: {
          firebaseUID: userId
        }
      });

      // Kullanıcı dökümanına Stripe müşteri ID'sini kaydet
      await updateDoc(userRef, {
        stripeCustomerId: customer.id
      });
    } else {
      customer = await stripe.customers.retrieve(req.body.customerId);
    }

    // Abonelik oluştur
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: PRODUCTS[plan] }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId
      }
    });

    // Kullanıcı dökümanını güncelle
    await updateDoc(userRef, {
      membershipType: 'premium',
      subscription: {
        id: subscription.id,
        plan: plan,
        status: subscription.status,
        startDate: new Date().toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      }
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
} 