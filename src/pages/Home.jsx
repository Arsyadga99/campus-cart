import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Food', 'Study Items', 'Daily Needs'];

/* ─── Greeting ─── */
function getTimeGreeting(name) {
  const h = new Date().getHours();
  const g = h >= 5 && h < 12 ? 'Good morning'
          : h >= 12 && h < 17 ? 'Good afternoon'
          : h >= 17 && h < 21 ? 'Good evening'
          : 'Good night';
  return `${g}, ${name.split(' ')[0]}.`;
}

function getGreetingNote() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Start your morning with fresh campus deals.';
  if (h >= 12 && h < 17) return 'Afternoon orders will be batched by 8 PM today.';
  if (h >= 17 && h < 21) return 'Order before the 8 PM cutoff for same-day delivery.';
  return 'Night owl? Your batch order will be ready tomorrow morning.';
}

/* ─── Countdown ─── */
function getNextBatch() {
  const now = new Date(), cutoff = new Date();
  cutoff.setHours(20, 0, 0, 0);
  if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1);
  return cutoff;
}

function useCountdown(target) {
  const [r, setR] = useState(target - Date.now());
  useEffect(() => {
    const id = setInterval(() => setR(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
  return {
    h: pad(Math.floor(r / 3600000)),
    m: pad(Math.floor((r % 3600000) / 60000)),
    s: pad(Math.floor((r % 60000) / 1000)),
  };
}

/* ─── Icons ─── */
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const ProductIcon = ({ cat }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-faint)' }}>
    {cat === 'Food'
      ? <><circle cx="12" cy="12" r="8"/><path d="M12 6v6l4 2"/></>
      : cat === 'Study Items'
      ? <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>
      : <><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>
    }
  </svg>
);

import productsData from '../data/products.json';

function getRecommended(orders) {
  if (!orders?.length) return productsData.sort((a, b) => b.orders - a.orders).slice(0, 4);
  const usedCats = [...new Set(orders.flatMap(o => o.items.map(i => i.category)))];
  return productsData
    .map(p => ({ ...p, score: (usedCats.includes(p.category) ? 100 : 0) + p.orders }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export default function Home() {
  const { user, getCart, saveCart, getOrders } = useAuth();
  const [cart, setCart]           = useState([]);
  const [quantities, setQuantities] = useState({});
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [added, setAdded]         = useState({});

  const batchTime  = getNextBatch().getTime();
  const countdown  = useCountdown(batchTime);
  const orderHistory = getOrders();
  const recommended  = getRecommended(orderHistory);

  useEffect(() => {
    setCart(getCart());
    const handler = () => setCart(getCart());
    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  }, [user]);

  const filtered = productsData.filter(p => {
    const matchCat  = category === 'All' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      || p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const adjustQty = (id, delta) => {
    const cur = quantities[id] ?? 1;
    const next = Math.max(1, cur + delta);
    setQuantities({ ...quantities, [id]: next });
  };

  const addToCart = (product) => {
    const qty = quantities[product.id] ?? 1;
    const cur = getCart();
    const idx = cur.findIndex(i => i.id === product.id);
    if (idx >= 0) cur[idx].quantity += qty;
    else cur.push({ ...product, quantity: qty });
    saveCart(cur);
    setQuantities(q => ({ ...q, [product.id]: 1 }));
    setAdded(a => ({ ...a, [product.id]: true }));
    setTimeout(() => setAdded(a => ({ ...a, [product.id]: false })), 1500);
  };

  const ProductCard = ({ p, sectionNum }) => {
    const qty = quantities[p.id] ?? 1;
    const justAdded = added[p.id];
    return (
      <div className="product-card animate-in">
        <div className="product-card-img">
          <div className="product-icon-placeholder"><ProductIcon cat={p.category} /></div>
          {p.badge && (
            <span className={`badge-tag badge-${p.badge}`}>
              {p.badge === 'preorder' ? 'Pre-Order' : p.badge === 'popular' ? 'Popular' : 'New'}
            </span>
          )}
        </div>
        <div className="product-card-body">
          {sectionNum && <span className="label-section">Section {String(sectionNum).padStart(2,'0')}</span>}
          <span className="product-section-tag">{p.category}</span>
          <div className="product-name">{p.name}</div>
          <div className="product-desc">{p.description}</div>
          <div className="product-price">
            {p.price.toLocaleString('vi-VN')} VND
            {p.originalPrice && <span className="original-price">{p.originalPrice.toLocaleString('vi-VN')}</span>}
          </div>
          <div className="qty-control">
            <button className="qty-btn" onClick={() => adjustQty(p.id, -1)}>−</button>
            <span className="qty-num">{qty}</span>
            <button className="qty-btn" onClick={() => adjustQty(p.id, 1)}>+</button>
          </div>
          <button className={`btn-add-cart ${justAdded ? 'added' : ''}`} onClick={() => addToCart(p)}>
            {justAdded ? 'Added to Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      {/* ─ Personal Greeting ─ */}
      <div className="home-greeting animate-in">
        <div>
          <div className="label-section">// Welcome back</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, color: 'var(--ink)', marginBottom: 6, lineHeight: 1.2 }}>
            {getTimeGreeting(user?.name || 'Student')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-subtle)' }}>{getGreetingNote()}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ink-faint)', fontWeight: 600, marginBottom: 4 }}>
            Your Orders
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>
            {orderHistory.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-subtle)' }}>total placed</div>
        </div>
      </div>

      {/* ─ Pre-Order Countdown ─ */}
      <div className="preorder-banner">
        <div>
          <div className="preorder-banner-label">// Pre-Order System</div>
          <h2>Next Batch Cutoff</h2>
          <p>Order before the cutoff to receive aggregated pricing and same-day campus delivery.</p>
        </div>
        <div className="countdown-boxes">
          {[{ v: countdown.h, l: 'Hours' }, { v: countdown.m, l: 'Mins' }, { v: countdown.s, l: 'Secs' }].map(({ v, l }) => (
            <div className="countdown-box" key={l}>
              <div className="num">{v}</div>
              <div className="lbl">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─ Recommended ─ */}
      <div style={{ marginBottom: 10 }}>
        <span className="label-section">// Recommended</span>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 className="section-title">Recommended for You</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
            Based on {orderHistory.length > 0 ? 'your purchase history' : 'campus popularity'}
          </span>
        </div>
      </div>
      <div className="product-grid" style={{ marginBottom: 48 }}>
        {recommended.map((p, i) => <ProductCard key={`rec-${p.id}`} p={p} sectionNum={i + 1} />)}
      </div>

      {/* ─ Referral ─ */}
      <div className="referral-banner">
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>
            Referral Program
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
            Share CampusCart, Earn Rewards
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-subtle)' }}>
            Invite peers with your referral code and receive 5,000 VND per successful signup.
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8, fontWeight: 600 }}>Your Code</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="referral-code">CAMPUS2026</span>
            <button onClick={() => navigator.clipboard.writeText('CAMPUS2026')} style={{ padding: '8px 16px', background: 'var(--gold)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* ─ Catalog ─ */}
      <div style={{ marginTop: 48 }}>
        <span className="label-section">// Catalog</span>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 className="section-title">All Products</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>{filtered.length} items</span>
        </div>

        <div className="catalog-toolbar">
          <div className="search-bar">
            <SearchIcon />
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-chips">
            {CATEGORIES.map(c => (
              <span key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</span>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><SearchIcon /></div>
            <h3>No products found</h3>
            <p>Try adjusting the search or category filter.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}