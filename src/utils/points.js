/** Pontos de uma entrega = peso (kg) × pontos por kg do material, arredondado. */
export function calcPoints(weightKg, pointsPerKg) {
  const w = Number(weightKg);
  const p = Number(pointsPerKg);
  if (!Number.isFinite(w) || !Number.isFinite(p) || w <= 0 || p <= 0) return 0;
  return Math.round(w * p);
}

export function sumBy(list, key) {
  return list.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
}

/** Resumo de pontuação a partir das entregas e resgates. */
export function calcSummary(deliveries, redemptions) {
  const earned = sumBy(deliveries, 'points');
  // Resgates cancelados devolvem os pontos ao saldo
  const spent = sumBy(redemptions.filter((r) => r.status !== 'cancelado'), 'pointsSpent');
  return {
    earned,
    spent,
    balance: earned - spent,
    weightKg: sumBy(deliveries, 'weightKg'),
    deliveries: deliveries.length,
  };
}

export function generateVoucher() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `ECO-${code}`;
}

export const fmtNumber = (n, digits = 0) =>
  Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtKg = (n) =>
  `${Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';
