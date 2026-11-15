import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'ecopoints:user';

function stripPassword(user) {
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = user;
  return rest;
}

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  const persist = useCallback((u) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage indisponível: sessão vale só nesta aba */
    }
  }, []);

  // Revalida a sessão salva (usuário pode ter sido removido ou alterado)
  useEffect(() => {
    if (!user) return;
    api
      .get(`/users/${user.id}`)
      .then((fresh) => persist(stripPassword(fresh)))
      .catch((err) => {
        if (String(err.message).includes('404')) persist(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const found = await api.get(`/users?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    const match = found.find((u) => u.password === password);
    if (!match) throw new Error('E-mail ou senha inválidos.');
    persist(stripPassword(match));
    return match;
  };

  const register = async ({ name, email, password, phone }) => {
    const normalized = email.trim().toLowerCase();
    const existing = await api.get(`/users?email=${encodeURIComponent(normalized)}`);
    if (existing.length) throw new Error('Já existe uma conta com este e-mail.');
    const created = await api.post('/users', {
      name: name.trim(),
      email: normalized,
      password,
      phone: phone?.trim() || '',
      role: 'user',
      createdAt: new Date().toISOString(),
    });
    persist(stripPassword(created));
    return created;
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
