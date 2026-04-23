import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_user') || 'null'); } catch { return null; }
  });

  const login = useCallback((accessToken, userData) => {
    // userData = { full_name, user_id, role, type_id?, access_token }
    localStorage.setItem('crm_token', accessToken);
    localStorage.setItem('crm_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
