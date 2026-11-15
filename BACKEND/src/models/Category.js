const mongoose = require('mongoose');

// Criado por Carlos: model de categorias padronizado em inglês e vinculado à coleção existente `categories`.
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    image: { type: String },
  },
  { timestamps: true, collection: 'categories' }
);

module.exports = mongoose.model('Category', categorySchema);
