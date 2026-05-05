import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export async function ensureDatabase() {
  await fs.mkdir(DB_DIR, { recursive: true });

  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!isObject(parsed) || !Array.isArray(parsed.users) || !Array.isArray(parsed.products)) {
      throw new Error('Invalid database shape');
    }

    if (parsed.users.length === 0 || parsed.products.length === 0) {
      const seed = createDefaultDatabase();
      const merged = {
        ...seed,
        ...parsed,
        users: parsed.users.length ? parsed.users : seed.users,
        products: parsed.products.length ? parsed.products : seed.products,
        orders: Array.isArray(parsed.orders) ? parsed.orders : seed.orders,
        batches: Array.isArray(parsed.batches) ? parsed.batches : seed.batches,
        marketing: parsed.marketing && isObject(parsed.marketing) ? parsed.marketing : seed.marketing
      };
      await fs.writeFile(DB_PATH, JSON.stringify(merged, null, 2), 'utf8');
      return merged;
    }

    return parsed;
  } catch {
    const seed = createDefaultDatabase();
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

export async function readDatabase() {
  return ensureDatabase();
}

export async function writeDatabase(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  return db;
}

export async function updateDatabase(updater) {
  const current = await readDatabase();
  const next = await updater(structuredClone(current));
  if (next && typeof next === 'object' && 'error' in next) {
    return next;
  }
  await writeDatabase(next);
  return next;
}
