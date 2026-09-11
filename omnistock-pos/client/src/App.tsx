import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import POS from './pages/POS';
import AdminDashboard from './pages/AdminDashboard';
import BulkPriceManager from './pages/BulkPriceManager';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import Tutorial from './pages/Tutorial';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<POS />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/capacitacion" element={<ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}><Tutorial /></ProtectedRoute>} />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/inventory" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Inventory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/bulk-prices" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <BulkPriceManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
                <Settings />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
