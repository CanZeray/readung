import Stripe from 'stripe';
import { buffer } from 'micro';

// Use environment variables for Stripe keys
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      buf.toString(),
      signature,
      webhookSecret
    );

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        // Subscription was created
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        // Subscription was updated
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        // Subscription was cancelled
        await handleSubscriptionCancelled(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        // Payment was successful
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        // Payment failed
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function handleSubscriptionCreated(subscription) {
  // In a real application, you would update your database
  console.log('Subscription created:', subscription.id);
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionCancelled(subscription) {
  console.log('Subscription cancelled:', subscription.id);
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed for invoice:', invoice.id);
} 