import { readDatabase } from '../db.js';

function getPurchasedProductsAfterTimestamp(orders, userId, timestamp) {
  const cutoff = new Date(timestamp).getTime();
  const purchased = new Set();

  for (const order of orders) {
    if (order.userId !== userId) {
      continue;
    }

    if (new Date(order.createdAt).getTime() < cutoff) {
      continue;
    }

    for (const item of order.items ?? []) {
      if (item?.id) {
        purchased.add(item.id);
      }
    }
  }

  return purchased;
}

function safeRatio(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return numerator / denominator;
}

export async function getAiPerformance(req, res) {
  const db = await readDatabase();
  const logs = Array.isArray(db.recommendation_logs) ? db.recommendation_logs : [];
  const orders = Array.isArray(db.orders) ? db.orders : [];

  let tp = 0;
  let fp = 0;
  let fn = 0;
  let totalRecommendations = 0;

  for (const log of logs) {
    const recommended = new Set(log.recommended_products ?? []);
    if (!recommended.size || !log.user_id || !log.timestamp) {
      continue;
    }

    const purchased = getPurchasedProductsAfterTimestamp(orders, log.user_id, log.timestamp);
    totalRecommendations += recommended.size;

    for (const productId of recommended) {
      if (purchased.has(productId)) {
        tp += 1;
      } else {
        fp += 1;
      }
    }

    for (const productId of purchased) {
      if (!recommended.has(productId)) {
        fn += 1;
      }
    }
  }

  const precision = safeRatio(tp, tp + fp);
  const recall = safeRatio(tp, tp + fn);
  const f1Score = safeRatio(2 * precision * recall, precision + recall);
  const totalUsers = db.users?.length ?? 0;

  return res.json({
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1_score: Number(f1Score.toFixed(4)),
    total_users: totalUsers,
    total_recommendations: totalRecommendations,
    tp,
    fp,
    fn
  });
}
