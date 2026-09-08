'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = { id: number; slug: string; title: string; priceVnd: number; coverTone: string };

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: number) => void;
  clear: () => void;
  has: (id: number) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let restored: CartItem[] = [];
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('kdt_cart') ?? '[]');
      if (Array.isArray(saved)) restored = saved.filter((item): item is CartItem => Boolean(item && typeof item === 'object' && 'id' in item && Number.isInteger(item.id) && Number(item.id) > 0));
    } catch {
      localStorage.removeItem('kdt_cart');
    }
    queueMicrotask(() => { setItems(restored); setReady(true); });
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem('kdt_cart', JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((item: CartItem) => setItems((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]), []);
  const remove = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((id: number) => items.some((item) => item.id === id), [items]);
  const value = useMemo(() => ({ items, add, remove, clear, has }), [items, add, remove, clear, has]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart phải nằm trong CartProvider.');
  return value;
}
