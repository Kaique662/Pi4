const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Address = require('../models/Address');

function generateToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (!/^[\p{L} ]+$/u.test(String(name).trim())) return res.status(400).json({ message: 'O nome deve conter apenas letras e espaços.' });
    if (String(password).length < 6) return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    if (address && (!address.street || !address.number || !address.city || !address.state || String(address.zipCode || '').replace(/\D/g, '').length !== 8)) return res.status(400).json({ message: 'Preencha rua, número, cidade, estado e um CEP válido no endereço.' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Já existe uma conta com esse e-mail.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
    });

    // Salva o endereço informado no cadastro, quando fornecido.
    if (address) await Address.create({ ...address, zipCode: String(address.zipCode).replace(/\D/g, ''), userId: user._id, name: 'Casa', isDefault: true });

    // já cria o carrinho vazio do usuário
    await Cart.create({ userId: user._id, items: [], totalPrice: 0 });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '', role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao criar conta.', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Sua conta foi desativada. Fale com o suporte.' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '', role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao fazer login.', error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar usuário.', error: err.message });
  }
};


exports.updateMe = async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ message: 'O nome deve ter pelo menos 2 caracteres.' });
      }
      if (!/^[\p{L} ]+$/u.test(name.trim())) return res.status(400).json({ message: 'O nome deve conter apenas letras e espaços.' });
      updates.name = name.trim();
    }
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Informe um e-mail válido.' });
      }
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: req.userId } });
      if (duplicate) return res.status(409).json({ message: 'Este e-mail já está em uso.' });
      updates.email = normalizedEmail;
    }
    if (phone !== undefined) updates.phone = String(phone || '').trim();
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '', role: user.role } });
  } catch (err) {
    return res.status(400).json({ message: 'Erro ao atualizar os dados da conta.', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'E-mail e nova senha são obrigatórios.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao redefinir senha.', error: err.message });
  }
};
