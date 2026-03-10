const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');
const { authenticate, requireUser } = require('../middleware/auth');

// Initialize Stripe (use test key if no real key configured)
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const COFFEE_PRICE_PENCE = 300; // £3 per coffee

// POST /api/donations/create-checkout-session
router.post('/create-checkout-session', authenticate, requireUser, async (req, res) => {
  try {
    const { teacherId, coffeeCount, anonymous } = req.body;
    if (!teacherId || !coffeeCount || ![1, 3, 5].includes(coffeeCount)) {
      return res.status(400).json({ error: { message: 'Invalid coffee count (1, 3, or 5)' } });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) return res.status(404).json({ error: { message: 'Teacher not found' } });

    const amount = coffeeCount * COFFEE_PRICE_PENCE;

    // If Stripe not configured, simulate for development
    if (!stripe) {
      const donation = await Donation.create({
        userId: anonymous ? null : req.user._id,
        teacherId,
        amount,
        currency: 'gbp',
        coffeeCount,
        status: 'completed',
        stripeSessionId: 'dev_' + Date.now(),
        anonymous: !!anonymous,
      });
      // Update teacher coffee count
      await User.findByIdAndUpdate(teacherId, { $inc: { coffeesReceived: coffeeCount } });
      return res.json({ success: true, donation, devMode: true });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${coffeeCount} Coffee${coffeeCount > 1 ? 's' : ''} for ${teacher.displayName}`,
            description: `Support ${teacher.displayName} with a virtual coffee ☕`,
          },
          unit_amount: COFFEE_PRICE_PENCE,
        },
        quantity: coffeeCount,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:8082'}/feed?coffee=success`,
      cancel_url: `${req.headers.origin || 'http://localhost:8082'}/feed?coffee=cancel`,
      metadata: {
        userId: anonymous ? 'anonymous' : req.user._id.toString(),
        teacherId: teacherId,
        coffeeCount: coffeeCount.toString(),
        anonymous: anonymous ? 'true' : 'false',
      },
    });

    // Save pending donation
    await Donation.create({
      userId: anonymous ? null : req.user._id,
      teacherId,
      amount,
      currency: 'gbp',
      coffeeCount,
      status: 'pending',
      stripeSessionId: session.id,
      anonymous: !!anonymous,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: { message: 'Failed to create checkout session' } });
  }
});

// POST /api/donations/webhook — Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.json({ received: true });

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { teacherId, coffeeCount } = session.metadata;

    // Update donation status
    await Donation.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: 'completed' }
    );

    // Update teacher coffee count
    await User.findByIdAndUpdate(teacherId, {
      $inc: { coffeesReceived: parseInt(coffeeCount) },
    });
  }

  res.json({ received: true });
});

// GET /api/donations/teacher/:id/count — Get coffee count for a teacher
router.get('/teacher/:id/count', async (req, res) => {
  try {
    const result = await Donation.aggregate([
      { $match: { teacherId: require('mongoose').Types.ObjectId(req.params.id), status: 'completed' } },
      { $group: { _id: null, totalCoffees: { $sum: '$coffeeCount' }, totalAmount: { $sum: '$amount' } } },
    ]);
    const data = result[0] || { totalCoffees: 0, totalAmount: 0 };
    res.json({ coffees: data.totalCoffees, amount: data.totalAmount });
  } catch (error) {
    // Fallback: use User field
    try {
      const user = await User.findById(req.params.id, 'coffeesReceived');
      res.json({ coffees: user?.coffeesReceived || 0, amount: 0 });
    } catch {
      res.json({ coffees: 0, amount: 0 });
    }
  }
});

module.exports = router;
