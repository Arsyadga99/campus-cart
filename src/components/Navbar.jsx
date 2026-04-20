import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  const updateCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('cartUpdated', updateCount);
    return () => window.removeEventListener('cartUpdated', updateCount);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="emoji">🛒</span>
          CampusCart
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            🏠 Catalog
          </Link>
          <Link to="/cart" className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}>
            🛍️ Cart
            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </Link>
          <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            📊 Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}