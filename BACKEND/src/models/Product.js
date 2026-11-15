const mongoose = require('mongoose');

// Mantém a coleção `products` e os campos existentes, incluindo os usados pelo formulário do front.
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 5, min: 0 },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    // O front atual envia a categoria como texto; categoryId continua suportado.
    category: { type: String, trim: true, default: '' },
    modality: { type: String, trim: true, default: '' },
    team: { type: String, trim: true, default: 'Sem time' },
    images: { type: [String], default: [] },
    imageUrl: { type: String, trim: true, default: '' },
    sizes: { type: [String], default: ['P', 'M', 'G', 'GG'] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'products' }
);

module.exports = mongoose.model('Product', productSchema);
