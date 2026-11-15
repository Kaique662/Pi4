const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Address = require('../models/Address');
const Product = require('../models/Product'); // <-- Importação do Product para o estoque, criado por carlos
const { enabled: mpEnabled } = require('../config/mercadoPago');

// Checkout simples: recebe endereço (ou addressId existente) + forma de pagamento,
// transforma o carrinho atual em pedido, "paga" na hora (simulação para o MVP) e limpa o carrinho.
exports.checkout = async (req, res) => {
  try {
    const { address, addressId, paymentMethod } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ message: 'Forma de pagamento é obrigatória.' });
    }

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Seu carrinho está vazio.' });
    }

    // 1. VALIDAR ESTOQUE DOS PRODUTOS NO CARRINHO
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({ message: `Produto "${item.name}" não foi encontrado.` });
      }

      const availableStock = Number(product.stock ?? product.estoque ?? 0);
      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `Estoque insuficiente para "${item.name}". Restam apenas ${availableStock} unidades.`
        });
      }
    }

    // Resolve endereço: usa um existente ou cria um novo a partir do payload
    let finalAddressId = addressId;
    if (!finalAddressId) {
      if (!address) {
        return res.status(400).json({ message: 'Informe um endereço para entrega.' });
      }
      const newAddress = await Address.create({ ...address, userId: req.userId });
      finalAddressId = newAddress._id;
    } else {
      const ownedAddress = await Address.findOne({ _id: finalAddressId, userId: req.userId });
      if (!ownedAddress) return res.status(404).json({ message: 'Endereço não encontrado para este usuário.' });
    }

    const shippingPrice = 0; // MVP: frete grátis fake
    const totalPrice = cart.totalPrice + shippingPrice;

    // 2. DAR BAIXA NO ESTOQUE DE CADA PRODUTO
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = await Order.create({
      userId: req.userId,
      addressId: finalAddressId,
      // Com Mercado Pago configurado o pedido nasce 'pending' e só vira 'paid' pelo webhook/consulta.
      // Sem token no .env, mantém a simulação do MVP (já paga na hora).
      status: mpEnabled ? 'pending' : 'paid',
      totalPrice,
      shippingPrice,
      paymentMethod,
    });

    const orderItemsDocs = cart.items.map((item) => ({
      orderId: order._id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
    }));
    await OrderItem.insertMany(orderItemsDocs);

    await Payment.create(
      mpEnabled
        ? { orderId: order._id, method: paymentMethod, status: 'pending', amount: totalPrice }
        : {
            orderId: order._id,
            method: paymentMethod,
            status: 'paid',
            transactionId: `MVP-${new mongoose.Types.ObjectId().toString()}`,
            paidAt: new Date(),
          }
    );

    // Limpa o carrinho
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    return res.status(201).json({
      message: mpEnabled
        ? 'Pedido criado. Siga para o pagamento no Mercado Pago.'
        : 'Pedido realizado com sucesso! Agradecemos a preferência.',
      requiresPayment: mpEnabled,
      order,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao finalizar pedido.', error: err.message });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao listar pedidos.', error: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });

    const items = await OrderItem.find({ orderId: order._id });
    const payment = await Payment.findOne({ orderId: order._id });

    return res.json({ order, items, payment });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar pedido.', error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    return res.json({ message: 'Status do pedido atualizado com sucesso!', order });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao atualizar status.', error: err.message });
  }
};
