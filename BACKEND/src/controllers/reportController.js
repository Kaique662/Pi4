const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');
const Address = require('../models/Address');

// GET /api/reports/export  (admin)
// Dados de vendas em JSON para análise (disciplina de Análise de Dados e Estatística).
// Clientes saem anonimizados: só id, data de cadastro e cidade/UF do pedido. Nada de nome, e-mail ou telefone.
exports.exportData = async (req, res) => {
  try {
    const [orders, items, payments, products, users, addresses] = await Promise.all([
      Order.find().sort({ createdAt: 1 }).lean(),
      OrderItem.find().lean(),
      Payment.find().lean(),
      Product.find().lean(),
      User.find({}, { role: 1, createdAt: 1 }).lean(),
      Address.find({}, { city: 1, state: 1 }).lean(),
    ]);

    const itemsByOrder = {};
    for (const i of items) {
      (itemsByOrder[i.orderId] ||= []).push({
        productId: String(i.productId),
        name: i.name,
        size: i.size || null,
        price: i.price,
        quantity: i.quantity,
        subtotal: Number((i.price * i.quantity).toFixed(2)),
      });
    }
    const paymentByOrder = Object.fromEntries(payments.map((p) => [String(p.orderId), p]));
    const addressById = Object.fromEntries(addresses.map((a) => [String(a._id), a]));

    return res.json({
      source: 'BlackWear',
      generatedAt: new Date().toISOString(),
      currency: 'BRL',
      orders: orders.map((o) => {
        const payment = paymentByOrder[String(o._id)];
        const address = addressById[String(o.addressId)];
        return {
          id: String(o._id),
          customerId: String(o.userId),
          createdAt: o.createdAt,
          status: o.status,
          paymentMethod: o.paymentMethod,
          totalPrice: o.totalPrice,
          shippingPrice: o.shippingPrice || 0,
          city: address?.city || null,
          state: address?.state || null,
          payment: payment ? { status: payment.status, paidAt: payment.paidAt || null } : null,
          items: itemsByOrder[String(o._id)] || [],
        };
      }),
      products: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        category: p.category || '',
        modality: p.modality || '',
        team: p.team || '',
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock ?? 0,
        minimumStock: p.minimumStock ?? 5,
        isActive: p.isActive !== false,
        createdAt: p.createdAt,
      })),
      customers: users
        .filter((u) => !['admin', 'adm', 'administrator'].includes(String(u.role || '').toLowerCase()))
        .map((u) => ({ id: String(u._id), createdAt: u.createdAt })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao exportar dados.', error: err.message });
  }
};
