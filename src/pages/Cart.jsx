import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { calculateCartPricing, getCampusLabel } from '../lib/analytics';
import { DELIVERY_ZONES, DISTRICTS } from '../data/deliveryZones';
import { useAuth } from '../context/useAuth';

const PROMO_RULES = {
  CAMPUS2026: { discount: 5000, description: 'Referral discount for new campus users' },
  NEWUSER: { discount: 10000, description: 'First order incentive to improve acquisition' },
  BATCH10: { discount: 8000, description: 'Batch adoption discount for pre-order behavior' },
  GROUPBUY: { discount: 7000, description: 'Shared batch discount for grouped demand' },
};

function getEligiblePromo(code, orderCount, cartItems) {
  const promo = PROMO_RULES[code];
  if (!promo) {
    return null;
  }

  if (code === 'NEWUSER' && orderCount > 0) {
    return null;
  }

  if (code === 'GROUPBUY' && !cartItems.some((item) => item.groupEligible && item.quantity >= 2)) {
    return null;
  }

  return { code, ...promo };
}

function buildVietQrUrl({ amount, user, items }) {
  const accountName = 'CAMPUSCART DEMO';
  const addInfo = `${user?.name ?? 'STUDENT'} / ${user?.id ?? 'USER'} / ${
    items[0]?.name ?? 'ORDER'
  }`;

  return `https://img.vietqr.io/image/mbbank-1900111222333-qr_only.jpg?amount=${amount}&addInfo=${encodeURIComponent(
    addInfo
  )}&accountName=${encodeURIComponent(accountName)}`;
}

