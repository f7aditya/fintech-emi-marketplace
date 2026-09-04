// Shapes returned by the 1Fi Marketplace API (server/src/lib/serialize.js).

export type Money = { paise: number; rupees: number; display: string };

export type EmiPlan = {
  id: string;
  title: string;
  provider: string;
  fundName: string;
  tenureMonths: number;
  interestRate: number;
  interestLabel: string;
  monthly: Money;
  downPayment: Money;
  cashback: (Money & { note: string | null }) | null;
  totalPayable: Money;
  isRecommended: boolean;
};

export type Variant = {
  id: string;
  sku: string;
  label: string;
  color: { name: string; hex: string };
  storage: string;
  image: string;
  inStock: boolean;
  isDefault: boolean;
  mrp: Money;
  price: Money;
  discount: Money & { percent: number };
  emiPlans?: EmiPlan[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  tagline: string;
  description?: string;
  heroImage: string;
  rating: number;
  ratingCount: number;
  startingPrice: Money | null;
  variantCount: number;
  url: string;
  variants: Variant[];
};

export type ProductListResponse = { count: number; products: Product[] };
export type ProductResponse = { product: Product };

// --- Orders ---------------------------------------------------------------

export type OrderItem = {
  id: string;
  product: { id: string; slug: string; name: string; brand: string; url: string };
  variant: { id: string; label: string; image: string };
  plan: {
    id: string;
    title: string;
    fundName: string;
    tenureMonths: number;
    interestRate: number;
    interestLabel: string;
  };
  quantity: number;
  unitPrice: Money;
  monthly: Money;
  downPayment: Money;
  cashback: Money | null;
  totalPayable: Money;
};

export type Order = {
  id: string;
  reference: string;
  status: 'PLACED' | 'CONFIRMED' | 'CANCELLED';
  customerName: string | null;
  itemCount: number;
  monthly: Money;
  downPayment: Money;
  cashback: Money | null;
  totalPayable: Money;
  firstEmiOn: string;
  createdAt: string;
  items: OrderItem[];
};

export type CreateOrderPayload = {
  customerName?: string;
  items: { variantId: string; emiPlanId: string; quantity: number }[];
};

export type OrderResponse = { order: Order };
export type OrderListResponse = { count: number; orders: Order[] };
