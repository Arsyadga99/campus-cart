import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import { CAMPUSES } from '../data/campuses';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/products';
import {
  createOrder,
  createProduct,
  decodeJwt,
  deleteProduct,
  deleteUser,
  fetchBatches,
  fetchMarketing,
  fetchMe,
  fetchOrders,
  fetchProducts,
  fetchRecommendations,
  fetchUsers,
  getStoredToken,
  loginRequest,
  payOrder,
  registerRequest,
  saveMarketing,
  setStoredToken,
  updateOrderStatus,
  updateProduct
} from '../lib/http';

const DEFAULT_MARKETING = {
  monthlySpend: 8000000,
  channels: {
    referral: 0.22,
    tiktok: 0.31,
    facebook: 0.18,
    ambassador: 0.19,
    organic: 0.1
  }
};

function toSession(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    campusId: user.campusId ?? null,
    referralCode: user.referralCode ?? null,
    role: user.role ?? 'student',
    loyaltyPoints: user.loyaltyPoints ?? 0,
    loyaltyTier: user.loyaltyTier ?? 'Starter',
    acquisitionChannel: user.acquisitionChannel ?? null
  };
}

function normalizeSessionFromToken(token) {
  const payload = decodeJwt(token);
  return payload
    ? {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        campusId: payload.campusId ?? null,
        referralCode: payload.referralCode ?? null,
        role: payload.role ?? null
      }
    : null;
}

