import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import type { EmiPlan, Money, Product, Variant } from './types';

const STORAGE_KEY = 'onefi.cart.v1';
const MAX_QTY = 10;

export type CartItem = {
  key: string; // `${variantId}:${planId}` — same variant + plan merges
  productSlug: string;
  productName: string;
  brand: string;
  variantId: string;
  variantLabel: string;
  image: string;
  unitPrice: Money;
  plan: EmiPlan;
  quantity: number;
  addedAt: number;
};

export type CartTotals = {
  lineCount: number;
  itemCount: number;
  monthlyPaise: number;
  downPaymentPaise: number;
  cashbackPaise: number;
  totalPayablePaise: number;
};

type State = { hydrated: boolean; items: CartItem[] };

type Action =
  | { type: 'hydrate'; items: CartItem[] }
  | { type: 'add'; item: Omit<CartItem, 'quantity' | 'addedAt'>; quantity: number }
  | { type: 'setQty'; key: string; quantity: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.round(n)));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { hydrated: true, items: action.items };
    case 'add': {
      const existing = state.items.find((i) => i.key === action.item.key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.key === action.item.key ? { ...i, quantity: clampQty(i.quantity + action.quantity) } : i,
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, quantity: clampQty(action.quantity), addedAt: Date.now() }],
      };
    }
    case 'setQty':
      return action.quantity <= 0
        ? { ...state, items: state.items.filter((i) => i.key !== action.key) }
        : {
            ...state,
            items: state.items.map((i) =>
              i.key === action.key ? { ...i, quantity: clampQty(action.quantity) } : i,
            ),
          };
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.key !== action.key) };
    case 'clear':
      return { ...state, items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  hydrated: boolean;
  items: CartItem[];
  totals: CartTotals;
  addItem: (args: { product: Product; variant: Variant; plan: EmiPlan; quantity?: number }) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  has: (variantId: string, planId: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { hydrated: false, items: [] });

  // Hydrate once from storage.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        const items = raw ? (JSON.parse(raw) as CartItem[]) : [];
        dispatch({ type: 'hydrate', items: Array.isArray(items) ? items : [] });
      })
      .catch(() => alive && dispatch({ type: 'hydrate', items: [] }));
    return () => {
      alive = false;
    };
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!state.hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  }, [state.hydrated, state.items]);

  const addItem = useCallback<CartContextValue['addItem']>(({ product, variant, plan, quantity = 1 }) => {
    dispatch({
      type: 'add',
      quantity,
      item: {
        key: `${variant.id}:${plan.id}`,
        productSlug: product.slug,
        productName: product.name,
        brand: product.brand,
        variantId: variant.id,
        variantLabel: variant.label,
        image: variant.image,
        unitPrice: variant.price,
        plan,
      },
    });
  }, []);

  const totals = useMemo<CartTotals>(() => {
    const acc: CartTotals = {
      lineCount: state.items.length,
      itemCount: 0,
      monthlyPaise: 0,
      downPaymentPaise: 0,
      cashbackPaise: 0,
      totalPayablePaise: 0,
    };
    for (const i of state.items) {
      acc.itemCount += i.quantity;
      acc.monthlyPaise += i.plan.monthly.paise * i.quantity;
      acc.downPaymentPaise += i.plan.downPayment.paise * i.quantity;
      acc.cashbackPaise += (i.plan.cashback?.paise ?? 0) * i.quantity;
      acc.totalPayablePaise += i.plan.totalPayable.paise * i.quantity;
    }
    return acc;
  }, [state.items]);

  const value = useMemo<CartContextValue>(
    () => ({
      hydrated: state.hydrated,
      items: state.items,
      totals,
      addItem,
      setQuantity: (key, quantity) => dispatch({ type: 'setQty', key, quantity }),
      removeItem: (key) => dispatch({ type: 'remove', key }),
      clear: () => dispatch({ type: 'clear' }),
      has: (variantId, planId) => state.items.some((i) => i.key === `${variantId}:${planId}`),
    }),
    [state.hydrated, state.items, totals, addItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
