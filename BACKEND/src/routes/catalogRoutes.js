
const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

// Listar produtos e pesquisar no catálogo
router.get('/', catalogController.getCatalog);

// Consultar um produto específico
router.get('/:id', catalogController.getCatalogProduct);

module.exports = router;