export function AuthProvider({ children }) {
  const initialToken = getStoredToken();
  const [token, setToken] = useState(initialToken);
  const [session, setSession] = useState(() => normalizeSessionFromToken(initialToken));
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [marketingState, setMarketingState] = useState(DEFAULT_MARKETING);
  const [cart, setCart] = useState([]);

  const clearSessionData = () => {
    setOrders([]);
    setRecommendations([]);
    setUsers([]);
    setBatches([]);
    setMarketingState(DEFAULT_MARKETING);
    setCart([]);
  };

  const refreshPublicProducts = async () => {
    const data = await fetchProducts();
    setProducts(data.products ?? []);
    return data.products ?? [];
  };

  const refreshAuthenticatedData = async (currentToken, currentSession) => {
    if (!currentToken) {
      clearSessionData();
      return;
    }

    if (currentSession?.role !== 'admin') {
      setUsers([]);
      setBatches([]);
      setMarketingState(DEFAULT_MARKETING);
    }

    const [ordersData, recommendationsData] = await Promise.all([
      fetchOrders(currentToken),
      fetchRecommendations(currentToken).catch(() => ({ recommendations: [] }))
    ]);

    setOrders(ordersData.orders ?? []);
    setRecommendations(recommendationsData.recommendations ?? []);

    if (currentSession?.role === 'admin') {
      const [usersData, batchesData, marketingData] = await Promise.all([
        fetchUsers(currentToken),
        fetchBatches(currentToken),
        fetchMarketing(currentToken)
      ]);

      setUsers(usersData.users ?? []);
      setBatches(batchesData.batches ?? []);
      setMarketingState(marketingData.marketing ?? DEFAULT_MARKETING);
      return;
    }

    try {
      const meData = await fetchMe(currentToken);
      const fullSession = toSession(meData.user ?? currentSession);
      if (fullSession) {
        setSession(fullSession);
      }
    } catch {
      clearSessionData();
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const productsData = await fetchProducts();
        if (!cancelled) {
          setProducts(productsData.products ?? FALLBACK_PRODUCTS);
        }
      } catch {
        if (!cancelled) {
          setProducts(FALLBACK_PRODUCTS);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!token) {
        clearSessionData();
        setSession(null);
        setStoredToken('');
        return;
      }

      try {
        const meData = await fetchMe(token);
        const fullSession = toSession(meData.user);
        if (cancelled) {
          return;
        }

        setSession(fullSession);
        await refreshAuthenticatedData(token, fullSession);
      } catch {
        if (cancelled) {
          return;
        }

        setStoredToken('');
        setToken('');
        setSession(null);
        clearSessionData();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const bootstrapAfterAuth = async (nextToken, fallbackSession) => {
    setStoredToken(nextToken);
    setToken(nextToken);

    const meData = await fetchMe(nextToken).catch(() => null);
    const nextSession = toSession(meData?.user ?? fallbackSession);
    if (nextSession) {
      setSession(nextSession);
      await refreshAuthenticatedData(nextToken, nextSession);
    }

    return nextSession;
  };

  const register = async (payload) => {
    try {
      const response = await registerRequest(payload);
      await bootstrapAfterAuth(response.token, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await loginRequest({ email, password });
      await bootstrapAfterAuth(response.token, response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setStoredToken('');
    setToken('');
    setSession(null);
    clearSessionData();
  };

  const getCart = () => cart;

  const saveCart = (nextCart) => {
    setCart(nextCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getProducts = () => products;

  const syncProducts = async (nextProducts) => {
    if (!session?.role || session.role !== 'admin') {
      setProducts(nextProducts);
      return nextProducts;
    }

    const currentMap = new Map(products.map((product) => [product.id, product]));
    const nextMap = new Map(nextProducts.map((product) => [product.id, product]));
    const tokenValue = getStoredToken();

    for (const [id, product] of nextMap.entries()) {
      if (!currentMap.has(id)) {
        await createProduct(product, tokenValue);
        continue;
      }

      const current = currentMap.get(id);
      if (JSON.stringify(current) !== JSON.stringify(product)) {
        await updateProduct(id, product, tokenValue);
      }
    }

    for (const id of currentMap.keys()) {
      if (!nextMap.has(id)) {
        await deleteProduct(id, tokenValue);
      }
    }

    const refreshed = await refreshPublicProducts();
    return refreshed;
  };

  const saveProducts = async (nextProducts) => syncProducts(nextProducts);

  const createProductRecord = async (payload) => {
    const response = await createProduct(payload, getStoredToken());
    setProducts(response.products ?? []);
    return response.product;
  };

  const updateProductRecord = async (productId, payload) => {
    const response = await updateProduct(productId, payload, getStoredToken());
    setProducts(response.products ?? []);
    return response.product;
  };

  const deleteProductRecord = async (productId) => {
    await deleteProduct(productId, getStoredToken());
    setProducts((current) => current.filter((product) => product.id !== productId));
  };

  const refreshOrders = async () => {
    if (!token) {
      setOrders([]);
      return [];
    }

    const data = await fetchOrders(token);
    setOrders(data.orders ?? []);
    return data.orders ?? [];
  };

  const addOrder = async (payload) => {
    const response = await createOrder(payload, getStoredToken());
    await refreshOrders();
    await refreshPublicProducts();
    if (session?.role === 'admin') {
      await refreshAuthenticatedData(token, session);
    } else {
      try {
        const recommendationsData = await fetchRecommendations(getStoredToken());
        setRecommendations(recommendationsData.recommendations ?? []);
      } catch {
        setRecommendations([]);
      }
    }
    saveCart([]);
    return response.order;
  };

  const payOrderRecord = async (orderId) => {
    const response = await payOrder(orderId, getStoredToken());
    await refreshOrders();
    if (session?.role === 'admin') {
      await refreshAuthenticatedData(token, session);
    }
    return response.order;
  };

  const updateOrderStatusRecord = async (orderId, statusPayload) => {
    const response = await updateOrderStatus(orderId, statusPayload, getStoredToken());
    await refreshOrders();
    if (session?.role === 'admin') {
      await refreshAuthenticatedData(token, session);
    }
    return response.order;
  };

  const getOrders = (userId = session?.id) => {
    if (!userId) {
      return [];
    }

    if (session?.role === 'admin' && !userId) {
      return orders;
    }

    if (session?.role === 'admin' && userId === session.id) {
      return orders;
    }

    return orders.filter((order) => order.userId === userId);
  };

  const getAllUsersWithOrders = () => {
    const ordersByUser = orders.reduce((acc, order) => {
      if (!acc[order.userId]) {
        acc[order.userId] = [];
      }

      acc[order.userId].push(order);
      return acc;
    }, {});

    return users.map((user) => ({
      ...user,
      campus: CAMPUSES.find((campus) => campus.id === user.campusId) ?? null,
      orders: ordersByUser[user.id] ?? []
    }));
  };

  const getAllBatches = async () => {
    if (session?.role !== 'admin') {
      return [];
    }

    return batches;
  };

  const deleteStudent = async (userId) => {
    await deleteUser(userId, getStoredToken());
    await refreshAuthenticatedData(getStoredToken(), session);
  };

  const saveMarketingStateRecord = async (nextState) => {
    const response = await saveMarketing(nextState, getStoredToken());
    setMarketingState(response.marketing ?? nextState);
    return response.marketing ?? nextState;
  };

  const currentUserProfile = useMemo(() => {
    if (!session) {
      return null;
    }

    return users.find((user) => user.id === session.id) ?? session;
  }, [session, users]);

  const contextValue = {
    user: session,
    role: session?.role ?? null,
    profile: currentUserProfile,
    products,
    orders,
    recommendations,
    users,
    batches,
    marketingState,
    register,
    login,
    logout,
    getCart,
    saveCart,
    getProducts,
    saveProducts,
    createProduct: createProductRecord,
    updateProduct: updateProductRecord,
    deleteProduct: deleteProductRecord,
    getOrders,
    addOrder,
    payOrder: payOrderRecord,
    updateOrderStatus: updateOrderStatusRecord,
    getAllUsersWithOrders,
    getAllBatches,
    deleteStudent,
    saveMarketingState: saveMarketingStateRecord,
    refreshOrders,
    availableCampuses: CAMPUSES,
    platformMode: 'Express API over JSON database',
    adminCredentials: {
      email: 'admin@campuscart.local',
      passwordHint: 'CampusCartAdmin2026'
    }
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
