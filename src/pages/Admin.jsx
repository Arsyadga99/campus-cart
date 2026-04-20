import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ADVANCED_FEATURES,
  BREAK_EVEN_ORDERS,
  BUSINESS_RULES,
  CAMPUS_PHASES,
} from '../constants/business';
import { summarizeAnalytics } from '../lib/analytics';
import { useAuth } from '../context/useAuth';

function resolveTab(pathname) {
  if (pathname === '/admin/orders') {
    return 'orders';
  }

  if (pathname === '/admin/economics') {
    return 'economics';
  }

  if (pathname === '/admin/users') {
    return 'users';
  }

  return 'overview';
}

function KpiCard({ label, value, helper }) {
  return (
    <article className="card kpi-card-v2">
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      <p>{helper}</p>
    </article>
  );
}

export default function Admin() {
  const location = useLocation();
  const activeTab = resolveTab(location.pathname);
  const { getAllUsersWithOrders, deleteStudent } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [users, setUsers] = useState(() => getAllUsersWithOrders());

  const allOrders = useMemo(
    () =>
      users
        .flatMap((user) => user.orders.map((order) => ({ ...order, studentName: user.name })))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [users]
  );

  const analytics = useMemo(() => summarizeAnalytics(users, allOrders), [users, allOrders]);
  const upcomingPhases = useMemo(
    () => CAMPUS_PHASES.filter((phase) => phase.id !== analytics.activePhase.id),
    [analytics.activePhase.id]
  );

  const handleDeleteStudent = (userId) => {
    deleteStudent(userId);
    setUsers((current) => current.filter((user) => user.id !== userId));
  };

  return (
    <div className="page-shell">
      <section className="section-head standalone-head">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>Business analytics and feasibility tracking</h1>
          <p className="support-copy">
            This dashboard operationalizes the report by exposing market validation,
            contribution margin, and break-even progress inside the product.
          </p>
        </div>
      </section>

      {activeTab === 'overview' ? (
        <>
          <section className="kpi-grid-v2">
            <KpiCard
              label="Total Orders"
              value={analytics.totalOrders.toLocaleString()}
              helper={`Break-even target: ${BREAK_EVEN_ORDERS.toLocaleString()} orders/month`}
            />
            <KpiCard
              label="GMV"
              value={`${analytics.grossMerchandiseValue.toLocaleString('vi-VN')} VND`}
              helper="Tracks student purchasing volume across vendors"
            />
            <KpiCard
              label="Platform Revenue"
              value={`${analytics.platformRevenue.toLocaleString('vi-VN')} VND`}
              helper="Commission plus delivery margin"
            />
            <KpiCard
              label="Contribution Margin"
              value={`${analytics.contributionMargin.toLocaleString('vi-VN')} VND`}
              helper="Revenue after variable order costs"
            />
            <KpiCard
              label="Retention Proxy"
              value={`${analytics.retentionProxy}%`}
              helper="Repeat buyers divided by total student accounts"
            />
            <KpiCard
              label="Orders per User"
              value={analytics.averageOrdersPerUser}
              helper="Engagement intensity for the student base"
            />
          </section>

          <section className="two-column-grid overview-detail-grid">
            <article className="card">
              <p className="eyebrow">Break-Even Progress</p>
              <h2>{analytics.breakEvenLabel}</h2>
              <div className="progress-rail">
                <div
                  className="progress-fill"
                  style={{ width: `${analytics.breakEvenProgress}%` }}
                />
              </div>
              <p className="support-copy">
                {analytics.totalOrders.toLocaleString()} of {BREAK_EVEN_ORDERS.toLocaleString()} orders reached
              </p>
              <p className="support-copy">
                Net operating result: {analytics.netOperatingResult.toLocaleString('vi-VN')} VND
              </p>
              <p className="support-copy">
                Fixed monthly cost assumption: {BUSINESS_RULES.fixedMonthlyCost.toLocaleString('vi-VN')} VND
              </p>
            </article>

            <article className="card roadmap-card">
              <p className="eyebrow">Scaling Roadmap</p>
              <div className="roadmap-current phase-row active">
                <span className="roadmap-caption">Current phase</span>
                <h2>
                  {analytics.activePhase.label} / {analytics.activePhase.title}
                </h2>
                <span className="phase-meta">
                  {analytics.activePhase.campusRange} • {analytics.activePhase.orderRange}
                </span>
              </div>
              <div className="roadmap-scroll">
                {upcomingPhases.map((phase) => (
                  <div key={phase.id} className="phase-row">
                    <strong>
                      {phase.label} / {phase.title}
                    </strong>
                    <span className="phase-meta">
                      {phase.campusRange} • {phase.orderRange}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="section-block">
            <div className="section-head">
              <div>
                <p className="eyebrow">E-commerce 4.0 Explanation</p>
                <h2>Why the implemented advanced features matter</h2>
              </div>
            </div>
            <div className="feature-grid">
              {ADVANCED_FEATURES.map((feature) => (
                <article key={feature.id} className="card feature-card">
                  <h3>{feature.title}</h3>
                  <p>
                    <strong>Importance:</strong> {feature.importance}
                  </p>
                  <p>
                    <strong>Business effect:</strong> {feature.impact}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {activeTab === 'orders' ? (
        <section className="stack">
          {allOrders.length ? (
            allOrders.map((order) => (
              <article key={order.id} className="card order-entry">
                <div className="order-entry-header">
                  <div>
                    <h2>{order.id}</h2>
                    <p className="support-copy">
                      {order.studentName} / {new Date(order.createdAt).toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="order-badge-block">
                    <span>{order.total.toLocaleString('vi-VN')} VND</span>
                    <small>{order.paymentMethod}</small>
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
                <div className="admin-order-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      setExpandedOrderId((current) =>
                        current === order.id ? null : order.id
                      )
                    }
                  >
                    {expandedOrderId === order.id
                      ? 'Hide revenue details'
                      : 'Show revenue details'}
                  </button>
                </div>
                {expandedOrderId === order.id ? (
                  <div className="admin-order-details">
                    <div className="detail-row">
                      <span>Subtotal</span>
                      <strong>{order.subtotal.toLocaleString('vi-VN')} VND</strong>
                    </div>
                    <div className="detail-row">
                      <span>Delivery fee charged</span>
                      <strong>{order.deliveryFee.toLocaleString('vi-VN')} VND</strong>
                    </div>
                    <div className="detail-row">
                      <span>Promo discount</span>
                      <strong>{order.promoDiscount.toLocaleString('vi-VN')} VND</strong>
                    </div>
                    <div className="detail-row">
                      <span>Commission revenue</span>
                      <strong>{order.commissionRevenue.toLocaleString('vi-VN')} VND</strong>
                    </div>
                    <div className="detail-row">
                      <span>Delivery margin revenue</span>
                      <strong>{order.deliveryMarginRevenue.toLocaleString('vi-VN')} VND</strong>
                    </div>
                    <div className="detail-row">
                      <span>Platform revenue</span>
                      <strong>{order.platformRevenue.toLocaleString('vi-VN')} VND</strong>
                    </div>
                    <div className="detail-row">
                      <span>Contribution margin</span>
                      <strong>{order.contributionMargin.toLocaleString('vi-VN')} VND</strong>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <article className="card empty-card">
              <h2>No transaction data yet</h2>
              <p>Student orders will appear here after checkout.</p>
            </article>
          )}
        </section>
      ) : null}

      {activeTab === 'economics' ? (
        <section className="two-column-grid">
          <article className="card">
            <p className="eyebrow">Unit Economics</p>
            <h2>Per-order financial model</h2>
            <dl className="summary-list">
              <div>
                <dt>Average order value</dt>
                <dd>{BUSINESS_RULES.averageOrderValue.toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Commission revenue</dt>
                <dd>{(BUSINESS_RULES.averageOrderValue * BUSINESS_RULES.commissionRate).toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Net delivery margin</dt>
                <dd>{(BUSINESS_RULES.deliveryCharge - BUSINESS_RULES.deliveryCost).toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Payment processing</dt>
                <dd>{BUSINESS_RULES.paymentFee.toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Operational handling</dt>
                <dd>{BUSINESS_RULES.operationalCost.toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Promotional subsidy</dt>
                <dd>{BUSINESS_RULES.promotionalSubsidy.toLocaleString('vi-VN')} VND</dd>
              </div>
            </dl>
          </article>

          <article className="card">
            <p className="eyebrow">Margin Expansion Strategy</p>
            <h2>Paths to better unit economics</h2>
            <div className="stack compact-stack">
              <div className="strategy-card">
                <strong>Selective commission uplift</strong>
                <span>Premium vendors can move from 10% to 12-15% commission.</span>
              </div>
              <div className="strategy-card">
                <strong>Batch delivery optimization</strong>
                <span>Higher order density reduces per-route delivery cost.</span>
              </div>
              <div className="strategy-card">
                <strong>Additional revenue streams</strong>
                <span>Promoted listings and vendor subscriptions diversify revenue.</span>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'users' ? (
        <section className="stack">
          {users.length ? (
            users.map((user) => (
              <article key={user.id} className="card user-row">
                <div>
                  <h2>{user.name}</h2>
                  <p className="support-copy">{user.email}</p>
                </div>
                <div className="user-metrics">
                  <span>{user.orders.length} orders</span>
                  <span>
                    {user.orders
                      .reduce((sum, order) => sum + order.total, 0)
                      .toLocaleString('vi-VN')}{' '}
                    VND spent
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-button danger-button"
                  onClick={() => handleDeleteStudent(user.id)}
                >
                  Delete student
                </button>
              </article>
            ))
          ) : (
            <article className="card empty-card">
              <h2>No registered students yet</h2>
              <p>Student accounts created through the register flow will appear here.</p>
              <Link to="/" className="primary-button">
                Return to marketplace
              </Link>
            </article>
          )}
        </section>
      ) : null}
    </div>
  );
}
