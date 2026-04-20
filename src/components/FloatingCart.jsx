import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FloatingCart() {
  const { getCart, user } = useAuth();
  const [summary, setSummary] = useState({ count: 0, total: 0 });

  const update = () => {
    const cart  = getCart();
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    setSummary({ count, total });
  };

  useEffect(() => {
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, [user]);

  if (summary.count === 0) return null;

  return (
    <Link to="/cart" className="floating-cart">
      <span className="floating-cart-count">{summary.count} items</span>
      <span className="floating-cart-label">View Cart</span>
      <span className="floating-cart-total">{summary.total.toLocaleString('vi-VN')} VND</span>
    </Link>
  );
}