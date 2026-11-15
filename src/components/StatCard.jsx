export default function StatCard({ label, value, hint, accent = false, icon }) {
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <div className="stat-label">
        {icon && <span aria-hidden>{icon}</span>} {label}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
