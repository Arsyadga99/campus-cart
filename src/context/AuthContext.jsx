import { useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import { calculateCartPricing } from '../lib/analytics';
import { loadJson, saveJson, simpleHash } from '../lib/storage';
import { CAMPUSES } from '../data/campuses';
import { createOrderBatch, fetchBatches } from '../lib/api';

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

function makeReferralCode(name) {
  return `${name.replace(/\s+/g, '').slice(0, 4).toUpperCase()}${Math.floor(
    100 + Math.random() * 900
  )}`;
}

function createStudentProfile({
  name,
  email,
  password,
  campusId,
  acquisitionChannel,
  referralCodeUsed,
}) {
  const referralCode = makeReferralCode(name.trim());

  return {
    id: `student_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: simpleHash(password),
    campusId,
    acquisitionChannel,
    referralCode,
    referralCodeUsed: referralCodeUsed?.trim().toUpperCase() || null,
    loyaltyPoints: 0,
    loyaltyTier: 'Starter',
    groupBuyOrders: 0,
    createdAt: new Date().toISOString(),
    lastOrderAt: null,
    totalOrders: 0,
  };
}

function toSession(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    campusId: user.campusId,
    referralCode: user.referralCode,
    role: 'student',
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadJson(KEY_SESSION, null));
  const [batchesVersion, setBatchesVersion] = useState(0);

  const getUsers = () => loadJson(KEY_USERS, []);
  const saveUsers = (users) => saveJson(KEY_USERS, users);

  const startSession = (nextSession) => {
    saveJson(KEY_SESSION, nextSession);
    setSession(nextSession);
  };

  const register = ({
    name,
    email,
    password,
    campusId,
    acquisitionChannel,
    referralCodeUsed,
  }) => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !campusId ||
      !acquisitionChannel
    ) {
      return { success: false, error: 'All registration fields are required.' };
    }

    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((user) => user.email === normalizedEmail)) {
      return { success: false, error: 'This email is already registered.' };
    }

    const normalizedReferral = referralCodeUsed?.trim().toUpperCase();
    if (
      normalizedReferral &&
      !users.some((user) => user.referralCode === normalizedReferral)
    ) {
      return { success: false, error: 'Referral code was not found.' };
    }

    const student = createStudentProfile({
      name,
      email,
      password,
      campusId,
      acquisitionChannel,
      referralCodeUsed,
    });

    saveUsers([...users, student]);
    startSession(toSession(student));

    return { success: true };
  };

  const login = (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = simpleHash(password);

    if (normalizedEmail === ADMIN_EMAIL && passwordHash === ADMIN_PASSWORD_HASH) {
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

    startSession(toSession(user));

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

  const updateUserStatsAfterOrder = (order) => {
    const users = getUsers();
    const nextUsers = users.map((user) => {
      if (user.id === session.id) {
        const totalOrders = user.totalOrders + 1;
        const loyaltyPoints = user.loyaltyPoints + Math.floor(order.total / 5000);

        return {
          ...user,
          loyaltyPoints,
          loyaltyTier:
            loyaltyPoints >= 60 ? 'Gold' : loyaltyPoints >= 25 ? 'Silver' : 'Starter',
          totalOrders,
          lastOrderAt: order.createdAt,
          groupBuyOrders: user.groupBuyOrders + (order.groupBuyQualified ? 1 : 0),
        };
      }

      if (user.referralCode === order.referralCodeUsed) {
        return {
          ...user,
          loyaltyPoints: user.loyaltyPoints + 5,
        };
      }

      return user;
    });

    saveUsers(nextUsers);
    if (session.role === 'student') {
      const currentUser = nextUsers.find((user) => user.id === session.id);
      if (currentUser) {
        startSession(toSession(currentUser));
      }
    }
  };

  const addOrder = ({
    items,
    deliveryMethod,
    paymentMethod,
    promoDiscount,
    promoCode,
    deliveryAddress,
    campaignSource,
  }) => {
    if (!session?.id) {
      return null;
    }

    const pricing = calculateCartPricing(items, deliveryMethod, promoDiscount);
    const groupBuyQualified = items.some((item) => item.groupEligible && item.quantity >= 2);
    const order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      studentId: session.id,
      campusId: session.campusId,
      items,
      ...pricing,
      paymentMethod,
      deliveryMethod,
      promoDiscount,
      promoCode,
      deliveryAddress,
      campaignSource,
      referralCodeUsed:
        getUsers().find((user) => user.id === session.id)?.referralCodeUsed ?? null,
      groupBuyQualified,
      createdAt: new Date().toISOString(),
    };

    const batch = createOrderBatch({
      campusId: session.campusId,
      district: deliveryMethod === 'delivery' ? deliveryAddress?.district : null,
      ward: deliveryMethod === 'delivery' ? deliveryAddress?.ward : null,
      order,
    });

    order.batchId = batch.id;
    order.batchWindow = batch.windowLabel;

    saveJson(buildOrdersKey(session.id), [...getOrders(), order]);
    updateUserStatsAfterOrder(order);
    saveCart([]);
    setBatchesVersion((value) => value + 1);
    return order;
  };

  const getAllUsersWithOrders = () =>
    getUsers().map((user) => ({
      ...user,
      campus: CAMPUSES.find((campus) => campus.id === user.campusId) ?? null,
      orders: getOrders(user.id),
    }));

  const getAllBatches = () => {
    void batchesVersion;
    return fetchBatches();
  };

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

  const currentUserProfile = useMemo(
    () => getUsers().find((user) => user.id === session?.id) ?? null,
    [session]
  );

  const contextValue = {
    user: session,
    role: session?.role ?? null,
    profile: currentUserProfile,
    register,
    login,
    logout,
    getCart,
    saveCart,
    getOrders,
    addOrder,
    getAllUsersWithOrders,
    getAllBatches,
    deleteStudent,
    availableCampuses: CAMPUSES,
    platformMode: 'Mock cloud API over local persistence',
    adminCredentials: {
      email: ADMIN_EMAIL,
      passwordHint: 'CampusCartAdmin2026',
    },
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
