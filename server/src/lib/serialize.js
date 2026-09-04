/**
 * DB rows store money in paise. The API exposes both the raw paise integer
 * (for clients that want to do their own maths) and a pre-formatted rupee
 * string, so the frontend never has to know about paise.
 */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const paiseToRupees = (paise) => paise / 100;
export const formatInr = (paise) => inr.format(paise / 100);

export function serializeEmiPlan(plan) {
  return {
    id: plan.id,
    title: plan.title,
    provider: plan.provider,
    fundName: plan.fundName,
    tenureMonths: plan.tenureMonths,
    interestRate: plan.interestRate,
    interestLabel: plan.interestRate === 0 ? '0% (No Cost)' : `${plan.interestRate}% p.a.`,
    monthly: { paise: plan.monthlyPaise, rupees: paiseToRupees(plan.monthlyPaise), display: formatInr(plan.monthlyPaise) },
    downPayment: { paise: plan.downPaymentPaise, rupees: paiseToRupees(plan.downPaymentPaise), display: formatInr(plan.downPaymentPaise) },
    cashback: plan.cashbackPaise
      ? { paise: plan.cashbackPaise, rupees: paiseToRupees(plan.cashbackPaise), display: formatInr(plan.cashbackPaise), note: plan.cashbackNote }
      : null,
    totalPayable: { paise: plan.totalPayablePaise, rupees: paiseToRupees(plan.totalPayablePaise), display: formatInr(plan.totalPayablePaise) },
    isRecommended: plan.isRecommended,
  };
}

export function serializeVariant(variant, { withPlans = true } = {}) {
  const discountPaise = Math.max(0, variant.mrpPaise - variant.pricePaise);
  return {
    id: variant.id,
    sku: variant.sku,
    label: variant.label,
    color: { name: variant.colorName, hex: variant.colorHex },
    storage: variant.storage,
    image: variant.imageUrl,
    inStock: variant.inStock,
    isDefault: variant.isDefault,
    mrp: { paise: variant.mrpPaise, rupees: paiseToRupees(variant.mrpPaise), display: formatInr(variant.mrpPaise) },
    price: { paise: variant.pricePaise, rupees: paiseToRupees(variant.pricePaise), display: formatInr(variant.pricePaise) },
    discount: {
      paise: discountPaise,
      rupees: paiseToRupees(discountPaise),
      display: formatInr(discountPaise),
      percent: variant.mrpPaise ? Math.round((discountPaise / variant.mrpPaise) * 100) : 0,
    },
    ...(withPlans && variant.emiPlans
      ? { emiPlans: [...variant.emiPlans].sort((a, b) => a.sortOrder - b.sortOrder).map(serializeEmiPlan) }
      : {}),
  };
}

export function serializeProduct(product, { full = true } = {}) {
  const variants = (product.variants ?? []).map((v) => serializeVariant(v, { withPlans: full }));
  const prices = variants.map((v) => v.price.paise).filter(Boolean);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    tagline: product.tagline,
    ...(full ? { description: product.description } : {}),
    heroImage: product.heroImage,
    rating: product.rating,
    ratingCount: product.ratingCount,
    startingPrice: prices.length
      ? { paise: Math.min(...prices), rupees: Math.min(...prices) / 100, display: formatInr(Math.min(...prices)) }
      : null,
    variantCount: variants.length,
    url: `/products/${product.slug}`,
    variants,
  };
}

const money = (paise) => ({ paise, rupees: paiseToRupees(paise), display: formatInr(paise) });

export function serializeOrderItem(item) {
  return {
    id: item.id,
    product: { id: item.productId, slug: item.productSlug, name: item.productName, brand: item.brand, url: `/products/${item.productSlug}` },
    variant: { id: item.variantId, label: item.variantLabel, image: item.imageUrl },
    plan: {
      id: item.emiPlanId,
      title: item.planTitle,
      fundName: item.fundName,
      tenureMonths: item.tenureMonths,
      interestRate: item.interestRate,
      interestLabel: item.interestRate === 0 ? '0% (No Cost)' : `${item.interestRate}% p.a.`,
    },
    quantity: item.quantity,
    unitPrice: money(item.unitPricePaise),
    monthly: money(item.monthlyPaise),
    downPayment: money(item.downPaymentPaise),
    cashback: item.cashbackPaise ? money(item.cashbackPaise) : null,
    totalPayable: money(item.totalPayablePaise),
  };
}

export function serializeOrder(order) {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    customerName: order.customerName,
    itemCount: order.itemCount,
    monthly: money(order.monthlyPaise),
    downPayment: money(order.downPaymentPaise),
    cashback: order.cashbackPaise ? money(order.cashbackPaise) : null,
    totalPayable: money(order.totalPayablePaise),
    firstEmiOn: order.firstEmiOn,
    createdAt: order.createdAt,
    items: (order.items ?? []).map(serializeOrderItem),
  };
}
