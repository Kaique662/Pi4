const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Gestão de usuários: somente administradores.
router.use(auth, admin);

router.get('/', userController.listUsers);
router.patch('/:id/role', userController.updateRole);
router.patch('/:id/status', userController.updateStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;
