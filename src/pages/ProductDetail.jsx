import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useState } from 'react';
import { VENDOR_BY_ID } from '../data/vendors';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProducts, getCart, saveCart } = useAuth();
  
  const products = getProducts();
  const product = products.find(p => p.id === id);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="page-shell">
        <section className="card empty-card">
          <h2>Product not found</h2>
          <button className="primary-button" onClick={() => navigate('/')}>Return to Catalog</button>
        </section>
      </div>
    );
  }

  const vendor = VENDOR_BY_ID[product.vendorId];

  const addToCart = () => {
    const cart = [...getCart()];
    const index = cart.findIndex((item) => item.id === product.id);

    if (index >= 0) {
      cart[index] = {
        ...cart[index],
        quantity: cart[index].quantity + quantity,
      };
    } else {
      cart.push({ ...product, quantity });
    }

    saveCart(cart);
    navigate('/cart');
  };

  return (
    <div className="page-shell">
      <div className="toolbar">
        <button className="ghost-button" onClick={() => navigate('/')}>&larr; Back to Catalog</button>
      </div>
      <section className="two-column-grid">
        <article className="card">
          <div className="product-image-placeholder" style={{ backgroundColor: '#222', height: 300, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#888', fontSize: '1.25rem' }}>Product Image Preview</span>
          </div>
        </article>
        
        <article className="card">
          <p className="eyebrow">{product.category}</p>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{product.name}</h1>
          {product.badge && <span className="tag" style={{ marginBottom: '1rem', display: 'inline-block' }}>{product.badge}</span>}
          
          <div className="price-row" style={{ fontSize: '2rem', margin: '1rem 0' }}>
            <strong>{product.price.toLocaleString('vi-VN')} VND</strong>
            {product.originalPrice ? (
              <span style={{ textDecoration: 'line-through', color: '#888', marginLeft: '1rem', fontSize: '1.25rem' }}>
                {product.originalPrice.toLocaleString('vi-VN')} VND
              </span>
            ) : null}
          </div>

          <p className="support-copy" style={{ fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {product.description}
          </p>

          <dl className="summary-list" style={{ marginBottom: '2rem' }}>
            <div>
              <dt>Vendor Name</dt>
              <dd>{product.vendor}</dd>
            </div>
            <div>
              <dt>Available Campuses</dt>
              <dd>{product.campusIds.length} Campus Clusters</dd>
            </div>
            <div>
              <dt>Estimated Lead Time</dt>
              <dd>{product.leadTime}</dd>
            </div>
            <div>
              <dt>Campus Demand Score</dt>
              <dd>{product.campusDemand} recent searches</dd>
            </div>
            <div>
              <dt>Group Buy Eligible</dt>
              <dd>{product.groupEligible ? 'Yes (Min 2 req)' : 'No'}</dd>
            </div>
          </dl>

          <div className="cart-action-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="quantity-row">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button type="button" className="primary-button" style={{ flex: 1 }} onClick={addToCart}>
              Add {quantity} to Pre-Order
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
