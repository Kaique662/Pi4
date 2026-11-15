import React, { createContext, useContext, useEffect, useState } from 'react';
import { productService } from '../services/productService';
import { toProductPayload } from '../utils/productForm';
const ProductsContext = createContext(null);
export function ProductsProvider({ children }) {
 const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
 async function refreshProducts() { setLoading(true); setError(''); try { setProducts(await productService.list()); } catch (e) { setError(e.message || 'Não foi possível carregar os produtos.'); } finally { setLoading(false); } }
 useEffect(() => { refreshProducts(); }, []);
 async function createProduct(form) { const created = await productService.create(form); setProducts(current => [...current.filter(p => p.id !== created.id), created]); return created; }
 async function updateProduct(id, form) { const payload = toProductPayload(form); const updated = await productService.update(id, payload); setProducts(current => current.map(p => p.id === id ? updated : p)); return updated; }
 async function deleteProduct(id) { await productService.remove(id); setProducts(current => current.filter(p => p.id !== id)); }
 return <ProductsContext.Provider value={{ products, loading, error, refreshProducts, createProduct, updateProduct, deleteProduct }}>{children}</ProductsContext.Provider>;
}
export function useProducts() { const context = useContext(ProductsContext); if (!context) throw new Error('useProducts precisa estar dentro de ProductsProvider.'); return context; }
