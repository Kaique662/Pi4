const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Públicas (chamadas pelo Mercado Pago / navegador)
router.post('/webhook', paymentController.webhook);
router.get('/return/:result', paymentController.paymentReturn);

// Autenticadas
router.post('/checkout', auth, paymentController.createCheckout);
router.get('/order/:orderId/status', auth, paymentController.getOrderPaymentStatus);

module.exports = router;
