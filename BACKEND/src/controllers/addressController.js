const mongoose = require('mongoose');
const Address = require('../models/Address');

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function addressPayload(body = {}) {
  const aliases = {
    name: ['name', 'nome'],
    street: ['street', 'rua', 'logradouro'],
    number: ['number', 'numero'],
    complement: ['complement', 'complemento'],
    neighborhood: ['neighborhood', 'bairro'],
    city: ['city', 'cidade'],
    state: ['state', 'estado', 'uf'],
    zipCode: ['zipCode', 'cep', 'postalCode'],
    isDefault: ['isDefault', 'principal'],
  };
  const result = {};
  for (const [field, keys] of Object.entries(aliases)) {
    const key = keys.find((candidate) => body[candidate] !== undefined);
    if (key) result[field] = body[key];
  }
  return result;
}

function validateRequired(data, partial = false) {
  const required = ['street', 'number', 'city', 'state', 'zipCode'];
  return required.some((field) => (!partial || data[field] !== undefined) &&
    (typeof data[field] !== 'string' || !data[field].trim()));
}

exports.listAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });
    return res.json(addresses);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao consultar endereços.' });
  }
};

exports.getAddress = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de endereço inválido.' });
    const address = await Address.findOne({ _id: req.params.id, userId: req.userId });
    if (!address) return res.status(404).json({ message: 'Endereço não encontrado.' });
    return res.json(address);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao consultar endereço.' });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const data = addressPayload(req.body);
    if (validateRequired(data)) return res.status(400).json({ message: 'Rua, número, cidade, estado e CEP são obrigatórios.' });
    // O userId sempre vem do token, nunca do corpo da requisição.
    if (data.isDefault) await Address.updateMany({ userId: req.userId }, { $set: { isDefault: false } });
    const address = await Address.create({ ...data, userId: req.userId });
    return res.status(201).json({ message: 'Endereço cadastrado com sucesso.', address });
  } catch (err) {
    return res.status(400).json({ message: 'Erro ao cadastrar endereço.', error: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de endereço inválido.' });
    const data = addressPayload(req.body);
    if (validateRequired(data, true)) return res.status(400).json({ message: 'Os campos de endereço enviados não podem estar vazios.' });
    const existing = await Address.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) return res.status(404).json({ message: 'Endereço não encontrado.' });
    if (data.isDefault) await Address.updateMany({ userId: req.userId, _id: { $ne: existing._id } }, { $set: { isDefault: false } });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, { $set: data }, { new: true, runValidators: true }
    );
    return res.json({ message: 'Endereço atualizado com sucesso.', address });
  } catch (err) {
    return res.status(400).json({ message: 'Erro ao atualizar endereço.', error: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID de endereço inválido.' });
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!address) return res.status(404).json({ message: 'Endereço não encontrado.' });
    return res.json({ message: 'Endereço removido com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao remover endereço.' });
  }
};
