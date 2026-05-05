export const BUSINESS_RULES = {
  averageOrderValue: 50000,
  commissionRate: 0.1,
  deliveryCharge: 10000,
  deliveryCost: 8000,
  paymentFee: 1500,
  operationalCost: 2000,
  promotionalSubsidy: 2500,
  fixedMonthlyCost: 20000000,
  batchCutoffHour: 20,
};

export const CONTRIBUTION_PER_ORDER =
  BUSINESS_RULES.averageOrderValue * BUSINESS_RULES.commissionRate +
  (BUSINESS_RULES.deliveryCharge - BUSINESS_RULES.deliveryCost) -
  (BUSINESS_RULES.paymentFee +
    BUSINESS_RULES.operationalCost +
    BUSINESS_RULES.promotionalSubsidy);

export const BREAK_EVEN_ORDERS = Math.round(
  BUSINESS_RULES.fixedMonthlyCost / CONTRIBUTION_PER_ORDER
);

export const CAMPUS_PHASES = [
  {
    id: 'phase-1',
    label: 'Phase 1',
    title: 'Demand Validation',
    campusRange: '1 campus',
    orderRange: '900-2,400 orders/month',
    minOrders: 0,
  },
  {
    id: 'phase-2',
    label: 'Phase 2',
    title: 'Growth',
    campusRange: '3-5 campuses',
    orderRange: '3k-10k orders/mo',
    minOrders: 3000,
  },
  {
    id: 'phase-3',
    label: 'Phase 3',
    title: 'Break-Even',
    campusRange: '8-10 campuses',
    orderRange: '10k-20k orders/mo',
    minOrders: 10000,
  },
  {
    id: 'phase-4',
    label: 'Phase 4',
    title: 'Scale Profit',
    campusRange: '10+ campuses',
    orderRange: '20k+ orders/mo',
    minOrders: 20000,
  },
];

export const KPI_TARGETS = [
  '500-1,000 registered users in the first validation phase',
  '10-15% conversion rate for active student traffic',
  '900-2,400 monthly orders before multi-campus scale',
  '20,000 monthly orders to reach break-even',
];

export const ADVANCED_FEATURES = [
  {
    id: 'ai-recommendation',
    title: 'AI-Based Collaborative Filtering',
    importance:
      'Students make many small purchases, so faster product discovery has a direct impact on conversion and repeat orders.',
    impact:
      'CampusCart learns from overlapping user purchase histories and recommends products bought by similar students, while still falling back to a lightweight rule-based backup when data is sparse.',
  },
  {
    id: 'analytics-dashboard',
    title: 'Data Analytics Dashboard',
    importance:
      'A marketplace with thin contribution margin needs constant visibility into revenue, break-even progress, and cohort performance.',
    impact:
      'The admin dashboard surfaces GMV, contribution margin, revenue mix, retention proxies, and scaling phase so operators can react early.',
  },
];
