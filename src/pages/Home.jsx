import { useEffect, useMemo, useState } from 'react';
import { ADVANCED_FEATURES } from '../constants/business';
import { PRODUCTS, PRODUCT_CATEGORIES } from '../data/products';
import { formatCountdown, getBatchCutoffDate } from '../lib/analytics';
import { buildRecommendationFeed } from '../lib/recommendation';
import { useAuth } from '../context/useAuth';

function useBatchCountdown() {
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getBatchCutoffDate().getTime())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(formatCountdown(getBatchCutoffDate().getTime()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return countdown;
}

function ProductCard({ product, quantity, onChangeQuantity, onAddToCart }) {
  return (
    <article className="card product-card">
      <div className="product-card-top">
        <div>
          <p className="eyebrow">{product.category}</p>
          <h3>{product.name}</h3>
        </div>
        {product.badge ? <span className="tag">{product.badge}</span> : null}
      </div>

      <p className="product-description">{product.description}</p>

      <dl className="product-meta">
        <div>
          <dt>Vendor</dt>
          <dd>{product.vendor}</dd>
        </div>
        <div>
          <dt>Lead time</dt>
          <dd>{product.leadTime}</dd>
        </div>
        <div>
          <dt>Campus demand</dt>
          <dd>{product.campusDemand} orders</dd>
        </div>
      </dl>

      <div className="price-row">
        <strong>{product.price.toLocaleString('vi-VN')} VND</strong>
        {product.originalPrice ? (
          <span>{product.originalPrice.toLocaleString('vi-VN')} VND</span>
        ) : null}
      </div>

      <div className="quantity-row">
        <button type="button" onClick={() => onChangeQuantity(product.id, -1)}>
          -
        </button>
        <span>{quantity}</span>
        <button type="button" onClick={() => onChangeQuantity(product.id, 1)}>
          +
        </button>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={() => onAddToCart(product)}
      >
        Add to pre-order
      </button>
    </article>
  );
}

export default function Home() {
  const { user, getCart, saveCart, getOrders } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [cartSummary, setCartSummary] = useState({ items: 0, total: 0 });
  const countdown = useBatchCountdown();

  const orders = getOrders();

  const recommendations = useMemo(
    () => buildRecommendationFeed(PRODUCTS, orders),
    [orders]
  );

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const categoryMatches =
        selectedCategory === 'All' || product.category === selectedCategory;
      const query = searchTerm.trim().toLowerCase();
      const searchMatches =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.vendor.toLowerCase().includes(query);

      return categoryMatches && searchMatches;
    });
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const syncSummary = () => {
      const cart = getCart();
      setCartSummary({
        items: cart.reduce((sum, item) => sum + item.quantity, 0),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });
    };

    syncSummary();
    window.addEventListener('cartUpdated', syncSummary);
    return () => window.removeEventListener('cartUpdated', syncSummary);
  }, [getCart, user]);

  const updateQuantity = (productId, delta) => {
    setQuantities((current) => {
      const nextQuantity = Math.max(1, (current[productId] ?? 1) + delta);
      return { ...current, [productId]: nextQuantity };
    });
  };

  const addToCart = (product) => {
    const cart = [...getCart()];
    const quantity = quantities[product.id] ?? 1;
    const index = cart.findIndex((item) => item.id === product.id);

    if (index >= 0) {
      cart[index] = {
        ...cart[index],
        quantity: cart[index].quantity + quantity,
      };
    } else {
      cart.push({ ...product, quantity });
    }

    saveCart(cart);
    setQuantities((current) => ({ ...current, [product.id]: 1 }));
  };

  return (
    <div className="page-shell">
      <section className="hero-grid">
        <div className="card hero-card">
          <p className="eyebrow">Student-Centered Marketplace</p>
          <h1>CampusCart turns daily campus demand into faster, cheaper orders.</h1>
          <p className="hero-copy">
            The platform combines pre-order batching, local vendors, tailored
            recommendations, and analytics-led operations to support the business
            model described in the project report.
          </p>

          <div className="hero-actions">
            <div className="metric-pill">
              <span>Current user</span>
              <strong>{user?.name}</strong>
            </div>
            <div className="metric-pill">
              <span>Orders placed</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="metric-pill">
              <span>Cart value</span>
              <strong>{cartSummary.total.toLocaleString('vi-VN')} VND</strong>
            </div>
          </div>
        </div>

        <div className="card spotlight-card">
          <p className="eyebrow">Batch Delivery</p>
          <h2>Next cut-off at 20:00</h2>
          <div className="countdown-grid">
            <div>
              <strong>{countdown.hours}</strong>
              <span>Hours</span>
            </div>
            <div>
              <strong>{countdown.minutes}</strong>
              <span>Minutes</span>
            </div>
            <div>
              <strong>{countdown.seconds}</strong>
              <span>Seconds</span>
            </div>
          </div>
          <p className="support-copy">
            Orders submitted before the cutoff are consolidated for same-day or
            next-batch fulfillment, which matches the PDF requirement for
            pre-order aggregation and local delivery efficiency.
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Advanced Features</p>
            <h2>E-commerce 4.0 features implemented in the product</h2>
          </div>
        </div>

        <div className="feature-grid">
          {ADVANCED_FEATURES.map((feature) => (
            <article key={feature.id} className="card feature-card">
              <h3>{feature.title}</h3>
              <p>
                <strong>Why it matters:</strong> {feature.importance}
              </p>
              <p>
                <strong>How it helps:</strong> {feature.impact}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI Recommendation</p>
            <h2>Recommended for your campus routine</h2>
          </div>
        </div>

        <div className="product-grid">
          {recommendations.map((product) => (
            <article key={product.id} className="card recommendation-card">
              <div className="recommendation-header">
                <h3>{product.name}</h3>
                <span className="tag">Score {product.recommendationScore}</span>
              </div>
              <p>{product.recommendationReason}</p>
              <div className="compact-meta">
                <span>{product.vendor}</span>
                <span>{product.price.toLocaleString('vi-VN')} VND</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Localized vendor supply for student needs</h2>
          </div>
          <div className="catalog-summary">
            <span>{filteredProducts.length} products shown</span>
            <span>{cartSummary.items} items in cart</span>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by product or vendor"
          />
          <div className="chip-row">
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`chip ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={quantities[product.id] ?? 1}
              onChangeQuantity={updateQuantity}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
