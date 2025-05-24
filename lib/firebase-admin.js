import * as admin from 'firebase-admin';

// Check if Firebase app is already initialized to prevent multiple instances
if (!admin.apps.length) {
  try {
    // Sadece gerekli environment variables varsa initialize et
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('Firebase Admin Environment Check:', {
      projectId: !!projectId ? projectId : 'Missing',
      clientEmail: !!clientEmail ? clientEmail.substring(0, 20) + '...' : 'Missing',
      privateKey: !!privateKey ? 'Present (' + privateKey.length + ' chars)' : 'Missing',
      hasPlaceholder: privateKey === "ADD_YOUR_FIREBASE_PRIVATE_KEY_HERE"
    });

    if (projectId && clientEmail && privateKey && privateKey !== "ADD_YOUR_FIREBASE_PRIVATE_KEY_HERE") {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('❌ Firebase Admin not initialized: Missing or placeholder credentials');
      console.warn('Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
      console.warn('Check your .env.local file');
    }
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  }
}

// Güvenli export - app yoksa undefined döner
export const auth = admin.apps.length > 0 ? admin.auth() : null;
export const db = admin.apps.length > 0 ? admin.firestore() : null;

console.log('Firebase Admin Export Status:', {
  appsLength: admin.apps.length,
  authAvailable: !!auth,
  dbAvailable: !!db
}); 