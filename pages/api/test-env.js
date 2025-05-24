export default function handler(req, res) {
  // Test amaçlı API - sadece development ortamında çalışır
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      error: 'Not allowed in production',
      message: 'This debug endpoint is only available in development mode'
    });
  }

  console.log('=== Environment Variables Debug ===');
  
  const envDebug = {
    // Stripe Variables
    STRIPE_SECRET_KEY: {
      exists: !!process.env.STRIPE_SECRET_KEY,
      value: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...' : 'MISSING'
    },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
      exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...' : 'MISSING'
    },
    STRIPE_WEBHOOK_SECRET: {
      exists: !!process.env.STRIPE_WEBHOOK_SECRET,
      value: process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20) + '...' : 'MISSING'
    },
    
    // Firebase Variables
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
      exists: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING'
    },
    FIREBASE_CLIENT_EMAIL: {
      exists: !!process.env.FIREBASE_CLIENT_EMAIL,
      value: process.env.FIREBASE_CLIENT_EMAIL ? process.env.FIREBASE_CLIENT_EMAIL.substring(0, 30) + '...' : 'MISSING'
    },
    FIREBASE_PRIVATE_KEY: {
      exists: !!process.env.FIREBASE_PRIVATE_KEY,
      length: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
      startsWithBegin: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.startsWith('"-----BEGIN') : false
    },
    NEXT_PUBLIC_FIREBASE_API_KEY: {
      exists: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 20) + '...' : 'MISSING'
    }
  };

  // Console'a da yazdır
  console.log('Environment Debug:', JSON.stringify(envDebug, null, 2));
  
  // Tüm process.env'i de kontrol et (sadece kendi değişkenlerimiz)
  const allEnvKeys = Object.keys(process.env).filter(key => 
    key.includes('STRIPE') || 
    key.includes('FIREBASE') || 
    key.includes('NEXT_PUBLIC')
  );
  
  console.log('All related env keys:', allEnvKeys);

  res.status(200).json({
    message: 'Environment variables debug info',
    variables: envDebug,
    allRelatedKeys: allEnvKeys,
    nodeEnv: process.env.NODE_ENV,
    pwd: process.env.PWD || process.cwd()
  });
} 