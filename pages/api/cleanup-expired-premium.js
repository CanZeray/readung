import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export default async function handler(req, res) {
  // Güvenlik - sadece POST ve doğru secret ile çalışır
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-cleanup-secret'] || req.body.secret;
  if (secret !== process.env.CLEANUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🧹 Starting expired premium cleanup...');
    
    // Premium kullanıcıları getir
    const usersRef = collection(db, 'users');
    const premiumQuery = query(usersRef, where('membershipType', '==', 'premium'));
    const premiumSnapshot = await getDocs(premiumQuery);
    
    let cleanupCount = 0;
    const now = new Date();
    
    for (const userDoc of premiumSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      let shouldDowngrade = false;
      let reason = '';
      
      // Check 1: Cancelled subscription with expired grace period
      if (userData.cancelledAt) {
        const cancelledDate = new Date(userData.cancelledAt);
        const gracePeriodEnd = new Date(cancelledDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        
        if (now > gracePeriodEnd) {
          shouldDowngrade = true;
          reason = 'Grace period expired';
        }
      }
      
      // Check 2: Inactive subscription status
      if (userData.subscription?.status === 'canceled' || userData.subscription?.status === 'inactive') {
        shouldDowngrade = true;
        reason = 'Subscription status inactive';
      }
      
      // Check 3: No active subscription ID
      if (!userData.subscriptionId && !userData.subscription?.id) {
        shouldDowngrade = true;
        reason = 'No active subscription ID';
      }
      
      // Downgrade if needed
      if (shouldDowngrade) {
        console.log(`⬇️ Downgrading user ${userId} to basic - Reason: ${reason}`);
        
        await updateDoc(doc(db, 'users', userId), {
          membershipType: 'basic',
          downgradedAt: new Date().toISOString(),
          downgradeReason: reason,
          updatedAt: new Date().toISOString()
        });
        
        cleanupCount++;
      }
    }
    
    console.log(`✅ Cleanup completed. ${cleanupCount} users downgraded to basic.`);
    
    res.status(200).json({ 
      success: true, 
      message: `Cleanup completed successfully`,
      stats: {
        totalPremiumUsers: premiumSnapshot.size,
        downgradedUsers: cleanupCount,
        activeUsers: premiumSnapshot.size - cleanupCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({ 
      error: 'Cleanup failed', 
      details: error.message 
    });
  }
} 