import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useProducts } from './ProductsContext';
import { useAuth } from './AuthContext';
import { apiRequest } from '../services/api';
import { canSetQuantity, remainingStock } from '../utils/stock';
const CartContext = createContext(null);
function normalizeCart(data, products) {
  return (data?.items || []).map(item => {
    const id = String(item.productId?._id || item.productId || item.id || '');
    const product = products.find(p => p.id === id) || {};
    return { id, name: item.name || product.name || 'Produto indisponível', price: Number(item.price ?? product.salePrice ?? product.price ?? 0), size: item.size || 'Único', quantity: Number(item.quantity ?? 1) };
  }).filter(item => item.id && Number.isSafeInteger(item.quantity) && item.quantity > 0);
}
export function CartProvider({ children }) {
  const { products, loading: productsLoading } = useProducts();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const session = useRef(user?.id);
  session.current = user?.id;
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const productsRef = useRef(products);
  productsRef.current = products;
  function accept(data, owner) {
    if (owner !== session.current) return;
    const next = normalizeCart(data, productsRef.current);
    cartRef.current = next; setCart(next);
  }
  async function refreshCart() {
    const owner = session.current;
    if (!owner) { cartRef.current = []; setCart([]); return; }
    const data = await apiRequest('/api/cart');
    accept(data, owner);
  }
  useEffect(() => {
    const owner = user?.id;
    let active = true;
    cartRef.current = []; setCart([]); setError('');
    if (owner) apiRequest('/api/cart').then(data => { if (active) accept(data, owner); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [user?.id]);
  async function mutate(action) {
    if (pending.current) return false;
    if (!session.current) { setError('Entre na sua conta para salvar seu carrinho.'); return false; }
    const owner = session.current;
    pending.current = true; setBusy(true); setError('');
    try { const data = await action(); accept(data, owner); return owner === session.current; }
    catch (e) { if (owner === session.current) setError(e.message || 'Não foi possível atualizar o carrinho.'); return false; }
    finally { pending.current = false; setBusy(false); }
  }
  async function addProduct(product, size) {
    const current = productsRef.current.find(p => p.id === product.id);
    if (productsLoading || !current || remainingStock(cartRef.current, current) < 1) {
      setError('Limite de estoque atingido para este produto.'); return false;
    }
    return mutate(() => apiRequest('/api/cart/items', { method: 'POST', body: { productId: current.id, size: size || 'Único', quantity: 1 } }));
  }
  function setQuantity(item, quantity) {
    if (!item) return Promise.resolve(false);
    const current = productsRef.current.find(p => p.id === item.id);
    // Reduções e remoções continuam possíveis após queda de estoque ou exclusão do produto.
    if (quantity > item.quantity && (productsLoading || !canSetQuantity(cartRef.current, item, quantity, current))) {
      setError('Limite de estoque atingido para este produto.'); return Promise.resolve(false);
    }
    return mutate(() => apiRequest(`/api/cart/items/${encodeURIComponent(item.id)}`, { method: 'PATCH', body: { quantity, size: item.size } }));
  }
  function increase(index) { const item = cartRef.current[index]; return setQuantity(item, item?.quantity + 1); }
  function decrease(index) { const item = cartRef.current[index]; return setQuantity(item, item?.quantity - 1); }
  function remove(index) {
    const item = cartRef.current[index];
    if (!item) return Promise.resolve(false);
    return mutate(() => apiRequest(`/api/cart/items/${encodeURIComponent(item.id)}?size=${encodeURIComponent(item.size)}`, { method: 'DELETE' }));
  }
  const totalQuantity = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const total = useMemo(() => cart.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100, [cart]);
  return <CartContext.Provider value={{ cart, totalQuantity, total, addProduct, increase, decrease, remove, refreshCart, busy, error, clearError: () => setError('') }}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('useCart precisa ser usado dentro de CartProvider.'); return context; }
