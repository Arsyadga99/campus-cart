import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, role, logout, getCart } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const updateCount = () => {
    setCartCount(getCart().reduce((s, i) => s + i.quantity, 0));
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('cartUpdated', updateCount);
    return () => window.removeEventListener('cartUpdated', updateCount);
  }, [user]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div>
            <div className="navbar-brand-name">CampusCart</div>
            <div className="navbar-brand-tagline">
              {role === 'admin' ? 'Admin Dashboard' : 'Student Marketplace'}
            </div>
          </div>
        </div>

        <div className="navbar-links">
          {role === 'student' && (
            <>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Catalog</Link>
              <Link to="/cart" className={`nav-link ${isActive('/cart') ? 'active' : ''}`}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Cart
                  {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                </span>
              </Link>
              <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>My Orders</Link>
            </>
          )}
          {role === 'admin' && (
            <>
              <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>Overview</Link>
              <Link to="/admin/orders" className={`nav-link ${isActive('/admin/orders') ? 'active' : ''}`}>Orders</Link>
              <Link to="/admin/economics" className={`nav-link ${isActive('/admin/economics') ? 'active' : ''}`}>Unit Economics</Link>
              <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>Students</Link>
            </>
          )}

          <div className="navbar-divider" style={{ margin: '0 8px' }} />

          <div className="navbar-user">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{user?.name}</div>
              <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                {role}
              </div>
            </div>
            <button className="btn-logout" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </div>
    </nav>
  );
}