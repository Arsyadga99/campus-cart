function getHourBias() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) {
    return 'morning';
  }

  if (hour >= 11 && hour < 17) {
    return 'midday';
  }

  return 'night';
}

function getTemporalBoost(product, timeBias) {
  if (timeBias === 'morning' && product.category === 'Food') {
    return 10;
  }

  if (timeBias === 'midday' && product.leadTime === 'Same day') {
    return 8;
  }

  if (timeBias === 'night' && product.groupEligible) {
    return 6;
  }

  return 0;
}

export function buildRecommendationFeed(products, orders, profile, allUsers = []) {
  const categoryCounts = new Map();
  const vendorCounts = new Map();
  const repeatItemCounts = new Map();
  const collaborativeCounts = new Map();
  const timeBias = getHourBias();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + item.quantity);
      vendorCounts.set(item.vendorId, (vendorCounts.get(item.vendorId) ?? 0) + item.quantity);
      repeatItemCounts.set(item.id, (repeatItemCounts.get(item.id) ?? 0) + item.quantity);
    });
  });

  allUsers
    .filter((user) => user.campusId === profile?.campusId)
    .forEach((user) => {
      user.orders.forEach((order) => {
        order.items.forEach((item) => {
          collaborativeCounts.set(item.id, (collaborativeCounts.get(item.id) ?? 0) + item.quantity);
        });
      });
    });

  return products
    .map((product) => {
      const campusScore = product.campusIds.includes(profile?.campusId) ? 20 : 0;
      const categoryScore = (categoryCounts.get(product.category) ?? 0) * 8;
      const vendorScore = (vendorCounts.get(product.vendorId) ?? 0) * 5;
      const repeatIntentScore = (repeatItemCounts.get(product.id) ?? 0) * 12;
      const collaborativeScore = (collaborativeCounts.get(product.id) ?? 0) * 3;
      const campusDemandScore = Math.round(product.campusDemand / 10);
      const temporalBoost = getTemporalBoost(product, timeBias);

      const recommendationScore =
        campusScore +
        categoryScore +
        vendorScore +
        repeatIntentScore +
        collaborativeScore +
        campusDemandScore +
        temporalBoost;

      let recommendationReason = `Strong fit for ${profile?.campusId ? 'your campus cluster' : 'current campus demand'}`;

      if (repeatIntentScore > 0) {
        recommendationReason = 'Recommended from your repeat purchase history';
      } else if (collaborativeScore > 0) {
        recommendationReason = 'Trending among students in your campus network';
      } else if (categoryScore > 0) {
        recommendationReason = `Recommended from your ${product.category.toLowerCase()} browsing pattern`;
      }

      return {
        ...product,
        recommendationScore,
        recommendationReason,
      };
    })
    .sort((left, right) => right.recommendationScore - left.recommendationScore)
    .slice(0, 4);
}
