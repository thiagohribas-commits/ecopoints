import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Loading, PageHeader } from '../components/Feedback';
import { calcPoints, fmtDateTime, fmtKg, fmtNumber } from '../utils/points';

const emptyForm = { userId: '', materialId: '', quantity: '', weightKg: '', notes: '' };

export default function Deliveries() {
  const { user, isAdmin } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterUser, setFilterUser] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [mats, dels, us] = await Promise.all([
        api.get('/materials'),
        api.get(isAdmin ? '/deliveries' : `/deliveries?userId=${user.id}`),
        isAdmin ? api.get('/users') : Promise.resolve([]),
      ]);
      setMaterials(mats);
      setDeliveries(dels.sort((a, b) => b.date.localeCompare(a.date)));
      setUsers(us.filter((u) => u.role !== 'admin'));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeMaterials = materials.filter((m) => m.active);
  const selectedMaterial = materials.find((m) => m.id === Number(form.materialId));
  const previewPoints = calcPoints(form.weightKg, selectedMaterial?.pointsPerKg);
  const matName = (id) => materials.find((m) => m.id === id)?.name || 'Material removido';
  const userName = (id) => users.find((u) => u.id === id)?.name || (id === user.id ? user.name : '-');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const targetUserId = isAdmin ? Number(form.userId) : user.id;
    const quantity = Number(form.quantity);
    const weightKg = Number(String(form.weightKg).replace(',', '.'));

    if (isAdmin && !targetUserId) return setError('Selecione o usuário que fez a entrega.');
    if (!selectedMaterial) return setError('Selecione o material.');
    if (!Number.isInteger(quantity) || quantity <= 0) return setError('Informe uma quantidade inteira maior que zero.');
    if (!(weightKg > 0)) return setError('Informe um peso maior que zero.');
    if (weightKg > 1000) return setError('Peso acima do limite de 1000 kg por entrega.');

    const points = calcPoints(weightKg, selectedMaterial.pointsPerKg);
    setSaving(true);
    try {
      await api.post('/deliveries', {
        userId: targetUserId,
        materialId: selectedMaterial.id,
        quantity,
        weightKg,
        pointsPerKg: selectedMaterial.pointsPerKg,
        points,
        date: new Date().toISOString(),
        notes: form.notes.trim(),
        registeredBy: user.id,
      });
      setSuccess(`Entrega registrada! +${fmtNumber(points)} pontos para ${isAdmin ? userName(targetUserId) : 'você'}.`);
      setForm({ ...emptyForm, userId: form.userId });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Excluir esta entrega? ${fmtNumber(d.points)} pontos serão removidos do saldo de ${userName(d.userId)}.`)) return;
    try {
      await api.delete(`/deliveries/${d.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const visible = useMemo(
    () => (deliveries || []).filter((d) => !filterUser || d.userId === Number(filterUser)),
    [deliveries, filterUser]
  );

  if (!deliveries && !error) return <Loading />;

  return (
    <>
      <PageHeader
        title="Registro de entregas"
        subtitle={isAdmin ? 'Registre as entregas feitas nos pontos de coleta.' : 'Registre os materiais recicláveis que você entregou.'}
      />
      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

      <div className="card">
        <h2>Nova entrega</h2>
        <form className="form" style={{ marginTop: 14 }} onSubmit={handleSubmit}>
          <div className="form-row">
            {isAdmin && (
              <div className="field">
                <label htmlFor="userId">Usuário</label>
                <select id="userId" value={form.userId} onChange={set('userId')} required>
                  <option value="">Selecione...</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label htmlFor="materialId">Material</label>
              <select id="materialId" value={form.materialId} onChange={set('materialId')} required>
                <option value="">Selecione...</option>
                {activeMaterials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.pointsPerKg} pts/kg)</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="quantity">Quantidade (itens)</label>
              <input id="quantity" type="number" min="1" step="1" value={form.quantity} onChange={set('quantity')} required />
            </div>
            <div className="field">
              <label htmlFor="weightKg">Peso (kg)</label>
              <input id="weightKg" type="number" min="0.01" step="0.01" value={form.weightKg} onChange={set('weightKg')} required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="notes">Observações <span className="muted">(opcional)</span></label>
            <input id="notes" value={form.notes} onChange={set('notes')} placeholder="Ex.: garrafas limpas e amassadas" />
          </div>

          <div className="points-preview">
            <div>
              <div className="small muted">Pontos calculados</div>
              <div className="small">
                {selectedMaterial && form.weightKg
                  ? `${fmtKg(form.weightKg)} × ${selectedMaterial.pointsPerKg} pts/kg`
                  : 'Selecione o material e informe o peso'}
              </div>
            </div>
            <strong>+{fmtNumber(previewPoints)}</strong>
          </div>

          <div>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Registrando...' : 'Registrar entrega'}</button>
          </div>
        </form>
      </div>

      <div className="card section">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h2>{isAdmin ? 'Histórico de entregas' : 'Minhas entregas'}</h2>
          {isAdmin && (
            <div className="filters" style={{ margin: 0 }}>
              <div className="field">
                <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} aria-label="Filtrar por usuário">
                  <option value="">Todos os usuários</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>{isAdmin && <th>Usuário</th>}<th>Material</th><th className="num">Qtd.</th>
                <th className="num">Peso</th><th className="num">Pts/kg</th><th className="num">Pontos</th><th>Obs.</th>
                {isAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan={9} className="muted">Nenhuma entrega encontrada.</td></tr>}
              {visible.map((d) => (
                <tr key={d.id}>
                  <td>{fmtDateTime(d.date)}</td>
                  {isAdmin && <td>{userName(d.userId)}</td>}
                  <td>{matName(d.materialId)}</td>
                  <td className="num">{d.quantity}</td>
                  <td className="num">{fmtKg(d.weightKg)}</td>
                  <td className="num">{d.pointsPerKg}</td>
                  <td className="num points">+{fmtNumber(d.points)}</td>
                  <td className="muted small">{d.notes || '—'}</td>
                  {isAdmin && (
                    <td className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(d)}>Excluir</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {visible.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={isAdmin ? 4 : 3}><strong>Total</strong></td>
                  <td className="num"><strong>{fmtKg(visible.reduce((s, d) => s + d.weightKg, 0))}</strong></td>
                  <td />
                  <td className="num points">{fmtNumber(visible.reduce((s, d) => s + d.points, 0))}</td>
                  <td colSpan={isAdmin ? 2 : 1} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
