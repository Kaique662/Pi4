
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Converte documentos antigos em português para o formato usado pelo aplicativo.
function normalizeProduct(product) {
  if (!product) return null;

  const p =
    typeof product.toObject === 'function'
      ? product.toObject()
      : product;

  const images =
    p.images ??
    p.imagens ??
    (p.imageUrl || p.imagemUrl
      ? [p.imageUrl || p.imagemUrl]
      : []);

  return {
    ...p,
    id: String(p._id ?? p.id ?? ''),
    name: p.name ?? p.nome ?? '',
    description: p.description ?? p.descricao ?? '',
    price: Number(p.price ?? p.preco ?? 0),

    salePrice:
      p.salePrice != null
        ? Number(p.salePrice)
        : p.precoPromocional != null
          ? Number(p.precoPromocional)
          : undefined,

    stock: Number(p.stock ?? p.estoque ?? 0),
    minimumStock: Number(p.minimumStock ?? p.estoqueMinimo ?? 5),
    categoryId: p.categoryId ?? p.categoriaId ?? null,
    category: p.category ?? p.categoria ?? '',
    modality: p.modality ?? p.modalidade ?? '',
    team: p.team ?? p.time ?? 'Sem time',
    images,
    imageUrl: p.imageUrl ?? p.imagemUrl ?? images[0] ?? '',
    sizes: p.sizes ?? p.tamanhos ?? ['P', 'M', 'G', 'GG'],
    isActive: p.isActive ?? p.ativo ?? true,
  };
}

// LISTAR PRODUTOS
exports.listProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    const filter = {
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
        { ativo: true },
        { ativo: { $exists: false }, isActive: { $exists: false } },
      ],
    };

    if (category) {
      filter.$and = [
        {
          $or: [
            { categoryId: category },
            { categoriaId: category },
            { category: category },
            { categoria: category },
          ],
        },
      ];
    }

    if (search) {
      const escapedSearch = String(search).replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

      const regex = { $regex: escapedSearch, $options: 'i' };

      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { name: regex },
            { nome: regex },
            { description: regex },
            { descricao: regex },
            { category: regex },
            { categoria: regex },
            { team: regex },
            { time: regex },
          ],
        },
      ];
    }

    const products = await Product.collection.find(filter).toArray();

    return res.json(products.map(normalizeProduct));
  } catch (err) {
    console.error('Erro ao listar produtos:', err);

    return res.status(500).json({
      message: 'Erro ao listar produtos.',
    });
  }
};

exports.getAllProducts = exports.listProducts;

// BUSCAR PRODUTO POR ID
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'ID de produto inválido.',
      });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        message: 'Produto não encontrado.',
      });
    }

    return res.json(normalizeProduct(product));
  } catch (err) {
    console.error('Erro ao buscar produto:', err);

    return res.status(500).json({
      message: 'Erro ao buscar produto.',
    });
  }
};

exports.getProductById = exports.getProduct;

