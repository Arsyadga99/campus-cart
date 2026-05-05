import bcrypt from 'bcryptjs';
import { BUSINESS_RULES } from '../../src/constants/business.js';
import { CAMPUSES } from '../../src/data/campuses.js';
import { DELIVERY_ZONES, DISTRICTS } from '../../src/data/deliveryZones.js';
import { PRODUCTS } from '../../src/data/products.js';
import { VENDORS } from '../../src/data/vendors.js';

function makeReferralCode(name) {
  return `${name.replace(/\s+/g, '').slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
}

function createUser({ id, name, email, password, role = 'student', campusId, acquisitionChannel = 'Referral' }) {
  return {
    id,
    name,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    campusId,
    acquisitionChannel,
    referralCode: role === 'student' ? makeReferralCode(name) : null,
    referralCodeUsed: null,
    loyaltyPoints: 0,
    loyaltyTier: 'Starter',
    groupBuyOrders: 0,
    createdAt: new Date().toISOString(),
    lastOrderAt: null,
    totalOrders: 0
  };
}

function makeSeededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function pickRandom(random, items) {
  return items[Math.floor(random() * items.length)];
}

function buildStudentTemplate(index) {
  const clusters = ['food', 'study', 'daily'];
  const cluster = clusters[index % clusters.length];
  const campuses = [
    'hcmut-main',
    'hcmut-dormitory',
    'ussh-linh-trung',
    'uit-linh-trung',
    'hcmus-nguyen-van-cu',
    'ueh-nguyen-trai',
    'ftu2-binh-thanh',
    'huflit-phu-nhuan',
    'hutech-binh-thanh',
    'ton-duc-thang-d7'
  ];

  return {
    cluster,
    campusId: campuses[index % campuses.length],
    acquisitionChannel: ['Referral', 'TikTok', 'Facebook', 'Ambassador'][index % 4]
  };
}

function buildOrderItems(cluster, variantIndex, products) {
  const comboMap = {
    food: [
      ['p-food-rice', 'p-food-coffee'],
      ['p-food-rice', 'p-food-noodle'],
      ['p-food-noodle', 'p-food-bento'],
      ['p-food-coffee', 'p-food-bento']
    ],
    study: [
      ['p-study-pack', 'p-study-graph'],
      ['p-study-pack', 'p-study-usb'],
      ['p-study-graph', 'p-study-usb']
    ],
    daily: [
      ['p-daily-water', 'p-daily-bodywash'],
      ['p-daily-water', 'p-daily-snack-box'],
      ['p-daily-bodywash', 'p-daily-vitamin'],
      ['p-daily-water', 'p-daily-vitamin']
    ]
  };

  const combos = comboMap[cluster] ?? [products.slice(0, 2).map((product) => product.id)];
  const chosen = combos[variantIndex % combos.length];

  return chosen
    .map((productId) => products.find((entry) => entry.id === productId))
    .filter(Boolean)
    .map((product) => ({
      ...product,
      quantity: 1
    }));
}

function buildRecommendationLogs(orders, products) {
  const clusterAlternatives = {
    Food: ['p-food-coffee', 'p-food-noodle', 'p-food-bento', 'p-food-rice'],
    'Study Items': ['p-study-pack', 'p-study-graph', 'p-study-usb'],
    'Daily Needs': ['p-daily-water', 'p-daily-bodywash', 'p-daily-vitamin', 'p-daily-snack-box']
  };

  return orders.map((order, index) => {
    const purchasedIds = order.items.map((item) => item.id);
    const primaryId = purchasedIds[0];
    const primaryProduct = products.find((product) => product.id === primaryId);
    const alternates = clusterAlternatives[primaryProduct?.category] ?? products.map((product) => product.id);
    const recommendedProducts = [];

    if (primaryId) {
      recommendedProducts.push(primaryId);
    }

    const secondary = alternates.find((productId) => !purchasedIds.includes(productId));
    if (secondary) {
      recommendedProducts.push(secondary);
    }

    const timestamp = new Date(new Date(order.createdAt).getTime() - 15 * 60 * 1000);

    return {
      id: `REC-SEED-${String(index + 1).padStart(4, '0')}`,
      user_id: order.userId,
      recommended_products: recommendedProducts,
      source: 'seed-backfill',
      timestamp: timestamp.toISOString()
    };
  });
}

function buildDummyOrders(users, products) {
  const random = makeSeededRandom(20260505);
  const orders = [];
  let sequence = 1;
  const activeStudents = users.filter((user) => user.role === 'student');

  for (const user of activeStudents) {
    const templateIndex = Number(user.id.split('_').pop()) || sequence;
    const template = buildStudentTemplate(templateIndex);
    const repeatCount = user.id === 'student_demo' ? 2 : 1;
    const variantSeed = Math.floor(random() * 1000);

    for (let i = 0; i < repeatCount; i += 1) {
      const createdAt = new Date(Date.UTC(2026, 4, 1, 2 + (sequence % 10), 15 + (sequence % 40), sequence % 60));
      const items = buildOrderItems(template.cluster, variantSeed + i, products);
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryMethod = i % 3 === 0 ? 'pickup' : 'delivery';
      const deliveryFee = 10000;
      const paymentStatus = sequence % 5 === 0 ? 'unpaid' : 'paid';
      const status = paymentStatus === 'paid' ? (deliveryMethod === 'pickup' ? 'delivered' : 'shipped') : 'pending';
      const deliveryStatus = deliveryMethod === 'pickup' ? 'delivered' : (status === 'shipped' ? 'on_delivery' : 'preparing');
      const orderTotal = subtotal + deliveryFee;
      const commissionRevenue = Math.round(subtotal * 0.1);
      const deliveryMarginRevenue = deliveryFee - BUSINESS_RULES.deliveryCost;
      const promotedListingRevenue = items.some((item) => item.badge) ? 500 : 0;
      const subscriptionRevenue = sequence % 4 === 0 ? 250 : 0;
      const platformRevenue = commissionRevenue + deliveryMarginRevenue + promotedListingRevenue + subscriptionRevenue;
      const variableCost = 6000;
      const contributionMargin = platformRevenue - variableCost;

      orders.push({
        id: `ORD-${100000 + sequence}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        campusId: user.campusId,
        items,
        subtotal,
        deliveryFee,
        total: orderTotal,
        commissionRevenue,
        deliveryMarginRevenue,
        promotedListingRevenue,
        subscriptionRevenue,
        platformRevenue,
        variableCost,
        contributionMargin,
        deliveryMethod,
        paymentMethod: sequence % 2 === 0 ? 'vietqr' : 'cod',
        payment_status: paymentStatus,
        status,
        delivery_status: deliveryStatus,
        courier_name: deliveryMethod === 'delivery' ? `Courier ${((sequence - 1) % 6) + 1}` : null,
        promoDiscount: 0,
        promoCode: null,
        deliveryAddress: deliveryMethod === 'delivery'
          ? {
              district: template.campusId === 'hcmut-main' ? 'District 10' : pickRandom(random, DISTRICTS),
              ward: 'Ward 1',
              street: `Auto Seed Street ${sequence}`
            }
          : {
              district: null,
              ward: null,
              street: `Pickup hub at ${users.find((entry) => entry.campusId === user.campusId)?.campusId ?? 'Campus'}`
            },
        campaignSource: template.acquisitionChannel,
        referralCodeUsed: null,
        groupBuyQualified: items.some((item) => item.groupEligible),
        createdAt: createdAt.toISOString(),
        batchId: `BATCH-${200000 + Math.floor(sequence / 3)}`,
        batchWindow: '05/05/2026 08:00-20:00'
      });

      sequence += 1;
    }
  }

  return orders;
}

