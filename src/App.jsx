import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Deliveries from './pages/Deliveries';
import Rewards from './pages/Rewards';
import Redemptions from './pages/Redemptions';
import Materials from './pages/Materials';
import Partners from './pages/Partners';
import ManageRewards from './pages/ManageRewards';
import Users from './pages/Users';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/cadastro" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="entregas" element={<Deliveries />} />
        <Route path="recompensas" element={<Rewards />} />
        <Route path="resgates" element={<Redemptions />} />

        <Route path="admin/materiais" element={<ProtectedRoute adminOnly><Materials /></ProtectedRoute>} />
        <Route path="admin/parceiros" element={<ProtectedRoute adminOnly><Partners /></ProtectedRoute>} />
        <Route path="admin/recompensas" element={<ProtectedRoute adminOnly><ManageRewards /></ProtectedRoute>} />
        <Route path="admin/usuarios" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
