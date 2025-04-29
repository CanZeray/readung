import Stripe from 'stripe';

// Use environment variable for Stripe secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, paymentMethod, plan } = req.body;

    // Create a customer
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethod,
      invoice_settings: { default_payment_method: paymentMethod },
    });

    // Determine price ID based on selected plan
    const priceId = plan === 'monthly' ? 'price_monthly_id' : 'price_annual_id';

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Return the client secret for the payment
    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: error.message });
  }
} 