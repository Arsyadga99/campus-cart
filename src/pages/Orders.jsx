import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { getOrders, user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders([...getOrders()].reverse());
  }, [user]);

  return (
    <div className="page">
      <div className="page-header">
        <span className="label-section">// Purchase History</span>
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">All pre-orders placed under your account.</p>
      </div>

      {!orders.length ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <h3>No orders yet</h3>
          <p>Place your first pre-order to see purchase history here.</p>
          <Link to="/" className="btn-primary">Browse Catalog</Link>
        </div>
      ) : (
        <div>
          {orders.map(o => (
            <div key={o.id} className="order-card animate-in">
              <div style={{ flex: 1 }}>
                <div className="order-card-id">{o.id}</div>
                <div className="order-card-date">{o.date}</div>
                <div className="order-card-items" style={{ marginTop: 6 }}>
                  {o.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)', padding: '2px 8px', background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 2 }}>
                    {o.deliveryMethod === 'delivery' ? 'Dormitory Delivery' : 'Campus Pickup'}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)', padding: '2px 8px', background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 2, textTransform: 'uppercase' }}>
                    {o.paymentMethod}
                  </span>
                  {o.promoDiscount > 0 && (
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--success)', padding: '2px 8px', background: 'var(--success-light)', border: '1px solid #BBF7D0', borderRadius: 2 }}>
                      Promo − {o.promoDiscount.toLocaleString('vi-VN')} VND
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--ink)' }}>
                  {o.total.toLocaleString('vi-VN')} VND
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '3px 0 12px', fontFamily: 'var(--font-mono)' }}>
                  subtotal: {o.subtotal.toLocaleString('vi-VN')} VND
                </div>
                <div className="order-badge">Delivered</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
