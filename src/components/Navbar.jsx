import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={{ padding: '15px 30px', background: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0, color: '#2ecc71' }}>CampusCart</h2>
      <div style={{ display: 'flex', gap: '20px', fontWeight: 'bold' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Catalog</Link>
        <Link to="/cart" style={{ color: 'white', textDecoration: 'none' }}>Cart</Link>
        <Link to="/admin" style={{ color: '#f1c40f', textDecoration: 'none' }}>Admin Panel</Link>
      </div>
    </nav>
  );
}