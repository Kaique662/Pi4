const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Rotas Públicas (Qualquer um pode listar e ver detalhes)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// parte de baixo adicionada pelo carlos, para apenas adm editar o produto
// Rotas Privadas para Administradores (CRUD)
router.post('/', [auth, admin], productController.createProduct);
router.put('/:id', [auth, admin], productController.updateProduct);
router.delete('/:id', [auth, admin], productController.deleteProduct);

module.exports = router;
