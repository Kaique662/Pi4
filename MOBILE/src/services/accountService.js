import { apiRequest, tokenStorage } from './api';
export const normalizeEmail = value => String(value || '').trim().toLowerCase();
export function validateProfile({ name, email, phone = '' }) {
 if (!String(name || '').trim() || String(name).trim().length < 2) return 'Digite seu nome com pelo menos 2 caracteres.';
 if (!/^[\p{L} ]+$/u.test(String(name).trim())) return 'O nome deve conter apenas letras e espaços.';
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) return 'Digite um e-mail válido.';
 const digits = String(phone || '').replace(/\D/g, '');
 if (phone && (digits.length < 10 || digits.length > 11)) return 'Digite um telefone com DDD e 10 ou 11 dígitos.';
 return '';
}
export function validateCredentials(email, password, confirmation) {
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) return 'Digite um e-mail válido.';
 if (String(password || '').length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
 if (confirmation !== undefined && password !== confirmation) return 'As senhas não coincidem.';
 return '';
}
const normalizeUser = user => ({ id: String(user.id || user._id), name: user.name || user.nome || '', email: user.email || '', phone: user.phone || user.telefone || '', role: user.role || user.tipo || 'user' });
export const accountService = {
 async register({ name, email, phone = '', password, confirmation, address }) {
  const error = validateProfile({ name, email, phone }) || validateCredentials(email, password, confirmation) || (address && (!address.street.trim() || !address.number.trim() || !address.city.trim() || !address.state.trim() || address.zipCode.replace(/\D/g, '').length !== 8) ? 'Preencha rua, número, cidade, estado e um CEP válido no endereço.' : '');
  if (error) throw new Error(error);
  const result = await apiRequest('/api/auth/register', { method: 'POST', noAuth: true, body: { name: name.trim(), email: normalizeEmail(email), phone: phone.trim(), password, address } });
  if (!result.token || !result.user) throw new Error('O servidor não retornou os dados da sessão.');
  await tokenStorage.set(result.token);
  return { user: normalizeUser(result.user), token: result.token };
 },
 async login({ email, password }) {
  const error = validateCredentials(email, password);
  if (error) throw new Error(error);
  const result = await apiRequest('/api/auth/login', { method: 'POST', noAuth: true, body: { email: normalizeEmail(email), password } });
  if (!result.token || !result.user) throw new Error('O servidor não retornou os dados da sessão.');
  await tokenStorage.set(result.token);
  return { user: normalizeUser(result.user), token: result.token };
 },
 async currentUser() {
  const token = await tokenStorage.get();
  if (!token) return null;
  try { const user = await apiRequest('/api/auth/me'); return normalizeUser(user); }
  catch (error) { await tokenStorage.clear(); return null; }
 },
 async updateProfile(_id, profile) {
  const error = validateProfile(profile);
  if (error) throw new Error(error);
  const result = await apiRequest('/api/auth/me', { method: 'PATCH', body: { name: profile.name.trim(), email: normalizeEmail(profile.email), phone: (profile.phone || '').trim() } });
  return { user: normalizeUser(result.user || result) };
 },
 async logout() { await tokenStorage.clear(); },
};
