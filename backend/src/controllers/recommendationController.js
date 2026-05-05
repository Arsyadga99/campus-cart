import { readDatabase, updateDatabase } from '../db.js';
import { buildRecommendationFeed } from '../services/recommendation.js';
import { getRecommendations as getMlRecommendations } from '../services/recommendationML.js';

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function appendRecommendationLog({ userId, recommendedProducts, source }) {
  await updateDatabase((current) => {
    current.recommendation_logs = Array.isArray(current.recommendation_logs)
      ? current.recommendation_logs
      : [];

    current.recommendation_logs.push({
      id: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      recommended_products: recommendedProducts,
      source,
      timestamp: new Date().toISOString()
    });

    return current;
  });
}

export async function getRecommendations(req, res) {
  const db = await readDatabase();
  const profile = db.users.find((user) => user.id === req.auth.id);

  if (!profile) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const mlResult = getMlRecommendations(db, profile.id);
  const hasUsefulMlSignal = mlResult.recommendedProductIds.length > 0;

  if (hasUsefulMlSignal) {
    const productIndex = new Map(db.products.map((product) => [product.id, product]));
    const recommendations = mlResult.recommendedProductIds
      .map((productId) => productIndex.get(productId))
      .filter(Boolean)
      .map((product, index) => ({
        ...product,
        recommendationScore: Math.max(100 - index * 10, 10),
        recommendationReason: 'AI recommendation from similar users'
      }));

    await appendRecommendationLog({
      userId: profile.id,
      recommendedProducts: recommendations.map((product) => product.id),
      source: 'collaborative-filtering'
    });

    return res.json({
      recommendations,
      profile: sanitizeUser(profile),
      recommendationSource: 'collaborative-filtering',
      ml: mlResult
    });
  }

  const orders = db.orders.filter((order) => order.userId === profile.id);
  const allUsers = db.users.map((user) => ({
    ...user,
    orders: db.orders.filter((order) => order.userId === user.id)
  }));

  const recommendations = buildRecommendationFeed({
    products: db.products,
    orders,
    profile,
    allUsers
  });

  await appendRecommendationLog({
    userId: profile.id,
    recommendedProducts: recommendations.map((product) => product.id),
    source: 'rule-based'
  });

  return res.json({
    recommendations,
    profile: sanitizeUser(profile),
    recommendationSource: 'rule-based'
  });
}

export async function getMlRecommendationsEndpoint(req, res) {
  const db = await readDatabase();
  const profile = db.users.find((user) => user.id === req.auth.id);

  if (!profile) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const mlResult = getMlRecommendations(db, profile.id);
  if (mlResult.recommendedProductIds.length) {
    await appendRecommendationLog({
      userId: profile.id,
      recommendedProducts: mlResult.recommendedProductIds,
      source: 'collaborative-filtering'
    });

    return res.json({
      user_id: profile.id,
      recommended_products: mlResult.recommendedProductIds,
      method: mlResult.method,
      confidence: mlResult.confidence,
      similar_users: mlResult.similarUsers
    });
  }

  const orders = db.orders.filter((order) => order.userId === profile.id);
  const allUsers = db.users.map((user) => ({
    ...user,
    orders: db.orders.filter((order) => order.userId === user.id)
  }));
  const fallbackRecommendations = buildRecommendationFeed({
    products: db.products,
    orders,
    profile,
    allUsers
  });

  await appendRecommendationLog({
    userId: profile.id,
    recommendedProducts: fallbackRecommendations.map((product) => product.id),
    source: 'rule-based-fallback'
  });

  return res.json({
    user_id: profile.id,
    recommended_products: fallbackRecommendations.map((product) => product.id),
    method: 'rule-based-fallback',
    confidence: 0,
    similar_users: []
  });
}
