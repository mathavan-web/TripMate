import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import SettingsPage from './pages/SettingsPage';
import CustomersPage from './pages/CustomersPage';
import EnquiriesPage from './pages/EnquiriesPage';
import PackagesPage from './pages/PackagesPage';
import QuotationsPage from './pages/QuotationsPage';

function ProtectedRoute({ children }) {
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Navigate to="/dashboard" replace />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/enquiries" element={<EnquiriesPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/business-profile" element={<BusinessProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<div className="page-shell"><div className="card-block"><h2>Page not found</h2><p>The page you are looking for does not exist.</p></div></div>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
