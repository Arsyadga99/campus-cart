import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ADVANCED_FEATURES,
  BREAK_EVEN_ORDERS,
  BUSINESS_RULES,
  CAMPUS_PHASES,
} from '../constants/business';
import { getMarketingState, saveMarketingState } from '../lib/api';
import { getCampusLabel, summarizeAnalytics } from '../lib/analytics';
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

  if (pathname === '/admin/vendors') {
    return 'vendors';
  }

  if (pathname === '/admin/marketing') {
    return 'marketing';
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

function DetailRow({ label, value, tone = 'neutral' }) {
  return (
    <div className={`detail-row detail-row-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Admin() {
  const location = useLocation();
  const activeTab = resolveTab(location.pathname);
  const { getAllUsersWithOrders, getAllBatches, deleteStudent, platformMode } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [users, setUsers] = useState(() => getAllUsersWithOrders());
  const [batches, setBatches] = useState([]);
  const [marketingState, setMarketingState] = useState(() => getMarketingState());

  useEffect(() => {
    let cancelled = false;

    getAllBatches().then((nextBatches) => {
      if (!cancelled) {
        setBatches(nextBatches.sort((left, right) => right.cutoffAt.localeCompare(left.cutoffAt)));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [getAllBatches]);

  const allOrders = useMemo(
    () =>
      users
        .flatMap((user) =>
          user.orders.map((order) => ({
            ...order,
            studentName: user.name,
            studentCampusId: user.campusId,
            acquisitionChannel: user.acquisitionChannel,
          }))
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [users]
  );

  const analytics = useMemo(
    () => summarizeAnalytics(users, allOrders, batches, marketingState),
    [users, allOrders, batches, marketingState]
  );
  const upcomingPhases = useMemo(
    () => CAMPUS_PHASES.filter((phase) => phase.id !== analytics.activePhase.id),
    [analytics.activePhase.id]
  );

  const handleDeleteStudent = (userId) => {
    deleteStudent(userId);
    setUsers((current) => current.filter((user) => user.id !== userId));
  };

  const handleMarketingSpendChange = (value) => {
    const digitsOnly = value.replace(/[^\d]/g, '');
    const monthlySpend = digitsOnly ? Number(digitsOnly) : 0;
    const nextState = { ...marketingState, monthlySpend };
    setMarketingState(nextState);
    saveMarketingState(nextState);
  };

  return (
    <div className="page-shell">
      <section className="section-head standalone-head">
        <div>
          <p className="eyebrow">Admin Console</p>
          <h1>Business analytics and feasibility tracking</h1>
          <p className="support-copy">
            Runtime: {platformMode}. Campus growth, vendor monetization, marketing
            efficiency, and batch delivery are now traced from product data.
          </p>
        </div>
      </section>

      {activeTab === 'overview' ? (
        <>
          <section className="kpi-grid-v2">
            <article className="card kpi-card-v2 kpi-card-hero">
              <p className="eyebrow">Revenue This Month</p>
              <h3>{`${analytics.totalRevenueThisMonth.toLocaleString('vi-VN')} VND`}</h3>
              <p>Platform revenue booked in the current month</p>
            </article>
            <KpiCard
              label="Net Contribution This Month"
              value={`${analytics.netContributionThisMonth.toLocaleString('vi-VN')} VND`}
              helper="Monthly contribution margin after variable costs"
            />
            <KpiCard
              label="Total Orders"
              value={analytics.totalOrders.toLocaleString()}
              helper={`Break-even target: ${BREAK_EVEN_ORDERS.toLocaleString()} orders/month`}
            />
            <KpiCard
              label="Active Campuses"
              value={analytics.activeCampusCount}
              helper="Campuses with live order activity"
            />
            <KpiCard
              label="CAC"
              value={`${analytics.customerAcquisitionCost.toLocaleString('vi-VN')} VND`}
              helper="Marketing spend divided by acquired students"
            />
            <KpiCard
              label="Conversion Rate"
              value={`${analytics.conversionRate}%`}
              helper="Students with at least one completed order"
            />
            <KpiCard
              label="Referral Share"
              value={`${analytics.referralShare}%`}
              helper="Students acquired through referral codes"
            />
            <KpiCard
              label="Group-Buy Share"
              value={`${analytics.groupBuyShare}%`}
              helper="Orders contributing to grouped demand"
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
                  {analytics.activePhase.campusRange} / {analytics.activePhase.orderRange}
                </span>
              </div>
              <div className="roadmap-scroll">
                {upcomingPhases.map((phase) => (
                  <div key={phase.id} className="phase-row">
                    <strong>
                      {phase.label} / {phase.title}
                    </strong>
                    <span className="phase-meta">
                      {phase.campusRange} / {phase.orderRange}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="two-column-grid section-block">
            <article className="card">
              <p className="eyebrow">Campus Rollout</p>
              <h2>Multi-campus expansion status</h2>
              <div className="stack compact-stack">
                {analytics.campusPerformance.slice(0, 6).map((campus) => (
                  <div key={campus.id} className="strategy-card">
                    <strong>{campus.name}</strong>
                    <span>
                      {campus.orderCount} orders / {campus.studentCount} students / {campus.status}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <p className="eyebrow">Batch Operations</p>
              <h2>Smart delivery batching</h2>
              <div className="stack compact-stack">
                <div className="strategy-card">
                  <strong>Average batch size</strong>
                  <span>{analytics.averageBatchSize} orders per batch</span>
                </div>
                <div className="strategy-card">
                  <strong>Grouped unit coverage</strong>
                  <span>{analytics.batchCoverage}% of ordered units join dense routes</span>
                </div>
                <div className="strategy-card">
                  <strong>District coverage</strong>
                  <span>{analytics.districtCoverage} active delivery districts</span>
                </div>
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
                    <small>{order.batchId}</small>
                  </div>
                </div>
                <div className="compact-meta">
                  <span>{getCampusLabel(order.campusId)}</span>
                  <span>{order.deliveryMethod}</span>
                  <span>{order.campaignSource}</span>
                  <span>{order.batchWindow}</span>
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
                    <DetailRow
                      label="Subtotal"
                      value={`${order.subtotal.toLocaleString('vi-VN')} VND`}
                    />
                    <DetailRow
                      label="Logistics fee charged"
                      value={`${order.deliveryFee.toLocaleString('vi-VN')} VND`}
                    />
                    <DetailRow
                      label="Commission revenue"
                      value={`${order.commissionRevenue.toLocaleString('vi-VN')} VND`}
                      tone="positive"
                    />
                    <DetailRow
                      label="Delivery margin revenue"
                      value={`${order.deliveryMarginRevenue.toLocaleString('vi-VN')} VND`}
                      tone="positive"
                    />
                    <DetailRow
                      label="Promoted listing revenue"
                      value={`${(order.promotedListingRevenue ?? 0).toLocaleString('vi-VN')} VND`}
                      tone="positive"
                    />
                    <DetailRow
                      label="Subscription revenue"
                      value={`${(order.subscriptionRevenue ?? 0).toLocaleString('vi-VN')} VND`}
                      tone="positive"
                    />
                    <DetailRow
                      label="Variable cost"
                      value={`${order.variableCost.toLocaleString('vi-VN')} VND`}
                      tone="negative"
                    />
                    <DetailRow
                      label="Final revenue from this order"
                      value={`${order.contributionMargin.toLocaleString('vi-VN')} VND`}
                      tone="positive"
                    />
                    <DetailRow
                      label="Delivery route"
                      value={
                        order.deliveryAddress?.district
                          ? `${order.deliveryAddress.district} / ${order.deliveryAddress.ward}`
                          : 'Campus pickup'
                      }
                    />
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
                <dt>Baseline commission revenue</dt>
                <dd>{(BUSINESS_RULES.averageOrderValue * BUSINESS_RULES.commissionRate).toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Net delivery margin</dt>
                <dd>{(BUSINESS_RULES.deliveryCharge - BUSINESS_RULES.deliveryCost).toLocaleString('vi-VN')} VND</dd>
              </div>
              <div>
                <dt>Promoted listing revenue</dt>
                <dd>{analytics.promotedListingRevenue.toLocaleString('vi-VN')} VND total</dd>
              </div>
              <div>
                <dt>Vendor subscription revenue</dt>
                <dd>{analytics.subscriptionRevenue.toLocaleString('vi-VN')} VND total</dd>
              </div>
              <div>
                <dt>Contribution margin</dt>
                <dd>{analytics.contributionMargin.toLocaleString('vi-VN')} VND</dd>
              </div>
            </dl>
          </article>

          <article className="card">
            <p className="eyebrow">Margin Expansion Strategy</p>
            <h2>Paths to better unit economics</h2>
            <div className="stack compact-stack">
              <div className="strategy-card">
                <strong>Selective commission uplift</strong>
                <span>Premium vendors already use 12-14% commission tiers.</span>
              </div>
              <div className="strategy-card">
                <strong>Batch delivery optimization</strong>
                <span>{analytics.averageBatchSize} orders per batch improve route density.</span>
              </div>
              <div className="strategy-card">
                <strong>Additional revenue streams</strong>
                <span>Promoted listings and subscriptions now contribute to platform revenue.</span>
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
                  <p className="support-copy">
                    {user.email} / {getCampusLabel(user.campusId)}
                  </p>
                </div>
                <div className="user-metrics">
                  <span>{user.orders.length} orders</span>
                  <span>{user.loyaltyTier} / {user.loyaltyPoints} pts</span>
                  <span>{user.acquisitionChannel}</span>
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

      {activeTab === 'vendors' ? (
        <section className="two-column-grid">
          <article className="card">
            <p className="eyebrow">Vendor Network</p>
            <h2>Local supply and monetization tiers</h2>
            <div className="stack compact-stack">
              {analytics.vendorPerformance.map((vendor) => (
                <div key={vendor.id} className="strategy-card">
                  <strong>{vendor.name}</strong>
                  <span>
                    {vendor.subscriptionPlan} plan / {Math.round(vendor.commissionRate * 100)}% commission
                  </span>
                  <span>
                    {vendor.orderCount} orders / {vendor.revenue.toLocaleString('vi-VN')} VND platform revenue
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <p className="eyebrow">Batch Queue</p>
            <h2>Operational routing windows</h2>
            <div className="stack compact-stack">
              {batches.length ? (
                batches.slice(0, 6).map((batch) => (
                  <div key={batch.id} className="strategy-card">
                    <strong>{batch.id}</strong>
                    <span>
                      {getCampusLabel(batch.campusId)} / {batch.totalOrders} orders / {batch.groupBuyUnits} grouped units
                    </span>
                    <span>
                      {batch.district ? `${batch.district} / ${batch.ward}` : 'Campus pickup hub'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="strategy-card">
                  <strong>No live batches yet</strong>
                  <span>Batches will appear after the first order is submitted.</span>
                </div>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'marketing' ? (
        <section className="two-column-grid section-block">
          <article className="card">
            <p className="eyebrow">Marketing Metrics</p>
            <h2>Acquisition and retention measurement</h2>
            <div className="stack compact-stack">
              <div className="strategy-card">
                <strong>Monthly marketing spend</strong>
                <div className="inline-field">
                  <input
                    value={marketingState.monthlySpend.toString()}
                    onChange={(event) => handleMarketingSpendChange(event.target.value)}
                    inputMode="numeric"
                    placeholder="8000000"
                  />
                  <span>{analytics.marketingSpend.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>
              <div className="strategy-card">
                <strong>Conversion rate</strong>
                <span>{analytics.conversionRate}% of registered students have purchased</span>
              </div>
              <div className="strategy-card">
                <strong>Retention rate proxy</strong>
                <span>{analytics.retentionProxy}% repeat buyers</span>
              </div>
              <div className="strategy-card">
                <strong>Loyalty usage</strong>
                <span>{analytics.loyaltyUsageRate}% of students hold loyalty points</span>
              </div>
            </div>
          </article>

          <article className="card">
            <p className="eyebrow">Growth Channels</p>
            <h2>Referral and channel performance</h2>
            <div className="stack compact-stack">
              {Object.entries(marketingState.channels).map(([channel, share]) => (
                <div key={channel} className="strategy-card">
                  <strong>{channel}</strong>
                  <span>{Math.round(share * 100)}% allocation share</span>
                </div>
              ))}
              <div className="strategy-card">
                <strong>Referral adoption</strong>
                <span>{analytics.referralShare}% of students joined via referral code</span>
              </div>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
