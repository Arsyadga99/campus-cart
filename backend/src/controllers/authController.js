import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readDatabase, writeDatabase } from '../db.js';

function makeReferralCode(name) {
  return `${name.replace(/\s+/g, '').slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      campusId: user.campusId ?? null,
      referralCode: user.referralCode ?? null
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(req, res) {
  const { name, email, password, campusId, acquisitionChannel, referralCodeUsed } = req.body ?? {};

  if (!name || !email || !password || !campusId || !acquisitionChannel) {
    return res.status(400).json({ message: 'All registration fields are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const db = await readDatabase();

    if (db.users.some((user) => user.email === normalizedEmail)) {
      return res.status(400).json({ message: 'This email is already registered.' });
    }

    const normalizedReferral = referralCodeUsed ? String(referralCodeUsed).trim().toUpperCase() : null;
    if (normalizedReferral && !db.users.some((user) => user.referralCode === normalizedReferral)) {
      return res.status(400).json({ message: 'Referral code was not found.' });
    }

    const user = {
      id: `student_${Date.now()}`,
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(String(password), 10),
      role: 'student',
      campusId,
      acquisitionChannel,
      referralCode: makeReferralCode(String(name).trim()),
      referralCodeUsed: normalizedReferral,
      loyaltyPoints: 0,
      loyaltyTier: 'Starter',
      groupBuyOrders: 0,
      createdAt: new Date().toISOString(),
      lastOrderAt: null,
      totalOrders: 0
    };

    db.users.push(user);
    await writeDatabase(db);

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to register user.', error: error.message });
  }
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const db = await readDatabase();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: sanitizeUser(user)
  });
}

export async function me(req, res) {
  const db = await readDatabase();
  const user = db.users.find((entry) => entry.id === req.auth.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user: sanitizeUser(user) });
}
