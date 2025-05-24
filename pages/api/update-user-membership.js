import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth } from '../../lib/firebase-admin';

export default async function handler(req, res) {
  // Test amaçlı API - sadece development ortamında çalışır
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      error: 'Not allowed in production',
      message: 'This endpoint is only available in development mode'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Firebase token'dan kullanıcı bilgisini al
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log('Updating user membership for:', userId);

    // Kullanıcıyı premium yap
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      membershipType: 'premium',
      subscriptionId: 'sub_test_premium_' + Date.now(), // Test subscription ID
      subscription: {
        status: 'active',
        updatedAt: new Date().toISOString(),
        plan: 'monthly'
      },
      updatedAt: new Date().toISOString()
    });

    console.log('User membership updated to premium');

    res.status(200).json({ 
      success: true, 
      message: 'User membership updated to premium',
      membershipType: 'premium'
    });

  } catch (error) {
    console.error('Error updating membership:', error);
    res.status(500).json({ 
      error: 'Failed to update membership',
      details: error.message
    });
  }
} 