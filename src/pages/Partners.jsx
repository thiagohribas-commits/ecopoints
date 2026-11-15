import CrudPage from '../components/CrudPage';
import { api } from '../api/client';

const segments = ['Supermercado', 'Alimentação', 'Entretenimento', 'Mobilidade', 'Moda', 'Saúde', 'Educação', 'Serviços', 'Outro'];

const fields = [
  { name: 'name', label: 'Nome da empresa', required: true, full: true },
  { name: 'cnpj', label: 'CNPJ', required: true, placeholder: '00.000.000/0000-00' },
  { name: 'segment', label: 'Segmento', type: 'select', required: true, options: segments.map((s) => ({ value: s, label: s })) },
  { name: 'email', label: 'E-mail', type: 'email', required: true },
  { name: 'phone', label: 'Telefone' },
  { name: 'address', label: 'Endereço', full: true },
  { name: 'active', label: 'Parceria ativa', type: 'checkbox' },
];

const columns = [
  { label: 'Empresa', render: (p) => <strong>{p.name}</strong> },
  { label: 'CNPJ', render: (p) => <span className="small">{p.cnpj}</span> },
  { label: 'Segmento', render: (p) => <span className="badge">{p.segment}</span> },
  { label: 'Contato', render: (p) => <span className="small">{p.email}<br /><span className="muted">{p.phone}</span></span> },
  { label: 'Endereço', render: (p) => <span className="muted small">{p.address || '—'}</span> },
];

const formatCnpj = (v) => {
  const d = v.replace(/\D/g, '');
  if (d.length !== 14) return v;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

export default function Partners() {
  return (
    <CrudPage
      title="Empresas parceiras"
      subtitle="Empresas que oferecem produtos e serviços em troca de pontos."
      resource="/partners"
      singular="Parceiro"
      fields={fields}
      columns={columns}
      searchKeys={['name', 'cnpj', 'segment', 'email']}
      emptyItem={{ name: '', cnpj: '', segment: '', email: '', phone: '', address: '', active: true }}
      validate={(p, all) => {
        if (p.name.length < 2) return 'Informe o nome da empresa.';
        if (p.cnpj.replace(/\D/g, '').length !== 14) return 'CNPJ deve ter 14 dígitos.';
        p.cnpj = formatCnpj(p.cnpj);
        if (!p.segment) return 'Selecione o segmento.';
        if (!/^\S+@\S+\.\S+$/.test(p.email)) return 'Informe um e-mail válido.';
        if (all.some((o) => o.id !== p.id && o.cnpj.replace(/\D/g, '') === p.cnpj.replace(/\D/g, ''))) return 'Já existe um parceiro com esse CNPJ.';
        return null;
      }}
      beforeDelete={async (p) => {
        const linked = await api.get(`/rewards?partnerId=${p.id}`);
        return linked.length
          ? `"${p.name}" possui ${linked.length} recompensa(s) vinculada(s) e não pode ser excluído. Desative a parceria ou remova as recompensas antes.`
          : null;
      }}
    />
  );
}
