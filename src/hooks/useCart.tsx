import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItemVariant {
  id: string;
  name: string;
  image?: string | null;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  compare_at_price?: number | null;
  image: string;
  quantity: number;
  variant?: CartItemVariant | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'id'> & { id?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CART_KEY = 'trend_cart';

const CartContext = createContext<CartContextType | null>(null);

function buildCartItemId(productId: string, variantId?: string | null) {
  return variantId ? `${productId}::${variantId}` : productId;
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem: CartContextType['addItem'] = (item) => {
    const productId = item.productId ?? item.id ?? '';
    const cartId = buildCartItemId(productId, item.variant?.id);
    setItems(prev => {
      const existing = prev.find(i => i.id === cartId);
      if (existing) {
        return prev.map(i => i.id === cartId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: cartId,
        productId,
        name: item.name,
        price: item.price,
        compare_at_price: item.compare_at_price,
        image: item.image,
        variant: item.variant ?? null,
        quantity: 1,
      }];
    });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
