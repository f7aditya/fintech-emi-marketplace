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

// --- Auth --------------------------------------------------------------------

export type User = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  provider: 'google' | 'mock';
  createdAt: string;
};

export type AuthConfig = { google: boolean; mock: boolean };
export type AuthResponse = { token: string; user: User };
export type MeResponse = { user: User };

export type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING';
export type PaymentStatus = 'CREATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type Payment = {
  id: string;
  reference: string;
  gateway: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: Money;
  instrumentHint: string | null;
  failureReason: string | null;
  attempts: number;
  paidAt: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  reference: string;
  status: 'PENDING_PAYMENT' | 'PLACED' | 'CONFIRMED' | 'CANCELLED';
  customerName: string | null;
  itemCount: number;
  monthly: Money;
  downPayment: Money;
  cashback: Money | null;
  totalPayable: Money;
  firstEmiOn: string;
  createdAt: string;
  payment?: Payment | null;
  items: OrderItem[];
};

export type CreateOrderPayload = {
  customerName?: string;
  method?: PaymentMethod;
  items: { variantId: string; emiPlanId: string; quantity: number }[];
};

export type ConfirmPaymentPayload = {
  method: PaymentMethod;
  card?: { number: string; name?: string; expiry?: string; cvv?: string };
  upiId?: string;
  bank?: string;
  simulate?: 'success' | 'failure';
};

export type OrderResponse = { order: Order };
export type OrderListResponse = { count: number; orders: Order[] };
export type PaymentResponse = { payment: Payment; order: Order };
