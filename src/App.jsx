import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import FloatingCart from './components/FloatingCart';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      
      {/* Floating Live Cart Widget */}
      <FloatingCart />

      {/* AI Chatbot Dummy */}
      <div 
        onClick={() => alert('AI Chatbot: Hello! Do you need help finding products?')}
        style={{
          position: 'fixed', bottom: '30px', right: '30px', background: '#2980b9',
          color: 'white', width: '60px', height: '60px', borderRadius: '50%',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 1000
        }}
      >
        💬
      </div>
    </Router>
  );
}

export default App;