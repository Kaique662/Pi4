const mongoose = require('mongoose');
const {
  Preference,
  Payment: MPPayment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} = require('mercadopago');

const { client: mpClient, enabled: mpEnabled } = require('../config/mercadoPago');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Product = require('../models/Product');

const APP_SCHEME = process.env.APP_SCHEME || 'blackwear';
const publicUrl = () => (process.env.API_PUBLIC_URL || '').replace(/\/+$/, '');

function requireMp(res) {
  if (!mpEnabled) {
    res.status(503).json({ message: 'Mercado Pago não configurado (MP_ACCESS_TOKEN ausente no .env).' });
    return false;
  }
  return true;
}

// Só aceitamos voltar para o app (Expo Go usa exp://, build próprio usa o scheme).
function safeAppUrl(raw) {
  try {
    const u = new URL(raw);
    if (['exp:', 'exps:', `${APP_SCHEME}:`].includes(u.protocol)) return u;
  } catch {}
  return null;
}

function mapMethod(mp) {
  if (mp.payment_method_id === 'pix') return 'pix';
  if (mp.payment_type_id === 'ticket') return 'boleto';
  if (['credit_card', 'debit_card', 'prepaid_card'].includes(mp.payment_type_id)) return 'card';
  return null;
}

// Devolve ao estoque os itens de um pedido cancelado.
async function restoreStock(orderId) {
  const items = await OrderItem.find({ orderId });
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }
}

// Aplica o estado de um pagamento do Mercado Pago no pedido.
// É idempotente: a mesma notificação pode chegar várias vezes sem duplicar efeitos.
async function applyMpPayment(mp) {
  const orderId = mp.external_reference;
  if (!orderId || !mongoose.isValidObjectId(orderId)) return null;

  const order = await Order.findById(orderId);
  if (!order) return null;

  // Segurança: o valor pago precisa bater com o pedido salvo no banco.
  if (Math.abs(Number(mp.transaction_amount) - Number(order.totalPrice)) > 0.01) {
    console.warn(`[MP] Valor divergente no pedido ${orderId}: pago ${mp.transaction_amount}, esperado ${order.totalPrice}`);
    return null;
  }

  const method = mapMethod(mp);
  const update = {
    transactionId: String(mp.id),
    mpStatus: mp.status,
    statusDetail: mp.status_detail,
    amount: Number(mp.transaction_amount),
  };
  if (method) update.method = method;

  switch (mp.status) {
    case 'approved': {
      update.status = 'paid';
      update.paidAt = mp.date_approved ? new Date(mp.date_approved) : new Date();
      // Só um processamento consegue virar pending -> paid.
      await Order.findOneAndUpdate(
        { _id: orderId, status: 'pending' },
        { status: 'paid', ...(method ? { paymentMethod: method } : {}) }
      );
      break;
    }
    case 'rejected':
      // Pedido continua pending: o cliente pode tentar pagar de novo no mesmo checkout.
      update.status = 'failed';
      break;
    case 'cancelled':
    case 'refunded':
    case 'charged_back': {
      update.status = 'failed';
      const canceled = await Order.findOneAndUpdate(
        { _id: orderId, status: 'pending' },
        { status: 'canceled' }
      );
      if (canceled) await restoreStock(orderId); // só devolve estoque na 1ª vez
      break;
    }
    default: // pending, in_process, in_mediation, authorized
      update.status = 'pending';
  }

  // Não rebaixa um pagamento já aprovado por causa de notificação fora de ordem.
  const current = await Payment.findOne({ orderId });
  if (current && current.status === 'paid' && update.status !== 'paid') {
    return current;
  }

  return Payment.findOneAndUpdate(
    { orderId },
    { $set: update, $setOnInsert: { method: method || order.paymentMethod } },
    { new: true, upsert: true }
  );
}

// POST /api/payments/checkout  { orderId, returnUrl? }
exports.createCheckout = async (req, res) => {
  try {
    if (!requireMp(res)) return;

    const { orderId, returnUrl } = req.body;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'orderId inválido.' });
    }

    const order = await Order.findOne({ _id: orderId, userId: req.userId });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    if (order.status !== 'pending') {
      return res.status(409).json({ message: 'Este pedido não está aguardando pagamento.' });
    }

    // Valores SEMPRE vindos do banco, nunca do celular.
    const orderItems = await OrderItem.find({ orderId: order._id });
    const items = orderItems.map((i) => ({
      id: String(i.productId),
      title: i.size ? `${i.name} (${i.size})` : i.name,
      quantity: i.quantity,
      unit_price: Number(i.price),
      currency_id: 'BRL',
    }));
    if (order.shippingPrice > 0) {
      items.push({ id: 'frete', title: 'Frete', quantity: 1, unit_price: Number(order.shippingPrice), currency_id: 'BRL' });
    }

    const body = {
      items,
      external_reference: String(order._id),
      statement_descriptor: 'BLACKWEAR',
    };

    // URLs públicas (ngrok/deploy). Sem elas o checkout funciona igual,
    // só não há webhook nem retorno automático (o app consulta /status).
    const base = publicUrl();
    if (base) {
      body.notification_url = `${base}/api/payments/webhook`;
      const to = safeAppUrl(returnUrl);
      const q = to ? `?to=${encodeURIComponent(to.toString())}` : '';
      body.back_urls = {
        success: `${base}/api/payments/return/success${q}`,
        pending: `${base}/api/payments/return/pending${q}`,
        failure: `${base}/api/payments/return/failure${q}`,
      };
      body.auto_return = 'approved';
    }

    const pref = await new Preference(mpClient).create({ body });

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { $set: { preferenceId: pref.id, amount: order.totalPrice } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({
      orderId: String(order._id),
      preferenceId: pref.id,
      checkoutUrl: pref.init_point,
      sandboxUrl: pref.sandbox_init_point,
    });
  } catch (err) {
    console.error('[MP] Erro ao criar preferência:', err.message, err.cause || '');
    return res.status(500).json({ message: 'Erro ao criar checkout do Mercado Pago.', error: err.message });
  }
};

