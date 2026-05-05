const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'cc_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
}

export function decodeJwt(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, token = getStoredToken(), headers = {}, auth = true } = {}) {
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (auth && token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed.');
  }

  return data;
}

export function registerRequest(payload) {
  return request('/auth/register', { method: 'POST', body: payload, auth: false });
}

export function loginRequest(payload) {
  return request('/auth/login', { method: 'POST', body: payload, auth: false });
}

export function fetchMe(token = getStoredToken()) {
  return request('/auth/me', { token });
}

export function fetchProducts() {
  return request('/products', { auth: false });
}

export function createProduct(payload, token = getStoredToken()) {
  return request('/products', { method: 'POST', body: payload, token });
}

export function updateProduct(productId, payload, token = getStoredToken()) {
  return request(`/products/${productId}`, { method: 'PATCH', body: payload, token });
}

export function deleteProduct(productId, token = getStoredToken()) {
  return request(`/products/${productId}`, { method: 'DELETE', token });
}

export function fetchOrders(token = getStoredToken()) {
  return request('/orders', { token });
}

export function createOrder(payload, token = getStoredToken()) {
  return request('/orders', { method: 'POST', body: payload, token });
}

export function payOrder(orderId, token = getStoredToken()) {
  return request(`/orders/${orderId}/pay`, { method: 'POST', token });
}

export function updateOrderStatus(orderId, payload, token = getStoredToken()) {
  return request(`/orders/${orderId}/status`, { method: 'PATCH', body: payload, token });
}

export function fetchUsers(token = getStoredToken()) {
  return request('/admin/users', { token });
}

export function deleteUser(userId, token = getStoredToken()) {
  return request(`/admin/users/${userId}`, { method: 'DELETE', token });
}

export function fetchMarketing(token = getStoredToken()) {
  return request('/admin/marketing', { token });
}

export function saveMarketing(payload, token = getStoredToken()) {
  return request('/admin/marketing', { method: 'PUT', body: payload, token });
}

export function fetchBatches(token = getStoredToken()) {
  return request('/admin/batches', { token });
}

export function fetchRecommendations(token = getStoredToken()) {
  return request('/recommendations', { token });
}

export function fetchRecommendationsML(token = getStoredToken()) {
  return request('/recommendations/ml', { token });
}

export function fetchAiPerformance(token = getStoredToken()) {
  return request('/admin/ai-performance', { token });
}
