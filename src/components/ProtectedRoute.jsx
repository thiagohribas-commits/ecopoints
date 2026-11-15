import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && !isAdmin) {
    return (
      <div className="card empty">
        <h2>Acesso restrito</h2>
        <p>Esta área é exclusiva para administradores.</p>
      </div>
    );
  }
  return children;
}
