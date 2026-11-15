export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const hasPromotion = product => Number.isFinite(product.salePrice) && product.salePrice > 0 && product.salePrice < product.price;
export const getPrice = product => hasPromotion(product) ? product.salePrice : product.price;
export const getDiscount = product => hasPromotion(product) ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
export const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const emptyFilters = { team: 'Todos', modality: 'Todas', category: 'Todas', maxPrice: 'Qualquer', sort: 'Destaques' };
export function filterProducts(products, filters = emptyFilters, query = '', promotionsOnly = false) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const result = products.filter(product => {
    const searchable = normalize(`${product.name} ${product.team} ${product.modality} ${product.category}`);
    return terms.every(term => searchable.includes(term))
      && (filters.team === 'Todos' || product.team === filters.team)
      && (filters.modality === 'Todas' || product.modality === filters.modality)
      && (filters.category === 'Todas' || product.category === filters.category)
      && (filters.maxPrice === 'Qualquer' || Math.round(getPrice(product) * 100) <= Number(filters.maxPrice) * 100)
      && (!promotionsOnly || hasPromotion(product));
  });
  if (filters.sort === 'Menor preço') result.sort((a, b) => getPrice(a) - getPrice(b));
  if (filters.sort === 'Maior preço') result.sort((a, b) => getPrice(b) - getPrice(a));
  if (filters.sort === 'Maior desconto') result.sort((a, b) => getDiscount(b) - getDiscount(a));
  return result;
}
