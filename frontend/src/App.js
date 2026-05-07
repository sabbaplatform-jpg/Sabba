import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Nav from './components/Nav';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import PackageDetail from './pages/PackageDetail';
import HRDashboard from './pages/HRDashboard';
import { EmployeeHome, MyBooking } from './pages/Employee';
import { VendorDashboard, VendorPackages } from './pages/Vendor';
import { Spinner } from './components/UI';
import { font } from './lib/styles';

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (role && user.role !== role) return <Navigate to="/" replace/>;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  if (!user) return <Navigate to="/login" replace/>;
  const dest = { hr: '/hr', employee: '/home', vendor: '/vendor' }[user.role];
  return <Navigate to={dest || '/login'} replace/>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <div style={{ fontFamily: font.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f9f8f6; }
      `}</style>
      {user && <Nav/>}
      <Routes>
        <Route path="/login"    element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/hr"       element={<RequireAuth role="hr"><HRDashboard/></RequireAuth>}/>
        <Route path="/home"     element={<RequireAuth role="employee"><EmployeeHome/></RequireAuth>}/>
        <Route path="/my-booking" element={<RequireAuth role="employee"><MyBooking/></RequireAuth>}/>
        <Route path="/vendor"          element={<RequireAuth role="vendor"><VendorDashboard/></RequireAuth>}/>
        <Route path="/vendor/packages" element={<RequireAuth role="vendor"><VendorPackages/></RequireAuth>}/>
        <Route path="/marketplace"  element={<RequireAuth><Marketplace/></RequireAuth>}/>
        <Route path="/package/:id"  element={<RequireAuth><PackageDetail/></RequireAuth>}/>
        <Route path="/" element={<RoleRedirect/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes/>
      </AuthProvider>
    </BrowserRouter>
  );
}
