import { Router } from 'express';

import { prisma } from '../prisma.js';
import { makeReference } from '../lib/reference.js';
import { serializeOrder } from '../lib/serialize.js';

export const ordersRouter = Router();

/**
 * POST /api/orders
 * Body: { customerName?: string, items: [{ variantId, emiPlanId, quantity? }], method? }
 *
 * The server re-reads every variant and plan from the DB and recomputes all
 * money — the client's numbers are never trusted. Line items are snapshotted so
 * the order stays accurate if the catalogue changes later.
 *
 * The order is created as PENDING_PAYMENT together with a dummy-gateway Payment
 * row for the "due today" amount. The client then drives it to SUCCESS via
 * POST /api/payments/:reference/confirm, which flips the order to CONFIRMED.
 */
const PAYMENT_METHODS = new Set(['CARD', 'UPI', 'NETBANKING']);

ordersRouter.post('/', async (req, res, next) => {
  try {
    const { customerName, items, method } = req.body ?? {};
    const payMethod = PAYMENT_METHODS.has(String(method).toUpperCase())
      ? String(method).toUpperCase()
      : 'CARD';

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Provide a non-empty "items" array' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'Too many items (max 50)' });
    }

    // Resolve + validate each line against the DB.
    const resolved = [];
    for (const [i, line] of items.entries()) {
      const quantity = Number.isInteger(line?.quantity) ? line.quantity : 1;
      if (!line?.variantId || !line?.emiPlanId) {
        return res.status(400).json({ error: `items[${i}] needs variantId and emiPlanId` });
      }
      if (quantity < 1 || quantity > 10) {
        return res.status(400).json({ error: `items[${i}].quantity must be between 1 and 10` });
      }

      const plan = await prisma.emiPlan.findUnique({
        where: { id: line.emiPlanId },
        include: { variant: { include: { product: true } } },
      });

      if (!plan || plan.variantId !== line.variantId) {
        return res.status(422).json({ error: `items[${i}]: EMI plan does not match variant`, line });
      }
      if (!plan.variant.inStock) {
        return res.status(409).json({ error: `${plan.variant.product.name} (${plan.variant.label}) is out of stock` });
      }

      const v = plan.variant;
      resolved.push({
        productId: v.product.id,
        productSlug: v.product.slug,
        productName: v.product.name,
        brand: v.product.brand,
        variantId: v.id,
        variantLabel: v.label,
        imageUrl: v.imageUrl,
        emiPlanId: plan.id,
        planTitle: plan.title,
        fundName: plan.fundName,
        tenureMonths: plan.tenureMonths,
        interestRate: plan.interestRate,
        quantity,
        unitPricePaise: v.pricePaise,
        monthlyPaise: plan.monthlyPaise * quantity,
        downPaymentPaise: plan.downPaymentPaise * quantity,
        cashbackPaise: plan.cashbackPaise * quantity,
        totalPayablePaise: plan.totalPayablePaise * quantity,
      });
    }

    const sum = (key) => resolved.reduce((acc, l) => acc + l[key], 0);
    const now = new Date();
    const firstEmiOn = new Date(now);
    firstEmiOn.setMonth(firstEmiOn.getMonth() + 1);

    const downPaymentPaise = sum('downPaymentPaise');

    // Link the order to the signed-in user (if any) and fall back to their name.
    const userId = req.user?.id ?? null;
    const resolvedName =
      customerName?.toString().trim().slice(0, 120) || req.user?.name?.slice(0, 120) || null;

    // Retry a couple of times on the (astronomically unlikely) reference clash.
    let order;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        order = await prisma.order.create({
          data: {
            reference: makeReference('1FI'),
            status: 'PENDING_PAYMENT',
            userId,
            customerName: resolvedName,
            itemCount: resolved.reduce((acc, l) => acc + l.quantity, 0),
            monthlyPaise: sum('monthlyPaise'),
            downPaymentPaise,
            cashbackPaise: sum('cashbackPaise'),
            totalPayablePaise: sum('totalPayablePaise'),
            firstEmiOn,
            items: { create: resolved },
            payment: {
              create: {
                reference: makeReference('PAY'),
                method: payMethod,
                amountPaise: downPaymentPaise,
                status: 'CREATED',
              },
            },
          },
          include: { items: true, payment: true },
        });
        break;
      } catch (e) {
        if (e.code === 'P2002' && attempt < 2) continue; // unique clash on reference
        throw e;
      }
    }

    res.status(201).json({ order: serializeOrder(order) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders  — newest first. Orders still awaiting payment are hidden
 * unless ?includePending=1 is passed.
 *
 * Signed in  → only that user's orders.
 * Anonymous  → only orders with no user attached (the classic demo behaviour).
 */
ordersRouter.get('/', async (req, res, next) => {
  try {
    const includePending = ['1', 'true', 'yes'].includes(String(req.query.includePending).toLowerCase());
    const where = {};
    if (!includePending) where.status = { not: 'PENDING_PAYMENT' };
    where.userId = req.user ? req.user.id : null;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true, payment: true },
      take: 100,
    });
    res.json({ count: orders.length, orders: orders.map(serializeOrder) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:ref  — by reference (case-insensitive) or id.
 */
ordersRouter.get('/:ref', async (req, res, next) => {
  try {
    const { ref } = req.params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ reference: ref.toUpperCase() }, { id: ref }] },
      include: { items: true, payment: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found', reference: ref });
    res.json({ order: serializeOrder(order) });
  } catch (err) {
    next(err);
  }
});
