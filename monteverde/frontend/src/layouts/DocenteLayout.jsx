import { NavLink, Outlet } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import { useAuth } from '../hooks/useAuth';

export default function DocenteLayout() {
  const { usuario } = useAuth();
  
  const link = { padding: '.35rem 0', color: '#064e3b' };
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ borderRight: '1px solid #eee', padding: '1rem', background: '#fff' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          fontWeight: 700, 
          color: '#166534', 
          marginBottom: '1rem' 
        }}>
          <img 
            src={`${import.meta.env.BASE_URL}logo-monteverde.png`} 
            alt="Escudo" 
            style={{ height: 32 }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'inline-block';
            }}
          />
          <span style={{ 
            display: 'none', 
            fontSize: '20px' 
          }}>
            🎓
          </span>
          Monteverde
        </div>
        
        <nav style={{ display: 'grid', gap: '.25rem', marginTop: '1rem' }}>
          <NavLink to="/docente" style={link} end>Inicio</NavLink>
          <NavLink to="/docente/calificaciones" style={link}>Gestión Académica</NavLink>
          <NavLink to="/docente/asistencia" style={link}>Asistencia</NavLink>
          <NavLink to="/docente/observador" style={link}>Observador</NavLink>
          <NavLink to="/docente/mensajes" style={link}>Mensajes</NavLink>
        </nav>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column' }}>
        <HeaderBar 
          usuario={usuario?.nombre || 'Usuario'} 
          rol={usuario?.rol || 'Docente'} 
        />
        <div style={{ padding: '1rem 1.5rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
