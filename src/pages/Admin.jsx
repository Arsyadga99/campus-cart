import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COMMISSION_RATE  = 0.10;
const DELIVERY_MARGIN  = 2000;
const PAYMENT_FEE      = 1500;
const OPS_COST         = 2000;
const PROMO_SUBSIDY    = 2500;
const TOTAL_VAR        = PAYMENT_FEE + OPS_COST + PROMO_SUBSIDY;
const FIXED_MONTHLY    = 20_000_000;
const BEP_ORDERS       = 20_000;

const PHASES = [
  { label: 'Phase 1', subtitle: 'Demand Validation', campuses: 1,  min: 0,     max: 2400   },
  { label: 'Phase 2', subtitle: 'Growth',            campuses: 5,  min: 3000,  max: 10000  },
  { label: 'Phase 3', subtitle: 'Near Break-Even',   campuses: 10, min: 10000, max: 20000  },
  { label: 'Phase 4', subtitle: 'Profitability',     campuses: 12, min: 20000, max: 35000  },
];

function currentPhase(orders) {
  for (let i = PHASES.length - 1; i >= 0; i--)
    if (orders >= PHASES[i].min) return PHASES[i];
  return PHASES[0];
}

/* ─── resolve tab from URL pathname ─── */
function tabFromPath(path) {
  if (path === '/admin/orders')    return 'orders';
  if (path === '/admin/economics') return 'economics';
  if (path === '/admin/users')     return 'users';
  return 'overview';
}

