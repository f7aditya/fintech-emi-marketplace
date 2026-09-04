/**
 * Seed data for the 1Fi Marketplace.
 *
 * 4 products, each with 2+ variants, each variant with a full ladder of EMI plans.
 * All money is stored in paise (₹1 = 100 paise) as integers.
 *
 * EMI instalments are computed from the price with a standard reducing-balance
 * formula so the numbers in the DB are internally consistent — nothing is
 * hand-typed and wrong.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rupees = (n) => Math.round(n * 100); // rupees -> paise

/**
 * Standard reducing-balance EMI.
 * @param {number} principalPaise  amount financed (price - downPayment)
 * @param {number} annualRatePct   e.g. 0, 10.5, 14
 * @param {number} months          tenure
 * @returns {number} monthly instalment in paise (rounded)
 */
function monthlyInstalment(principalPaise, annualRatePct, months) {
  if (annualRatePct === 0) return Math.round(principalPaise / months);
  const r = annualRatePct / 12 / 100;
  const factor = Math.pow(1 + r, months);
  return Math.round((principalPaise * r * factor) / (factor - 1));
}

/**
 * Build the EMI ladder for one variant from its price.
 * Returns an array of `emiPlans` create objects.
 */
function buildEmiPlans(pricePaise) {
  const templates = [
    {
      title: "No Cost EMI",
      fundName: "1Fi Liquid Direct — Growth",
      tenureMonths: 3,
      interestRate: 0,
      downPct: 0,
      cashback: 0,
      recommended: false,
    },
    {
      title: "No Cost EMI",
      fundName: "1Fi Liquid Direct — Growth",
      tenureMonths: 6,
      interestRate: 0,
      downPct: 0,
      cashback: rupees(1500),
      recommended: true,
      cashbackNote: "Instant ₹1,500 cashback as 1Fi units",
    },
    {
      title: "Low Interest EMI",
      fundName: "1Fi Ultra Short Duration — Growth",
      tenureMonths: 9,
      interestRate: 10.5,
      downPct: 0,
      cashback: 0,
      recommended: false,
    },
    {
      title: "Standard EMI",
      fundName: "1Fi Money Market — Growth",
      tenureMonths: 12,
      interestRate: 14,
      downPct: 0.1,
      cashback: rupees(2000),
      recommended: false,
      cashbackNote: "₹2,000 cashback after 3 on-time payments",
    },
    {
      title: "Standard EMI",
      fundName: "1Fi Corporate Bond — Growth",
      tenureMonths: 18,
      interestRate: 15,
      downPct: 0.1,
      cashback: 0,
      recommended: false,
    },
    {
      title: "Standard EMI",
      fundName: "1Fi Corporate Bond — Growth",
      tenureMonths: 24,
      interestRate: 16,
      downPct: 0.15,
      cashback: 0,
      recommended: false,
    },
  ];

  return templates.map((t, i) => {
    const downPaymentPaise = Math.round(pricePaise * t.downPct);
    const principal = pricePaise - downPaymentPaise;
    const monthlyPaise = monthlyInstalment(
      principal,
      t.interestRate,
      t.tenureMonths,
    );
    const totalPayablePaise =
      downPaymentPaise + monthlyPaise * t.tenureMonths - t.cashback;
    return {
      title: t.title,
      provider: "1Fi",
      fundName: t.fundName,
      tenureMonths: t.tenureMonths,
      interestRate: t.interestRate,
      monthlyPaise,
      downPaymentPaise,
      cashbackPaise: t.cashback,
      cashbackNote: t.cashback > 0 ? t.cashbackNote : null,
      totalPayablePaise,
      isRecommended: t.recommended,
      sortOrder: i,
    };
  });
}

const IMG = {
  iphoneSilver:
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80",
  iphoneBlue:
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80",
  iphoneBlack:
    "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=900&q=80",
  samsungBlack:
    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80",
  samsungGray:
    "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80",
  pixelObsidian:
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
  pixelPorcelain:
    "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=900&q=80",
  oneplusBlack:
    "https://images.unsplash.com/photo-1533228100845-08145b01de14?auto=format&fit=crop&w=900&q=80",
  oneplusWhite:
    "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=900&q=80",
};

