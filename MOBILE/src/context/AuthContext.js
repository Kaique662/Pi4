import React, { createContext, useContext, useEffect, useState } from 'react';
import { accountService } from '../services/accountService';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);
 useEffect(() => { let active = true; accountService.currentUser().then(value => { if (active) setUser(value); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
 async function run(action) {
  try { const result = await action(); setUser(result.user); return ''; }
  catch (error) { return error.message || 'Não foi possível concluir. Tente novamente.'; }
 }
 const register = values => run(() => accountService.register(values));
 const login = values => run(() => accountService.login(values));
 const updateProfile = values => user ? run(() => accountService.updateProfile(user.id, values)) : Promise.resolve('Entre na sua conta novamente.');
 async function logout() { await accountService.logout(); setUser(null); }
 const isAdmin = ['admin', 'adm', 'administrator'].includes(String(user?.role || '').toLowerCase());
 return <AuthContext.Provider value={{ user, loading, isAdmin, register, login, updateProfile, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.'); return context; }
