import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStripe } from '@stripe/stripe-js';

export default function Success() {
  const stripe = useStripe();
  const router = useRouter();

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        if (paymentIntent.status === 'succeeded') {
          setTimeout(() => {
            router.push('/home');
          }, 3000);
        }
      });
    }
  }, [stripe, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödemeniz Başarıyla Tamamlandı!</h1>
        <p className="text-gray-600">Premium üyeliğiniz aktif edildi. Ana sayfaya yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
} 