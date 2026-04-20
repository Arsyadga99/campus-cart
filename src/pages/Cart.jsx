import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// === Business Model Constants (from PDF) ===
const COMMISSION_RATE = 0.10;        // 10% platform commission
const DELIVERY_CHARGE = 10000;       // 10,000 VND charged to user
const DELIVERY_COST = 8000;          // 8,000 VND actual cost
const DELIVERY_MARGIN = DELIVERY_CHARGE - DELIVERY_COST; // 2,000 VND
const PAYMENT_FEE = 1500;            // Payment processing fee
const OPERATIONAL_COST = 2000;       // Operational handling per order
const PROMO_SUBSIDY = 2500;          // Average promo/discount subsidy

// Known promo codes
const PROMO_CODES = {
  'CAMPUS2026': { discount: 5000, label: 'Referral code — 5,000 VND off!' },
  'NEWUSER':    { discount: 10000, label: 'First-time user — 10,000 VND off!' },
  'BATCH10':    { discount: 8000, label: 'Batch order discount — 8,000 VND off!' },
};

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [delivery, setDelivery] = useState('pickup');
  const [payment, setPayment] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(saved);
    // Auto-apply NEWUSER for first-timers
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    if (orders.length === 0 && !localStorage.getItem('promoUsed_NEWUSER')) {
      setAppliedPromo({ code: 'NEWUSER', ...PROMO_CODES['NEWUSER'] });
    }
  }, []);

  const sync = (updated) => {
    localStorage.setItem('cart', JSON.stringify(updated));
    setCart(updated);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (id, delta) => {
    let updated = [...cart];
    const idx = updated.findIndex(i => i.id === id);
    if (idx === -1) return;
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) updated.splice(idx, 1);
    else updated[idx].quantity = newQty;
    sync(updated);
  };

  const removeItem = (id) => sync(cart.filter(i => i.id !== id));

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo({ code, ...PROMO_CODES[code] });
      setPromoError('');
    } else {
      setAppliedPromo(null);
      setPromoError('Invalid promo code. Try CAMPUS2026 or BATCH10.');
    }
  };

  // === Financial Calculations ===
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = delivery === 'delivery' ? DELIVERY_CHARGE : 0;
  const promoDiscount = appliedPromo ? appliedPromo.discount : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - promoDiscount);

  // Platform Revenue (per PDF)
  const numOrders = cart.length > 0 ? 1 : 0;  // 1 batch = 1 order transaction
  const commissionRevenue = Math.round(subtotal * COMMISSION_RATE);
  const deliveryMarginRevenue = delivery === 'delivery' ? DELIVERY_MARGIN : 0;
  const totalPlatformRevenue = commissionRevenue + deliveryMarginRevenue;
  const totalVariableCost = numOrders * (PAYMENT_FEE + OPERATIONAL_COST + PROMO_SUBSIDY);
  const contributionMargin = totalPlatformRevenue - totalVariableCost;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      const newOrder = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        items: cart,
        subtotal,
        deliveryFee,
        promoDiscount,
        total: grandTotal,
        platformRevenue: totalPlatformRevenue,
        commissionRevenue,
        deliveryMarginRevenue,
        contributionMargin,
        paymentMethod: payment,
        deliveryMethod: delivery,
        date: new Date().toLocaleString('en-US'),
        timestamp: Date.now(),
      };
      orders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(orders));
      if (appliedPromo) localStorage.setItem(`promoUsed_${appliedPromo.code}`, '1');
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      setLastOrder(newOrder);
      setCart([]);
      setIsProcessing(false);
      setOrderSuccess(true);
    }, 1500);
  };

  // ─── Order Success Screen ───
  if (orderSuccess && lastOrder) {
    return (
      <div className="page">
        <div className="success-page animate-in">
          <div className="success-icon">✅</div>
          <h1>Order Placed!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Your pre-order has been submitted to the batch queue.
          </p>

          <div className="receipt-box">
            <div className="receipt-row">
              <span>Order ID</span><strong>{lastOrder.id}</strong>
            </div>
            <div className="receipt-row">
              <span>Subtotal</span><strong>{lastOrder.subtotal.toLocaleString('vi-VN')} VND</strong>
            </div>
            {lastOrder.deliveryFee > 0 && (
              <div className="receipt-row">
                <span>Delivery Fee</span><strong>{lastOrder.deliveryFee.toLocaleString('vi-VN')} VND</strong>
              </div>
            )}
            {lastOrder.promoDiscount > 0 && (
              <div className="receipt-row" style={{ color: 'var(--accent-dark)' }}>
                <span>Promo Discount</span><strong>− {lastOrder.promoDiscount.toLocaleString('vi-VN')} VND</strong>
              </div>
            )}
            <div className="receipt-row" style={{ fontWeight: 800, fontSize: 16, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span>Total Paid</span><strong style={{ color: 'var(--accent-dark)' }}>{lastOrder.total.toLocaleString('vi-VN')} VND</strong>
            </div>
            <div className="receipt-row" style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Payment</span><span>{lastOrder.paymentMethod.toUpperCase()}</span>
            </div>
            <div className="receipt-row" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Delivery</span><span>{lastOrder.deliveryMethod === 'delivery' ? 'Dormitory Delivery' : 'Campus Pickup'}</span>
            </div>
          </div>

          <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '14px 18px', textAlign: 'left', border: '1px solid #BFDBFE', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase' }}>
              📊 Platform Revenue (This Order)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>Commission (10%)</span><span style={{ fontWeight: 700 }}>{lastOrder.commissionRevenue.toLocaleString('vi-VN')} VND</span>
            </div>
            {lastOrder.deliveryMarginRevenue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>Delivery Margin</span><span style={{ fontWeight: 700 }}>{lastOrder.deliveryMarginRevenue.toLocaleString('vi-VN')} VND</span>
              </div>
            )}
          </div>

          <Link to="/">
            <button className="btn-checkout" style={{ marginTop: 0 }}>
              🛍️ Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Cart View ───
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🛍️ Your Cart</h1>
        <p className="page-subtitle">Review your pre-order before confirming the batch.</p>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some products from the catalog to get started.</p>
          <Link to="/" className="btn-link">Browse Catalog</Link>
        </div>
      ) : (
        <div className="cart-layout">

          {/* ─── Left: Items ─── */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Shopping Basket ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map(item => (
                <div key={item.id} className="cart-item animate-in">
                  <div className="cart-item-emoji">{item.emoji || '📦'}</div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-cat">{item.category}</div>
                    <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>
                      {item.price.toLocaleString('vi-VN')} VND × {item.quantity}
                    </div>
                  </div>
                  <div className="qty-control" style={{ width: 'auto', padding: '6px 10px' }}>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>−</button>
                    <span className="qty-num">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                  <div className="cart-item-price">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                  </div>
                  <button className="btn-remove" onClick={() => removeItem(item.id)} title="Remove">🗑️</button>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right: Sidebar ─── */}
          <div className="cart-sidebar">
            <div className="sidebar-title">📋 Order Summary</div>

            <div className="order-row">
              <span>Subtotal</span>
              <span>{subtotal.toLocaleString('vi-VN')} VND</span>
            </div>

            {/* Delivery */}
            <div style={{ margin: '16px 0' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>🚚 Delivery Method</div>
              <div className="method-options">
                <label className={`method-option ${delivery === 'pickup' ? 'selected' : ''}`}>
                  <input type="radio" name="delivery" value="pickup" checked={delivery === 'pickup'} onChange={() => setDelivery('pickup')} />
                  🏫 Campus Pickup — Free
                </label>
                <label className={`method-option ${delivery === 'delivery' ? 'selected' : ''}`}>
                  <input type="radio" name="delivery" value="delivery" checked={delivery === 'delivery'} onChange={() => setDelivery('delivery')} />
                  🏠 Dormitory Delivery — +10,000 VND
                </label>
              </div>
            </div>

            {delivery === 'delivery' && (
              <div className="order-row">
                <span>Delivery Fee</span>
                <span>+{DELIVERY_CHARGE.toLocaleString('vi-VN')} VND</span>
              </div>
            )}

            {/* Payment */}
            <div style={{ margin: '16px 0' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>💳 Payment Method</div>
              <div className="method-options">
                {[
                  { val: 'cod', label: '💵 Cash on Delivery' },
                  { val: 'momo', label: '💜 Momo e-Wallet' },
                  { val: 'bank', label: '🏦 Bank Transfer' },
                ].map(opt => (
                  <label key={opt.val} className={`method-option ${payment === opt.val ? 'selected' : ''}`}>
                    <input type="radio" name="payment" value={opt.val} checked={payment === opt.val} onChange={() => setPayment(opt.val)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Promo Code */}
            <hr className="divider" />
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>🎁 Promo Code</div>
            <div className="promo-row">
              <input
                className="promo-input"
                placeholder="Enter code (e.g. NEWUSER)"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
              />
              <button className="btn-apply" onClick={applyPromo}>Apply</button>
            </div>
            {appliedPromo && (
              <div className="promo-success">✅ {appliedPromo.label}</div>
            )}
            {promoError && <div className="promo-error">❌ {promoError}</div>}

            {appliedPromo && (
              <div className="order-row" style={{ color: 'var(--accent-dark)' }}>
                <span>Promo Discount</span>
                <span>− {appliedPromo.discount.toLocaleString('vi-VN')} VND</span>
              </div>
            )}

            {/* Platform Revenue Breakdown (PDF transparency) */}
            <div className="revenue-breakdown">
              <div className="revenue-breakdown-title">📊 Platform Revenue (PDF Model)</div>
              <div className="rev-row">
                <span>Commission 10%</span>
                <span>{commissionRevenue.toLocaleString('vi-VN')} VND</span>
              </div>
              {delivery === 'delivery' && (
                <div className="rev-row">
                  <span>Delivery Margin</span>
                  <span>{DELIVERY_MARGIN.toLocaleString('vi-VN')} VND</span>
                </div>
              )}
              <div className="rev-row highlight">
                <span>Platform Earns</span>
                <span>{totalPlatformRevenue.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="rev-row" style={{ color: contributionMargin >= 0 ? 'var(--accent-dark)' : 'var(--danger)', fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                <span>Contribution Margin</span>
                <span>{contributionMargin >= 0 ? '+' : ''}{contributionMargin.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="order-row total">
              <span>Total</span>
              <span>{grandTotal.toLocaleString('vi-VN')} VND</span>
            </div>

            <button
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
            >
              {isProcessing ? '⏳ Processing...' : '✅ Confirm Pre-Order'}
            </button>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 12 }}>
              🔒 Secured & batch-processed by CampusCart
            </div>
          </div>
        </div>
      )}
    </div>
  );
}