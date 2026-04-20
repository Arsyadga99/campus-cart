import { useState, useEffect } from 'react';

// === PDF Business Model Constants ===
const COMMISSION_RATE = 0.10;
const DELIVERY_CHARGE = 10000;
const DELIVERY_COST = 8000;
const DELIVERY_MARGIN = DELIVERY_CHARGE - DELIVERY_COST; // 2,000
const PAYMENT_FEE = 1500;
const OPERATIONAL_COST = 2000;
const PROMO_SUBSIDY = 2500;
const TOTAL_VARIABLE_COST = PAYMENT_FEE + OPERATIONAL_COST + PROMO_SUBSIDY; // 6,000
const CONTRIBUTION_MARGIN_PER_ORDER = 7000 - TOTAL_VARIABLE_COST; // 1,000 VND
const FIXED_MONTHLY_COST = 20_000_000; // 20 million VND
const BEP_ORDERS = FIXED_MONTHLY_COST / CONTRIBUTION_MARGIN_PER_ORDER; // 20,000 orders

// Scaling phases from PDF
const SCALING_PHASES = [
  { campuses: 1,   minOrders: 900,   maxOrders: 2400,   label: 'Phase 1 – Demand Validation' },
  { campuses: 5,   minOrders: 3000,  maxOrders: 10000,  label: 'Phase 2 – Growth' },
  { campuses: 10,  minOrders: 10000, maxOrders: 20000,  label: 'Phase 3 – Near Break-Even' },
  { campuses: 12,  minOrders: 20000, maxOrders: 35000,  label: 'Phase 4 – Profitability' },
];

