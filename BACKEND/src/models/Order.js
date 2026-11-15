const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'canceled'],
      default: 'pending',
    },
    totalPrice: { type: Number, required: true },
    shippingPrice: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['pix', 'card', 'boleto'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