const products = [
  {
    slug: "apple-iphone-17-pro",
    name: "Apple iPhone 17 Pro",
    brand: "Apple",
    tagline:
      "Titanium. A19 Pro chip. The most powerful iPhone camera system yet.",
    description:
      "The iPhone 17 Pro features an aerospace-grade titanium design, the A19 Pro chip, a customisable Action button, and a Pro camera system with a 5x Telephoto lens. Buy it on 1Fi with EMI plans backed by mutual funds — pay in parts while your money keeps working.",
    heroImage: IMG.iphoneSilver,
    rating: 4.8,
    ratingCount: 2143,
    variants: [
      {
        storage: "256 GB",
        colorName: "Silver",
        colorHex: "#E3E4E5",
        mrp: 134900,
        price: 129900,
        image: IMG.iphoneSilver,
        isDefault: true,
      },
      {
        storage: "256 GB",
        colorName: "Deep Blue",
        colorHex: "#2E4A6B",
        mrp: 134900,
        price: 131900,
        image: IMG.iphoneBlue,
      },
      {
        storage: "512 GB",
        colorName: "Black Titanium",
        colorHex: "#3B3B3D",
        mrp: 154900,
        price: 149900,
        image: IMG.iphoneBlack,
      },
    ],
  },
  {
    slug: "samsung-galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    tagline: "Galaxy AI is here. 200MP camera, built-in S Pen, titanium frame.",
    description:
      'The Galaxy S24 Ultra brings a flat 6.8" QHD+ Dynamic AMOLED 2X display, a 200MP wide camera, the Snapdragon 8 Gen 3 for Galaxy, and Galaxy AI features like Circle to Search and Live Translate. Available on 1Fi with mutual-fund-backed EMI.',
    heroImage: IMG.samsungBlack,
    rating: 4.7,
    ratingCount: 1587,
    variants: [
      {
        storage: "256 GB",
        colorName: "Titanium Black",
        colorHex: "#2B2B2B",
        mrp: 129999,
        price: 121999,
        image: IMG.samsungBlack,
        isDefault: true,
      },
      {
        storage: "512 GB",
        colorName: "Titanium Gray",
        colorHex: "#8A8D8F",
        mrp: 139999,
        price: 133999,
        image: IMG.samsungGray,
      },
    ],
  },
  {
    slug: "google-pixel-9-pro",
    name: "Google Pixel 9 Pro",
    brand: "Google",
    tagline:
      "Google Tensor G4. Gemini built in. The best of Google in a phone.",
    description:
      'Pixel 9 Pro pairs the Google Tensor G4 chip with a pro-level triple rear camera, a 6.3" Super Actua display, and seven years of OS and security updates. Gemini is built in. Buy now, pay in EMIs on 1Fi.',
    heroImage: IMG.pixelObsidian,
    rating: 4.6,
    ratingCount: 934,
    variants: [
      {
        storage: "128 GB",
        colorName: "Obsidian",
        colorHex: "#1C1C1E",
        mrp: 109999,
        price: 99999,
        image: IMG.pixelObsidian,
        isDefault: true,
      },
      {
        storage: "256 GB",
        colorName: "Porcelain",
        colorHex: "#EDE9E3",
        mrp: 119999,
        price: 112999,
        image: IMG.pixelPorcelain,
      },
    ],
  },
  {
    slug: "oneplus-13",
    name: "OnePlus 13",
    brand: "OnePlus",
    tagline: "Snapdragon 8 Elite. 6000mAh. Hasselblad camera for mobile.",
    description:
      'OnePlus 13 runs the Snapdragon 8 Elite platform with a 6000mAh battery, 100W SUPERVOOC charging, a 6.82" 2K ProXDR display and a 4th-gen Hasselblad camera system. IP69 rated. Now on 1Fi with EMI plans backed by mutual funds.',
    heroImage: IMG.oneplusBlack,
    rating: 4.5,
    ratingCount: 612,
    variants: [
      {
        storage: "256 GB",
        colorName: "Midnight Ocean",
        colorHex: "#1F3A4D",
        mrp: 69999,
        price: 64999,
        image: IMG.oneplusBlack,
        isDefault: true,
      },
      {
        storage: "512 GB",
        colorName: "Arctic Dawn",
        colorHex: "#DDE3E6",
        mrp: 76999,
        price: 72999,
        image: IMG.oneplusWhite,
      },
    ],
  },
  {
    slug: "xiaomi-14",
    name: "Xiaomi 14",
    brand: "Xiaomi",
    tagline: "Leica Summilux optical lens. Snapdragon 8 Gen 3.",
    description:
      "Co-engineered with Leicaa, Xiaomi 14 delivers an incredible photography experience in a perfectly sized 6.36-inch form factor. HyperOS and 90W HyperCharge included. Get it via No Cost EMI powered by your 1Fi investments.",
    heroImage: IMG.oneplusBlack,
    rating: 4.4,
    ratingCount: 421,
    variants: [
      {
        storage: "512 GB",
        colorName: "Jade Green",
        colorHex: "#4C6A5A",
        mrp: 79999,
        price: 69999,
        image: IMG.oneplusBlack,
        isDefault: true,
      },
      {
        storage: "512 GB",
        colorName: "Matte Black",
        colorHex: "#111111",
        mrp: 79999,
        price: 69999,
        image: IMG.samsungBlack,
      },
    ],
  },
  {
    slug: "vivo-x100-pro",
    name: "Vivo X100 Pro",
    brand: "Vivo",
    tagline: "ZEISS APO Floating Telephoto Camera. Dimensity 9300.",
    description:
      "The Vivo X100 Pro redefines mobile photography with its ZEISS optics. Packed with the flagship Dimensity 9300, a massive 5400mAh battery, and a sleek glass design. Buy now and pay later with 1Fi.",
    heroImage:
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
    rating: 4.7,
    ratingCount: 304,
    variants: [
      {
        storage: "512 GB",
        colorName: "Asteroid Black",
        colorHex: "#222224",
        mrp: 96999,
        price: 89999,
        image:
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
        isDefault: true,
      },
    ],
  },
  {
    slug: "motorola-edge-50-pro",
    name: "Motorola Edge 50 Pro",
    brand: "Motorola",
    tagline: "AI-powered camera. 125W TurboPower. Pantone Validated colors.",
    description:
      "Experience the intelligence of moto ai with the Edge 50 Pro. Features a 144Hz pOLED display, 125W charging, and vegan leather finishes validated by Pantone. Shop today with 1Fi No Cost EMIs.",
    heroImage:
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80",
    rating: 4.3,
    ratingCount: 1245,
    variants: [
      {
        storage: "256 GB",
        colorName: "Luxe Lavender",
        colorHex: "#9E85B6",
        mrp: 36999,
        price: 31999,
        image:
          "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80",
        isDefault: true,
      },
      {
        storage: "256 GB",
        colorName: "Black Beauty",
        colorHex: "#1B1B1D",
        mrp: 36999,
        price: 31999,
        image: IMG.oneplusBlack,
      },
    ],
  },
];

