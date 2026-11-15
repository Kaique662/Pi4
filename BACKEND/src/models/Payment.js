const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    method: { type: String, enum: ['pix', 'card', 'boleto'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    transactionId: { type: String },
    paidAt: { type: Date },
    // Mercado Pago
    preferenceId: { type: String },
    statusDetail: { type: String },
    mpStatus: { type: String },
    amount: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
