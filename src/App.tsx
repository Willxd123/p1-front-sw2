import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';

import PublicDashboard from './pages/PublicDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminSensores from './features/admin/AdminSensores';
import AdminLogs from './features/admin/AdminLogs';
import AdminNotifications from './features/admin/AdminNotifications.tsx';
import AdminUsers from './features/admin/AdminUsers';
import './index.css';
import AdminLayout from './layouts/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PublicDashboard />} />
        </Route>
 
        {/* Rutas Administrativas */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/sensores" element={<AdminSensores />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/notificaciones" element={<AdminNotifications />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
