import { useState } from 'react';
import { ADVANCED_FEATURES } from '../constants/business';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const result =
      mode === 'login'
        ? login(formState.email, formState.password)
        : register(formState.name, formState.email, formState.password);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel auth-panel-dark">
        <div className="auth-hero-copy">
          <p className="eyebrow">Student marketplace platform</p>
          <h1 className="auth-brand-title">CampusCart</h1>
          <p className="auth-brand-subtitle">
            Student commerce optimized for speed, personalization, and feasibility.
          </p>
          <p className="support-copy light-copy auth-description">
            This version emphasizes clean code, mobile-first usability, transparent
            unit economics, and two advanced e-commerce features required by the
            assignment.
          </p>
        </div>

        <div className="stack auth-feature-list">
          {ADVANCED_FEATURES.map((feature) => (
            <article key={feature.id} className="auth-feature">
              <strong>{feature.title}</strong>
              <span>{feature.impact}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <div className="card auth-card">
          <p className="eyebrow">Access</p>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create student account'}</h2>

          <div className="tab-row auth-mode-switch">
            <button
              type="button"
              className={`tab-button ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`tab-button ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className="field">
                <span>Full name</span>
                <input
                  value={formState.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Nguyen Van An"
                />
              </label>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                value={formState.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="you@student.hcmut.edu.vn"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={formState.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Enter password"
              />
            </label>

            {error ? <p className="error-text">{error}</p> : null}

            <button type="submit" className="primary-button">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