export function createDefaultDatabase() {
  const admin = createUser({
    id: 'admin',
    name: 'CampusCart Admin',
    email: 'admin@campuscart.local',
    password: 'CampusCartAdmin2026',
    role: 'admin',
    campusId: CAMPUSES[0].id,
    acquisitionChannel: 'Organic Search'
  });

  const demoStudent = createUser({
    id: 'student_demo',
    name: 'Demo Student',
    email: 'student@hcmut.local',
    password: 'Student123!',
    role: 'student',
    campusId: 'hcmut-main',
    acquisitionChannel: 'Referral'
  });

  const generatedStudents = Array.from({ length: 100 }, (_, index) => {
    const template = buildStudentTemplate(index + 1);
    const campus = CAMPUSES.find((entry) => entry.id === template.campusId) ?? CAMPUSES[0];

    return createUser({
      id: `student_${String(index + 1).padStart(3, '0')}`,
      name: `Student ${String(index + 1).padStart(3, '0')}`,
      email: `student${String(index + 1).padStart(3, '0')}@campuscart.local`,
      password: 'Student123!',
      role: 'student',
      campusId: campus.id,
      acquisitionChannel: template.acquisitionChannel
    });
  });

  const users = [admin, demoStudent, ...generatedStudents];
  const orders = buildDummyOrders(users, PRODUCTS);
  const recommendationLogs = buildRecommendationLogs(orders, PRODUCTS);

  return {
    users,
    products: PRODUCTS.map((product) => ({ ...product })),
    orders,
    recommendation_logs: recommendationLogs,
    batches: [],
    marketing: {
      monthlySpend: 8000000,
      channels: {
        referral: 0.22,
        tiktok: 0.31,
        facebook: 0.18,
        ambassador: 0.19,
        organic: 0.1
      }
    },
    campuses: CAMPUSES,
    vendors: VENDORS,
    deliveryZones: DELIVERY_ZONES,
    districts: DISTRICTS,
    businessRules: BUSINESS_RULES
  };
}
