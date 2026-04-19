import { useState, useEffect } from 'react';

export default function Admin() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    setOrders(savedOrders);
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const clearData = () => {
    if(window.confirm("Are you sure you want to delete all order history?")) {
      localStorage.removeItem('orders');
      setOrders([]);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ marginBottom: '20px' }}>Admin Analytics Dashboard</h1>
      
      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', background: '#ebf5fb', borderRadius: '8px', borderLeft: '6px solid #3498db', width: '250px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Total Orders (KPI)</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#2980b9' }}>{orders.length}</p>
        </div>
        <div style={{ padding: '20px', background: '#eafaf1', borderRadius: '8px', borderLeft: '6px solid #2ecc71', width: '250px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Total Revenue (KPI)</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#27ae60' }}>
            {totalRevenue.toLocaleString('vi-VN')} VND
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', maxWidth: '800px' }}>
        <h2>Order History</h2>
        <button onClick={clearData} style={{ background: '#e74c3c', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Clear All Data
        </button>
      </div>

      {orders.length === 0 ? <p>No orders yet.</p> : (
        <div style={{ maxWidth: '800px' }}>
          {orders.map((o) => (
            <div key={o.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '15px', borderRadius: '8px', background: '#fdfdfd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                <strong>Order ID: {o.id}</strong>
                <span style={{ color: '#7f8c8d', fontSize: '14px' }}>{o.date}</span>
              </div>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Total Spent: {o.total.toLocaleString('vi-VN')} VND</p>
              <p style={{ fontSize: '14px', color: '#555', margin: 0 }}>
                <strong>Items:</strong> {o.items.map(i => i.name).join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}