export default function Admin() {
  const location = useLocation();
  const activeTab = tabFromPath(location.pathname);

  const { getAllUsers, getUserOrders } = useAuth();
  const [allOrders, setAllOrders] = useState([]);
  const [users, setUsers]         = useState([]);

  useEffect(() => {
    const us = getAllUsers();
    setUsers(us);
    const orders = us.flatMap(u => getUserOrders(u.id));
    setAllOrders(orders);
  }, []);

  /* ── Metrics ── */
  const totalOrders   = allOrders.length;
  const totalGMV      = allOrders.reduce((s, o) => s + (o.subtotal ?? o.total), 0);
  const totalComm     = allOrders.reduce((s, o) => s + (o.commissionRevenue ?? Math.round((o.subtotal ?? o.total) * COMMISSION_RATE)), 0);
  const totalDelMarg  = allOrders.reduce((s, o) => s + (o.deliveryMarginRevenue ?? 0), 0);
  const totalPlatRev  = totalComm + totalDelMarg;
  const totalVarCost  = totalOrders * TOTAL_VAR;
  const totalContrib  = totalPlatRev - totalVarCost;
  const netOperating  = totalContrib - FIXED_MONTHLY;
  const bepPct        = Math.min(100, (totalOrders / BEP_ORDERS) * 100);
  const phase         = currentPhase(totalOrders);

  /* ── KPI Card ── */
  const KPICard = ({ label, value, note, variant }) => (
    <div className={`kpi-card ${variant || ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ fontSize: String(value).length > 12 ? 17 : 26 }}>{value}</div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <span className="label-section">// Analytics</span>
          <h1 className="page-title">Business Dashboard</h1>
          <p className="page-subtitle">
            CampusCart revenue intelligence &nbsp;&middot;&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--cream-dark)', padding: '2px 8px', borderRadius: 2, border: '1px solid var(--border)' }}>
              {phase.label}: {phase.subtitle}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Clear all demo order data?')) {
              users.forEach(u => localStorage.removeItem(`cc_orders_${u.id}`));
              setAllOrders([]);
            }
          }}
          style={{ padding: '10px 18px', background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}
        >
          Clear Data
        </button>
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === 'overview' && (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <KPICard label="Total Orders"         value={totalOrders.toLocaleString()}             note="BEP target: 20,000/month" />
            <KPICard label="Platform Revenue"     value={`${totalPlatRev.toLocaleString('vi-VN')} VND`} note="Commission + delivery margin" variant="gold" />
            <KPICard label="Gross GMV"            value={`${totalGMV.toLocaleString('vi-VN')} VND`}    note="Total merchandise value"     variant="accent" />
            <KPICard label="Contribution Margin"  value={`${totalContrib >= 0 ? '+' : ''}${totalContrib.toLocaleString('vi-VN')} VND`} note="After variable costs" variant={totalContrib >= 0 ? 'success' : 'danger'} />
            <KPICard label="Net Operating Result" value={`${netOperating >= 0 ? '+' : ''}${netOperating.toLocaleString('vi-VN')} VND`} note="vs 20M VND fixed cost" variant={netOperating >= 0 ? 'success' : 'danger'} />
            <KPICard label="Avg Revenue / Order"  value={`${totalOrders > 0 ? Math.round(totalPlatRev / totalOrders).toLocaleString('vi-VN') : 0} VND`} note="Target: 7,000 VND/order" />
          </div>

          {/* BEP Progress */}
          <div className="bep-section">
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <div>
                <span className="label-section">// Break-Even Analysis</span>
                <div className="bep-section-title">Progress to Break-Even</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{totalOrders.toLocaleString()} / {BEP_ORDERS.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{bepPct.toFixed(2)}% achieved</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-subtle)', marginBottom: 16 }}>
              {totalOrders < BEP_ORDERS
                ? `${(BEP_ORDERS - totalOrders).toLocaleString()} more orders needed — BEP = 20,000,000 ÷ 1,000 = 20,000 orders / month`
                : 'Break-even achieved. Platform is now profitable.'}
            </p>
            <div className="bep-bar-wrapper"><div className="bep-bar-fill" style={{ width: `${bepPct}%` }} /></div>
            <div className="bep-legend"><span>0</span><span>5,000</span><span>10,000</span><span>15,000</span><span>20,000 (BEP)</span></div>

            <div style={{ marginTop: 28 }}>
              <span className="label-section">// Scaling Roadmap</span>
              <div className="phase-grid">
                {PHASES.map((p, i) => (
                  <div key={i} className={`phase-card ${phase.label === p.label ? 'current' : ''}`}>
                    <div className="phase-card-label">{phase.label === p.label ? 'Current — ' : ''}{p.label}</div>
                    <div className="phase-card-title">{p.subtitle}</div>
                    <div className="phase-card-info">{p.campuses} campus{p.campuses > 1 ? 'es' : ''}<br />{p.min.toLocaleString()}–{p.max.toLocaleString()} orders/mo</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue vs Cost */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
              <span className="label-section">// Revenue Sources</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 20 }}>Platform Income</h3>
              {[['Commission (10%)', totalComm], ['Delivery Margin', totalDelMarg]].map(([l, v]) => (
                <div className="order-row" key={l}><span>{l}</span><span className="font-mono">{v.toLocaleString('vi-VN')} VND</span></div>
              ))}
              <div className="order-row total"><span>Total Platform Revenue</span><span>{totalPlatRev.toLocaleString('vi-VN')} VND</span></div>
            </div>
            <div style={{ background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
              <span className="label-section">// Cost Structure</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 20 }}>Cost Breakdown</h3>
              {[
                [`Variable Costs (${totalOrders} × 6,000)`, totalVarCost],
                ['Fixed Monthly Cost', FIXED_MONTHLY],
              ].map(([l, v]) => (
                <div className="order-row" key={l}><span>{l}</span><span className="font-mono text-danger">{v.toLocaleString('vi-VN')} VND</span></div>
              ))}
              <div className="order-row total"><span>Net Operating Result</span><span className={netOperating >= 0 ? 'text-success' : 'text-danger'}>{netOperating >= 0 ? '+' : ''}{netOperating.toLocaleString('vi-VN')} VND</span></div>
            </div>
          </div>
        </>
      )}

      {/* ══ ORDERS TAB ══ */}
      {activeTab === 'orders' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <span className="label-section">// All Transactions</span>
            <h2 style={{ fontFamily: 'var(--font-serif)' }}>Order History</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-subtle)', marginTop: 4 }}>
              {allOrders.length} orders across {users.length} registered students.
            </p>
          </div>
          {!allOrders.length ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <h3>No orders recorded</h3>
              <p>Student transactions will appear here after orders are placed.</p>
            </div>
          ) : (
            [...allOrders].reverse().map(o => (
              <div key={o.id} className="order-card animate-in">
                <div style={{ flex: 1 }}>
                  <div className="order-card-id">{o.id}</div>
                  <div className="order-card-date">{o.date}</div>
                  <div className="order-card-items" style={{ marginTop: 4 }}>
                    {o.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)', padding: '2px 8px', background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 2 }}>
                      {o.deliveryMethod === 'delivery' ? 'Dormitory Delivery' : 'Campus Pickup'}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)', padding: '2px 8px', background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 2, textTransform: 'uppercase' }}>
                      {o.paymentMethod}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>
                    {(o.total ?? o.subtotal).toLocaleString('vi-VN')} VND
                  </div>
                  <div className="order-badge" style={{ marginTop: 10 }}>
                    Platform +{(o.platformRevenue ?? o.commissionRevenue ?? Math.round((o.subtotal ?? o.total) * 0.1)).toLocaleString('vi-VN')} VND
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ══ UNIT ECONOMICS TAB ══ */}
      {activeTab === 'economics' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <span className="label-section">// PDF Table 1</span>
            <h2 style={{ fontFamily: 'var(--font-serif)' }}>Unit Economics — Per Order</h2>
          </div>
          <div style={{ background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, marginBottom: 24 }}>
            <table className="econ-table">
              <thead>
                <tr><th>Metric</th><th>Value</th><th>Notes</th></tr>
              </thead>
              <tbody>
                <tr><td>Average Order Value</td><td className="mono">50,000 VND</td><td>Typical student purchase</td></tr>
                <tr><td>Commission (10%)</td><td className="mono">5,000 VND</td><td>Platform fee per order</td></tr>
                <tr><td>Net Delivery Margin</td><td className="mono">2,000 VND</td><td>Charge 10k, cost 8k to vendor</td></tr>
                <tr className="row-total"><td className="bold">Total Revenue / Order</td><td className="mono bold">7,000 VND</td><td>Platform income</td></tr>
                <tr className="row-cost"><td>Payment Processing</td><td className="neg">−1,500 VND</td><td>Gateway fee</td></tr>
                <tr className="row-cost"><td>Operational Handling</td><td className="neg">−2,000 VND</td><td>Support and system ops</td></tr>
                <tr className="row-cost"><td>Promo Subsidy</td><td className="neg">−2,500 VND</td><td>Discounts and incentives</td></tr>
                <tr className="row-total"><td className="bold">Total Variable Costs</td><td className="neg bold">−6,000 VND</td><td>Sum of per-order costs</td></tr>
                <tr><td className="bold" style={{ fontSize: 15 }}>Contribution Margin</td><td className="pos" style={{ fontSize: 15 }}>+1,000 VND</td><td>Applied toward fixed costs</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)' }}>
              BEP = Fixed Cost / Contribution Margin = 20,000,000 / 1,000 = <strong style={{ color: 'var(--ink)' }}>20,000 orders / month</strong>
            </div>
          </div>
          {/* Margin Strategy */}
          <div style={{ marginBottom: 16 }}>
            <span className="label-section">// Section 8.1</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 6 }}>Margin Expansion Strategy</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { num: '01', title: 'Selective Commission Escalation', body: 'Premium sellers pay 12–15% commission without affecting general pricing. Increases per-transaction revenue with no student impact.', metric: '12–15% on premium sellers' },
              { num: '02', title: 'Batch Delivery Efficiency', body: 'Consolidated delivery routes reduce cost per order from 8,000 to 6,000–7,000 VND, expanding delivery margin by 1,000–2,000 VND.', metric: '+1,000–2,000 VND margin/order' },
              { num: '03', title: 'Non-Transactional Revenue', body: 'Promoted listings, vendor subscription tiers, and in-app placement fees provide revenue independent of order volume.', metric: 'Subscriptions + ad placements' },
            ].map(s => (
              <div key={s.num} style={{ background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--border)', marginBottom: 10, lineHeight: 1 }}>{s.num}</div>
                <div className="label-section">Strategy {s.num}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-subtle)', lineHeight: 1.6, marginBottom: 14 }}>{s.body}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)', background: 'var(--gold-pale)', padding: '6px 12px', borderRadius: 2, border: '1px solid var(--gold-light)', display: 'inline-block' }}>{s.metric}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══ STUDENTS TAB ══ */}
      {activeTab === 'users' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <span className="label-section">// Student Registry</span>
            <h2 style={{ fontFamily: 'var(--font-serif)' }}>Registered Students</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-subtle)', marginTop: 4 }}>
              {users.length} student{users.length !== 1 ? 's' : ''} registered on the platform.
            </p>
          </div>
          {!users.length ? (
            <div className="empty-state">
              <h3>No students yet</h3>
              <p>Registered student accounts will appear here.</p>
            </div>
          ) : (
            <div style={{ background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <table className="econ-table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Registered</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const uOrders = getUserOrders(u.id);
                    const spent = uOrders.reduce((s, o) => s + (o.total ?? o.subtotal), 0);
                    return (
                      <tr key={u.id}>
                        <td className="bold">{u.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.email}</td>
                        <td style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="mono">{uOrders.length}</td>
                        <td className="mono">{spent.toLocaleString('vi-VN')} VND</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}