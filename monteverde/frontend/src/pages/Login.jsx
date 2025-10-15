import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      console.error('Error en login:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 420, width: '100%', border: '1px solid #ddd', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Plataforma MonteVerde</h1>

        <img
          src={`${import.meta.env.BASE_URL}logo-monteverde.png`}
          alt="Escudo"
          style={{
            width: '120px',
            height: 'auto',
            marginBottom: '1rem',
            borderRadius: '8px'
          }}
          onError={(e) => {
            // Si no encuentra el logo, usar emoji
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        
        {/* Fallback emoji si no hay logo */}
        <div 
          style={{ 
            fontSize: '120px', 
            marginBottom: '1rem', 
            display: 'none' 
          }}
        >
          🎓
        </div>

        {/* Mostrar error del contexto */}
        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid #ccc',
                marginBottom: '0.5rem'
              }}
              required
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid #ccc',
                marginBottom: '0.5rem'
              }}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 8,
              backgroundColor: isLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Botón de regresar */}
        <div style={{ marginTop: '1rem' }}>
          <a 
            href="/" 
            style={{ 
              color: '#666', 
              textDecoration: 'none', 
              fontSize: '0.85rem',
              display: 'inline-block',
              padding: '0.25rem 0.5rem',
              borderRadius: 4,
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.color = '#007bff'}
            onMouseOut={(e) => e.target.style.color = '#666'}
          >
            ← Volver al inicio
          </a>
        </div>

        {/* Credenciales de prueba con ADMIN agregado */}
        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
          <p style={{ marginBottom: '0.5rem' }}>Credenciales de prueba:</p>
          <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
            <p><strong>Admin:</strong> admin@monteverde.com / admin123</p>
            <p><strong>Docente:</strong> docente@monteverde.com / docente123</p>
            <p><strong>Familia:</strong> familia@monteverde.com / familia123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
