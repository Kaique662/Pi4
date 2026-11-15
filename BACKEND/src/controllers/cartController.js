const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], totalPrice: 0 });
  }
  return cart;
}

exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    return res.json(cart);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar carrinho.', error: err.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId é obrigatório.' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });

    const qty = quantity && quantity > 0 ? quantity : 1;

    const cart = await getOrCreateCart(req.userId);

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name || product.nome,
        price: (product.salePrice ?? product.precoPromocional) > 0 && (product.salePrice ?? product.precoPromocional) < (product.price ?? product.preco) ? (product.salePrice ?? product.precoPromocional) : (product.price ?? product.preco),
        size,
        quantity: qty,
        image: product.images?.[0] || product.imagens?.[0] || product.imageUrl || product.imagemUrl || '',
      });
    }

    cart.recalculateTotal();
    await cart.save();

    return res.status(201).json(cart);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao adicionar item ao carrinho.', error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, size } = req.body;

    const cart = await getOrCreateCart(req.userId);
    const matches = (i) => i.productId.toString() === productId && i.size === size;
    const item = cart.items.find(matches);

    if (!item) return res.status(404).json({ message: 'Item não encontrado no carrinho.' });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => !matches(i));
    } else {
      item.quantity = quantity;
    }

    cart.recalculateTotal();
    await cart.save();

    return res.json(cart);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao atualizar item do carrinho.', error: err.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size } = req.query;
    const cart = await getOrCreateCart(req.userId);

    cart.items = cart.items.filter(
      (i) => !(i.productId.toString() === productId && i.size === size)
    );
    cart.recalculateTotal();
    await cart.save();

    return res.json(cart);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao remover item do carrinho.', error: err.message });
  }
};
