import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { useContext } from 'react';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CustomersList from './pages/CustomersList';
import CustomerProfile from './pages/CustomerProfile';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import Campaigns from './pages/Campaigns';
import Segments from './pages/Segments';
import Retention from './pages/Retention';
import Stores from './pages/Stores';
import UsersAdmin from './pages/UsersAdmin';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, authLoading } = useContext(AuthContext);
  if (authLoading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-10 h-10 rounded-full border-4 border-crm-cyan border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastContainer />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><CustomersList /></PrivateRoute>} />
              <Route path="/customers/:id" element={<PrivateRoute><CustomerProfile /></PrivateRoute>} />
              <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
              <Route path="/campaigns" element={<PrivateRoute><Campaigns /></PrivateRoute>} />
              <Route path="/segments" element={<PrivateRoute><Segments /></PrivateRoute>} />
              <Route path="/retention" element={<PrivateRoute><Retention /></PrivateRoute>} />
              <Route path="/stores" element={<PrivateRoute requiredRole="Admin"><Stores /></PrivateRoute>} />
              <Route path="/admin/users" element={<PrivateRoute requiredRole="Admin"><UsersAdmin /></PrivateRoute>} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
