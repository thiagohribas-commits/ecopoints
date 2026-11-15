import { useEffect, useState } from 'react';
import CrudPage from '../components/CrudPage';
import { Alert, Loading } from '../components/Feedback';
import { api } from '../api/client';
import { fmtNumber } from '../utils/points';

export default function ManageRewards() {
  const [partners, setPartners] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/partners').then(setPartners).catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!partners) return <Loading />;

  const partnerName = (id) => partners.find((p) => p.id === id)?.name || '—';

  const fields = [
    { name: 'name', label: 'Nome da recompensa', required: true, full: true },
    { name: 'description', label: 'Descrição', type: 'textarea', full: true },
    {
      name: 'type', label: 'Tipo', type: 'select', required: true,
      options: [{ value: 'produto', label: 'Produto' }, { value: 'serviço', label: 'Serviço' }],
    },
    {
      name: 'partnerId', label: 'Parceiro', type: 'select', required: true, numeric: true,
      options: partners.map((p) => ({ value: p.id, label: p.active ? p.name : `${p.name} (inativo)` })),
    },
    { name: 'pointsCost', label: 'Custo em pontos', type: 'number', min: 1, step: 1, required: true },
    { name: 'stock', label: 'Estoque disponível', type: 'number', min: 0, step: 1, required: true },
    { name: 'active', label: 'Disponível no catálogo', type: 'checkbox' },
  ];

  const columns = [
    { label: 'Recompensa', render: (r) => <><strong>{r.name}</strong><br /><span className="muted small">{r.description}</span></> },
    { label: 'Tipo', render: (r) => <span className={`badge ${r.type === 'serviço' ? 'badge-blue' : 'badge-green'}`}>{r.type}</span> },
    { label: 'Parceiro', render: (r) => partnerName(r.partnerId) },
    { label: 'Custo', num: true, render: (r) => <span className="points">{fmtNumber(r.pointsCost)} pts</span> },
    { label: 'Estoque', num: true, render: (r) => (r.stock > 0 ? r.stock : <span className="badge badge-red">Esgotado</span>) },
  ];

  return (
    <CrudPage
      title="Gerenciar recompensas"
      subtitle="Produtos e serviços oferecidos pelos parceiros em troca de pontos."
      resource="/rewards"
      singular="Recompensa"
      feminine
      fields={fields}
      columns={columns}
      searchKeys={['name', 'description', 'type']}
      emptyItem={{ name: '', description: '', type: 'produto', partnerId: '', pointsCost: '', stock: '', active: true }}
      validate={(r) => {
        if (r.name.length < 2) return 'Informe o nome da recompensa.';
        if (!r.type) return 'Selecione o tipo.';
        if (!r.partnerId) return 'Selecione o parceiro.';
        if (!Number.isInteger(r.pointsCost) || r.pointsCost <= 0) return 'O custo deve ser um número inteiro maior que zero.';
        if (!Number.isInteger(r.stock) || r.stock < 0) return 'O estoque deve ser um número inteiro maior ou igual a zero.';
        return null;
      }}
      beforeDelete={async (r) => {
        const used = await api.get(`/redemptions?rewardId=${r.id}&_limit=1`);
        return used.length
          ? `"${r.name}" já foi resgatada por usuários e não pode ser excluída. Desative-a para tirá-la do catálogo.`
          : null;
      }}
    />
  );
}