// CADASTRAR PRODUTO
exports.createProduct = async (req, res) => {
  try {
    const body = req.body || {};

    const price = Number(body.price ?? body.preco);
    const name = String(body.name ?? body.nome ?? '').trim();
    const category = String(body.category ?? body.categoria ?? '').trim();

    if (name.length < 3) return res.status(400).json({ message: 'O nome do produto deve ter pelo menos 3 caracteres.' });
    if (!/^[\p{L}\p{N}][\p{L}\p{N} .,'’()_-]*$/u.test(name)) return res.status(400).json({ message: 'O nome do produto contém caracteres inválidos.' });
    if (!/^[\p{L} ]+$/u.test(category)) return res.status(400).json({ message: 'A categoria deve conter apenas letras e espaços.' });

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        message: 'Informe um preço maior que zero.',
      });
    }

    const rawSalePrice = body.salePrice ?? body.precoPromocional;
    let salePrice;

    if (
      rawSalePrice !== undefined &&
      rawSalePrice !== null &&
      rawSalePrice !== ''
    ) {
      salePrice = Number(rawSalePrice);

      if (
        !Number.isFinite(salePrice) ||
        salePrice <= 0 ||
        salePrice >= price
      ) {
        return res.status(400).json({
          message:
            'O preço promocional deve ser maior que zero e menor que o preço normal.',
        });
      }
    }

    const rawStock = body.stock ?? body.estoque ?? 0;
    const stock = Number(rawStock);
    const minimumStock = Number(body.minimumStock ?? body.estoqueMinimo ?? 5);
    if (!Number.isInteger(minimumStock) || minimumStock < 0) return res.status(400).json({ message: 'O estoque mínimo deve ser um número inteiro igual ou maior que zero.' });

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        message: 'O estoque deve ser um número inteiro igual ou maior que zero.',
      });
    }

    const rawImages =
      body.images ??
      body.imagens ??
      (body.imageUrl || body.imagemUrl
        ? [body.imageUrl || body.imagemUrl]
        : []);

    const productData = {
      name,
      description: body.description ?? body.descricao ?? '',
      price,
      stock,
      minimumStock,
      categoryId: body.categoryId ?? body.categoriaId,
      category,
      modality: body.modality ?? body.modalidade ?? '',
      team: body.team ?? body.time ?? 'Sem time',
      images: Array.isArray(rawImages) ? rawImages : [],
      imageUrl:
        body.imageUrl ??
        body.imagemUrl ??
        (Array.isArray(rawImages) ? rawImages[0] : '') ??
        '',
      sizes: body.sizes ?? body.tamanhos ?? ['P', 'M', 'G', 'GG'],
      isActive: body.isActive ?? body.ativo ?? true,
    };

    if (salePrice !== undefined) {
      productData.salePrice = salePrice;
    }

    if (!productData.images.length || !String(productData.images[0] || '').trim()) return res.status(400).json({ message: 'A foto do produto é obrigatória.' });
    const product = await Product.create(productData);

    return res.status(201).json({
      message: 'Produto criado com sucesso!',
      product: normalizeProduct(product),
    });
  } catch (err) {
    console.error('Erro ao criar produto:', err);

    return res.status(400).json({
      message: 'Erro ao criar produto.',
      error: err.message,
    });
  }
};

// ATUALIZAR PRODUTO
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'ID de produto inválido.',
      });
    }

    const updates = {};

    const fields = {
      name: ['name', 'nome'],
      description: ['description', 'descricao'],
      price: ['price', 'preco'],
      salePrice: ['salePrice', 'precoPromocional'],
      stock: ['stock', 'estoque'],
      minimumStock: ['minimumStock', 'estoqueMinimo'],
      categoryId: ['categoryId', 'categoriaId'],
      category: ['category', 'categoria'],
      modality: ['modality', 'modalidade'],
      team: ['team', 'time'],
      imageUrl: ['imageUrl', 'imagemUrl'],
      images: ['images', 'imagens'],
      sizes: ['sizes', 'tamanhos'],
      isActive: ['isActive', 'ativo'],
    };

    for (const [field, aliases] of Object.entries(fields)) {
      const key = aliases.find((alias) => body[alias] !== undefined);
      if (key) updates[field] = body[key];
    }
    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();
      if (updates.name.length < 3 || !/^[\p{L}\p{N}][\p{L}\p{N} .,'’()_-]*$/u.test(updates.name)) return res.status(400).json({ message: 'Informe um nome de produto válido.' });
    }
    if (updates.category !== undefined) {
      updates.category = String(updates.category).trim();
      if (!/^[\p{L} ]+$/u.test(updates.category)) return res.status(400).json({ message: 'A categoria deve conter apenas letras e espaços.' });
    }

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);

      if (!Number.isFinite(updates.price) || updates.price <= 0) {
        return res.status(400).json({
          message: 'Informe um preço maior que zero.',
        });
      }
    }

    if (updates.salePrice !== undefined && updates.salePrice !== null && updates.salePrice !== '') {
      updates.salePrice = Number(updates.salePrice);

      if (
        !Number.isFinite(updates.salePrice) ||
        updates.salePrice <= 0
      ) {
        return res.status(400).json({
          message: 'O preço promocional deve ser maior que zero.',
        });
      }

      const current = await Product.findById(id).lean();

      if (!current) {
        return res.status(404).json({
          message: 'Produto não encontrado.',
        });
      }

      const finalPrice = updates.price ?? current.price ?? current.preco;

      if (updates.salePrice >= Number(finalPrice)) {
        return res.status(400).json({
          message:
            'O preço promocional deve ser menor que o preço normal.',
        });
      }
    }

    if (updates.minimumStock !== undefined) { updates.minimumStock = Number(updates.minimumStock); if (!Number.isInteger(updates.minimumStock) || updates.minimumStock < 0) return res.status(400).json({ message: 'O estoque mínimo deve ser um número inteiro igual ou maior que zero.' }); }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);

      if (!Number.isInteger(updates.stock) || updates.stock < 0) {
        return res.status(400).json({
          message: 'O estoque deve ser um número inteiro igual ou maior que zero.',
        });
      }
    }

    if (updates.imageUrl !== undefined && !String(updates.imageUrl || '').trim() && updates.images === undefined) return res.status(400).json({ message: 'A foto do produto é obrigatória.' });
    if (updates.images !== undefined && (!Array.isArray(updates.images) || !updates.images.length || !String(updates.images[0] || '').trim())) {
      return res.status(400).json({
        message: 'A foto do produto é obrigatória e deve ser uma URL válida.',
      });
    }

    if (updates.imageUrl !== undefined && updates.images === undefined) {
      updates.images = updates.imageUrl ? [updates.imageUrl] : [];
    }

    if (updates.images !== undefined && updates.imageUrl === undefined) {
      updates.imageUrl = updates.images[0] ?? '';
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        message: 'Produto não encontrado.',
      });
    }

    return res.json({
      message: 'Produto atualizado com sucesso!',
      product: normalizeProduct(product),
    });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);

    return res.status(400).json({
      message: 'Erro ao atualizar produto.',
      error: err.message,
    });
  }
};

