
const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

// Todas as rotas do carrinho exigem autenticação.
router.use(auth);

// Consultar carrinho
router.get('/', cartController.getCart);

// Adicionar produto
router.post('/items', cartController.addItem);

// Atualizar quantidade ou tamanho
router.patch('/items/:productId', cartController.updateItem);

// Remover produto
router.delete('/items/:productId', cartController.removeItem);

module.exports = router;
