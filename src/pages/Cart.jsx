import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COMMISSION_RATE   = 0.10;
const DELIVERY_CHARGE   = 10000;
const DELIVERY_COST     = 8000;
const DELIVERY_MARGIN   = DELIVERY_CHARGE - DELIVERY_COST;
const PAYMENT_FEE       = 1500;
const OPERATIONAL_COST  = 2000;
const PROMO_SUBSIDY     = 2500;

const PROMOS = {
  'CAMPUS2026': { discount: 5000,  label: 'Referral code — 5,000 VND off.' },
  'NEWUSER':    { discount: 10000, label: 'First-time user — 10,000 VND off.' },
  'BATCH10':    { discount: 8000,  label: 'Batch discount — 8,000 VND off.' },
};

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const ProductIcon = ({ cat }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--ink-faint)' }}>
    {cat === 'Food'
      ? <><circle cx="12" cy="12" r="8"/><path d="M12 6v6l4 2"/></>
      : cat === 'Study Items'
      ? <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>
      : <><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>
    }
  </svg>
);

export default function Cart() {
  const { user, getCart, saveCart, addOrder, getOrders } = useAuth();
  const [cart, setCart]         = useState([]);
  const [delivery, setDelivery] = useState('pickup');
  const [payment, setPayment]   = useState('cod');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderDone, setOrderDone]   = useState(false);
  const [lastOrder, setLastOrder]   = useState(null);

  useEffect(() => {
    // Auto-apply NEWUSER if first order
    const orders = getOrders();
    if (orders.length === 0 && !localStorage.getItem(`cc_promo_used_NEWUSER_${user?.id}`)) {
      setApplied({ code: 'NEWUSER', ...PROMOS['NEWUSER'] });
    }
    setCart(getCart());
  }, [user]);

  const syncCart = (updated) => { saveCart(updated); setCart(updated); };
  const updateQty    = (id, d) => {
    const u = cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i);
    syncCart(u);
  };
  const removeItem = (id) => syncCart(cart.filter(i => i.id !== id));

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (PROMOS[code]) { setApplied({ code, ...PROMOS[code] }); setPromoError(''); }
    else { setApplied(null); setPromoError('Invalid code. Try: CAMPUS2026, NEWUSER, BATCH10'); }
  };

  const subtotal    = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = delivery === 'delivery' ? DELIVERY_CHARGE : 0;
  const discount    = appliedPromo?.discount ?? 0;
  const grandTotal  = Math.max(0, subtotal + deliveryFee - discount);

  const commission  = Math.round(subtotal * COMMISSION_RATE);
  const delMargin   = delivery === 'delivery' ? DELIVERY_MARGIN : 0;
  const platformRev = commission + delMargin;
  const varCost     = PAYMENT_FEE + OPERATIONAL_COST + PROMO_SUBSIDY;
  const contribution = platformRev - varCost;

  const handleCheckout = () => {
    if (!cart.length) return;
    setProcessing(true);
    setTimeout(() => {
      const order = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        items: cart,
        subtotal,
        deliveryFee,
        promoDiscount: discount,
        total: grandTotal,
        platformRevenue: platformRev,
        commissionRevenue: commission,
        deliveryMarginRevenue: delMargin,
        contributionMargin: contribution,
        paymentMethod: payment,
        deliveryMethod: delivery,
        date: new Date().toLocaleString('en-US'),
        timestamp: Date.now(),
      };
      addOrder(order);
      if (appliedPromo) localStorage.setItem(`cc_promo_used_${appliedPromo.code}_${user?.id}`, '1');
      saveCart([]);
      setLastOrder(order);
      setCart([]);
      setProcessing(false);
      setOrderDone(true);
    }, 1400);
  };

  /* ── Order Success ── */
  if (orderDone && lastOrder) {
    return (
      <div className="page">
        <div className="success-page animate-in">
          <span className="label-section">// Order Confirmed</span>
          <h1 style={{ marginBottom: 12 }}>Pre-Order Placed</h1>
          <p style={{ color: 'var(--ink-subtle)', fontSize: 14, marginBottom: 28 }}>
            Your order is queued in the next delivery batch and will be dispatched shortly.
          </p>
          <div className="receipt-box">
            {[
              ['Order ID', lastOrder.id],
              ['Subtotal', `${lastOrder.subtotal.toLocaleString('vi-VN')} VND`],
              ...(lastOrder.deliveryFee > 0 ? [['Delivery Fee', `${lastOrder.deliveryFee.toLocaleString('vi-VN')} VND`]] : []),
              ...(lastOrder.promoDiscount > 0 ? [['Promo Discount', `− ${lastOrder.promoDiscount.toLocaleString('vi-VN')} VND`]] : []),
            ].map(([l, v]) => (
              <div className="receipt-row" key={l}><span>{l}</span><strong>{v}</strong></div>
            ))}
            <div className="receipt-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6, fontWeight: 700 }}>
              <span>Total Paid</span>
              <strong style={{ fontSize: 16 }}>{lastOrder.total.toLocaleString('vi-VN')} VND</strong>
            </div>
            <div className="receipt-row" style={{ color: 'var(--ink-faint)' }}>
              <span>Payment</span><span style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{lastOrder.paymentMethod}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to="/"><button className="btn-checkout" style={{ width: 'auto', padding: '12px 28px' }}>Continue Shopping</button></Link>
            <Link to="/orders"><button className="btn-checkout" style={{ width: 'auto', padding: '12px 28px', background: 'none', color: 'var(--ink)', border: '1px solid var(--border)' }}>View My Orders</button></Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Cart View ── */
  return (
    <div className="page">
      <div className="page-header">
        <span className="label-section">// Pre-Order Cart</span>
        <h1 className="page-title">Review Your Order</h1>
        <p className="page-subtitle">Confirm items before submitting to the next campus batch.</p>
      </div>

      {!cart.length ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h3>Your cart is empty</h3>
          <p>Browse the catalog and add items to your pre-order.</p>
          <Link to="/" className="btn-primary">Browse Catalog</Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items */}
          <div>
            <div className="cart-list-header">{cart.reduce((s, i) => s + i.quantity, 0)} items in basket</div>
            {cart.map(item => (
              <div key={item.id} className="cart-item animate-in">
                <div className="cart-item-icon"><ProductIcon cat={item.category} /></div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-cat">{item.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {item.price.toLocaleString('vi-VN')} VND × {item.quantity}
                  </div>
                </div>
                <div className="qty-control" style={{ width: 'auto', padding: '6px 10px' }}>
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <div className="cart-item-price">{(item.price * item.quantity).toLocaleString('vi-VN')} VND</div>
                <button className="btn-remove" onClick={() => removeItem(item.id)}><TrashIcon /></button>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="cart-sidebar">
            <div className="sidebar-title">Order Summary</div>

            <div className="order-row"><span>Subtotal</span><span className="font-mono">{subtotal.toLocaleString('vi-VN')} VND</span></div>

            <div className="method-section-label">Delivery Method</div>
            <div className="method-options">
              <label className={`method-option ${delivery === 'pickup' ? 'selected' : ''}`}>
                <input type="radio" name="d" value="pickup" checked={delivery === 'pickup'} onChange={() => setDelivery('pickup')} />
                Campus Pickup — Free
              </label>
              <label className={`method-option ${delivery === 'delivery' ? 'selected' : ''}`}>
                <input type="radio" name="d" value="delivery" checked={delivery === 'delivery'} onChange={() => setDelivery('delivery')} />
                Dormitory Delivery — +{DELIVERY_CHARGE.toLocaleString('vi-VN')} VND
              </label>
            </div>

            {delivery === 'delivery' && (
              <div className="order-row" style={{ marginTop: 8 }}>
                <span>Delivery Fee</span>
                <span className="font-mono">+{DELIVERY_CHARGE.toLocaleString('vi-VN')} VND</span>
              </div>
            )}

            <div className="method-section-label">Payment Method</div>
            <div className="method-options">
              {[{ v: 'cod', l: 'Cash on Delivery' }, { v: 'momo', l: 'Momo e-Wallet' }, { v: 'bank', l: 'Bank Transfer' }].map(o => (
                <label key={o.v} className={`method-option ${payment === o.v ? 'selected' : ''}`}>
                  <input type="radio" name="p" value={o.v} checked={payment === o.v} onChange={() => setPayment(o.v)} />
                  {o.l}
                </label>
              ))}
            </div>

            <hr className="divider" />

            <div className="method-section-label">Promo Code</div>
            <div className="promo-row">
              <input className="promo-input" placeholder="Enter code..." value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && applyPromo()} />
              <button className="btn-apply" onClick={applyPromo}>Apply</button>
            </div>
            {appliedPromo && <div className="promo-success">{appliedPromo.label}</div>}
            {promoError   && <div className="promo-error">{promoError}</div>}
            {appliedPromo && (
              <div className="order-row" style={{ marginTop: 8, color: 'var(--success)' }}>
                <span>Discount</span>
                <span className="font-mono">− {discount.toLocaleString('vi-VN')} VND</span>
              </div>
            )}

            <div className="revenue-breakdown">
              <div className="revenue-breakdown-title">Platform Revenue Model</div>
              <div className="rev-row"><span>Commission (10%)</span><span>{commission.toLocaleString('vi-VN')} VND</span></div>
              {delivery === 'delivery' && <div className="rev-row"><span>Delivery Margin</span><span>{DELIVERY_MARGIN.toLocaleString('vi-VN')} VND</span></div>}
              <div className="rev-row highlight"><span>Platform Earns</span><span>{platformRev.toLocaleString('vi-VN')} VND</span></div>
              <div className="rev-row" style={{ color: contribution >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700, marginTop: 4, fontSize: 11 }}>
                <span>Contribution Margin</span>
                <span>{contribution >= 0 ? '+' : ''}{contribution.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            <div className="order-row total"><span>Total</span><span>{grandTotal.toLocaleString('vi-VN')} VND</span></div>

            <button className="btn-checkout" onClick={handleCheckout} disabled={processing || !cart.length}>
              {processing ? 'Processing...' : 'Confirm Pre-Order'}
            </button>
            <div className="info-bar">Secured and batch-processed by CampusCart</div>
          </div>
        </div>
      )}
    </div>
  );
}