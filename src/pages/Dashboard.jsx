import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fetchActivity } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { Alert, Loading, PageHeader } from '../components/Feedback';
import { calcSummary, fmtDate, fmtKg, fmtNumber } from '../utils/points';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchActivity(isAdmin ? undefined : user.id),
      api.get('/materials'),
      isAdmin ? api.get('/users') : Promise.resolve([]),
    ])
      .then(([activity, materials, users]) => setData({ ...activity, materials, users }))
      .catch((e) => setError(e.message));
  }, [user.id, isAdmin]);

  const view = useMemo(() => {
    if (!data) return null;
    const { deliveries, redemptions, materials, users } = data;
    const matById = Object.fromEntries(materials.map((m) => [m.id, m]));
    const summary = calcSummary(deliveries, redemptions);

    const byMaterial = {};
    for (const d of deliveries) {
      const key = d.materialId;
      byMaterial[key] ??= { name: matById[key]?.name || 'Material removido', kg: 0, points: 0 };
      byMaterial[key].kg += d.weightKg;
      byMaterial[key].points += d.points;
    }
    const materialRows = Object.values(byMaterial).sort((a, b) => b.points - a.points);
    const maxPoints = Math.max(1, ...materialRows.map((r) => r.points));

    const recent = [...deliveries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

    let ranking = [];
    if (isAdmin) {
      ranking = users
        .filter((u) => u.role !== 'admin')
        .map((u) => {
          const s = calcSummary(
            deliveries.filter((d) => d.userId === u.id),
            redemptions.filter((r) => r.userId === u.id)
          );
          return { ...u, ...s };
        })
        .sort((a, b) => b.earned - a.earned)
        .slice(0, 5);
    }
    return { summary, materialRows, maxPoints, recent, matById, ranking, users };
  }, [data, isAdmin]);

  if (error) return <Alert>{error}</Alert>;
  if (!view) return <Loading />;
  const { summary, materialRows, maxPoints, recent, matById, ranking, users } = view;
  const userName = (id) => users.find((u) => u.id === id)?.name || '-';

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Visão geral' : `Olá, ${user.name.split(' ')[0]}!`}
        subtitle={isAdmin ? 'Indicadores de todo o programa EcoPoints.' : 'Acompanhe sua pontuação acumulada.'}
      >
        <Link to="/entregas" className="btn btn-primary">+ Registrar entrega</Link>
        {!isAdmin && <Link to="/recompensas" className="btn btn-secondary">Trocar pontos</Link>}
      </PageHeader>

      <div className="grid grid-stats">
        {isAdmin ? (
          <>
            <StatCard accent icon="⭐" label="Pontos distribuídos" value={fmtNumber(summary.earned)} hint={`${fmtNumber(summary.spent)} já resgatados`} />
            <StatCard icon="⚖️" label="Material reciclado" value={fmtKg(summary.weightKg)} hint={`${summary.deliveries} entregas`} />
            <StatCard icon="👥" label="Usuários" value={users.filter((u) => u.role !== 'admin').length} />
            <StatCard icon="🎟️" label="Resgates" value={data.redemptions.length} />
          </>
        ) : (
          <>
            <StatCard accent icon="⭐" label="Saldo disponível" value={fmtNumber(summary.balance)} hint="pontos para trocar" />
            <StatCard icon="📈" label="Total acumulado" value={fmtNumber(summary.earned)} hint="pontos ganhos desde o início" />
            <StatCard icon="🎁" label="Pontos resgatados" value={fmtNumber(summary.spent)} hint={`${data.redemptions.length} resgate(s)`} />
            <StatCard icon="⚖️" label="Material reciclado" value={fmtKg(summary.weightKg)} hint={`${summary.deliveries} entrega(s)`} />
          </>
        )}
      </div>

      <div className="grid grid-2 section">
        <div className="card">
          <h2>Pontos por material</h2>
          <p className="muted small" style={{ marginBottom: 16 }}>Distribuição dos pontos ganhos por tipo de material.</p>
          {materialRows.length === 0 ? (
            <p className="muted">Nenhuma entrega registrada ainda.</p>
          ) : (
            <div className="bars">
              {materialRows.map((r) => (
                <div className="bar-row" key={r.name} title={fmtKg(r.kg)}>
                  <span>{r.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(r.points / maxPoints) * 100}%` }} />
                  </div>
                  <span className="num">{fmtNumber(r.points)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin ? (
          <div className="card">
            <h2>Ranking de recicladores</h2>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead><tr><th>#</th><th>Usuário</th><th className="num">Reciclado</th><th className="num">Pontos</th></tr></thead>
                <tbody>
                  {ranking.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}º</td><td>{u.name}</td>
                      <td className="num">{fmtKg(u.weightKg)}</td>
                      <td className="num points">{fmtNumber(u.earned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2>Como os pontos são calculados</h2>
            <p className="muted small" style={{ margin: '4px 0 12px' }}>Pontos = peso (kg) × pontos por kg do material.</p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Material</th><th className="num">Pontos / kg</th></tr></thead>
                <tbody>
                  {data.materials.filter((m) => m.active).map((m) => (
                    <tr key={m.id}><td>{m.name}</td><td className="num points">{m.pointsPerKg}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="card section">
        <h2>Últimas entregas</h2>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Data</th>{isAdmin && <th>Usuário</th>}<th>Material</th>
                <th className="num">Qtd.</th><th className="num">Peso</th><th className="num">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={6} className="muted">Nenhuma entrega ainda. <Link to="/entregas">Registre a primeira!</Link></td></tr>
              )}
              {recent.map((d) => (
                <tr key={d.id}>
                  <td>{fmtDate(d.date)}</td>
                  {isAdmin && <td>{userName(d.userId)}</td>}
                  <td>{matById[d.materialId]?.name || '-'}</td>
                  <td className="num">{d.quantity}</td>
                  <td className="num">{fmtKg(d.weightKg)}</td>
                  <td className="num points">+{fmtNumber(d.points)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
