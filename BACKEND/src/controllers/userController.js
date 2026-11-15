const mongoose = require('mongoose');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const ADMIN_ROLES = ['admin', 'adm', 'administrator'];
const isAdminRole = (role) => ADMIN_ROLES.includes(String(role || '').toLowerCase());

// Admin principal: MAIN_ADMIN_EMAIL no .env; sem ele, o admin mais antigo.
// Ele nunca pode ser excluído, rebaixado ou desativado.
async function mainAdminId() {
  const email = String(process.env.MAIN_ADMIN_EMAIL || '').trim().toLowerCase();
  const main = email
    ? await User.findOne({ email }).select('_id')
    : await User.findOne({ role: { $in: ['admin', 'ADM', 'ADMIN'] } }).sort({ createdAt: 1 }).select('_id');
  return main ? String(main._id) : null;
}

function publicUser(u, mainId, selfId, orderCount = 0) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    role: isAdminRole(u.role) ? 'admin' : 'user',
    isActive: u.isActive !== false,
    isMainAdmin: String(u._id) === mainId,
    isSelf: String(u._id) === selfId,
    orderCount,
    createdAt: u.createdAt,
  };
}

// Carrega o alvo e aplica as proteções comuns às ações de alteração.
async function loadTarget(req, res, action) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: 'ID de usuário inválido.' });
    return null;
  }
  const target = await User.findById(id);
  if (!target) {
    res.status(404).json({ message: 'Usuário não encontrado.' });
    return null;
  }
  const mainId = await mainAdminId();
  if (String(target._id) === mainId) {
    res.status(403).json({ message: `O admin principal não pode ser ${action}.` });
    return null;
  }
  if (String(target._id) === String(req.userId)) {
    res.status(403).json({ message: `Você não pode ${action === 'excluído' ? 'excluir' : 'alterar'} a sua própria conta por aqui.` });
    return null;
  }
  return { target, mainId };
}

// GET /api/users
exports.listUsers = async (req, res) => {
  try {
    const [users, mainId, counts] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).lean(),
      mainAdminId(),
      Order.aggregate([{ $group: { _id: '$userId', n: { $sum: 1 } } }]),
    ]);
    const orderCount = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    return res.json(users.map((u) => publicUser(u, mainId, String(req.userId), orderCount[String(u._id)] || 0)));
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao listar usuários.', error: err.message });
  }
};

// PATCH /api/users/:id/role  { role: 'admin' | 'user' }
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: "Papel inválido. Use 'admin' ou 'user'." });
    }
    const loaded = await loadTarget(req, res, 'alterado');
    if (!loaded) return;
    loaded.target.role = role;
    await loaded.target.save();
    return res.json({ user: publicUser(loaded.target, loaded.mainId, String(req.userId)) });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao alterar o papel do usuário.', error: err.message });
  }
};

// PATCH /api/users/:id/status  { isActive: boolean }
exports.updateStatus = async (req, res) => {
  try {
    const { isActive } = req.body || {};
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'Informe isActive como true ou false.' });
    }
    const loaded = await loadTarget(req, res, 'desativado');
    if (!loaded) return;
    loaded.target.isActive = isActive;
    await loaded.target.save();
    return res.json({ user: publicUser(loaded.target, loaded.mainId, String(req.userId)) });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao alterar o status do usuário.', error: err.message });
  }
};

// DELETE /api/users/:id
// Pedidos e endereços ficam no banco: são histórico de vendas usado nos relatórios.
exports.deleteUser = async (req, res) => {
  try {
    const loaded = await loadTarget(req, res, 'excluído');
    if (!loaded) return;
    await Cart.deleteOne({ userId: loaded.target._id });
    await loaded.target.deleteOne();
    return res.json({ message: 'Usuário excluído.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao excluir usuário.', error: err.message });
  }
};