async function main() {
  console.log("Clearing existing data…");
  await prisma.emiPlan.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();

  for (const p of products) {
    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: "Smartphones",
        tagline: p.tagline,
        description: p.description,
        heroImage: p.heroImage,
        rating: p.rating,
        ratingCount: p.ratingCount,
        variants: {
          create: p.variants.map((v, idx) => {
            const pricePaise = rupees(v.price);
            return {
              sku: `${p.slug}-${v.storage.replace(/\s+/g, "").toLowerCase()}-${v.colorName.replace(/\s+/g, "-").toLowerCase()}`,
              label: `${v.storage} · ${v.colorName}`,
              colorName: v.colorName,
              colorHex: v.colorHex,
              storage: v.storage,
              imageUrl: v.image,
              mrpPaise: rupees(v.mrp),
              pricePaise,
              inStock: true,
              isDefault: Boolean(v.isDefault) || idx === 0,
              emiPlans: { create: buildEmiPlans(pricePaise) },
            };
          }),
        },
      },
      include: { variants: { include: { emiPlans: true } } },
    });
    const planCount = created.variants.reduce(
      (s, v) => s + v.emiPlans.length,
      0,
    );
    console.log(
      `  ✓ ${created.name} — ${created.variants.length} variants, ${planCount} EMI plans`,
    );
  }

  const [products_, variants_, plans_] = await Promise.all([
    prisma.product.count(),
    prisma.variant.count(),
    prisma.emiPlan.count(),
  ]);
  console.log(
    `\nDone. ${products_} products, ${variants_} variants, ${plans_} EMI plans.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
