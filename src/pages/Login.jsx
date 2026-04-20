import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* ─── Time-based greeting ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

function getGreetingNote() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Start your day with great campus deals.';
  if (h >= 12 && h < 17) return 'Quick delivery to your dorm by evening.';
  if (h >= 17 && h < 21) return 'Order now before the 8 PM batch cutoff.';
  return 'Late-night study supplies available now.';
}

/* ─── SVG Icons ─── */
const EyeIcon = ({ off }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off
      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    }
  </svg>
);

export default function Login() {
  const { login, register } = useAuth();
  const [tab, setTab]             = useState('login');   // 'login' | 'register'
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const greeting     = getGreeting();
  const greetingNote = getGreetingNote();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // simulate latency

    const result = tab === 'login'
      ? login(email, password)
      : register(name, email, password);

    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="login-page">
      {/* Left Panel — Greeting */}
      <div className="login-greeting-panel">
        <div className="login-greeting-inner">
          <div className="label-section" style={{ color: 'var(--gold-light)', marginBottom: 12 }}>
            // CampusCart
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
            {greeting}.
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 340 }}>
            {greetingNote}
          </p>

          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              Platform Features
            </div>
            {[
              ['Pre-Order Batching',    'Daily 8 PM cutoff for consolidated delivery'],
              ['10% Commission Model',  'Transparent revenue shared with platform'],
              ['AI Recommendations',   'Personalised by your purchase history'],
              ['Dormitory Delivery',   'Direct to your room for 10,000 VND'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 48, fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 }}>
            CO3027 Electronic Commerce &nbsp;&middot;&nbsp; Group INDOMIE
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="login-form-panel">
        <div className="login-form-card animate-in">
          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
              CampusCart
            </div>
            <div style={{ width: 36, height: 2, background: 'var(--gold)', margin: '10px 0' }} />
            <div style={{ fontSize: 13, color: 'var(--ink-subtle)' }}>
              Ho Chi Minh City University of Technology
            </div>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
              Sign In
            </button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Nguyen Van An"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type={tab === 'login' ? 'text' : 'email'}
                placeholder={tab === 'login' ? 'Email or admin identifier' : 'you@student.hcmut.edu.vn'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder={tab === 'register' ? 'Choose a secure password' : 'Enter your password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  <EyeIcon off={showPw} />
                </button>
              </div>
            </div>

            {error && (
              <div className="form-error animate-in">{error}</div>
            )}

            <button
              type="submit"
              className="btn-form-submit"
              disabled={loading}
              style={{ marginTop: 24 }}
            >
              {loading
                ? 'Please wait...'
                : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Switch */}
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--ink-subtle)' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
            <button
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              {tab === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </div>

          {tab === 'login' && (
            <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--cream)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.6 }}>
              Admin access: enter any identifier with the admin password
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
