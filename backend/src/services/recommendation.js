function daysBetween(from, to) {
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

export function buildRecommendationFeed({ products, orders, profile, allUsers = [] }) {
  const now = new Date();
  const userOrders = orders.filter((order) => order.userId === profile?.id);
  const campusOrders = allUsers
    .filter((user) => user.campusId === profile?.campusId)
    .flatMap((user) => user.orders);

  return products
    .map((product) => {
      const categoryMatch = userOrders.reduce(
        (sum, order) =>
          sum +
          order.items.filter((item) => item.category === product.category).reduce((acc, item) => acc + item.quantity, 0),
        0
      );
      const purchaseFrequency = userOrders.reduce(
        (sum, order) =>
          sum +
          order.items.filter((item) => item.id === product.id).reduce((acc, item) => acc + item.quantity, 0),
        0
      );
      const recencyScore = userOrders.reduce((score, order) => {
        const hasProduct = order.items.some((item) => item.id === product.id);
        if (!hasProduct) {
          return score;
        }

        const age = daysBetween(new Date(order.createdAt), now);
        if (age <= 7) return Math.max(score, 20);
        if (age <= 30) return Math.max(score, 10);
        if (age <= 90) return Math.max(score, 4);
        return Math.max(score, 1);
      }, 0);
      const campusAffinity = product.campusIds.includes(profile?.campusId) ? 15 : 0;
      const campusNetwork = campusOrders.reduce(
        (sum, order) =>
          sum +
          order.items.filter((item) => item.id === product.id).reduce((acc, item) => acc + item.quantity, 0),
        0
      );
      const demandScore = Math.round(product.campusDemand / 15);

      const recommendationScore =
        categoryMatch * 8 +
        purchaseFrequency * 14 +
        recencyScore +
        campusAffinity +
        campusNetwork * 3 +
        demandScore;

      let recommendationReason = 'Rule-based recommendation system';
      if (purchaseFrequency > 0) {
        recommendationReason = 'Recommended from your purchase history';
      } else if (categoryMatch > 0) {
        recommendationReason = `Recommended from your ${product.category.toLowerCase()} activity`;
      } else if (campusNetwork > 0) {
        recommendationReason = 'Trending among students in your campus network';
      } else if (campusAffinity > 0) {
        recommendationReason = 'Fits your campus catalog';
      }

      return {
        ...product,
        recommendationScore,
        recommendationReason
      };
    })
    .sort((left, right) => right.recommendationScore - left.recommendationScore)
    .slice(0, 4);
}