// EXCLUIR PRODUTO
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'ID de produto inválido.',
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        message: 'Produto não encontrado.',
      });
    }

    return res.json({
      message: 'Produto removido com sucesso!',
    });
  } catch (err) {
    console.error('Erro ao remover produto:', err);

    return res.status(500).json({
      message: 'Erro ao remover produto.',
    });
  }
};

// LISTAR CATEGORIAS
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.collection.find({}).toArray();

    return res.json(
      categories.map((category) => ({
        ...category,
        id: String(category._id ?? category.id ?? ''),
        name: category.name ?? category.nome ?? '',
        description: category.description ?? category.descricao ?? '',
        parentId: category.parentId ?? category.categoriaPaiId ?? null,
        image: category.image ?? category.imagem ?? '',
      }))
    );
  } catch (err) {
    console.error('Erro ao listar categorias:', err);

    return res.status(500).json({
      message: 'Erro ao listar categorias.',
    });
  }
};

// CADASTRAR CATEGORIA
exports.createCategory = async (req, res) => {
  try {
    const body = req.body || {};
    const name = body.name ?? body.nome;

    if (!name || !/^[\p{L} ]+$/u.test(String(name).trim())) {
      return res.status(400).json({
        message: 'A categoria deve conter apenas letras e espaços, sem números ou caracteres especiais.',
      });
    }

    const slug =
      body.slug ??
      String(name)
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const category = await Category.create({
      name: String(name).trim(),
      slug,
      description: body.description ?? body.descricao ?? '',
      parentId: body.parentId ?? body.categoriaPaiId ?? null,
      image: body.image ?? body.imagem ?? '',
    });

    return res.status(201).json({
      message: 'Categoria criada com sucesso!',
      category,
    });
  } catch (err) {
    console.error('Erro ao criar categoria:', err);

    return res.status(400).json({
      message: 'Erro ao criar categoria.',
      error: err.message,
    });
  }
};

// ATUALIZAR CATEGORIA
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'ID de categoria inválido.',
      });
    }

    const updates = {};
    const fields = {
      name: ['name', 'nome'],
      slug: ['slug'],
      description: ['description', 'descricao'],
      parentId: ['parentId', 'categoriaPaiId'],
      image: ['image', 'imagem'],
    };

    for (const [field, aliases] of Object.entries(fields)) {
      const key = aliases.find((alias) => body[alias] !== undefined);
      if (key) updates[field] = body[key];
    }
    if (updates.name !== undefined && !/^[\p{L} ]+$/u.test(String(updates.name).trim())) return res.status(400).json({ message: 'A categoria deve conter apenas letras e espaços.' });
    if (updates.name !== undefined && updates.slug === undefined) updates.slug = String(updates.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const category = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        message: 'Categoria não encontrada.',
      });
    }

    return res.json({
      message: 'Categoria atualizada com sucesso!',
      category,
    });
  } catch (err) {
    console.error('Erro ao atualizar categoria:', err);

    return res.status(400).json({
      message: 'Erro ao atualizar categoria.',
      error: err.message,
    });
  }
};

// EXCLUIR CATEGORIA
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'ID de categoria inválido.',
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        message: 'Categoria não encontrada.',
      });
    }

    return res.json({
      message: 'Categoria removida com sucesso!',
    });
  } catch (err) {
    console.error('Erro ao remover categoria:', err);

    return res.status(500).json({
      message: 'Erro ao remover categoria.',
    });
  }
};
