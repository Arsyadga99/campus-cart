import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [delivery, setDelivery] = useState('pickup');
  const [payment, setPayment] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
  };

  useEffect(() => {
    loadCart();
  }, []);

  // Function to update quantity (+ or -)
  const updateQuantity = (productId, delta) => {
    let updatedCart = [...cart];
    const itemIndex = updatedCart.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
      const newQuantity = updatedCart[itemIndex].quantity + delta;
      
      if (newQuantity <= 0) {
        // Remove item if quantity becomes 0
        updatedCart.splice(itemIndex, 1);
      } else {
        updatedCart[itemIndex].quantity = newQuantity;
      }
      
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      setCart(updatedCart);
      // Sync with FloatingCart
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  // Function to completely remove an item
  const removeItem = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = delivery === 'delivery' ? 15000 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      const newOrder = {
        id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
        items: cart,
        total: grandTotal,
        paymentMethod: payment,
        deliveryMethod: delivery,
        date: new Date().toLocaleString('en-US')
      };
      
      orders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(orders));
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      
      setLastOrder(newOrder);
      setCart([]);
      setIsProcessing(false);
      setOrderSuccess(true);
    }, 1500);
  };

  if (orderSuccess && lastOrder) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '60px', marginBottom: '10px' }}>✅</div>
        <h1 style={{ color: '#27ae60' }}>Payment Successful!</h1>
        <div style={{ background: '#f9f9f9', padding: '25px', borderRadius: '12px', marginTop: '20px', textAlign: 'left', border: '1px dashed #27ae60' }}>
          <h3>Order Receipt</h3>
          <p><strong>Order ID:</strong> {lastOrder.id}</p>
          <p><strong>Total Paid:</strong> {lastOrder.total.toLocaleString('vi-VN')} VND</p>
          <p><strong>Items:</strong> {lastOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
        </div>
        <Link to="/"><button style={{ marginTop: '30px', background: '#3498db', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Continue Shopping</button></Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '25px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Review Your Order</h1>
      
      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#7f8c8d', fontSize: '18px' }}>Your cart is empty.</p>
          <Link to="/" style={{ color: '#3498db', fontWeight: 'bold' }}>Go back to catalog</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          
          {/* Left Column: Item List with Action Buttons */}
          <div style={{ flex: '2', minWidth: '400px' }}>
            <h3 style={{ marginBottom: '15px' }}>Shopping Basket</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                  <div style={{ flex: '2' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{item.category}</div>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>+</button>
                  </div>

                  <div style={{ flex: '1', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>
                    {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeItem(item.id)}
                    style={{ marginLeft: '15px', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px' }}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Checkout Sidebar */}
          <div style={{ flex: '1', minWidth: '320px', background: '#fdfdfd', padding: '25px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>Order Totals</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal:</span>
              <span>{subtotal.toLocaleString('vi-VN')} VND</span>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ margin: '15px 0 10px 0' }}>Delivery Method</h5>
              <select value={delivery} onChange={(e) => setDelivery(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}>
                <option value="pickup">Campus Pickup (Free)</option>
                <option value="delivery">Dormitory Delivery (+15,000 VND)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ margin: '15px 0 10px 0' }}>Payment Method</h5>
              <select value={payment} onChange={(e) => setPayment(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}>
                <option value="cod">Cash on Delivery</option>
                <option value="momo">Momo e-Wallet</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div style={{ borderTop: '2px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#27ae60', marginBottom: '20px' }}>
              <span>Total:</span>
              <span>{grandTotal.toLocaleString('vi-VN')} VND</span>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isProcessing}
              style={{ background: isProcessing ? '#bdc3c7' : '#27ae60', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
            >
              {isProcessing ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}