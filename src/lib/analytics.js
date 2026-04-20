import {
  BREAK_EVEN_ORDERS,
  BUSINESS_RULES,
  CAMPUS_PHASES,
} from '../constants/business';

export function getBatchCutoffDate() {
  const cutoff = new Date();
  cutoff.setHours(BUSINESS_RULES.batchCutoffHour, 0, 0, 0);

  if (Date.now() >= cutoff.getTime()) {
    cutoff.setDate(cutoff.getDate() + 1);
  }

  return cutoff;
}

export function formatCountdown(targetTime) {
  const remaining = Math.max(0, targetTime - Date.now());
  const hours = String(Math.floor(remaining / 3600000)).padStart(2, '0');
  const minutes = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');

  return { hours, minutes, seconds };
}

export function calculateCartPricing(cartItems, deliveryMethod, promoDiscount = 0) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee =
    deliveryMethod === 'delivery' ? BUSINESS_RULES.deliveryCharge : 0;
  const commissionRevenue = Math.round(subtotal * BUSINESS_RULES.commissionRate);
  const deliveryMarginRevenue =
    deliveryMethod === 'delivery'
      ? BUSINESS_RULES.deliveryCharge - BUSINESS_RULES.deliveryCost
      : 0;
  const platformRevenue = commissionRevenue + deliveryMarginRevenue;
  const variableCost =
    BUSINESS_RULES.paymentFee +
    BUSINESS_RULES.operationalCost +
    BUSINESS_RULES.promotionalSubsidy;
  const contributionMargin = platformRevenue - variableCost;
  const total = Math.max(0, subtotal + deliveryFee - promoDiscount);

  return {
    subtotal,
    deliveryFee,
    total,
    commissionRevenue,
    deliveryMarginRevenue,
    platformRevenue,
    variableCost,
    contributionMargin,
  };
}

export function getCurrentPhase(orderCount) {
  return [...CAMPUS_PHASES]
    .reverse()
    .find((phase) => orderCount >= phase.minOrders) ?? CAMPUS_PHASES[0];
}

export function summarizeAnalytics(users, allOrders) {
  const totalOrders = allOrders.length;
  const grossMerchandiseValue = allOrders.reduce(
    (sum, order) => sum + order.subtotal,
    0
  );
  const platformRevenue = allOrders.reduce(
    (sum, order) => sum + order.platformRevenue,
    0
  );
  const deliveryMarginRevenue = allOrders.reduce(
    (sum, order) => sum + order.deliveryMarginRevenue,
    0
  );
  const commissionRevenue = platformRevenue - deliveryMarginRevenue;
  const contributionMargin = allOrders.reduce(
    (sum, order) => sum + order.contributionMargin,
    0
  );
  const breakEvenProgress = Math.min(100, (totalOrders / BREAK_EVEN_ORDERS) * 100);
  const breakEvenLabel =
    breakEvenProgress > 0 && breakEvenProgress < 0.1
      ? '<0.1%'
      : `${breakEvenProgress.toFixed(2)}%`;
  const repeatBuyers = users.filter((user) => user.orders.length >= 2).length;
  const retentionProxy = users.length
    ? Math.round((repeatBuyers / users.length) * 100)
    : 0;
  const averageOrdersPerUser = users.length
    ? (totalOrders / users.length).toFixed(2)
    : '0.00';

  return {
    totalOrders,
    grossMerchandiseValue,
    platformRevenue,
    commissionRevenue,
    deliveryMarginRevenue,
    contributionMargin,
    netOperatingResult: contributionMargin - BUSINESS_RULES.fixedMonthlyCost,
    breakEvenProgress,
    breakEvenLabel,
    repeatBuyers,
    retentionProxy,
    averageOrdersPerUser,
    activePhase: getCurrentPhase(totalOrders),
  };
}
