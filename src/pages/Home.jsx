import { useState, useEffect } from 'react';
import productsData from '../data/products.json';

const CATEGORIES = ['All', 'Food', 'Study Items', 'Daily Needs'];

// Simulate next batch cutoff: end of today at 8pm
function getNextBatch() {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(20, 0, 0, 0);
  if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1);
  return cutoff;
}

function useCountdown(target) {
  const [remaining, setRemaining] = useState(target - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') };
}

// Simple recommendation: products matching past cart categories, sorted by orders
function getRecommended(history) {
  if (!history || history.length === 0) {
    return productsData.sort((a, b) => b.orders - a.orders).slice(0, 4);
  }
  const usedCategories = [...new Set(history.flatMap(o => o.items.map(i => i.category)))];
  const scored = productsData.map(p => ({
    ...p,
    score: (usedCategories.includes(p.category) ? 100 : 0) + p.orders,
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, 4);
}

export default function Home() {
  const [quantities, setQuantities] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [added, setAdded] = useState({});
  const batchTime = getNextBatch().getTime();
  const countdown = useCountdown(batchTime);

  const orderHistory = JSON.parse(localStorage.getItem('orders')) || [];
  const recommended = getRecommended(orderHistory);

  const filtered = productsData.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const adjustQty = (id, delta) => {
    const cur = quantities[id] || 1;
    const next = cur + delta;
    if (next >= 1) setQuantities({ ...quantities, [id]: next });
  };

  const addToCart = (product) => {
    const qty = quantities[product.id] || 1;
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    const idx = currentCart.findIndex(i => i.id === product.id);
    if (idx >= 0) {
      currentCart[idx].quantity += qty;
    } else {
      currentCart.push({ ...product, quantity: qty });
    }
    localStorage.setItem('cart', JSON.stringify(currentCart));
    setQuantities({ ...quantities, [product.id]: 1 });
    setAdded({ ...added, [product.id]: true });
    setTimeout(() => setAdded(a => ({ ...a, [product.id]: false })), 1500);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const ProductCard = ({ p }) => {
    const qty = quantities[p.id] || 1;
    const justAdded = added[p.id];

    return (
      <div className="product-card animate-in">
        <div className="product-card-img">
          <span>{p.emoji}</span>
          {p.badge && (
            <span className={`badge-tag badge-${p.badge}`}>
              {p.badge === 'preorder' ? '⏰ Pre-order' : p.badge === 'popular' ? '🔥 Popular' : '✨ New'}
            </span>
          )}
        </div>
        <div className="product-card-body">
          <span className="product-category-tag">{p.category}</span>
          <div className="product-name">{p.name}</div>
          <div className="product-desc">{p.description}</div>
          <div className="product-price">
            {p.price.toLocaleString('vi-VN')} VND
            {p.originalPrice && (
              <span className="original-price">{p.originalPrice.toLocaleString('vi-VN')}</span>
            )}
          </div>

          <div className="qty-control">
            <button className="qty-btn" onClick={() => adjustQty(p.id, -1)}>−</button>
            <span className="qty-num">{qty}</span>
            <button className="qty-btn" onClick={() => adjustQty(p.id, 1)}>+</button>
          </div>

          <button
            className="btn-add-cart"
            onClick={() => addToCart(p)}
            style={justAdded ? { background: 'linear-gradient(135deg, #10B981, #059669)' } : {}}
          >
            {justAdded ? '✓ Added!' : '+ Add to Cart'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      {/* Pre-Order Countdown Banner */}
      <div className="preorder-banner">
        <div>
          <h2>⏰ Next Pre-Order Batch Cutoff</h2>
          <p>Order before the cutoff to get aggregated pricing & same-day delivery!</p>
        </div>
        <div className="countdown-boxes">
          <div className="countdown-box">
            <div className="num">{countdown.h}</div>
            <div className="lbl">Hours</div>
          </div>
          <div className="countdown-box">
            <div className="num">{countdown.m}</div>
            <div className="lbl">Mins</div>
          </div>
          <div className="countdown-box">
            <div className="num">{countdown.s}</div>
            <div className="lbl">Secs</div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="section-label">
        <span className="icon">🤖</span>
        AI Recommended for You
      </div>
      <div className="product-grid" style={{ marginBottom: 0 }}>
        {recommended.map(p => <ProductCard key={`rec-${p.id}`} p={p} />)}
      </div>

      {/* Referral Banner */}
      <div className="referral-banner">
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#065F46' }}>🎁 Share CampusCart, Earn Rewards!</div>
          <div style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>
            Invite friends with your referral code & get 5,000 VND per successful signup.
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#047857', marginBottom: 4, fontWeight: 600 }}>Your Code:</div>
          <span className="referral-code">CAMPUS2026</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText('CAMPUS2026'); alert('Code copied!'); }}
          style={{ padding: '8px 18px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Copy Code
        </button>
      </div>

      {/* Main Catalog */}
      <div className="section-label">
        <span className="icon">🛍️</span>
        All Products
      </div>

      <div className="catalog-toolbar">
        <div className="search-bar">
          <span>🔍</span>
          <input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {CATEGORIES.map(c => (
            <span
              key={c}
              className={`chip ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🔍</div>
          <h3>No products found</h3>
          <p>Try changing the search or category filter.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}