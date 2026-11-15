const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Rota pública de consulta
router.get('/', productController.listCategories);

// Rotas administrativas protegidas
router.post('/', [auth, admin], productController.createCategory);
router.put('/:id', [auth, admin], productController.updateCategory);
router.delete('/:id', [auth, admin], productController.deleteCategory);

module.exports = router;
