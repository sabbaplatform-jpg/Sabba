import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || user.role !== 'employee') return;
    try {
      const { data } = await api.get('/cart');
      setItems(data);
    } catch {}
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (package_id, options = {}) => {
    await api.post('/cart', { package_id, ...options });
    await fetchCart();
  };

  const removeFromCart = async (id) => {
    await api.delete(`/cart/${id}`);
    setItems(items => items.filter(i => i.id !== id));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((s, i) => s + Number(i.price_gbp), 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, removeFromCart, clearCart, fetchCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
