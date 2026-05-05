import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { PRODUCT_CATEGORIES } from '../data/products';

export default function Inventory() {
  const { products, createProduct, updateProduct, deleteProduct } = useAuth();
  const [editingId, setEditingId] = useState(null);
  
  const defaultProduct = {
    id: `p-custom-${Date.now()}`,
    name: '',
    description: '',
    category: 'Daily Needs',
    campusIds: ['hcmut-main'],
    vendorId: 'vendor-dorm-essentials',
    vendor: 'Dormitory Essentials',
    price: 15000,
    originalPrice: null,
    campusDemand: 10,
    badge: 'New',
    leadTime: 'Same day',
    groupEligible: false,
  };

  const [formData, setFormData] = useState(defaultProduct);

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData(product);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await deleteProduct(id);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateProduct(editingId, formData);
    } else {
      await createProduct(formData);
    }
    setEditingId(null);
    setFormData({ ...defaultProduct, id: `p-custom-${Date.now()}` });
  };

  return (
    <div className="page-shell">
      <section className="section-head standalone-head">
        <div>
          <p className="eyebrow">Admin / Vendor Features</p>
          <h1>Product Management</h1>
          <p className="support-copy">Manage the catalog of items available across campuses.</p>
        </div>
      </section>

      <section className="stack">
        <article className="card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form className="stack" onSubmit={handleSave} style={{ gap: '1.25rem' }}>
            <div className="option-group">
              <label>Product Name</label>
              <input required className="search-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="E.g. Engineering Notebook" />
            </div>
            
            <div className="option-group">
              <label>Description</label>
              <textarea required className="search-input" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="A short description..." style={{ resize: 'vertical' }} />
            </div>

            <div className="option-group">
              <label>Category</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                {PRODUCT_CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="option-group">
              <label>Price (VND)</label>
              <input required className="search-input" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
            </div>

            <div className="option-group">
              <label>Original Price (VND) - Optional</label>
              <input className="search-input" type="number" value={formData.originalPrice || ''} onChange={(e) => setFormData({...formData, originalPrice: e.target.value ? Number(e.target.value) : null})} />
            </div>

            <div className="option-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <input type="checkbox" checked={formData.groupEligible} onChange={(e) => setFormData({...formData, groupEligible: e.target.checked})} id="cbGroup" style={{ width: '1.2rem', height: '1.2rem', margin: 0 }} />
              <label htmlFor="cbGroup" style={{ margin: 0 }}>Eligible for Group Buy Discount</label>
            </div>

            <div className="button-row" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'row', gap: '1rem' }}>
              <button type="submit" className="primary-button" style={{ flex: 1, padding: '1rem' }}>
                {editingId ? 'Update Product' : 'Create Product'}
              </button>
              {editingId && (
                <button type="button" className="ghost-button" style={{ flex: 1, padding: '1rem' }} onClick={() => {
                  setEditingId(null);
                  setFormData({ ...defaultProduct, id: `p-custom-${Date.now()}` });
                }}>Cancel</button>
              )}
            </div>
          </form>
        </article>
        <div style={{ marginTop: '2rem' }}>
          <div className="section-head">
            <h2>Current Catalog ({products.length})</h2>
          </div>
          <div className="product-grid">
            {products.map(product => (
              <article key={product.id} className="card product-card">
                <div className="product-card-top" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <p className="eyebrow">{product.category}</p>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem' }}>{product.name}</h3>
                  </div>
                  {product.badge ? <span className="tag">{product.badge}</span> : null}
                </div>
                
                <p className="product-description" style={{ fontSize: '0.9rem', flex: 1 }}>
                  {product.description}
                </p>

                <div className="price-row" style={{ margin: '1rem 0' }}>
                  <strong>{product.price.toLocaleString('vi-VN')} VND</strong>
                </div>

               <div
                  className="button-row"
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    marginTop: '0.5rem'
                  }}
                >
                  <button
                    type="button"
                    className="ghost-button"
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.8rem',
                      width: 'auto',
                      minWidth: '60px',
                      flex: '0 0 auto'
                    }}
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="ghost-button danger-button"
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.8rem',
                      width: 'auto',
                      minWidth: '60px',
                      flex: '0 0 auto'
                    }}
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
