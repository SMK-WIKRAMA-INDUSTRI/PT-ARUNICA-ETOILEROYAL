import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCatalog } from './catalog.jsx';

const CART_KEY = 'etoile.cart';

function readCart() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((item) => item?.id)
      .map((item) => ({ id: item.id, qty: Math.max(1, Math.min(20, Number(item.qty) || 1)) }));
  } catch {
    return [];
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { activeProducts } = useCatalog();
  const [items, setItems] = useState(readCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const addItem = useCallback((dish, qty = 1) => {
    if (!dish?.id) return;
    const amount = Math.max(1, Math.min(20, Number(qty) || 1));
    setItems((current) => {
      const found = current.find((item) => item.id === dish.id);
      if (!found) return [...current, { id: dish.id, qty: amount }];
      return current.map((item) => item.id === dish.id
        ? { ...item, qty: Math.min(20, item.qty + amount) }
        : item);
    });
  }, []);

  const setQuantity = useCallback((id, qty) => {
    const amount = Math.max(1, Math.min(20, Number(qty) || 1));
    setItems((current) => current.map((item) => item.id === id ? { ...item, qty: amount } : item));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo(() => items.map((item) => {
    const dish = activeProducts.find((entry) => entry.id === item.id);
    return { id: item.id, qty: item.qty, dish, unitPriceEur: Number(dish?.price) || 0 };
  }).filter((line) => Boolean(line.dish)), [items, activeProducts]);

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);
  const subtotalEur = useMemo(
    () => Math.round(lines.reduce((sum, line) => sum + line.unitPriceEur * line.qty, 0) * 100) / 100,
    [lines]
  );

  const value = useMemo(() => ({
    items,
    lines,
    count,
    subtotalEur,
    addItem,
    setQuantity,
    removeItem,
    clear,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false)
  }), [items, lines, count, subtotalEur, addItem, setQuantity, removeItem, clear, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>.');
  return context;
}
