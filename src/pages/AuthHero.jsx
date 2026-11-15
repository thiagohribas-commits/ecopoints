export default function AuthHero() {
  return (
    <div className="auth-hero">
      <div className="brand" style={{ fontSize: '1.4rem' }}>
        <span className="brand-logo">♻️</span> EcoPoints
      </div>
      <h1>Recicle, acumule pontos e troque por recompensas.</h1>
      <p>Entregue seus materiais recicláveis em um ponto de coleta e ganhe pontos de acordo com o peso e o tipo de material.</p>
      <ul>
        <li>🧴 Plástico, papel, metal, vidro, óleo e eletrônicos</li>
        <li>⚖️ Pontos calculados automaticamente pelo peso</li>
        <li>🎁 Produtos e serviços de empresas parceiras</li>
      </ul>
    </div>
  );
}
