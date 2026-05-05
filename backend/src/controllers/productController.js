import { readDatabase, updateDatabase } from '../db.js';

function normalizeProduct(product) {
  return {
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice === null || product.originalPrice === undefined ? null : Number(product.originalPrice),
    campusDemand: Number(product.campusDemand ?? 0),
    groupEligible: Boolean(product.groupEligible)
  };
}

export async function listProducts(req, res) {
  const db = await readDatabase();
  return res.json({ products: db.products });
}

export async function createProduct(req, res) {
  const payload = req.body ?? {};
  if (!payload.name || !payload.description || !payload.category || !payload.vendorId) {
    return res.status(400).json({ message: 'Missing product fields.' });
  }

  const product = normalizeProduct({
    id: payload.id || `p-custom-${Date.now()}`,
    name: String(payload.name).trim(),
    description: String(payload.description).trim(),
    category: payload.category,
    campusIds: Array.isArray(payload.campusIds) ? payload.campusIds : [],
    vendorId: payload.vendorId,
    vendor: payload.vendor ?? payload.name,
    price: payload.price,
    originalPrice: payload.originalPrice ?? null,
    campusDemand: payload.campusDemand ?? 0,
    badge: payload.badge ?? null,
    leadTime: payload.leadTime ?? 'Same day',
    groupEligible: payload.groupEligible ?? false
  });

  const db = await updateDatabase((current) => {
    current.products.unshift(product);
    return current;
  });

  return res.status(201).json({ product, products: db.products });
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const payload = req.body ?? {};

  const db = await updateDatabase((current) => {
    const index = current.products.findIndex((product) => product.id === id);
    if (index === -1) {
      return { error: 'Product not found.' };
    }

    current.products[index] = normalizeProduct({
      ...current.products[index],
      ...payload,
      id
    });
    return current;
  });

  if (db.error) {
    return res.status(404).json({ message: db.error });
  }

  return res.json({ product: db.products.find((product) => product.id === id), products: db.products });
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  const db = await updateDatabase((current) => {
    const exists = current.products.some((product) => product.id === id);
    if (!exists) {
      return { error: 'Product not found.' };
    }

    current.products = current.products.filter((product) => product.id !== id);
    return current;
  });

  if (db.error) {
    return res.status(404).json({ message: db.error });
  }

  return res.status(204).send();
}
