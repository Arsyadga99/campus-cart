import {
  BREAK_EVEN_ORDERS,
  BUSINESS_RULES,
  CAMPUS_PHASES,
} from '../constants/business';
import { CAMPUSES, CAMPUS_BY_ID } from '../data/campuses';
import { VENDOR_BY_ID } from '../data/vendors';

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

function calculateCommissionForItems(cartItems) {
  return cartItems.reduce((sum, item) => {
    const vendor = VENDOR_BY_ID[item.vendorId];
    const commissionRate = vendor?.commissionRate ?? BUSINESS_RULES.commissionRate;
    return sum + Math.round(item.price * item.quantity * commissionRate);
  }, 0);
}

export function calculateCartPricing(cartItems, deliveryMethod, promoDiscount = 0) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = BUSINESS_RULES.deliveryCharge;
  const commissionRevenue = calculateCommissionForItems(cartItems);
  const deliveryMarginRevenue = BUSINESS_RULES.deliveryCharge - BUSINESS_RULES.deliveryCost;
  const promotedListingRevenue = cartItems.reduce((sum, item) => {
    const vendor = VENDOR_BY_ID[item.vendorId];
    return sum + (vendor?.promoted ? 500 : 0);
  }, 0);
  const subscriptionRevenue = cartItems.reduce((sum, item) => {
    const vendor = VENDOR_BY_ID[item.vendorId];
    if (!vendor) {
      return sum;
    }

    return sum + (vendor.subscriptionPlan === 'Scale' ? 400 : vendor.subscriptionPlan === 'Growth' ? 250 : 0);
  }, 0);
  const platformRevenue =
    commissionRevenue +
    deliveryMarginRevenue +
    promotedListingRevenue +
    subscriptionRevenue;
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
    promotedListingRevenue,
    subscriptionRevenue,
    platformRevenue,
    variableCost,
    contributionMargin,
  };
}

export function getCurrentPhase(orderCount, activeCampusCount) {
  if (activeCampusCount >= 10 || orderCount >= 20000) {
    return CAMPUS_PHASES[3];
  }

  if (activeCampusCount >= 8 || orderCount >= 10000) {
    return CAMPUS_PHASES[2];
  }

  if (activeCampusCount >= 3 || orderCount >= 3000) {
    return CAMPUS_PHASES[1];
  }

  return CAMPUS_PHASES[0];
}

export function summarizeAnalytics(users, allOrders, batches = [], marketingState) {
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
  const commissionRevenue = allOrders.reduce(
    (sum, order) => sum + order.commissionRevenue,
    0
  );
  const subscriptionRevenue = allOrders.reduce(
    (sum, order) => sum + (order.subscriptionRevenue ?? 0),
    0
  );
  const promotedListingRevenue = allOrders.reduce(
    (sum, order) => sum + (order.promotedListingRevenue ?? 0),
    0
  );
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
  const conversionRate = users.length
    ? Math.round((users.filter((user) => user.orders.length > 0).length / users.length) * 100)
    : 0;
  const averageOrdersPerUser = users.length
    ? (totalOrders / users.length).toFixed(2)
    : '0.00';
  const activeCampusIds = Array.from(
    new Set(allOrders.map((order) => order.campusId).filter(Boolean))
  );
  const activeCampusCount = activeCampusIds.length;
  const campusPerformance = CAMPUSES.map((campus) => {
    const campusOrders = allOrders.filter((order) => order.campusId === campus.id);
    return {
      ...campus,
      orderCount: campusOrders.length,
      gmv: campusOrders.reduce((sum, order) => sum + order.subtotal, 0),
      studentCount: users.filter((user) => user.campusId === campus.id).length,
      status: campusOrders.length ? 'Active' : 'Planned',
    };
  }).sort((left, right) => right.orderCount - left.orderCount);

  const vendorPerformance = Object.values(VENDOR_BY_ID).map((vendor) => {
    const vendorOrders = allOrders.filter((order) =>
      order.items.some((item) => item.vendorId === vendor.id)
    );

    return {
      ...vendor,
      orderCount: vendorOrders.length,
      revenue: vendorOrders.reduce((sum, order) => sum + order.platformRevenue, 0),
    };
  });

  const marketingSpend = marketingState?.monthlySpend ?? 0;
  const acquiredUsers = users.length || 1;
  const customerAcquisitionCost = Math.round(marketingSpend / acquiredUsers);
  const referralUsers = users.filter((user) => user.referralCodeUsed).length;
  const referralShare = users.length ? Math.round((referralUsers / users.length) * 100) : 0;
  const loyaltyUsers = users.filter((user) => user.loyaltyPoints > 0).length;
  const loyaltyUsageRate = users.length
    ? Math.round((loyaltyUsers / users.length) * 100)
    : 0;
  const groupBuyOrders = allOrders.filter((order) => order.groupBuyQualified).length;
  const groupBuyShare = totalOrders ? Math.round((groupBuyOrders / totalOrders) * 100) : 0;
  const averageBatchSize = batches.length
    ? (batches.reduce((sum, batch) => sum + batch.totalOrders, 0) / batches.length).toFixed(1)
    : '0.0';
  const batchCoverage = totalOrders
    ? Math.round(
        (batches.reduce((sum, batch) => sum + batch.groupBuyUnits, 0) /
          Math.max(
            1,
            allOrders.reduce(
              (sum, order) => sum + order.items.reduce((acc, item) => acc + item.quantity, 0),
              0
            )
          )) *
          100
      )
    : 0;
  const districtCoverage = Array.from(
    new Set(
      allOrders
        .map((order) => order.deliveryAddress?.district)
        .filter(Boolean)
    )
  ).length;
  const activePhase = getCurrentPhase(totalOrders, activeCampusCount);

  return {
    totalOrders,
    grossMerchandiseValue,
    platformRevenue,
    commissionRevenue,
    deliveryMarginRevenue,
    subscriptionRevenue,
    promotedListingRevenue,
    contributionMargin,
    netOperatingResult: contributionMargin - BUSINESS_RULES.fixedMonthlyCost,
    breakEvenProgress,
    breakEvenLabel,
    repeatBuyers,
    retentionProxy,
    averageOrdersPerUser,
    conversionRate,
    activeCampusCount,
    campusPerformance,
    vendorPerformance,
    customerAcquisitionCost,
    referralShare,
    loyaltyUsageRate,
    groupBuyOrders,
    groupBuyShare,
    averageBatchSize,
    batchCoverage,
    districtCoverage,
    marketingSpend,
    activePhase,
  };
}

export function getCampusLabel(campusId) {
  return CAMPUS_BY_ID[campusId]?.name ?? 'Unknown campus';
}
