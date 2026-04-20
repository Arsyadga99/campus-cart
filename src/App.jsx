import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login  from './pages/Login';
import Home   from './pages/Home';
import Cart   from './pages/Cart';
import Orders from './pages/Orders';
import Admin  from './pages/Admin';
import Navbar from './components/Navbar';
import FloatingCart from './components/FloatingCart';

function StudentApp() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"       element={<Home />} />
        <Route path="/cart"   element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*"       element={<Navigate to="/" replace />} />
      </Routes>
      <FloatingCart />
    </>
  );
}

function AdminApp() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/admin"            element={<Admin />} />
        <Route path="/admin/orders"     element={<Admin />} />
        <Route path="/admin/economics"  element={<Admin />} />
        <Route path="/admin/users"      element={<Admin />} />
        <Route path="*"                 element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}

function AppRouter() {
  const { role } = useAuth();
  if (!role)            return <Login />;
  if (role === 'student') return <StudentApp />;
  if (role === 'admin')   return <AdminApp />;
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
    </AuthProvider>
  );
}