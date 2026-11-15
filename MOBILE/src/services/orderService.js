import { apiRequest } from './api';
export function orderId(order) { return String(order?._id || order?.id || ''); }
export const orderService = {
  async list() {
    const data = await apiRequest('/api/orders');
    return Array.isArray(data) ? data : data.orders || [];
  },
  async get(id) {
    if (!id) throw new Error('O servidor não retornou o ID do pedido. Consulte seu histórico antes de tentar novamente.');
    const data = await apiRequest(`/api/orders/${encodeURIComponent(id)}`);
    if (!orderId(data.order)) throw new Error('Resposta inválida ao consultar o pedido.');
    return { ...data.order, items: Array.isArray(data.items) ? data.items : [] };
  },
  async checkout(payload) {
    const data = await apiRequest('/api/orders/checkout', { method: 'POST', body: payload });
    if (!orderId(data.order)) throw new Error('O servidor não retornou o ID do pedido. Consulte seu histórico antes de tentar novamente.');
    return { ...data.order, requiresPayment: Boolean(data.requiresPayment) };
  },
};
