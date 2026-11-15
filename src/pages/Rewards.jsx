import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fetchActivity } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Alert, Loading, PageHeader } from '../components/Feedback';
import { calcSummary, fmtNumber, generateVoucher } from '../utils/points';

export default function Rewards() {
  const { user, isAdmin } = useAuth();
  const [rewards, setRewards] = useState(null);
  const [partners, setPartners] = useState([]);
  const [balance, setBalance] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [selected, setSelected] = useState(null);
  const [redeemed, setRedeemed] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBalance = async () => {
    const { deliveries, redemptions } = await fetchActivity(user.id);
    const b = calcSummary(deliveries, redemptions).balance;
    setBalance(b);
    return b;
  };

  const load = async () => {
    try {
      const [rw, pt] = await Promise.all([api.get('/rewards'), api.get('/partners'), loadBalance()]);
      setRewards(rw);
      setPartners(pt);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const partnerById = useMemo(() => Object.fromEntries(partners.map((p) => [p.id, p])), [partners]);

  const catalog = useMemo(
    () =>
      (rewards || [])
        .filter((r) => r.active && partnerById[r.partnerId]?.active !== false)
        .filter((r) => !typeFilter || r.type === typeFilter)
        .filter((r) => !partnerFilter || r.partnerId === Number(partnerFilter))
        .filter((r) => !onlyAffordable || r.pointsCost <= balance)
        .sort((a, b) => a.pointsCost - b.pointsCost),
    [rewards, partnerById, typeFilter, partnerFilter, onlyAffordable, balance]
  );

  const confirmRedeem = async () => {
    setError('');
    setSaving(true);
    try {
      // Revalida saldo e estoque no momento da troca
      const [currentBalance, fresh] = await Promise.all([loadBalance(), api.get(`/rewards/${selected.id}`)]);
      if (!fresh.active || fresh.stock <= 0) throw new Error('Esta recompensa não está mais disponível.');
      if (currentBalance < fresh.pointsCost) throw new Error('Saldo insuficiente para esta troca.');

      const redemption = await api.post('/redemptions', {
        userId: user.id,
        rewardId: fresh.id,
        pointsSpent: fresh.pointsCost,
        date: new Date().toISOString(),
        code: generateVoucher(),
        status: 'disponível',
      });
      await api.patch(`/rewards/${fresh.id}`, { stock: fresh.stock - 1 });
      setRedeemed({ ...redemption, reward: fresh });
      setSelected(null);
      await load();
    } catch (e) {
      setError(e.message);
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  if (!rewards && !error) return <Loading />;

  return (
    <>
      <PageHeader title="Recompensas" subtitle="Troque seus pontos por produtos e serviços de nossos parceiros.">
        {!isAdmin && (
          <div className="stat-card accent" style={{ padding: '10px 18px' }}>
            <div className="stat-label">Seu saldo</div>
            <div className="stat-value" style={{ fontSize: '1.4rem', marginTop: 0 }}>{fmtNumber(balance)} pts</div>
          </div>
        )}
      </PageHeader>

      {isAdmin && (
        <Alert type="info">
          Você está vendo o catálogo como administrador. Para cadastrar ou editar recompensas, use{' '}
          <Link to="/admin/recompensas">Gerenciar Recompensas</Link>.
        </Alert>
      )}
      <Alert onClose={() => setError('')}>{error}</Alert>

      <div className="filters">
        <div className="field">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Tipo">
            <option value="">Produtos e serviços</option>
            <option value="produto">Somente produtos</option>
            <option value="serviço">Somente serviços</option>
          </select>
        </div>
        <div className="field">
          <select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} aria-label="Parceiro">
            <option value="">Todos os parceiros</option>
            {partners.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {!isAdmin && (
          <label className="check">
            <input type="checkbox" checked={onlyAffordable} onChange={(e) => setOnlyAffordable(e.target.checked)} />
            Só o que posso trocar
          </label>
        )}
      </div>

      {catalog.length === 0 ? (
        <div className="card empty">Nenhuma recompensa encontrada com esses filtros.</div>
      ) : (
        <div className="grid grid-cards">
          {catalog.map((r) => {
            const missing = r.pointsCost - balance;
            const outOfStock = r.stock <= 0;
            const progress = Math.min(100, (balance / r.pointsCost) * 100);
            return (
              <div key={r.id} className="card reward-card">
                <div className="reward-top">
                  <h3>{r.name}</h3>
                  <span className={`badge ${r.type === 'serviço' ? 'badge-blue' : 'badge-green'}`}>{r.type}</span>
                </div>
                <p>{r.description}</p>
                <div className="reward-meta">
                  <span>🤝 {partnerById[r.partnerId]?.name || '—'}</span>
                  <span>{outOfStock ? 'Esgotado' : `${r.stock} em estoque`}</span>
                </div>
                <div className="reward-cost">{fmtNumber(r.pointsCost)} pts</div>
                {!isAdmin && (
                  <>
                    <div className="progress" title={`${Math.round(progress)}%`}><span style={{ width: `${progress}%` }} /></div>
                    <button
                      className="btn btn-primary btn-block"
                      disabled={outOfStock || missing > 0}
                      onClick={() => setSelected(r)}
                    >
                      {outOfStock ? 'Esgotado' : missing > 0 ? `Faltam ${fmtNumber(missing)} pts` : 'Resgatar'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <Modal
          title="Confirmar resgate"
          onClose={() => !saving && setSelected(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setSelected(null)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmRedeem} disabled={saving}>
                {saving ? 'Resgatando...' : 'Confirmar resgate'}
              </button>
            </>
          }
        >
          <p>Trocar <strong>{fmtNumber(selected.pointsCost)} pontos</strong> por <strong>{selected.name}</strong> ({partnerById[selected.partnerId]?.name})?</p>
          <p className="muted" style={{ marginTop: 10 }}>
            Saldo atual: {fmtNumber(balance)} pts → após o resgate: {fmtNumber(balance - selected.pointsCost)} pts
          </p>
        </Modal>
      )}

      {redeemed && (
        <Modal
          title="Resgate realizado! 🎉"
          onClose={() => setRedeemed(null)}
          footer={
            <>
              <Link to="/resgates" className="btn btn-secondary">Ver meus resgates</Link>
              <button className="btn btn-primary" onClick={() => setRedeemed(null)}>Ok</button>
            </>
          }
        >
          <p>Você resgatou <strong>{redeemed.reward.name}</strong>.</p>
          <p style={{ marginTop: 12 }}>Apresente este código no parceiro <strong>{partnerById[redeemed.reward.partnerId]?.name}</strong>:</p>
          <p style={{ marginTop: 10, fontSize: '1.4rem', textAlign: 'center' }}><span className="voucher">{redeemed.code}</span></p>
        </Modal>
      )}
    </>
  );
}
