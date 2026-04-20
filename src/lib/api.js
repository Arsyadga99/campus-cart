import { CAMPUSES } from '../data/campuses';
import { VENDORS, VENDOR_BY_ID } from '../data/vendors';
import { loadJson, saveJson } from './storage';

const KEY_BATCHES = 'cc_batches';
const KEY_MARKETING = 'cc_marketing';

function readBatches() {
  return loadJson(KEY_BATCHES, []);
}

function writeBatches(batches) {
  saveJson(KEY_BATCHES, batches);
}

function getDefaultMarketingState() {
  return {
    monthlySpend: 8000000,
    channels: {
      referral: 0.22,
      tiktok: 0.31,
      facebook: 0.18,
      ambassador: 0.19,
      organic: 0.1,
    },
  };
}

export function getMarketingState() {
  return loadJson(KEY_MARKETING, getDefaultMarketingState());
}

export async function fetchCampuses() {
  return Promise.resolve(CAMPUSES);
}

export async function fetchVendors() {
  return Promise.resolve(VENDORS);
}

export function getVendorForProduct(product) {
  return VENDOR_BY_ID[product.vendorId] ?? null;
}

export function getBatchWindow(date = new Date()) {
  const cutoff = new Date(date);
  cutoff.setHours(20, 0, 0, 0);

  const start = new Date(cutoff);
  start.setHours(8, 0, 0, 0);

  if (date.getTime() > cutoff.getTime()) {
    start.setDate(start.getDate() + 1);
    cutoff.setDate(cutoff.getDate() + 1);
  }

  return {
    startAt: start.toISOString(),
    cutoffAt: cutoff.toISOString(),
    label: `${start.toLocaleDateString('en-GB')} 08:00-20:00`,
  };
}

function buildBatchKey({ campusId, district, ward, cutoffAt }) {
  return [campusId, district || 'pickup', ward || 'batch-hub', cutoffAt.slice(0, 10)].join('__');
}

export function createOrderBatch({ campusId, district, ward, order }) {
  const window = getBatchWindow(new Date(order.createdAt));
  const batches = readBatches();
  const batchKey = buildBatchKey({ campusId, district, ward, cutoffAt: window.cutoffAt });
  const existing = batches.find((batch) => batch.batchKey === batchKey);
  const groupedUnits = order.items
    .filter((item) => item.groupEligible)
    .reduce((sum, item) => sum + item.quantity, 0);

  if (existing) {
    existing.orderIds.push(order.id);
    existing.studentIds.push(order.studentId);
    existing.totalOrders += 1;
    existing.totalUnits += order.items.reduce((sum, item) => sum + item.quantity, 0);
    existing.groupBuyUnits += groupedUnits;
    existing.routeStops = Array.from(new Set([...existing.routeStops, `${district || 'Campus Hub'} / ${ward || 'Pickup'}`]));
    writeBatches(batches);
    return existing;
  }

  const batch = {
    id: `BATCH-${Math.floor(100000 + Math.random() * 900000)}`,
    batchKey,
    campusId,
    district: district || null,
    ward: ward || null,
    orderIds: [order.id],
    studentIds: [order.studentId],
    totalOrders: 1,
    totalUnits: order.items.reduce((sum, item) => sum + item.quantity, 0),
    groupBuyUnits: groupedUnits,
    routeStops: [`${district || 'Campus Hub'} / ${ward || 'Pickup'}`],
    startAt: window.startAt,
    cutoffAt: window.cutoffAt,
    windowLabel: window.label,
    status: 'Queued',
  };

  batches.push(batch);
  writeBatches(batches);
  return batch;
}

export async function fetchBatches() {
  return Promise.resolve(readBatches());
}
