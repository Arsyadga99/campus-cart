import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Orders() {
  const { getOrders } = useAuth();

  const orders = useMemo(
    () => [...getOrders()].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [getOrders]
  );

  if (!orders.length) {
    return (
      <div className="page-shell">
        <section className="card empty-card">
          <p className="eyebrow">Order History</p>
          <h2>No orders have been placed yet</h2>
          <p>The history page will track all student purchases once you place your first order.</p>
          <Link to="/" className="primary-button">
            Browse catalog
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="section-head standalone-head">
        <div>
          <p className="eyebrow">Purchase History</p>
          <h1>Student order timeline</h1>
          <p className="support-copy">
            Review what you ordered, when you ordered it, and the amount you paid.
          </p>
        </div>
      </section>

      <section className="stack">
        {orders.map((order) => (
          <article key={order.id} className="card order-entry">
            <div className="order-entry-header">
              <div>
                <h2>{order.id}</h2>
                <p className="support-copy">
                  {new Date(order.createdAt).toLocaleString('en-US')}
                </p>
              </div>
              <div className="order-badge-block">
                <span>{order.total.toLocaleString('vi-VN')} VND</span>
                <small>{order.deliveryMethod}</small>
              </div>
            </div>

            <div className="order-item-list">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.id}`} className="order-item-row">
                  <span>
                    {item.quantity} x {item.name}
                  </span>
                  <span>{(item.quantity * item.price).toLocaleString('vi-VN')} VND</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
