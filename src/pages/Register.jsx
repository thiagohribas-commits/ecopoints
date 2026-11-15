import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Feedback';
import AuthHero from './AuthHero';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 3) return setError('Informe seu nome completo.');
    if (form.password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    if (form.password !== form.confirm) return setError('As senhas não conferem.');
    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
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
          <h2>Criar conta</h2>
          <p className="muted">Cadastre-se e comece a acumular pontos.</p>

          <form className="form" onSubmit={handleSubmit}>
            <Alert>{error}</Alert>
            <div className="field">
              <label htmlFor="name">Nome completo</label>
              <input id="name" required value={form.name} onChange={set('name')} autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="phone">Telefone <span className="muted">(opcional)</span></label>
              <input id="phone" value={form.phone} onChange={set('phone')} placeholder="(11) 90000-0000" autoComplete="tel" />
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="password">Senha</label>
                <input id="password" type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" />
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirmar senha</label>
                <input id="confirm" type="password" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
              </div>
            </div>
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <div className="auth-footer">
            Já tem conta? <Link to="/login">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
