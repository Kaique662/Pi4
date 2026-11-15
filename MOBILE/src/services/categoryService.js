import { apiRequest } from './api';

function normalizeCategory(item) {
  const category = item?.category || item;
  if (!category) return null;
  return {
    ...category,
    id: String(category.id || category._id || ''),
    name: String(category.name || category.nome || '').trim(),
  };
}

export const categoryService = {
  async list() {
    const data = await apiRequest('/api/categories');
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.categories)
        ? data.categories
        : [];
    return items.map(normalizeCategory).filter(item => item && item.id && item.name);
  },

  async create(name) {
    const data = await apiRequest('/api/categories', {
      method: 'POST',
      body: { name: name.trim() },
    });
    const category = normalizeCategory(data);
    if (!category?.id) throw new Error('O servidor não retornou a categoria criada.');
    return category;
  },

  async remove(id) {
    return apiRequest(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
