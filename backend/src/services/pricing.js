import { BUSINESS_RULES } from '../../../src/constants/business.js';
import { VENDOR_BY_ID } from '../../../src/data/vendors.js';

function calculateCommission(items) {
  return items.reduce((sum, item) => {
    const vendor = VENDOR_BY_ID[item.vendorId];
    const commissionRate = vendor?.commissionRate ?? BUSINESS_RULES.commissionRate;
    return sum + Math.round(item.price * item.quantity * commissionRate);
  }, 0);
}

export function calculateCartPricing(items, deliveryMethod, promoDiscount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = BUSINESS_RULES.deliveryCharge;
  const commissionRevenue = calculateCommission(items);
  const deliveryMarginRevenue = BUSINESS_RULES.deliveryCharge - BUSINESS_RULES.deliveryCost;
  const promotedListingRevenue = items.reduce((sum, item) => {
    const vendor = VENDOR_BY_ID[item.vendorId];
    return sum + (vendor?.promoted ? 500 : 0);
  }, 0);
  const subscriptionRevenue = items.reduce((sum, item) => {
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
    deliveryMethod
  };
}
