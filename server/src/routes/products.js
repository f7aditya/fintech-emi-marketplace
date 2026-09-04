import { Router } from 'express';
import { prisma } from '../prisma.js';
import { serializeProduct, serializeVariant } from '../lib/serialize.js';

export const productsRouter = Router();

const variantInclude = {
  variants: {
    orderBy: { createdAt: 'asc' },
    include: { emiPlans: { orderBy: { sortOrder: 'asc' } } },
  },
};

/**
 * GET /api/products
 * List every product with a lightweight variant summary (no EMI plans).
 * Optional: ?brand=Apple  ?q=iphone
 */
productsRouter.get('/', async (req, res, next) => {
  try {
    const { brand, q } = req.query;
    const where = {};
    if (brand) where.brand = { equals: String(brand), mode: 'insensitive' };
    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { brand: { contains: String(q), mode: 'insensitive' } },
        { tagline: { contains: String(q), mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: variantInclude,
    });

    res.json({
      count: products.length,
      products: products.map((p) => serializeProduct(p, { full: false })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id
 * Full product by slug OR cuid, including every variant and its EMI plans.
 */
productsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: { OR: [{ slug: id }, { id }] },
      include: variantInclude,
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found', slug: id });
    }

    res.json({ product: serializeProduct(product, { full: true }) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id/emi-plans
 * The EMI plans for a product, grouped by variant. Handy for a checkout screen.
 * Optional: ?variant=<sku|variantId>
 */
productsRouter.get('/:id/emi-plans', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { variant } = req.query;
    const product = await prisma.product.findFirst({
      where: { OR: [{ slug: id }, { id }] },
      include: variantInclude,
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found', slug: id });
    }

    let variants = product.variants;
    if (variant) {
      variants = variants.filter((v) => v.sku === variant || v.id === variant);
      if (variants.length === 0) {
        return res.status(404).json({ error: 'Variant not found', variant });
      }
    }

    res.json({
      product: { id: product.id, slug: product.slug, name: product.name },
      variants: variants.map((v) => {
        const s = serializeVariant(v, { withPlans: true });
        return { id: s.id, sku: s.sku, label: s.label, price: s.price, emiPlans: s.emiPlans };
      }),
    });
  } catch (err) {
    next(err);
  }
});
