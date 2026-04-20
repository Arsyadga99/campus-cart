export function buildRecommendationFeed(products, orders) {
  const categoryCounts = new Map();
  const vendorCounts = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + item.quantity);
      vendorCounts.set(item.vendor, (vendorCounts.get(item.vendor) ?? 0) + item.quantity);
    });
  });

  return products
    .map((product) => {
      const categoryScore = (categoryCounts.get(product.category) ?? 0) * 8;
      const vendorScore = (vendorCounts.get(product.vendor) ?? 0) * 5;
      const campusDemandScore = Math.round(product.campusDemand / 10);

      return {
        ...product,
        recommendationScore: categoryScore + vendorScore + campusDemandScore,
        recommendationReason:
          categoryScore > 0
            ? `Recommended from your ${product.category.toLowerCase()} purchase pattern`
            : `Recommended from current campus demand in ${product.category.toLowerCase()}`,
      };
    })
    .sort((left, right) => right.recommendationScore - left.recommendationScore)
    .slice(0, 4);
}
