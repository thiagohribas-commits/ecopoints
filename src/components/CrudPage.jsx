import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import Modal from './Modal';
import { Alert, Loading, PageHeader } from './Feedback';

/**
 * Tela genérica de cadastro (listar / criar / editar / ativar-desativar / excluir)
 * para um recurso do json-server.
 *
 * fields:  [{ name, label, type: 'text'|'email'|'number'|'select'|'textarea'|'checkbox', options, required, min, step, placeholder, full }]
 * columns: [{ label, render: (item) => node, num }]
 * validate(item, items) -> mensagem de erro ou null
 * beforeDelete(item) -> Promise<mensagem de bloqueio ou null>
 */
export default function CrudPage({
  title,
  subtitle,
  resource,
  singular,
  fields,
  columns,
  emptyItem,
  validate,
  beforeDelete,
  searchKeys = ['name'],
  onChange,
  feminine = false,
}) {
  const o = feminine ? 'a' : 'o';
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setItems(await api.get(resource));
      onChange?.();
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items || []).filter(
      (it) => !q || searchKeys.some((k) => String(it[k] ?? '').toLowerCase().includes(q))
    );
  }, [items, search, searchKeys]);

  const openNew = () => {
    setFormError('');
    setEditing({ ...emptyItem });
  };
  const openEdit = (item) => {
    setFormError('');
    setEditing({ ...item });
  };

  const normalize = (item) => {
    const out = { ...item };
    for (const f of fields) {
      if (f.type === 'number' || f.numeric) out[f.name] = out[f.name] === '' ? '' : Number(out[f.name]);
      else if (typeof out[f.name] === 'string') out[f.name] = out[f.name].trim();
    }
    return out;
  };

  const save = async (e) => {
    e.preventDefault();
    const data = normalize(editing);
    const msg = validate?.(data, items || []);
    if (msg) return setFormError(msg);
    setSaving(true);
    try {
      if (data.id) await api.put(`${resource}/${data.id}`, data);
      else await api.post(resource, data);
      setSuccess(`${singular} ${data.id ? `atualizad${o}` : `cadastrad${o}`} com sucesso.`);
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.patch(`${resource}/${item.id}`, { active: !item.active });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (item) => {
    setError('');
    const blocked = await beforeDelete?.(item);
    if (blocked) return setError(blocked);
    if (!window.confirm(`Excluir "${item.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`${resource}/${item.id}`);
      setSuccess(`${singular} excluíd${o}.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const setField = (name, value) => setEditing((prev) => ({ ...prev, [name]: value }));

  const renderField = (f) => {
    const value = editing[f.name] ?? '';
    const common = { id: f.name, required: f.required, placeholder: f.placeholder };
    if (f.type === 'checkbox') {
      return (
        <label key={f.name} className="check">
          <input type="checkbox" checked={!!editing[f.name]} onChange={(e) => setField(f.name, e.target.checked)} />
          {f.label}
        </label>
      );
    }
    let input;
    if (f.type === 'select') {
      input = (
        <select {...common} value={value} onChange={(e) => setField(f.name, e.target.value)}>
          <option value="">Selecione...</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    } else if (f.type === 'textarea') {
      input = <textarea {...common} value={value} onChange={(e) => setField(f.name, e.target.value)} />;
    } else {
      input = (
        <input {...common} type={f.type || 'text'} min={f.min} step={f.step} value={value}
          onChange={(e) => setField(f.name, e.target.value)} />
      );
    }
    return (
      <div key={f.name} className="field" style={f.full ? { gridColumn: '1 / -1' } : undefined}>
        <label htmlFor={f.name}>{f.label}</label>
        {input}
        {f.hint && <span className="hint">{f.hint}</span>}
      </div>
    );
  };

  if (!items && !error) return <Loading />;
  const hasActive = 'active' in emptyItem;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        <button className="btn btn-primary" onClick={openNew}>+ {feminine ? 'Nova' : 'Novo'} {singular.toLowerCase()}</button>
      </PageHeader>
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

      <div className="card">
        <div className="filters">
          <div className="field">
            <input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
          </div>
          <span className="muted small" style={{ alignSelf: 'center' }}>{filtered.length} registro(s)</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((c) => <th key={c.label} className={c.num ? 'num' : ''}>{c.label}</th>)}
                {hasActive && <th>Status</th>}
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={columns.length + 2} className="muted">Nenhum registro encontrado.</td></tr>
              )}
              {filtered.map((item) => (
                <tr key={item.id} className={hasActive && !item.active ? 'inactive' : ''}>
                  {columns.map((c) => <td key={c.label} className={c.num ? 'num' : ''}>{c.render(item)}</td>)}
                  {hasActive && (
                    <td><span className={`badge ${item.active ? 'badge-green' : ''}`}>{item.active ? 'Ativo' : 'Inativo'}</span></td>
                  )}
                  <td className="actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Editar</button>
                    {hasActive && (
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(item)}>
                        {item.active ? 'Desativar' : 'Ativar'}
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(item)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal
          title={editing.id ? `Editar ${singular.toLowerCase()}` : `${feminine ? 'Nova' : 'Novo'} ${singular.toLowerCase()}`}
          onClose={() => !saving && setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" form="crud-form" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </>
          }
        >
          <form id="crud-form" className="form" onSubmit={save}>
            <Alert>{formError}</Alert>
            <div className="form-row">{fields.map(renderField)}</div>
          </form>
        </Modal>
      )}
    </>
  );
}
