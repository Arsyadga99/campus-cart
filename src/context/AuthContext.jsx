import { createContext, useContext, useState } from 'react';

const ADMIN_PASSWORD = 'X9v!Kq2@Lm7#Zp';
const KEY_USERS   = 'cc_users';
const KEY_SESSION = 'cc_session';

const AuthContext = createContext(null);

/* ─── helpers ─── */
const loadJSON = (key, fallback = null) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const saveJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const cartKey   = (uid) => `cc_cart_${uid}`;
const ordersKey = (uid) => `cc_orders_${uid}`;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadJSON(KEY_SESSION, null));

  /* ── user registry ── */
  const getUsers   = () => loadJSON(KEY_USERS, []);
  const saveUsers  = (arr) => saveJSON(KEY_USERS, arr);

  const startSession = (sess) => {
    saveJSON(KEY_SESSION, sess);
    setSession(sess);
  };

  /* ── register ── */
  const register = (name, email, password) => {
    if (!name.trim() || !email.trim() || !password)
      return { success: false, error: 'All fields are required.' };
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { success: false, error: 'Email is already registered.' };
    const user = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,           // plain-text — demo only
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, user]);
    startSession({ id: user.id, name: user.name, email: user.email, role: 'student' });
    return { success: true };
  };

  /* ── login ── */
  const login = (email, password) => {
    // Admin shortcut: any email + admin password
    if (password === ADMIN_PASSWORD) {
      startSession({ id: 'admin', name: 'Administrator', email: email || 'admin', role: 'admin' });
      return { success: true };
    }
    const users = getUsers();
    const user  = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );
    if (!user) return { success: false, error: 'Incorrect email or password.' };
    startSession({ id: user.id, name: user.name, email: user.email, role: 'student' });
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(KEY_SESSION);
    setSession(null);
  };

  /* ── per-user cart ── */
  const getCart = () => {
    if (!session) return [];
    return loadJSON(cartKey(session.id), []);
  };

  const saveCart = (cart) => {
    if (!session) return;
    saveJSON(cartKey(session.id), cart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  /* ── per-user orders ── */
  const getOrders = (uid) => loadJSON(ordersKey(uid ?? session?.id), []);

  const addOrder = (order) => {
    if (!session) return;
    const prev = getOrders();
    saveJSON(ordersKey(session.id), [...prev, order]);
  };

  /* ── admin helpers ── */
  const getAllUsers = () => getUsers();

  const getUserOrders = (uid) => getOrders(uid);

  return (
    <AuthContext.Provider value={{
      user: session,
      role: session?.role ?? null,
      login,
      logout,
      register,
      getCart,
      saveCart,
      getOrders,
      addOrder,
      getAllUsers,
      getUserOrders,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
