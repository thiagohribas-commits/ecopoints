import CrudPage from '../components/CrudPage';
import { api } from '../api/client';

const categories = ['Plástico', 'Papel', 'Metal', 'Vidro', 'Óleo', 'Eletrônico', 'Orgânico', 'Outro'];

const fields = [
  { name: 'name', label: 'Nome do material', required: true, full: true },
  { name: 'category', label: 'Categoria', type: 'select', required: true, options: categories.map((c) => ({ value: c, label: c })) },
  { name: 'pointsPerKg', label: 'Pontos por kg', type: 'number', min: 1, step: 1, required: true, hint: 'Usado no cálculo: peso × pontos/kg' },
  { name: 'description', label: 'Descrição / instruções de entrega', type: 'textarea', full: true },
  { name: 'active', label: 'Aceito nos pontos de coleta (ativo)', type: 'checkbox' },
];

const columns = [
  { label: 'Material', render: (m) => <strong>{m.name}</strong> },
  { label: 'Categoria', render: (m) => <span className="badge">{m.category}</span> },
  { label: 'Pontos / kg', num: true, render: (m) => <span className="points">{m.pointsPerKg}</span> },
  { label: 'Descrição', render: (m) => <span className="muted small">{m.description || '—'}</span> },
];

export default function Materials() {
  return (
    <CrudPage
      title="Materiais recicláveis"
      subtitle="Tipos de materiais aceitos e quantos pontos cada kg vale."
      resource="/materials"
      singular="Material"
      fields={fields}
      columns={columns}
      searchKeys={['name', 'category']}
      emptyItem={{ name: '', category: '', pointsPerKg: '', description: '', active: true }}
      validate={(m, all) => {
        if (m.name.length < 2) return 'Informe o nome do material.';
        if (!m.category) return 'Selecione a categoria.';
        if (!Number.isInteger(m.pointsPerKg) || m.pointsPerKg <= 0) return 'Pontos por kg deve ser um número inteiro maior que zero.';
        if (all.some((o) => o.id !== m.id && o.name.toLowerCase() === m.name.toLowerCase())) return 'Já existe um material com esse nome.';
        return null;
      }}
      beforeDelete={async (m) => {
        const used = await api.get(`/deliveries?materialId=${m.id}&_limit=1`);
        return used.length
          ? `"${m.name}" possui entregas registradas e não pode ser excluído. Desative-o para não aceitar novas entregas.`
          : null;
      }}
    />
  );
}
