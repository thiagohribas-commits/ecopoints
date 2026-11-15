import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { fetchActivity } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { calcSummary, fmtDate, fmtNumber } from '../utils/points';

const fields = [
  { name: 'name', label: 'Nome completo', required: true, full: true },
  { name: 'email', label: 'E-mail', type: 'email', required: true },
  { name: 'phone', label: 'Telefone' },
  { name: 'password', label: 'Senha', type: 'password', required: true, hint: 'Mínimo de 6 caracteres' },
  {
    name: 'role', label: 'Perfil', type: 'select', required: true,
    options: [{ value: 'user', label: 'Usuário' }, { value: 'admin', label: 'Administrador' }],
  },
];

export default function Users() {
  const { user: me } = useAuth();
  const [activity, setActivity] = useState({ deliveries: [], redemptions: [] });

  const loadActivity = () => fetchActivity().then(setActivity).catch(() => {});
  useEffect(() => {
    loadActivity();
  }, []);

  const summaryOf = (id) =>
    calcSummary(
      activity.deliveries.filter((d) => d.userId === id),
      activity.redemptions.filter((r) => r.userId === id)
    );

  const columns = [
    { label: 'Nome', render: (u) => <strong>{u.name}{u.id === me.id && <span className="muted small"> (você)</span>}</strong> },
    { label: 'E-mail', render: (u) => u.email },
    { label: 'Perfil', render: (u) => <span className={`badge ${u.role === 'admin' ? 'badge-amber' : ''}`}>{u.role === 'admin' ? 'Admin' : 'Usuário'}</span> },
    { label: 'Cadastro', render: (u) => fmtDate(u.createdAt) },
    { label: 'Entregas', num: true, render: (u) => summaryOf(u.id).deliveries },
    { label: 'Saldo', num: true, render: (u) => <span className="points">{fmtNumber(summaryOf(u.id).balance)}</span> },
  ];

  return (
    <CrudPage
      title="Usuários"
      subtitle="Contas cadastradas no sistema e seus saldos de pontos."
      resource="/users"
      singular="Usuário"
      fields={fields}
      columns={columns}
      searchKeys={['name', 'email']}
      onChange={loadActivity}
      emptyItem={{ name: '', email: '', phone: '', password: '', role: 'user', createdAt: new Date().toISOString() }}
      validate={(u, all) => {
        u.email = u.email.toLowerCase();
        if (u.name.length < 3) return 'Informe o nome completo.';
        if (!/^\S+@\S+\.\S+$/.test(u.email)) return 'Informe um e-mail válido.';
        if (all.some((o) => o.id !== u.id && o.email === u.email)) return 'Já existe uma conta com este e-mail.';
        if (u.password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
        if (u.id === me.id && u.role !== 'admin') return 'Você não pode remover seu próprio perfil de administrador.';
        return null;
      }}
      beforeDelete={async (u) => {
        if (u.id === me.id) return 'Você não pode excluir a própria conta.';
        if (summaryOf(u.id).deliveries > 0) return `"${u.name}" possui entregas registradas e não pode ser excluído.`;
        return null;
      }}
    />
  );
}
