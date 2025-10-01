// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // 👈 Cambiado aquí
import { login as authServiceLogin } from '../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUsuario } = useAuth(); // 👈 Ya no importamos de AuthContext directamente
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const usuario = await authServiceLogin(email, password);
      setUsuario(usuario);

      if (usuario.rol === 'docente') {
        navigate('/docente');
      } else if (usuario.rol === 'familia') {
        navigate('/familia');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
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
        />

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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 8,
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          <p>Credenciales de prueba:</p>
          <p><strong>Docente:</strong> maria@monteverde.edu / docente123</p>
          <p><strong>Familia:</strong> carlos@monteverde.edu / familia123</p>
        </div>
      </div>
    </div>
  );
}