function getPhase(orders) {
  for (let i = SCALING_PHASES.length - 1; i >= 0; i--) {
    if (orders >= SCALING_PHASES[i].minOrders) return SCALING_PHASES[i];
  }
  return SCALING_PHASES[0];
}

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('orders')) || [];
    setOrders(saved);
  }, []);

  // === Aggregate Financial Metrics ===
  const totalOrders = orders.length;
  const totalGMV = orders.reduce((s, o) => s + (o.subtotal || o.total), 0);
  const totalCommission = orders.reduce((s, o) => s + (o.commissionRevenue || Math.round((o.subtotal || o.total) * COMMISSION_RATE)), 0);
  const totalDeliveryMargin = orders.reduce((s, o) => s + (o.deliveryMarginRevenue || 0), 0);
  const totalPlatformRevenue = totalCommission + totalDeliveryMargin;
  const totalVariableCosts = totalOrders * TOTAL_VARIABLE_COST;
  const totalContribution = totalPlatformRevenue - totalVariableCosts;
  const operatingDeficit = totalContribution - FIXED_MONTHLY_COST;
  const bepProgress = Math.min(100, (totalOrders / BEP_ORDERS) * 100);
  const ordersToBreakEven = Math.max(0, BEP_ORDERS - totalOrders);

  const currentPhase = getPhase(totalOrders);

  const clearData = () => {
    if (window.confirm('Delete all order data? This cannot be undone.')) {
      localStorage.removeItem('orders');
      setOrders([]);
    }
  };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📊 Admin Analytics Dashboard</h1>
          <p className="page-subtitle">
            CampusCart Business Intelligence — Based on PDF Revenue Model
            <span className="loyalty-badge" style={{ marginLeft: 12 }}>
              ⭐ {currentPhase.label}
            </span>
          </p>
        </div>
        <button
          onClick={clearData}
          style={{ padding: '10px 20px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}
        >
          🗑️ Clear Data
        </button>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-value">{totalOrders.toLocaleString()}</div>
          <div className="kpi-note">BEP target: 20,000/month</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Platform Revenue</div>
          <div className="kpi-value" style={{ fontSize: totalPlatformRevenue > 999999 ? 20 : 26 }}>
            {totalPlatformRevenue.toLocaleString('vi-VN')}
          </div>
          <div className="kpi-note">Commission + Delivery Margin (VND)</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label">Total GMV</div>
          <div className="kpi-value" style={{ fontSize: totalGMV > 999999 ? 20 : 26 }}>
            {totalGMV.toLocaleString('vi-VN')}
          </div>
          <div className="kpi-note">Gross merchandise value (VND)</div>
        </div>
        <div className={`kpi-card ${totalContribution >= 0 ? 'green' : 'red'}`}>
          <div className="kpi-label">Contribution Margin</div>
          <div className="kpi-value" style={{ fontSize: 20, color: totalContribution >= 0 ? 'var(--accent-dark)' : 'var(--danger)' }}>
            {totalContribution >= 0 ? '+' : ''}{totalContribution.toLocaleString('vi-VN')}
          </div>
          <div className="kpi-note">After variable costs (VND)</div>
        </div>
        <div className={`kpi-card ${operatingDeficit >= 0 ? 'green' : 'red'}`}>
          <div className="kpi-label">vs Fixed Cost</div>
          <div className="kpi-value" style={{ fontSize: 20, color: operatingDeficit >= 0 ? 'var(--accent-dark)' : 'var(--danger)' }}>
            {operatingDeficit >= 0 ? '+' : ''}{operatingDeficit.toLocaleString('vi-VN')}
          </div>
          <div className="kpi-note">Fixed cost: 20,000,000 VND/month</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Revenue / Order</div>
          <div className="kpi-value">
            {totalOrders > 0 ? Math.round(totalPlatformRevenue / totalOrders).toLocaleString('vi-VN') : 0}
          </div>
          <div className="kpi-note">Target: 7,000 VND/order</div>
        </div>
      </div>

      {/* ─── Break-Even Progress ─── */}
      <div className="bep-section">
        <div className="flex-between" style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>📈 Break-Even Progress</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {totalOrders.toLocaleString()} / {BEP_ORDERS.toLocaleString()} orders ({bepProgress.toFixed(2)}%)
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          {ordersToBreakEven > 0
            ? `⚠️ Need ${ordersToBreakEven.toLocaleString()} more orders to reach break-even (BEP = 20,000,000 ÷ 1,000)`
            : '🎉 Break-even achieved! Platform is now profitable.'}
        </p>
        <div className="bep-bar-wrapper">
          <div className="bep-bar-fill" style={{ width: `${bepProgress}%` }} />
        </div>
        <div className="bep-legend">
          <span>0</span>
          <span>5,000</span>
          <span>10,000</span>
          <span>15,000</span>
          <span>20,000 (BEP)</span>
        </div>

        {/* Scaling Phases */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>🗺️ Scaling Roadmap (from PDF)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {SCALING_PHASES.map((phase, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: `1px solid ${currentPhase.campuses === phase.campuses ? 'var(--primary)' : 'var(--border)'}`,
                  background: currentPhase.campuses === phase.campuses ? 'var(--primary-light)' : 'var(--surface)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: currentPhase.campuses === phase.campuses ? 'var(--primary)' : 'var(--text)' }}>
                  {currentPhase.campuses === phase.campuses ? '▶ ' : ''}{phase.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {phase.campuses} campus{phase.campuses > 1 ? 'es' : ''} •{' '}
                  {phase.minOrders.toLocaleString()}–{phase.maxOrders.toLocaleString()} orders/month
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Unit Economics Table ─── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>💹 Unit Economics (Per Order — from PDF Table 1)</div>
        <table className="econ-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Average Order Value</td><td>50,000 VND</td><td>Typical student purchase</td></tr>
            <tr><td>Commission (10%)</td><td>5,000 VND</td><td>Platform fee per order</td></tr>
            <tr><td>Net Delivery Margin</td><td>2,000 VND</td><td>Charge 10k, cost 8k</td></tr>
            <tr><td>Total Revenue / Order</td><td style={{color:'var(--primary)', fontWeight:700}}>7,000 VND</td><td>Platform income per order</td></tr>
            <tr style={{background:'var(--danger-light)'}}><td>Payment Processing</td><td style={{color:'var(--danger)'}}>−1,500 VND</td><td>Gateway fee</td></tr>
            <tr style={{background:'var(--danger-light)'}}><td>Operational Handling</td><td style={{color:'var(--danger)'}}>−2,000 VND</td><td>Support & system ops</td></tr>
            <tr style={{background:'var(--danger-light)'}}><td>Promo Subsidy</td><td style={{color:'var(--danger)'}}>−2,500 VND</td><td>Discounts & incentives</td></tr>
            <tr><td>Total Variable Costs</td><td style={{color:'var(--danger)', fontWeight:700}}>−6,000 VND</td><td>Per-order costs</td></tr>
            <tr><td>Contribution Margin</td><td style={{color:'var(--accent-dark)', fontWeight:800, fontSize:16}}>+1,000 VND</td><td>Toward fixed costs</td></tr>
          </tbody>
        </table>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
          <strong>BEP Formula:</strong> Fixed Cost ÷ Contribution Margin = 20,000,000 ÷ 1,000 = <strong>20,000 orders/month</strong>
        </div>
      </div>

      {/* ─── Tabs: Overview vs Orders ─── */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          📊 Revenue Breakdown
        </button>
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          📦 Order History ({totalOrders})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Revenue Sources */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>💰 Revenue Sources</div>
            <div className="order-row">
              <span>Commission Revenue (10%)</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{totalCommission.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="order-row">
              <span>Delivery Margin Revenue</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{totalDeliveryMargin.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="order-row" style={{ borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 6, fontWeight: 800, fontSize: 16 }}>
              <span>Total Platform Revenue</span>
              <span style={{ color: 'var(--accent-dark)' }}>{totalPlatformRevenue.toLocaleString('vi-VN')} VND</span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>📉 Cost Breakdown</div>
            <div className="order-row">
              <span>Variable Costs ({totalOrders} orders × 6,000 VND)</span>
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{totalVariableCosts.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="order-row">
              <span>Fixed Monthly Cost</span>
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{FIXED_MONTHLY_COST.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="order-row" style={{ borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 6, fontWeight: 800, fontSize: 16 }}>
              <span>Net Operating Result</span>
              <span style={{ color: operatingDeficit >= 0 ? 'var(--accent-dark)' : 'var(--danger)' }}>
                {operatingDeficit >= 0 ? '+' : ''}{operatingDeficit.toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>

          {/* Margin Expansion Notes */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, gridColumn: '1 / -1' }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>📈 Margin Expansion Strategy (from PDF §8.1)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 14 }}>
              {[
                { icon: '💰', title: 'Selective Commission Hike', text: 'Premium sellers pay 12–15% commission, without affecting general pricing.' },
                { icon: '🚚', title: 'Batch Delivery Efficiency', text: 'Group orders by location. Delivery cost drops from 8,000 to 6,000–7,000 VND → margin 3,000–4,000 VND.' },
                { icon: '📢', title: 'Additional Revenue Streams', text: 'Promoted listings, vendor subscriptions, in-app advertising — independent of order volume.' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">📦</div>
              <h3>No orders yet</h3>
              <p>Orders will appear here once students start purchasing.</p>
            </div>
          ) : (
            [...orders].reverse().map(o => (
              <div key={o.id} className="order-card animate-in">
                <div>
                  <div className="order-card-id">#{o.id}</div>
                  <div className="order-card-date">🕐 {o.date}</div>
                  <div className="order-card-items">
                    Items: {o.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      📦 {o.deliveryMethod === 'delivery' ? 'Dormitory Delivery' : 'Campus Pickup'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      💳 {o.paymentMethod?.toUpperCase()}
                    </span>
                    {o.promoDiscount > 0 && (
                      <span style={{ color: 'var(--accent-dark)', fontWeight: 600 }}>
                        🎁 Promo: −{o.promoDiscount?.toLocaleString('vi-VN')} VND
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                    {(o.total || o.subtotal).toLocaleString('vi-VN')} VND
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Paid by customer</div>
                  <div style={{ marginTop: 8 }}>
                    <span className="order-badge">
                      Platform: +{(o.platformRevenue || o.commissionRevenue || Math.round((o.subtotal || o.total) * 0.1)).toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}