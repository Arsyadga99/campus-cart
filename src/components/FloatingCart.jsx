import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FloatingCart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  const updateCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
  };

  useEffect(() => {
    updateCart();
    // Mendengarkan event custom 'cartUpdated'
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  }, []);

  if (cart.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '100px', right: '30px', width: '280px',
      background: 'white', border: '1px solid #2c3e50', borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '15px', zIndex: 999
    }}>
      <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>🛒 Live Cart</h4>
      <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' }}>
        {cart.map((item, idx) => (
          <div key={idx} style={{ fontSize: '13px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{item.quantity}x {item.name}</span>
            <strong>{(item.price * item.quantity).toLocaleString('vi-VN')}</strong>
          </div>
        ))}
      </div>
      <button 
        onClick={() => navigate('/cart')}
        style={{ width: '100%', background: '#2ecc71', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Go to Checkout →
      </button>
    </div>
  );
}