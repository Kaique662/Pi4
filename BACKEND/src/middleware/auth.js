const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido. Faça login novamente.' });
  }

  const token = header.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }

  try {
    // Conta excluída ou desativada pelo admin perde o acesso na hora, mesmo com token válido.
    const user = await User.findById(payload.id).select('role isActive');
    if (!user) return res.status(401).json({ message: 'Conta não encontrada. Faça login novamente.' });
    if (user.isActive === false) return res.status(403).json({ message: 'Sua conta foi desativada. Fale com o suporte.' });
    req.userId = payload.id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao validar sessão.' });
  }
}

module.exports = auth;
