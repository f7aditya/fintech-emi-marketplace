import { Router } from 'express';

import { prisma } from '../prisma.js';
import { serializePayment, serializeOrder } from '../lib/serialize.js';

export const paymentsRouter = Router();

/*
 * DUMMY PAYMENT GATEWAY ("DummyPay")
 * ---------------------------------
 * No real money moves. A payment row is created with the order (status CREATED)
 * for the order's "due today" amount. The client collects fake instrument
 * details on the checkout screen and calls confirm, which simulates the gateway:
 *
 *   • an explicit `simulate: "success" | "failure"` always wins (handy for demos)
 *   • otherwise the outcome is derived from the instrument:
 *       - CARD  → test numbers below; any other 16-digit number succeeds
 *       - UPI   → a VPA containing "fail" / "@fail" declines; anything else succeeds
 *       - NETBANKING → always succeeds
 *
 * On success the payment goes SUCCESS and the order flips to CONFIRMED.
 * On failure the payment goes FAILED and can be retried in place.
 */

const METHODS = new Set(['CARD', 'UPI', 'NETBANKING']);

// Stripe-style test cards, kept familiar on purpose.
const TEST_CARDS = {
  '4242424242424242': { outcome: 'success' },
  '4111111111111111': { outcome: 'success' },
  '5555555555554444': { outcome: 'success' },
  '4000000000000002': { outcome: 'failure', reason: 'Your card was declined.' },
  '4000000000009995': { outcome: 'failure', reason: 'Insufficient funds.' },
  '4000000000000069': { outcome: 'failure', reason: 'Your card has expired.' },
};

const onlyDigits = (s) => String(s ?? '').replace(/\D/g, '');
const maskCard = (digits) => `•••• ${digits.slice(-4)}`;

function decideOutcome({ method, card, upiId, simulate }) {
  if (simulate === 'success') return { ok: true };
  if (simulate === 'failure') return { ok: false, reason: 'Payment failed (simulated).' };

  if (method === 'CARD') {
    const digits = onlyDigits(card?.number);
    if (digits.length !== 16) return { ok: false, reason: 'Enter a valid 16-digit card number.', code: 400 };
    const hit = TEST_CARDS[digits];
    if (hit?.outcome === 'failure') return { ok: false, reason: hit.reason };
    return { ok: true };
  }

  if (method === 'UPI') {
    const vpa = String(upiId ?? '').trim().toLowerCase();
    if (!/^[a-z0-9.\-_]{2,}@[a-z]{2,}$/.test(vpa)) return { ok: false, reason: 'Enter a valid UPI ID, e.g. name@bank.', code: 400 };
    if (vpa.includes('fail')) return { ok: false, reason: 'The UPI app declined the request.' };
    return { ok: true };
  }

  // NETBANKING
  return { ok: true };
}

function instrumentHint({ method, card, upiId, bank }) {
  if (method === 'CARD') {
    const digits = onlyDigits(card?.number);
    return digits.length >= 4 ? maskCard(digits) : 'Card';
  }
  if (method === 'UPI') return String(upiId ?? '').trim().slice(0, 60) || 'UPI';
  return String(bank ?? '').trim().slice(0, 40) || 'Netbanking';
}

async function findPayment(ref) {
  const reference = String(ref ?? '').toUpperCase();
  return prisma.payment.findFirst({
    where: { OR: [{ reference }, { id: ref }, { order: { reference } }] },
    include: { order: { include: { items: true } } },
  });
}

/**
 * GET /api/payments/:ref  — by payment reference, payment id, or order reference.
 */
paymentsRouter.get('/:ref', async (req, res, next) => {
  try {
    const payment = await findPayment(req.params.ref);
    if (!payment) return res.status(404).json({ error: 'Payment not found', reference: req.params.ref });
    res.json({ payment: serializePayment(payment), order: serializeOrder(payment.order) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/payments/:ref/confirm
 * Body: {
 *   method?: "CARD" | "UPI" | "NETBANKING",
 *   card?: { number, name?, expiry?, cvv? },
 *   upiId?: string,
 *   bank?: string,
 *   simulate?: "success" | "failure"
 * }
 */
paymentsRouter.post('/:ref/confirm', async (req, res, next) => {
  try {
    const payment = await findPayment(req.params.ref);
    if (!payment) return res.status(404).json({ error: 'Payment not found', reference: req.params.ref });

    if (payment.status === 'SUCCESS') {
      return res.json({ payment: serializePayment(payment), order: serializeOrder(payment.order) });
    }

    const body = req.body ?? {};
    const method = METHODS.has(String(body.method).toUpperCase())
      ? String(body.method).toUpperCase()
      : payment.method;
    const simulate = ['success', 'failure'].includes(String(body.simulate).toLowerCase())
      ? String(body.simulate).toLowerCase()
      : undefined;

    const verdict = decideOutcome({ method, card: body.card, upiId: body.upiId, simulate });
    const hint = instrumentHint({ method, card: body.card, upiId: body.upiId, bank: body.bank });

    // A validation problem with the fake instrument — not a gateway decline.
    if (!verdict.ok && verdict.code === 400) {
      return res.status(400).json({ error: verdict.reason });
    }

    if (!verdict.ok) {
      const failed = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          method,
          status: 'FAILED',
          instrumentHint: hint,
          failureReason: verdict.reason,
          attempts: { increment: 1 },
        },
        include: { order: { include: { items: true } } },
      });
      return res.status(402).json({
        error: verdict.reason,
        payment: serializePayment(failed),
        order: serializeOrder(failed.order),
      });
    }

    // Success — mark the payment paid and confirm the order in one transaction.
    const [paid] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          method,
          status: 'SUCCESS',
          instrumentHint: hint,
          failureReason: null,
          attempts: { increment: 1 },
          paidAt: new Date(),
        },
        include: { order: { include: { items: true } } },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
      }),
    ]);

    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: { items: true, payment: true },
    });

    res.json({ payment: serializePayment(paid), order: serializeOrder(order) });
  } catch (err) {
    next(err);
  }
});
