import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Loading, PageHeader } from '../components/Feedback';
import { fmtDateTime, fmtNumber } from '../utils/points';

const statusBadge = {
  'disponível': 'badge-green',
  utilizado: 'badge-blue',
  cancelado: 'badge-red',
};

export default function Redemptions() {
  const { user, isAdmin } = useAuth();
  const [list, setList] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [partners, setPartners] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [rd, rw, pt, us] = await Promise.all([
        api.get(isAdmin ? '/redemptions' : `/redemptions?userId=${user.id}`),
        api.get('/rewards'),
        api.get('/partners'),
        isAdmin ? api.get('/users') : Promise.resolve([]),
      ]);
      setList(rd.sort((a, b) => b.date.localeCompare(a.date)));
      setRewards(rw);
      setPartners(pt);
      setUsers(us);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reward = (id) => rewards.find((r) => r.id === id);
  const partnerName = (rewardId) => partners.find((p) => p.id === reward(rewardId)?.partnerId)?.name || '—';
  const userName = (id) => users.find((u) => u.id === id)?.name || '—';

  const markUsed = async (r) => {
    try {
      await api.patch(`/redemptions/${r.id}`, { status: 'utilizado' });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const cancel = async (r) => {
    if (!window.confirm(`Cancelar o resgate ${r.code}? Os ${fmtNumber(r.pointsSpent)} pontos voltam para o saldo.`)) return;
    try {
      await api.patch(`/redemptions/${r.id}`, { status: 'cancelado' });
      const rw = reward(r.rewardId);
      if (rw) await api.patch(`/rewards/${rw.id}`, { stock: rw.stock + 1 });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!list && !error) return <Loading />;

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Resgates' : 'Meus resgates'}
        subtitle={isAdmin ? 'Todos os resgates realizados pelos usuários.' : 'Seus vouchers de recompensas trocadas.'}
      >
        {!isAdmin && <Link to="/recompensas" className="btn btn-primary">Trocar pontos</Link>}
      </PageHeader>
      <Alert onClose={() => setError('')}>{error}</Alert>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>{isAdmin && <th>Usuário</th>}<th>Recompensa</th><th>Parceiro</th>
                <th>Código</th><th className="num">Pontos</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {(list || []).length === 0 && (
                <tr><td colSpan={8} className="muted">Nenhum resgate ainda.</td></tr>
              )}
              {(list || []).map((r) => (
                <tr key={r.id}>
                  <td>{fmtDateTime(r.date)}</td>
                  {isAdmin && <td>{userName(r.userId)}</td>}
                  <td>{reward(r.rewardId)?.name || 'Recompensa removida'}</td>
                  <td>{partnerName(r.rewardId)}</td>
                  <td><span className="voucher">{r.code}</span></td>
                  <td className="num">-{fmtNumber(r.pointsSpent)}</td>
                  <td><span className={`badge ${statusBadge[r.status] || ''}`}>{r.status}</span></td>
                  <td className="actions">
                    {r.status === 'disponível' && (
                      <>
                        {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => markUsed(r)}>Marcar utilizado</button>}
                        <button className="btn btn-ghost btn-sm" onClick={() => cancel(r)}>Cancelar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
