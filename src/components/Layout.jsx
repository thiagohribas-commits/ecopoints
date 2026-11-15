import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const userLinks = [
  { to: '/', label: 'Meus Pontos', icon: '📊', end: true },
  { to: '/entregas', label: 'Entregas', icon: '♻️' },
  { to: '/recompensas', label: 'Recompensas', icon: '🎁' },
  { to: '/resgates', label: 'Resgates', icon: '🎟️' },
];

const adminLinks = [
  { to: '/admin/materiais', label: 'Materiais', icon: '🧴' },
  { to: '/admin/parceiros', label: 'Parceiros', icon: '🤝' },
  { to: '/admin/recompensas', label: 'Gerenciar Recompensas', icon: '🏷️' },
  { to: '/admin/usuarios', label: 'Usuários', icon: '👥' },
];

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderLinks = (links) =>
    links.map((l) => (
      <NavLink key={l.to} to={l.to} end={l.end} className="nav-link" onClick={() => setOpen(false)}>
        <span className="nav-icon" aria-hidden>{l.icon}</span>
        {l.label}
      </NavLink>
    ));

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Abrir menu">
          ☰
        </button>
        <div className="brand">
          <span className="brand-logo">♻️</span> EcoPoints
        </div>
      </header>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand sidebar-brand">
          <span className="brand-logo">♻️</span> EcoPoints
        </div>
        <nav>
          {renderLinks(userLinks)}
          {isAdmin && (
            <>
              <div className="nav-section">Administração</div>
              {renderLinks(adminLinks)}
            </>
          )}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
          <div className="sidebar-user-info">
            <strong>{user.name}</strong>
            <small>{isAdmin ? 'Administrador' : 'Usuário'}</small>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sair</button>
        </div>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
