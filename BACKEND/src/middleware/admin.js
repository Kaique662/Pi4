const User = require('../models/User');

function isAdmin(user) {
  const role = String(user?.role ?? user?.tipo ?? '').trim().toLowerCase();
  return ['admin', 'adm', 'administrator'].includes(role);
}

module.exports = async (req, res, next) => {
  try {
    let user = req.user;
    if (!user && req.userId) {
      user = await User.findById(req.userId);
      req.user = user;
    }
    if (!user) return res.status(401).json({ message: 'Autenticação necessária.' });
    if (!isAdmin(user)) {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao verificar permissão.' });
  }
};
