import { readDatabase, updateDatabase } from '../db.js';
import { createOrderBatch, assignCourier, resolveDeliveryStatus } from '../services/batches.js';
import { calculateCartPricing } from '../services/pricing.js';

const ALLOWED_STATUSES = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'];
const ADMIN_EDITABLE_STATUSES = ['packed', 'shipped', 'delivered', 'cancelled'];

function sanitizeOrder(order, usersById) {
  const user = usersById[order.userId];
  return {
    ...order,
    studentName: user?.name ?? order.userName ?? 'Unknown',
    studentEmail: user?.email ?? order.userEmail ?? null,
    studentCampusId: user?.campusId ?? order.campusId ?? null,
    acquisitionChannel: user?.acquisitionChannel ?? order.campaignSource ?? null
  };
}

function buildUsersIndex(users) {
  return Object.fromEntries(users.map((user) => [user.id, user]));
}

function updateUserStats(users, order, currentUserId) {
  return users.map((user) => {
    if (user.id !== currentUserId) {
      if (user.referralCode === order.referralCodeUsed) {
        return {
          ...user,
          loyaltyPoints: (user.loyaltyPoints ?? 0) + 5
        };
      }

      return user;
    }

    const totalOrders = (user.totalOrders ?? 0) + 1;
    const loyaltyPoints = (user.loyaltyPoints ?? 0) + Math.floor(order.total / 5000);

    return {
      ...user,
      loyaltyPoints,
      loyaltyTier: loyaltyPoints >= 60 ? 'Gold' : loyaltyPoints >= 25 ? 'Silver' : 'Starter',
      totalOrders,
      lastOrderAt: order.createdAt,
      groupBuyOrders: (user.groupBuyOrders ?? 0) + (order.groupBuyQualified ? 1 : 0)
    };
  });
}

export async function listOrders(req, res) {
  const db = await readDatabase();
  const usersById = buildUsersIndex(db.users);

  const orders =
    req.auth.role === 'admin'
      ? db.orders.map((order) => sanitizeOrder(order, usersById))
      : db.orders.filter((order) => order.userId === req.auth.id).map((order) => sanitizeOrder(order, usersById));

  return res.json({ orders });
}

export async function createOrder(req, res) {
  const payload = req.body ?? {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) {
    return res.status(400).json({ message: 'Cart items are required.' });
  }

  try {
    const db = await readDatabase();
    const productIndex = Object.fromEntries(db.products.map((product) => [product.id, product]));
    const user = db.users.find((entry) => entry.id === req.auth.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const normalizedItems = items.map((item) => {
      const product = productIndex[item.id];
      if (!product) {
        throw new Error(`Product not found: ${item.id}`);
      }

      return {
        ...product,
        quantity: Math.max(1, Number(item.quantity) || 1)
      };
    });

    const pricing = calculateCartPricing(normalizedItems, payload.deliveryMethod, Number(payload.promoDiscount) || 0);
    const groupBuyQualified = normalizedItems.some((item) => item.groupEligible && item.quantity >= 2);
    const order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      campusId: user.campusId,
      items: normalizedItems,
      ...pricing,
      paymentMethod: payload.paymentMethod ?? 'cod',
      deliveryMethod: payload.deliveryMethod ?? 'pickup',
      payment_status: 'unpaid',
      status: 'pending',
      delivery_status: 'preparing',
      courier_name: null,
      promoDiscount: Number(payload.promoDiscount) || 0,
      promoCode: payload.promoCode ?? null,
      deliveryAddress: payload.deliveryAddress ?? null,
      campaignSource: payload.campaignSource ?? null,
      referralCodeUsed: user.referralCodeUsed ?? null,
      groupBuyQualified,
      createdAt: new Date().toISOString()
    };

    const batch = createOrderBatch({
      campusId: user.campusId,
      district: order.deliveryMethod === 'delivery' ? order.deliveryAddress?.district : null,
      ward: order.deliveryMethod === 'delivery' ? order.deliveryAddress?.ward : null,
      order,
      batches: db.batches
    });

    order.batchId = batch.id;
    order.batchWindow = batch.windowLabel;

    const nextDb = await updateDatabase((current) => {
      current.orders.push(order);
      current.batches = db.batches;
      current.users = updateUserStats(current.users, order, user.id);
      return current;
    });

    if (nextDb.error) {
      return res.status(400).json({ message: nextDb.error });
    }

    const usersById = buildUsersIndex(nextDb.users);
    return res.status(201).json({
      order: sanitizeOrder(order, usersById),
      batches: nextDb.batches
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to create order.' });
  }
}

export async function payOrder(req, res) {
  const { id } = req.params;

  const nextDb = await updateDatabase((current) => {
    const order = current.orders.find((entry) => entry.id === id);
    if (!order) {
      return { error: 'Order not found.' };
    }

    if (req.auth.role !== 'admin' && order.userId !== req.auth.id) {
      return { error: 'Insufficient permissions.' };
    }

    order.payment_status = 'paid';
    order.status = order.status === 'cancelled' ? 'cancelled' : 'paid';
    order.delivery_status = order.delivery_status === 'delivered' ? 'delivered' : 'preparing';
    return current;
  });

  if (nextDb.error) {
    return res.status(nextDb.error === 'Order not found.' ? 404 : 403).json({ message: nextDb.error });
  }

  return res.json({ order: nextDb.orders.find((entry) => entry.id === id) });
}

export async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status, delivery_status, courier_name } = req.body ?? {};

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  if (!ADMIN_EDITABLE_STATUSES.includes(status)) {
    return res.status(400).json({
      message: 'Admin can only change order status to packed, shipped, delivered, or cancelled.'
    });
  }

  const nextDb = await updateDatabase((current) => {
    const order = current.orders.find((entry) => entry.id === id);
    if (!order) {
      return { error: 'Order not found.' };
    }

    order.status = status;

    if (status === 'paid') {
      order.payment_status = 'paid';
    }

    if (delivery_status) {
      order.delivery_status = delivery_status;
    } else {
      order.delivery_status = resolveDeliveryStatus(status, order.delivery_status);
    }

    if (status === 'shipped' && !order.courier_name) {
      order.courier_name = courier_name || assignCourier(order);
    } else if (courier_name) {
      order.courier_name = courier_name;
    }

    if (status === 'delivered') {
      order.delivery_status = 'delivered';
    }

    if (status === 'cancelled') {
      order.delivery_status = 'preparing';
    }

    return current;
  });

  if (nextDb.error) {
    return res.status(404).json({ message: nextDb.error });
  }

  return res.json({ order: nextDb.orders.find((entry) => entry.id === id) });
}
