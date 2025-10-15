import { useAuth } from '../hooks/useAuth';

export default function HeaderBar({ usuario, rol }) {
  const { logout } = useAuth();
  
  const salir = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div style={{
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0.75rem 1rem', 
      borderBottom: '1px solid #eee', 
      background: '#fff', 
      position: 'sticky', 
      top: 0, 
      zIndex: 5
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img 
          src={`${import.meta.env.BASE_URL}logo-monteverde.png`} 
          alt="Escudo" 
          style={{ height: 28, width: 28, objectFit: 'contain' }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'inline-block';
          }}
        />
        <span style={{ 
          display: 'none', 
          width: '28px', 
          height: '28px', 
          background: 'var(--brand)', 
          borderRadius: '6px',
          color: 'white',
          fontSize: '18px',
          textAlign: 'center',
          lineHeight: '28px'
        }}>
          🎓
        </span>
        <strong>Colegio MonteVerde</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="badge">{usuario} ({rol})</span>
        <button className="btn" onClick={salir}>Salir</button>
      </div>
    </div>
  );
}
