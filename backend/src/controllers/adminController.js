import { updateDatabase, readDatabase } from '../db.js';

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function listUsers(req, res) {
  const db = await readDatabase();
  return res.json({
    users: db.users.map(sanitizeUser)
  });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  const nextDb = await updateDatabase((current) => {
    const exists = current.users.some((user) => user.id === id);
    if (!exists) {
      return { error: 'User not found.' };
    }

    current.users = current.users.filter((user) => user.id !== id);
    current.orders = current.orders.filter((order) => order.userId !== id);
    return current;
  });

  if (nextDb.error) {
    return res.status(404).json({ message: nextDb.error });
  }

  return res.status(204).send();
}

export async function getMarketing(req, res) {
  const db = await readDatabase();
  return res.json({ marketing: db.marketing });
}

export async function updateMarketing(req, res) {
  const payload = req.body ?? {};
  const monthlySpend = Number(payload.monthlySpend ?? 0);

  const nextDb = await updateDatabase((current) => {
    current.marketing = {
      ...(current.marketing ?? {}),
      monthlySpend,
      channels: payload.channels ?? current.marketing?.channels ?? {}
    };
    return current;
  });

  return res.json({ marketing: nextDb.marketing });
}

export async function listBatches(req, res) {
  const db = await readDatabase();
  return res.json({ batches: db.batches });
}
