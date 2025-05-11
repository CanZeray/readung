import admin from 'firebase-admin';

// Check if Firebase app is already initialized to prevent multiple instances
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined,
      }),
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export default admin; 