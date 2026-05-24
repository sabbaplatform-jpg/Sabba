import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Nav, { Footer } from './components/Nav';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import PackageDetail from './pages/PackageDetail';
import { NotFound, Contact, FAQ } from './pages/StaticPages';
import Messages from './pages/Messages';
import VendorOnboarding, { VendorPendingState } from './pages/VendorOnboarding';
import { Spinner } from './components/UI';
import { font, globalStyles } from './lib/styles';

// HR pages
import HRDashboard from './pages/hr/HRDashboard';
import HREmployees from './pages/hr/HREmployees';
import HRProfile from './pages/hr/HRProfile';
import { HRAdventures, HRMarketplace, HRAnalytics, HRIntegrations } from './pages/hr/HRPages';

// Employee pages
import { EmployeeHome } from './pages/employee/EmployeeHome';
import MyBooking from './pages/employee/MyBooking';
import { EmployeeProfile } from './pages/employee/EmployeeProfile';
import { AdminDashboard, AdminEmployers, AdminVendors, AdminPackages, AdminAnalytics, AdminBilling, AdminFeatureFlags, AdminAuditLog, AdminIntegrations, AdminSettings } from './pages/admin/AdminPages';
import { AdminEmployerDetail } from './pages/admin/AdminEmployerDetail';
import { Cart, CheckoutSuccess } from './pages/employee/Cart';
import Allowance from './pages/employee/Allowance';

// Vendor pages
import { VendorDashboard, VendorPackages, VendorBookings, VendorEarnings, VendorProfile } from './pages/vendor/VendorPages';

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
  const dest = { hr: '/hr', employee: '/home', vendor: '/vendor', superadmin: '/admin' }[user.role];
  return <Navigate to={dest || '/login'} replace/>;
}

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <Footer/>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <div style={{ fontFamily: font.body }}>
      <style>{globalStyles}</style>
      <Routes>
        {/* ── Admin routes — render without Nav/Footer ── */}
        <Route path="/admin"               element={<RequireAdmin><AdminDashboard/></RequireAdmin>}/>
        <Route path="/admin/employers"     element={<RequireAdmin><AdminEmployers/></RequireAdmin>}/>
        <Route path="/admin/employers/:id" element={<RequireAdmin><AdminEmployerDetail/></RequireAdmin>}/>
        <Route path="/admin/vendors"       element={<RequireAdmin><AdminVendors/></RequireAdmin>}/>
        <Route path="/admin/packages"      element={<RequireAdmin><AdminPackages/></RequireAdmin>}/>
        <Route path="/admin/integrations" element={<RequireAdmin><AdminIntegrations/></RequireAdmin>}/>
        <Route path="/admin/settings"     element={<RequireAdmin><AdminSettings/></RequireAdmin>}/>
        <Route path="/admin/analytics"     element={<RequireAdmin><AdminAnalytics/></RequireAdmin>}/>
        <Route path="/admin/billing"       element={<RequireAdmin><AdminBilling/></RequireAdmin>}/>
        <Route path="/admin/flags"         element={<RequireAdmin><AdminFeatureFlags/></RequireAdmin>}/>
        <Route path="/admin/audit"         element={<RequireAdmin><AdminAuditLog/></RequireAdmin>}/>

        {/* ── All other routes — with Nav/Footer ── */}
        <Route path="*" element={
          <>
            <ImpersonationBanner/>
            {user && <Nav/>}
            <AppLayout>
              <Routes>
                {/* Public */}
                <Route path="/login"              element={<Login/>}/>
                <Route path="/register"           element={<Register/>}/>
                <Route path="/contact"            element={<Contact/>}/>
                <Route path="/faq"                element={<FAQ/>}/>
                <Route path="/vendor/onboarding"  element={<VendorOnboarding/>}/>
                <Route path="/vendor/pending"     element={<VendorPendingState/>}/>

                {/* HR */}
                <Route path="/hr"              element={<RequireAuth role="hr"><HRDashboard/></RequireAuth>}/>
                <Route path="/hr/employees"    element={<RequireAuth role="hr"><HREmployees/></RequireAuth>}/>
                <Route path="/hr/profile"      element={<RequireAuth role="hr"><HRProfile/></RequireAuth>}/>
                <Route path="/hr/adventures"   element={<RequireAuth role="hr"><HRAdventures/></RequireAuth>}/>
                <Route path="/hr/marketplace"  element={<RequireAuth role="hr"><HRMarketplace/></RequireAuth>}/>
                <Route path="/hr/analytics"    element={<RequireAuth role="hr"><HRAnalytics/></RequireAuth>}/>
                <Route path="/hr/integrations" element={<RequireAuth role="hr"><HRIntegrations/></RequireAuth>}/>

                {/* Employee */}
                <Route path="/home"             element={<RequireAuth role="employee"><EmployeeHome/></RequireAuth>}/>
                <Route path="/my-booking"       element={<RequireAuth role="employee"><MyBooking/></RequireAuth>}/>
                <Route path="/profile"          element={<RequireAuth role="employee"><EmployeeProfile/></RequireAuth>}/>
                <Route path="/cart"             element={<RequireAuth role="employee"><Cart/></RequireAuth>}/>
                <Route path="/allowance"        element={<RequireAuth role="employee"><Allowance/></RequireAuth>}/>
                <Route path="/checkout-success" element={<RequireAuth role="employee"><CheckoutSuccess/></RequireAuth>}/>

                {/* Vendor */}
                <Route path="/vendor"          element={<RequireAuth role="vendor"><VendorDashboard/></RequireAuth>}/>
                <Route path="/vendor/packages" element={<RequireAuth role="vendor"><VendorPackages/></RequireAuth>}/>
                <Route path="/vendor/bookings" element={<RequireAuth role="vendor"><VendorBookings/></RequireAuth>}/>
                <Route path="/vendor/earnings" element={<RequireAuth role="vendor"><VendorEarnings/></RequireAuth>}/>
                <Route path="/vendor/profile"  element={<RequireAuth role="vendor"><VendorProfile/></RequireAuth>}/>

                {/* Messages */}
                <Route path="/messages"           element={<RequireAuth><Messages/></RequireAuth>}/>
                <Route path="/messages/new"        element={<RequireAuth><Messages/></RequireAuth>}/>
                <Route path="/messages/:threadId"  element={<RequireAuth><Messages/></RequireAuth>}/>

                {/* Shared */}
                <Route path="/marketplace" element={<RequireAuth><Marketplace/></RequireAuth>}/>
                <Route path="/package/:id" element={<RequireAuth><PackageDetail/></RequireAuth>}/>

                <Route path="/"  element={<RoleRedirect/>}/>
                <Route path="*"  element={<NotFound/>}/>
              </Routes>
            </AppLayout>
          </>
        }/>
      </Routes>
    </div>
  );
}


function ImpersonationBanner() {
  const info = sessionStorage.getItem('sabba_impersonating');
  if (!info) return null;
  const { name, email, company } = JSON.parse(info);
  const exit = () => {
    const adminToken = sessionStorage.getItem('sabba_admin_token');
    if (adminToken) localStorage.setItem('sabba_token', adminToken);
    sessionStorage.removeItem('sabba_admin_token');
    sessionStorage.removeItem('sabba_impersonating');
    window.location.href = '/admin';
  };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#B45309', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
        👁 Impersonating: {name} ({email}) · {company}
      </span>
      <button onClick={exit} style={{ background: '#fff', color: '#B45309', border: 'none', borderRadius: 6, padding: '4px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
        Exit impersonation →
      </button>
    </div>
  );
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== 'superadmin') return <Navigate to="/login" replace/>;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes/>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
