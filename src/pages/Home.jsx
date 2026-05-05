import { useEffect, useMemo, useState } from 'react';
import { PRODUCT_CATEGORIES } from '../data/products';
import { formatCountdown, getBatchCutoffDate, getCampusLabel } from '../lib/analytics';
import { VENDOR_BY_ID } from '../data/vendors';
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
  const vendor = VENDOR_BY_ID[product.vendorId];

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
          <dt>Campus cluster</dt>
          <dd>{product.campusIds.length} campuses</dd>
        </div>
        <div>
          <dt>Lead time</dt>
          <dd>{product.leadTime}</dd>
        </div>
        <div>
          <dt>Commission tier</dt>
          <dd>{Math.round((vendor?.commissionRate ?? 0.1) * 100)}%</dd>
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

      <div className="button-row">
        <button
          type="button"
          className="ghost-button"
          onClick={() => window.location.href = `/product/${product.id}`}
        >
          View details
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => onAddToCart(product)}
        >
          Add to pre-order
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const {
    user,
    profile,
    platformMode,
    getCart,
    saveCart,
    getOrders,
    getProducts,
    recommendations,
  } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [cartSummary, setCartSummary] = useState({ items: 0, total: 0 });
  const countdown = useBatchCountdown();

  const campusProducts = useMemo(
    () => getProducts().filter((product) => product.campusIds.includes(user?.campusId)),
    [user?.campusId, getProducts]
  );

  const filteredProducts = useMemo(() => {
    return campusProducts.filter((product) => {
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
  }, [campusProducts, searchTerm, selectedCategory]);

  const groupBuyCandidates = useMemo(
    () => campusProducts.filter((product) => product.groupEligible).slice(0, 3),
    [campusProducts]
  );

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
          <h1>CampusCart turns multi-campus demand into faster, cheaper orders.</h1>
          <p className="hero-copy">
            The platform now combines campus-aware catalog routing, smart batch windows,
            referral growth loops, loyalty tracking, and vendor tier monetization.
          </p>

          <div className="hero-actions">
            <div className="metric-pill">
              <span>Campus</span>
              <strong>{getCampusLabel(user?.campusId)}</strong>
            </div>
            <div className="metric-pill">
              <span>Loyalty</span>
              <strong>{profile?.loyaltyTier ?? 'Starter'}</strong>
            </div>
            <div className="metric-pill">
              <span>Referral code</span>
              <strong>{profile?.referralCode ?? '-'}</strong>
            </div>
            <div className="metric-pill">
              <span>Cart value</span>
              <strong>{cartSummary.total.toLocaleString('vi-VN')} VND</strong>
            </div>
          </div>
        </div>

        <div className="card spotlight-card">
          <p className="eyebrow">Smart Batch Delivery</p>
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
            Orders are grouped by campus, district, ward, and cutoff window. Group-buy
            eligible items strengthen route density and improve delivery margin over time.
          </p>
          <p className="support-copy">Runtime: {platformMode}</p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Retention Loops</p>
            <h2>Referral, loyalty, and group-buy drivers</h2>
          </div>
        </div>

        <div className="feature-grid">
          <article className="card feature-card">
            <h3>Loyalty balance</h3>
            <p>
              <strong>Points:</strong> {profile?.loyaltyPoints ?? 0}
            </p>
            <p>
              <strong>Tier:</strong> {profile?.loyaltyTier ?? 'Starter'}
            </p>
          </article>
          <article className="card feature-card">
            <h3>Referral growth</h3>
            <p>
              <strong>Your code:</strong> {profile?.referralCode ?? '-'}
            </p>
            <p>New referred students add loyalty points to both sides of the loop.</p>
          </article>
          <article className="card feature-card">
            <h3>Group-buy priority</h3>
            <p>
              <strong>Eligible SKUs:</strong> {groupBuyCandidates.length}
            </p>
            <p>Batch-friendly products are highlighted to reduce route fragmentation.</p>
          </article>
        </div>
      </section>



      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI Recommendation</p>
            <h2>Recommended from similar student behavior</h2>
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
              <div className="button-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => window.location.href = `/product/${product.id}`}
                >
                  View details
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => addToCart(product)}
                >
                  Add to pre-order
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Localized vendor supply for {getCampusLabel(user?.campusId)}</h2>
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
