import { Router } from 'express';
import { randomBytes } from 'node:crypto';

import { prisma } from '../prisma.js';
import { serializeOrder } from '../lib/serialize.js';

export const ordersRouter = Router();

// "1FI-XXXXXX" using an unambiguous alphabet (no 0/O/1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeReference() {
  const bytes = randomBytes(6);
  let code = '';
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `1FI-${code}`;
}

/**
 * POST /api/orders
 * Body: { customerName?: string, items: [{ variantId, emiPlanId, quantity? }] }
 *
 * The server re-reads every variant and plan from the DB and recomputes all
 * money — the client's numbers are never trusted. Line items are snapshotted so
 * the order stays accurate if the catalogue changes later.
 */
ordersRouter.post('/', async (req, res, next) => {
  try {
    const { customerName, items } = req.body ?? {};

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

    // Retry a couple of times on the (astronomically unlikely) reference clash.
    let order;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        order = await prisma.order.create({
          data: {
            reference: makeReference(),
            customerName: customerName?.toString().trim().slice(0, 120) || null,
            itemCount: resolved.reduce((acc, l) => acc + l.quantity, 0),
            monthlyPaise: sum('monthlyPaise'),
            downPaymentPaise: sum('downPaymentPaise'),
            cashbackPaise: sum('cashbackPaise'),
            totalPayablePaise: sum('totalPayablePaise'),
            firstEmiOn,
            items: { create: resolved },
          },
          include: { items: true },
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
 * GET /api/orders  — newest first.
 */
ordersRouter.get('/', async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
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
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found', reference: ref });
    res.json({ order: serializeOrder(order) });
  } catch (err) {
    next(err);
  }
});
