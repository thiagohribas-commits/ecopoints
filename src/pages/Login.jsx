import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Feedback';
import AuthHero from './AuthHero';

const demoAccounts = [
  { label: 'Administrador', email: 'admin@ecopoints.com', password: 'admin123' },
  { label: 'Maria (usuária)', email: 'maria@email.com', password: '123456' },
  { label: 'João (usuário)', email: 'joao@email.com', password: '123456' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthHero />
      <div className="auth-panel">
        <div className="auth-card">
          <h2>Entrar</h2>
          <p className="muted">Acesse sua conta para ver e trocar seus pontos.</p>

          <form className="form" onSubmit={handleSubmit}>
            <Alert>{error}</Alert>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" required autoComplete="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input id="password" type="password" required autoComplete="current-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="auth-footer">
            Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </div>

          <div className="demo-box">
            <strong>Contas de demonstração</strong> (clique para preencher):
            <ul>
              {demoAccounts.map((a) => (
                <li key={a.email}>
                  <button type="button" onClick={() => setForm({ email: a.email, password: a.password })}>
                    {a.label}
                  </button>{' '}
                  — {a.email} / {a.password}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
