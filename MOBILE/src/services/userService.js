import { apiRequest } from './api';

// Gestão de contas (somente admin). As regras de proteção ficam no back-end.
export const userService = {
  async list() {
    const data = await apiRequest('/api/users');
    return Array.isArray(data) ? data : [];
  },
  async setRole(id, role) {
    return (await apiRequest(`/api/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: { role } })).user;
  },
  async setActive(id, isActive) {
    return (await apiRequest(`/api/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { isActive } })).user;
  },
  remove(id) {
    return apiRequest(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
