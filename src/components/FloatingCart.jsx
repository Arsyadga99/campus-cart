import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function FloatingCart() {
  const { getCart } = useAuth();
  const [summary, setSummary] = useState({ count: 0, total: 0 });

  useEffect(() => {
    const sync = () => {
      const cart = getCart();
      setSummary({
        count: cart.reduce((sum, item) => sum + item.quantity, 0),
        total: cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
      });
    };

    sync();
    window.addEventListener('cartUpdated', sync);
    return () => window.removeEventListener('cartUpdated', sync);
  }, [getCart]);

  if (!summary.count) {
    return null;
  }

  return (
    <Link to="/cart" className="floating-cart-bar">
      <span>{summary.count} items</span>
      <strong>{summary.total.toLocaleString('vi-VN')} VND</strong>
    </Link>
  );
}
