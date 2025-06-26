import Stripe from 'stripe';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail, userId } = req.body;
    
    if (!userEmail || !userId) {
      return res.status(400).json({ error: 'Missing userEmail or userId' });
    }

    // Test environment variables
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const isTestMode = stripeKey?.startsWith('sk_test_');
    
    console.log('🧪 Debug Test Results:');
    console.log('1. Stripe Key Check:', {
      exists: !!stripeKey,
      isTestMode: isTestMode,
      keyStart: stripeKey?.substring(0, 15) + '...'
    });

    // Test price ID logic
    const PRODUCTS = isTestMode ? {
      monthly: process.env.STRIPE_TEST_PRICE_MONTHLY || 'price_test_monthly_fallback',
      annual: process.env.STRIPE_TEST_PRICE_ANNUAL || 'price_test_annual_fallback'
    } : {
      monthly: 'price_1RQq3dKSJSLdtZ64j0qDgK1v',
      annual: 'price_1RQq3dKSJSLdtZ64afIe5eeF'
    };

    console.log('2. Price Configuration:', {
      isTestMode,
      products: PRODUCTS,
      envVars: {
        STRIPE_TEST_PRICE_MONTHLY: process.env.STRIPE_TEST_PRICE_MONTHLY,
        STRIPE_TEST_PRICE_ANNUAL: process.env.STRIPE_TEST_PRICE_ANNUAL
      }
    });

    // Test Firebase duplicate check
    console.log('3. Testing Firebase duplicate check...');
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, 
        where('email', '==', userEmail),
        where('membershipType', '==', 'premium')
      );
      const existingUsers = await getDocs(q);
      
      if (!existingUsers.empty) {
        const existingUser = existingUsers.docs[0];
        const userData = existingUser.data();
        
        console.log('Found existing premium user:', {
          userId: existingUser.id,
          requestUserId: userId,
          isSameUser: existingUser.id === userId,
          subscriptionId: userData.subscriptionId,
          isTestSubscription: userData.subscriptionId?.startsWith('sub_test_'),
          subscriptionStatus: userData.subscription?.status
        });

        // Apply same logic as main API
        if (existingUser.id === userId) {
          console.log('✅ Same user, would allow');
        } else if (userData.subscriptionId?.startsWith('sub_test_')) {
          console.log('✅ Test subscription, would allow');
        } else if (userData.subscriptionId && !userData.subscriptionId.startsWith('sub_test_') && userData.subscription?.status === 'active') {
          console.log('❌ Would block: Active real subscription');
        } else {
          console.log('✅ Would allow: No active subscription');
        }
      } else {
        console.log('✅ No existing premium users found');
      }
    } catch (firebaseError) {
      console.log('❌ Firebase error:', firebaseError.message);
    }

    // Test price fallback logic
    const monthlyPriceId = PRODUCTS.monthly;
    const shouldUseFallback = isTestMode && monthlyPriceId.includes('fallback');
    
    console.log('4. Price Fallback Logic:', {
      monthlyPriceId,
      shouldUseFallback,
      would: shouldUseFallback ? 'Use fallback (direct upgrade)' : 'Use Stripe checkout'
    });

    if (shouldUseFallback) {
      console.log('5. Would perform direct upgrade simulation');
      return res.status(200).json({
        debug: true,
        message: 'Would perform direct upgrade (test mode fallback)',
        action: 'direct_upgrade',
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/home?payment=success&test_mode=true`
      });
    } else {
      console.log('5. Would create Stripe checkout session');
      return res.status(200).json({
        debug: true,
        message: 'Would create Stripe checkout session',
        action: 'stripe_checkout',
        priceId: monthlyPriceId
      });
    }

  } catch (error) {
    console.error('Debug API error:', error);
    return res.status(500).json({ 
      error: 'Debug failed', 
      details: error.message 
    });
  }
} 