import { useState } from 'react';
import { AuthContext } from './auth-context';
import { calculateCartPricing } from '../lib/analytics';
import { loadJson, saveJson, simpleHash } from '../lib/storage';

const ADMIN_EMAIL = 'admin@campuscart.local';
const ADMIN_PASSWORD_HASH = simpleHash('CampusCartAdmin2026');
const KEY_USERS = 'cc_users';
const KEY_SESSION = 'cc_session';

function buildCartKey(userId) {
  return `cc_cart_${userId}`;
}

function buildOrdersKey(userId) {
  return `cc_orders_${userId}`;
}

function createStudentProfile({ name, email, password }) {
  return {
    id: `student_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadJson(KEY_SESSION, null));

  const getUsers = () => loadJson(KEY_USERS, []);
  const saveUsers = (users) => saveJson(KEY_USERS, users);

  const startSession = (nextSession) => {
    saveJson(KEY_SESSION, nextSession);
    setSession(nextSession);
  };

  const register = (name, email, password) => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      return { success: false, error: 'All registration fields are required.' };
    }

    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((user) => user.email === normalizedEmail)) {
      return { success: false, error: 'This email is already registered.' };
    }

    const student = createStudentProfile({ name, email, password });
    saveUsers([...users, student]);
    startSession({
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'student',
    });

    return { success: true };
  };

  const login = (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = simpleHash(password);

    if (
      normalizedEmail === ADMIN_EMAIL &&
      passwordHash === ADMIN_PASSWORD_HASH
    ) {
      startSession({
        id: 'admin',
        name: 'CampusCart Admin',
        email: ADMIN_EMAIL,
        role: 'admin',
      });

      return { success: true };
    }

    const user = getUsers().find(
      (entry) =>
        entry.email === normalizedEmail && entry.passwordHash === passwordHash
    );

    if (!user) {
      return { success: false, error: 'Incorrect email or password.' };
    }

    startSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'student',
    });

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(KEY_SESSION);
    setSession(null);
  };

  const getCart = (userId = session?.id) => {
    if (!userId) {
      return [];
    }

    return loadJson(buildCartKey(userId), []);
  };

  const saveCart = (cartItems, userId = session?.id) => {
    if (!userId) {
      return;
    }

    saveJson(buildCartKey(userId), cartItems);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getOrders = (userId = session?.id) => {
    if (!userId) {
      return [];
    }

    return loadJson(buildOrdersKey(userId), []);
  };

  const addOrder = ({
    items,
    deliveryMethod,
    paymentMethod,
    promoDiscount,
    promoCode,
  }) => {
    if (!session?.id) {
      return null;
    }

    const pricing = calculateCartPricing(items, deliveryMethod, promoDiscount);
    const order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      items,
      ...pricing,
      paymentMethod,
      deliveryMethod,
      promoDiscount,
      promoCode,
      createdAt: new Date().toISOString(),
    };

    saveJson(buildOrdersKey(session.id), [...getOrders(), order]);
    saveCart([]);
    return order;
  };

  const getAllUsersWithOrders = () =>
    getUsers().map((user) => ({
      ...user,
      orders: getOrders(user.id),
    }));

  const deleteStudent = (userId) => {
    const users = getUsers();
    const nextUsers = users.filter((user) => user.id !== userId);

    saveUsers(nextUsers);
    localStorage.removeItem(buildCartKey(userId));
    localStorage.removeItem(buildOrdersKey(userId));

    if (session?.id === userId) {
      logout();
    }
  };

  const contextValue = {
    user: session,
    role: session?.role ?? null,
    register,
    login,
    logout,
    getCart,
    saveCart,
    getOrders,
    addOrder,
    getAllUsersWithOrders,
    deleteStudent,
    adminCredentials: {
      email: ADMIN_EMAIL,
      passwordHint: 'CampusCartAdmin2026',
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
