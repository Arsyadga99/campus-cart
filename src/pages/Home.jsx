import { useState } from 'react';
import productsData from '../data/products.json';

export default function Home() {
  // State to track quantities for each product locally in the catalog
  const [quantities, setQuantities] = useState({});

  // Function to adjust quantity before adding to cart
  const adjustQty = (id, delta) => {
    const currentQty = quantities[id] || 1;
    const newQty = currentQty + delta;
    
    if (newQty >= 1) {
      setQuantities({ ...quantities, [id]: newQty });
    }
  };

  const addToCart = (product) => {
    const qty = quantities[product.id] || 1;
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already exists in the cart
    const existingIndex = currentCart.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) {
      currentCart[existingIndex].quantity += qty;
    } else {
      currentCart.push({ ...product, quantity: qty });
    }

    localStorage.setItem('cart', JSON.stringify(currentCart));
    
    // Reset local quantity to 1 after adding to cart
    setQuantities({ ...quantities, [product.id]: 1 });

    // Trigger global event for FloatingCart update
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <div style={{ padding: '30px', paddingBottom: '100px' }}>
      <h1 style={{ marginBottom: '20px' }}>Student Product Catalog</h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {productsData.map((p) => {
          const displayQty = quantities[p.id] || 1;
          
          return (
            <div key={p.id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '12px', width: '220px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{p.name}</h3>
              <span style={{ background: '#f0f0f0', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                {p.category}
              </span>
              <p style={{ fontSize: '14px', color: '#666', height: '40px', marginTop: '10px' }}>{p.description}</p>
              <h3 style={{ color: '#27ae60', marginBottom: '15px' }}>{p.price.toLocaleString('vi-VN')} VND</h3>
              
              {/* Modern Plus/Minus Controls */}
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', background: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                <button 
                  onClick={() => adjustQty(p.id, -1)}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  -
                </button>
                <span style={{ fontWeight: 'bold', fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>
                  {displayQty}
                </span>
                <button 
                  onClick={() => adjustQty(p.id, 1)}
                  style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  +
                </button>
              </div>

              <button 
                onClick={() => addToCart(p)}
                style={{ 
                  background: '#2980b9', color: 'white', padding: '12px', border: 'none', 
                  borderRadius: '6px', cursor: 'pointer', width: '100%', fontWeight: 'bold', transition: '0.2s'
                }}
              >
                Add to Cart
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}