export default function Cart() {
  const { user, profile, getCart, saveCart, getOrders, addOrder, payOrder } = useAuth();
  const [cartItems, setCartItems] = useState(() => getCart());
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [promoCode, setPromoCode] = useState('');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [campaignSource, setCampaignSource] = useState(profile?.acquisitionChannel ?? 'Referral');
  const [deliveryAddress, setDeliveryAddress] = useState({
    district: DISTRICTS[0],
    ward: DELIVERY_ZONES[DISTRICTS[0]][0],
    street: '',
  });
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    const syncCart = () => {
      setCartItems(getCart());
    };

    window.addEventListener('cartUpdated', syncCart);
    return () => window.removeEventListener('cartUpdated', syncCart);
  }, [getCart]);

  const wards = DELIVERY_ZONES[deliveryAddress.district] ?? [];
  const orderCount = getOrders().length;

  const pricing = useMemo(() => {
    return calculateCartPricing(
      cartItems,
      deliveryMethod,
      selectedPromo?.discount ?? 0
    );
  }, [cartItems, deliveryMethod, selectedPromo]);
  const vietQrUrl = useMemo(
    () =>
      buildVietQrUrl({
        amount: pricing.total,
        user,
        items: cartItems,
      }),
    [pricing.total, user, cartItems]
  );

  const updateQuantity = (productId, delta) => {
    const updatedItems = cartItems.map((item) =>
      item.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );

    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const removeItem = (productId) => {
    const updatedItems = cartItems.filter((item) => item.id !== productId);
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const applyPromo = () => {
    const normalizedCode = promoCode.trim().toUpperCase();
    const promo = getEligiblePromo(normalizedCode, orderCount, cartItems);

    if (!promo) {
      setSelectedPromo(null);
      setPromoMessage('Promo code is invalid for the current order context.');
      return;
    }

    setSelectedPromo(promo);
    setPromoMessage(promo.description);
  };

  const updateDistrict = (district) => {
    const nextWards = DELIVERY_ZONES[district];
    setDeliveryAddress({
      district,
      ward: nextWards[0],
      street: '',
    });
  };

  const placeOrder = async () => {
    if (!cartItems.length) {
      return;
    }

    if (deliveryMethod === 'delivery' && !deliveryAddress.street.trim()) {
      setAddressError('Street name is required for dormitory delivery.');
      return;
    }

    setAddressError('');
    const order = await addOrder({
      items: cartItems,
      deliveryMethod,
      paymentMethod,
      promoDiscount: selectedPromo?.discount ?? 0,
      promoCode: selectedPromo?.code ?? null,
      deliveryAddress:
        deliveryMethod === 'delivery'
          ? {
              ...deliveryAddress,
              street: deliveryAddress.street.trim(),
            }
          : {
              district: null,
              ward: null,
              street: `Pickup hub at ${getCampusLabel(user?.campusId)}`,
            },
      campaignSource,
    });

    setLastOrder(order);
    setCartItems([]);
  };

  const simulatePayment = async () => {
    if (!lastOrder) {
      return;
    }

    const paidOrder = await payOrder(lastOrder.id);
    setLastOrder(paidOrder);
  };

  if (lastOrder) {
    return (
      <div className="page-shell narrow-shell">
        <section className="card success-card">
          <p className="eyebrow">Order Confirmed</p>
          <h1>Pre-order submitted successfully</h1>
          <p>
            The order is now assigned to a live batch window and recorded in the student
            order history.
          </p>

          <div className="summary-grid">
            <div className="summary-box">
              <span>Order ID</span>
              <strong>{lastOrder.id}</strong>
            </div>
            <div className="summary-box">
              <span>Batch ID</span>
              <strong>{lastOrder.batchId}</strong>
            </div>
            <div className="summary-box">
              <span>Total paid</span>
              <strong>{lastOrder.total.toLocaleString('vi-VN')} VND</strong>
            </div>
            <div className="summary-box">
              <span>Batch window</span>
              <strong>{lastOrder.batchWindow}</strong>
            </div>
            <div className="summary-box">
              <span>Payment status</span>
              <strong>{lastOrder.payment_status}</strong>
            </div>
          </div>

          <div className="button-row">
            <Link to="/" className="primary-button">
              Continue shopping
            </Link>
            <Link to="/orders" className="secondary-button">
              Review orders
            </Link>
            {lastOrder.payment_status !== 'paid' ? (
              <button type="button" className="ghost-button" onClick={simulatePayment}>
                Simulate payment
              </button>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="section-head standalone-head">
        <div>
          <p className="eyebrow">Pre-Order Checkout</p>
          <h1>Review campus order details</h1>
          <p className="support-copy">
            Each order uses the report assumption of 10,000 VND logistics fee, then gets
            routed into campus and district batch windows.
          </p>
        </div>
      </section>

      {!cartItems.length ? (
        <section className="card empty-card">
          <h2>Your cart is empty</h2>
          <p>Add products from the catalog to create a pre-order batch.</p>
          <Link to="/" className="primary-button">
            Open catalog
          </Link>
        </section>
      ) : (
        <section className="checkout-layout">
          <div className="stack">
            {cartItems.map((item) => (
              <article key={item.id} className="card cart-line">
                <div>
                  <p className="eyebrow">{item.category}</p>
                  <h3>{item.name}</h3>
                  <p className="support-copy">
                    {item.vendor} / {item.leadTime}
                  </p>
                </div>

                <div className="quantity-row">
                  <button type="button" onClick={() => updateQuantity(item.id, -1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, 1)}>
                    +
                  </button>
                </div>

                <div className="line-price">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>

          <aside className="card order-sidebar">
            <h2>Order summary</h2>

            <div className="option-group">
              <label>Fulfillment mode</label>
              <div className="option-stack">
                <button
                  type="button"
                  className={`select-button ${deliveryMethod === 'pickup' ? 'selected' : ''}`}
                  onClick={() => setDeliveryMethod('pickup')}
                >
                  Campus pickup
                </button>
                <button
                  type="button"
                  className={`select-button ${deliveryMethod === 'delivery' ? 'selected' : ''}`}
                  onClick={() => setDeliveryMethod('delivery')}
                >
                  Dormitory delivery
                </button>
              </div>
            </div>

            {deliveryMethod === 'delivery' ? (
              <div className="option-group">
                <label>Delivery address</label>
                <div className="stack compact-stack">
                  <select
                    value={deliveryAddress.district}
                    onChange={(event) => updateDistrict(event.target.value)}
                  >
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>

                  <select
                    value={deliveryAddress.ward}
                    onChange={(event) =>
                      setDeliveryAddress((current) => ({
                        ...current,
                        ward: event.target.value,
                      }))
                    }
                  >
                    {wards.map((ward) => (
                      <option key={ward} value={ward}>
                        {ward}
                      </option>
                    ))}
                  </select>

                  <input
                    className="search-input"
                    value={deliveryAddress.street}
                    onChange={(event) =>
                      setDeliveryAddress((current) => ({
                        ...current,
                        street: event.target.value,
                      }))
                    }
                    placeholder="Street name / house number"
                  />
                </div>
                {addressError ? <p className="error-text">{addressError}</p> : null}
              </div>
            ) : null}

            <div className="option-group">
              <label>Payment method</label>
              <div className="option-stack">
                {[
                  ['cod', 'Cash on delivery'],
                  ['vietqr', 'VietQR'],
                  ['bank', 'Bank transfer'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`select-button ${paymentMethod === value ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'vietqr' ? (
              <div className="option-group">
                <label>VietQR payment</label>
                <div className="vietqr-card">
                  <img src={vietQrUrl} alt="VietQR payment code" className="vietqr-image" />
                </div>
              </div>
            ) : null}

            <div className="option-group">
              <label>Campaign source</label>
              <select
                value={campaignSource}
                onChange={(event) => setCampaignSource(event.target.value)}
              >
                {['Referral', 'TikTok', 'Facebook', 'Campus Ambassador', 'Organic Search'].map(
                  (source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="option-group">
              <label>Promo code</label>
              <div className="promo-row">
                <input
                  className="search-input"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="CAMPUS2026"
                />
                <button type="button" className="primary-button compact" onClick={applyPromo}>
                  Apply
                </button>
              </div>
              {promoMessage ? <p className="support-copy">{promoMessage}</p> : null}
            </div>

            <dl className="summary-list">
              <div>
                <dt>Subtotal</dt>
                <dd>{pricing.subtotal.toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Logistics fee</dt>
                <dd>{pricing.deliveryFee.toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Promo discount</dt>
                <dd>{(selectedPromo?.discount ?? 0).toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Contribution margin</dt>
                <dd>{pricing.contributionMargin.toLocaleString('vi-VN')} VND</dd>
              </div>
              <div className="summary-total">
                <dt>Total</dt>
                <dd>{pricing.total.toLocaleString('vi-VN')} VND</dd>
              </div>
            </dl>

            <button type="button" className="primary-button" onClick={placeOrder}>
              Confirm pre-order
            </button>
          </aside>
        </section>
      )}
    </div>
  );
}
