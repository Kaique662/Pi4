import { Linking } from 'react-native';
import { apiRequest } from './api';

export const paymentService = {
  // Gera o link do Checkout Pro. Os valores são calculados no back-end a partir do pedido salvo.
  async createCheckout(orderId) {
    const data = await apiRequest('/api/payments/checkout', { method: 'POST', body: { orderId } });
    if (!data.checkoutUrl) throw new Error('O servidor não retornou o link de pagamento.');
    return data;
  },
  // Consulta o Mercado Pago pelo back-end e devolve { orderStatus, paymentStatus, mpStatus, statusDetail }.
  status(orderId) {
    return apiRequest(`/api/payments/order/${encodeURIComponent(orderId)}/status`);
  },
  async open(url) {
    await Linking.openURL(url);
  },
};
