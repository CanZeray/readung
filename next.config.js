/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables için explicit tanımlama
  env: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Experimental özellikler
  experimental: {
    // Environment variables'ın runtime'da reload edilmesini sağla
    forceSwcTransforms: false,
  },
  
  // Webpack config
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-side'da environment variables'ı zorla yükle
      require('dotenv').config({ path: './.env.local' });
    }
    
    // Fix for Stripe.js module resolution error
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/home',
        destination: '/'
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ]
  }
}

module.exports = nextConfig 