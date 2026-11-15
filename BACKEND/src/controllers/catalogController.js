const mongoose = require('mongoose');
const Product = require('../models/Product');

// Criado por Carlos: mantém o endpoint do catálogo compatível com documentos antigos em português,
// mas sempre responde com os nomes de campos em inglês esperados pelo aplicativo mobile.
function normalizeProduct(product) {
  if (!product) return product;
  const p = typeof product.toObject === 'function' ? product.toObject() : product;
  return {
    _id: p._id,
    id: String(p._id ?? p.id ?? ''),
    name: p.name ?? p.nome ?? '',
    description: p.description ?? p.descricao ?? '',
    price: Number(p.price ?? p.preco ?? 0),
    salePrice: p.salePrice === undefined ? undefined : Number(p.salePrice),
    stock: Number(p.stock ?? p.estoque ?? 0),
    categoryId: p.categoryId ?? p.categoriaId ?? null,
    category: p.category ?? p.categoria ?? '',
    modality: p.modality ?? p.modalidade ?? '',
    team: p.team ?? p.time ?? 'Sem time',
    images: p.images ?? p.imagens ?? (p.imageUrl ? [p.imageUrl] : []),
    imageUrl: p.imageUrl ?? p.imagemUrl ?? (p.images && p.images[0]) ?? '',
    sizes: p.sizes ?? p.tamanhos ?? ['P', 'M', 'G', 'GG'],
    isActive: p.isActive ?? p.ativo ?? true,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

exports.getCatalog = async (req, res) => {
  try {
    const { search } = req.query;
    // Consulta o model padrão; fallback para campos legados em português sem alterar os documentos.
    const filter = { $or: [{ isActive: true }, { isActive: { $exists: false } }, { ativo: true }] };
    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      filter.$and = [{ $or: [{ name: regex }, { nome: regex }] }];
    }
    const products = await Product.collection.find(filter).toArray();
    return res.status(200).json(products.map(normalizeProduct));
  } catch (error) {
    console.error('[BlackWear] Erro ao carregar catálogo:', error);
    return res.status(500).json({ message: 'Erro ao carregar o catálogo.' });
  }
};

exports.getCatalogProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de produto inválido.' });
    }
    const product = await Product.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    return res.status(200).json(normalizeProduct(product));
  } catch (error) {
    console.error('[BlackWear] Erro ao buscar produto:', error);
    return res.status(500).json({ message: 'Erro ao buscar produto.' });
  }
};