// GET /api/payments/order/:orderId/status
// Consulta o Mercado Pago na hora e sincroniza. Serve de plano B quando o webhook não chega.
exports.getOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'orderId inválido.' });
    }

    let order = await Order.findOne({ _id: orderId, userId: req.userId });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });

    if (mpEnabled && order.status === 'pending') {
      try {
        const found = await new MPPayment(mpClient).search({
          options: { external_reference: String(order._id), sort: 'date_created', criteria: 'desc' },
        });
        const results = found.results || [];
        const best = results.find((p) => p.status === 'approved') || results[0];
        if (best) await applyMpPayment(best);
      } catch (e) {
        console.warn('[MP] Falha ao sincronizar pagamento:', e.message);
      }
      order = await Order.findById(orderId);
    }

    const payment = await Payment.findOne({ orderId });
    return res.json({
      orderId: String(order._id),
      orderStatus: order.status,
      paymentStatus: payment?.status || 'pending',
      mpStatus: payment?.mpStatus || null,
      statusDetail: payment?.statusDetail || null,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao consultar pagamento.', error: err.message });
  }
};

// POST /api/payments/webhook  (público: quem chama é o Mercado Pago)
exports.webhook = async (req, res) => {
  try {
    if (!mpEnabled) return res.sendStatus(200);

    const type = req.query.type || req.body?.type || req.query.topic;
    const dataId = req.query['data.id'] || req.body?.data?.id || req.query.id;

    // Valida a assinatura quando MP_WEBHOOK_SECRET está configurado.
    if (process.env.MP_WEBHOOK_SECRET) {
      WebhookSignatureValidator.validate({
        xSignature: req.headers['x-signature'],
        xRequestId: req.headers['x-request-id'],
        dataId: req.query['data.id'],
        secret: process.env.MP_WEBHOOK_SECRET,
        // Sem toleranceSeconds de propósito: o SDK lê o ts como segundos, mas o Mercado Pago
        // manda em milissegundos, então a checagem rejeitaria webhooks legítimos.
        // Replay é inofensivo aqui: reconsultamos o pagamento no MP e o processamento é idempotente.
      });
    } else {
      console.warn('[MP] MP_WEBHOOK_SECRET ausente: assinatura NÃO validada (use só em teste).');
    }

    if (type === 'payment' && dataId) {
      // Nunca confiamos no corpo da notificação: buscamos o pagamento direto no Mercado Pago.
      const mp = await new MPPayment(mpClient).get({ id: dataId });
      await applyMpPayment(mp);
    }
    return res.sendStatus(200);
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      console.warn('[MP] Webhook com assinatura inválida:', err.reason);
      return res.sendStatus(401);
    }
    console.error('[MP] Erro no webhook:', err.message);
    return res.sendStatus(500); // o Mercado Pago tenta de novo
  }
};

// GET /api/payments/return/:result  (o Mercado Pago redireciona o navegador para cá)
exports.paymentReturn = (req, res) => {
  const { result } = req.params;
  const { to, ...mpParams } = req.query;
  const target = safeAppUrl(to);

  const labels = {
    success: 'Pagamento recebido! Já pode voltar para o app.',
    pending: 'Pagamento pendente. Volte para o app para acompanhar.',
    failure: 'O pagamento não foi concluído. Volte para o app e tente de novo.',
  };
  const message = labels[result] || 'Volte para o app.';

  if (!target) {
    return res.send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>BlackWear</h2><p>${message}</p></body>`);
  }

  target.searchParams.set('result', result);
  for (const [k, v] of Object.entries(mpParams)) {
    if (typeof v === 'string') target.searchParams.set(k, v);
  }
  const href = target.toString().replace(/"/g, '&quot;');
  return res.send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="refresh" content="0;url=${href}"><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>BlackWear</h2><p>${message}</p><p><a href="${href}">Voltar ao app</a></p></body>`);
};
