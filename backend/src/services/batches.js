const DEFAULT_WINDOW_START = 8;
const DEFAULT_WINDOW_END = 20;

function getBatchWindow(date = new Date()) {
  const cutoff = new Date(date);
  cutoff.setHours(DEFAULT_WINDOW_END, 0, 0, 0);

  const start = new Date(cutoff);
  start.setHours(DEFAULT_WINDOW_START, 0, 0, 0);

  if (date.getTime() > cutoff.getTime()) {
    start.setDate(start.getDate() + 1);
    cutoff.setDate(cutoff.getDate() + 1);
  }

  return {
    startAt: start.toISOString(),
    cutoffAt: cutoff.toISOString(),
    label: `${start.toLocaleDateString('en-GB')} 08:00-20:00`
  };
}

function buildBatchKey({ campusId, district, ward, cutoffAt }) {
  return [campusId, district || 'pickup', ward || 'batch-hub', cutoffAt.slice(0, 10)].join('__');
}

export function createOrderBatch({ campusId, district, ward, order, batches }) {
  const window = getBatchWindow(new Date(order.createdAt));
  const batchKey = buildBatchKey({ campusId, district, ward, cutoffAt: window.cutoffAt });
  const existing = batches.find((batch) => batch.batchKey === batchKey);
  const groupedUnits = order.items
    .filter((item) => item.groupEligible)
    .reduce((sum, item) => sum + item.quantity, 0);

  if (existing) {
    existing.orderIds.push(order.id);
    existing.studentIds.push(order.userId);
    existing.totalOrders += 1;
    existing.totalUnits += order.items.reduce((sum, item) => sum + item.quantity, 0);
    existing.groupBuyUnits += groupedUnits;
    existing.routeStops = Array.from(
      new Set([...existing.routeStops, `${district || 'Campus Hub'} / ${ward || 'Pickup'}`])
    );
    return existing;
  }

  const batch = {
    id: `BATCH-${Math.floor(100000 + Math.random() * 900000)}`,
    batchKey,
    campusId,
    district: district || null,
    ward: ward || null,
    orderIds: [order.id],
    studentIds: [order.userId],
    totalOrders: 1,
    totalUnits: order.items.reduce((sum, item) => sum + item.quantity, 0),
    groupBuyUnits: groupedUnits,
    routeStops: [`${district || 'Campus Hub'} / ${ward || 'Pickup'}`],
    startAt: window.startAt,
    cutoffAt: window.cutoffAt,
    windowLabel: window.label,
    status: 'Queued'
  };

  batches.push(batch);
  return batch;
}

export function assignCourier(order) {
  const couriers = ['Minh Delivery', 'An Courier', 'Khanh Rider', 'Vy Shuttle'];
  return couriers[Math.abs(order.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % couriers.length];
}

export function resolveDeliveryStatus(status, current = 'preparing') {
  if (status === 'shipped') return 'on_delivery';
  if (status === 'delivered') return 'delivered';
  if (status === 'packed') return 'preparing';
  if (status === 'cancelled') return current;
  if (status === 'paid') return 'preparing';
  return current;
}
