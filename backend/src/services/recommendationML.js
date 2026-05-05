function buildPurchaseMatrix(orders) {
  const userProductMap = new Map();

  for (const order of orders) {
    if (!order?.userId) {
      continue;
    }

    const purchasedProducts = userProductMap.get(order.userId) ?? new Set();
    for (const item of order.items ?? []) {
      if (item?.id) {
        purchasedProducts.add(item.id);
      }
    }
    userProductMap.set(order.userId, purchasedProducts);
  }

  return userProductMap;
}

function cosineSimilarity(leftSet, rightSet) {
  if (!leftSet.size || !rightSet.size) {
    return 0;
  }

  let intersection = 0;
  for (const productId of leftSet) {
    if (rightSet.has(productId)) {
      intersection += 1;
    }
  }

  return intersection / Math.sqrt(leftSet.size * rightSet.size);
}

function rankCandidateProducts({ neighbors, targetProducts, limit }) {
  const scores = new Map();
  const frequencies = new Map();

  for (const neighbor of neighbors) {
    for (const productId of neighbor.products) {
      if (targetProducts.has(productId)) {
        continue;
      }

      scores.set(productId, (scores.get(productId) ?? 0) + neighbor.similarity);
      frequencies.set(productId, (frequencies.get(productId) ?? 0) + 1);
    }
  }

  return [...scores.entries()]
    .map(([productId, score]) => ({
      productId,
      score,
      frequency: frequencies.get(productId) ?? 0
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.frequency !== left.frequency) {
        return right.frequency - left.frequency;
      }

      return left.productId.localeCompare(right.productId);
    })
    .slice(0, limit);
}

function rankCandidateProductsFromOrders({ db, neighbors, targetProducts, limit }) {
  const scores = new Map();
  const frequencies = new Map();

  for (const neighbor of neighbors) {
    const neighborOrders = (db.orders ?? []).filter((order) => order.userId === neighbor.userId);
    for (const order of neighborOrders) {
      for (const item of order.items ?? []) {
        const productId = item?.id;
        if (!productId || targetProducts.has(productId)) {
          continue;
        }

        scores.set(productId, (scores.get(productId) ?? 0) + neighbor.similarity);
        frequencies.set(productId, (frequencies.get(productId) ?? 0) + 1);
      }
    }
  }

  return [...scores.entries()]
    .map(([productId, score]) => ({
      productId,
      score,
      frequency: frequencies.get(productId) ?? 0
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.frequency !== left.frequency) {
        return right.frequency - left.frequency;
      }

      return left.productId.localeCompare(right.productId);
    })
    .slice(0, limit);
}

export function getRecommendations(db, userId, { topN = 3, limit = 4 } = {}) {
  const userProductMap = buildPurchaseMatrix(db.orders ?? []);
  const targetProducts = userProductMap.get(userId) ?? new Set();
  const targetOrders = (db.orders ?? []).filter((order) => order.userId === userId);
  const targetUserCount = [...userProductMap.keys()].length;

  // Collaborative filtering learns from purchase overlap:
  // if two users buy similar products, we recommend items from the
  // similar users that the target user has not bought yet.
  if (!targetProducts.size || targetUserCount < 2) {
    return {
      method: 'collaborative-filtering',
      confidence: 0,
      similarUsers: [],
      recommendedProductIds: [],
      targetPurchaseCount: targetProducts.size,
      purchaseMatrix: Object.fromEntries(
        [...userProductMap.entries()].map(([key, value]) => [key, [...value]])
      )
    };
  }

  const sortedNeighbors = [...userProductMap.entries()]
    .filter(([otherUserId]) => otherUserId !== userId)
    .map(([otherUserId, products]) => ({
      userId: otherUserId,
      similarity: cosineSimilarity(targetProducts, products),
      products: [...products]
    }))
    .filter((neighbor) => neighbor.similarity > 0)
    .sort((left, right) => right.similarity - left.similarity);

  const neighbors = sortedNeighbors.slice(0, topN);
  const candidateNeighbors = sortedNeighbors.slice(0, Math.max(topN * 4, 10));

  const rankedCandidates = rankCandidateProducts({
    neighbors: candidateNeighbors,
    targetProducts,
    limit
  });

  const fallbackRankedCandidates =
    rankedCandidates.length > 0
      ? rankedCandidates
      : rankCandidateProductsFromOrders({
          db,
          neighbors: candidateNeighbors,
          targetProducts,
          limit
        });

  return {
    method: 'collaborative-filtering',
    confidence: neighbors.length ? Number((neighbors[0].similarity * 100).toFixed(1)) : 0,
    similarUsers: neighbors.map((neighbor) => ({
      userId: neighbor.userId,
      similarity: Number(neighbor.similarity.toFixed(4))
    })),
    recommendedProductIds: fallbackRankedCandidates.map((candidate) => candidate.productId),
    rankedCandidates: fallbackRankedCandidates,
    targetPurchaseCount: targetProducts.size,
    targetOrderCount: targetOrders.length,
    purchaseMatrix: Object.fromEntries(
      [...userProductMap.entries()].map(([key, value]) => [key, [...value]])
    )
  };
}
