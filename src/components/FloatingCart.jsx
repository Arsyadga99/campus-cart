import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FloatingCart() {
  const [summary, setSummary] = useState({ count: 0, total: 0 });

  const update = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    setSummary({ count, total });
  };

  useEffect(() => {
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  if (summary.count === 0) return null;

  return (
    <Link to="/cart" className="floating-cart">
      <span>🛍️</span>
      <span className="floating-cart-count">{summary.count} items</span>
      <span style={{ flex: 1 }}>View Cart</span>
      <span style={{ fontWeight: 800 }}>{summary.total.toLocaleString('vi-VN')} VND</span>
    </Link>
  );
}