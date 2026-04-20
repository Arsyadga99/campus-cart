import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';

function NavItem({ to, label, active }) {
  return (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
      {label}
    </Link>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { user, role, logout, getCart } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };

    sync();
    window.addEventListener('cartUpdated', sync);
    return () => window.removeEventListener('cartUpdated', sync);
  }, [getCart]);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div>
          <p className="brand-title">CampusCart</p>
          <p className="brand-subtitle">
            {role === 'admin' ? 'Business Dashboard' : 'Student Marketplace'}
          </p>
        </div>

        <nav className="nav-row">
          {role === 'student' ? (
            <>
              <NavItem to="/" label="Marketplace" active={location.pathname === '/'} />
              <NavItem
                to="/cart"
                label={`Cart${cartCount ? ` (${cartCount})` : ''}`}
                active={location.pathname === '/cart'}
              />
              <NavItem
                to="/orders"
                label="Orders"
                active={location.pathname === '/orders'}
              />
            </>
          ) : null}

          {role === 'admin' ? (
            <>
              <NavItem
                to="/admin"
                label="Overview"
                active={location.pathname === '/admin'}
              />
              <NavItem
                to="/admin/orders"
                label="Orders"
                active={location.pathname === '/admin/orders'}
              />
              <NavItem
                to="/admin/economics"
                label="Economics"
                active={location.pathname === '/admin/economics'}
              />
              <NavItem
                to="/admin/users"
                label="Students"
                active={location.pathname === '/admin/users'}
              />
              <NavItem
                to="/admin/vendors"
                label="Vendors"
                active={location.pathname === '/admin/vendors'}
              />
              <NavItem
                to="/admin/inventory"
                label="Inventory"
                active={location.pathname === '/admin/inventory'}
              />
              <NavItem
                to="/admin/marketing"
                label="Marketing"
                active={location.pathname === '/admin/marketing'}
              />
            </>
          ) : null}
        </nav>

        <div className="header-user">
          <div>
            <strong>{user?.name}</strong>
            <span>{role}</span>
          </div>
          <button type="button" className="ghost-button" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
