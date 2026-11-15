
import { apiRequest } from './api';

export const cartService = {
  // Buscar o carrinho do usuário logado
  async get() {
    return apiRequest('/api/cart');
  },

  // Adicionar produto ao carrinho
  async add(productId, quantity = 1, size = 'Único') {
    if (!productId) {
      throw new Error('Produto inválido.');
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('A quantidade deve ser maior que zero.');
    }

    return apiRequest('/api/cart/items', {
      method: 'POST',
      body: {
        productId,
        quantity,
        size,
      },
    });
  },

  // Atualizar quantidade do produto
  async update(productId, quantity, size = 'Único') {
    if (!productId) {
      throw new Error('Produto inválido.');
    }

    if (!Number.isInteger(quantity)) {
      throw new Error('Informe uma quantidade inteira.');
    }

    return apiRequest(
      `/api/cart/items/${encodeURIComponent(productId)}`,
      {
        method: 'PATCH',
        body: { quantity, size },
      }
    );
  },

  // Remover produto do carrinho
  async remove(productId, size = 'Único') {
    if (!productId) {
      throw new Error('Produto inválido.');
    }

    return apiRequest(
      `/api/cart/items/${encodeURIComponent(productId)}?size=${encodeURIComponent(size)}`,
      { method: 'DELETE' }
    );
  },
};
