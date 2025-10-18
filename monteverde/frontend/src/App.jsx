import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Asistencia from './pages/docente/Asistencia';
import ObservadorAlumno from './pages/docente/ObservadorAlumno';
import Mensajes from './pages/docente/Mensajes';
import FamiliaHome from './pages/familia/Home';
import FamiliaMensajes from './pages/familia/Mensajes';
import ReporteAcademico from './pages/familia/ReporteAcademico';

// Layouts
import DocenteLayout from './layouts/DocenteLayout';
import FamiliaLayout from './layouts/FamiliaLayout'; 

// Pages
import DocenteHome from './pages/docente/Home';
import RegistroCalificaciones from './pages/docente/RegistroCalificaciones';

// ===================================================
// Componente Dashboard Admin Temporal
// ===================================================
function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleVolverInicio = () => {
    navigate('/');
  };

  const handleCerrarSesion = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '2rem'
        }}>
          👑
        </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#333',
          marginBottom: '0.5rem'
        }}>
          Dashboard Admin
        </h1>

        <p style={{ 
          color: '#666', 
          fontSize: '1.1rem',
          marginBottom: '0.5rem'
        }}>
          ¡Bienvenido, {user?.nombre}!
        </p>

        <p style={{ 
          color: '#999', 
          fontSize: '0.9rem',
          marginBottom: '3rem'
        }}>
          Panel administrativo en construcción
        </p>

        {/* Información del usuario */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#333', marginBottom: '1rem', textAlign: 'center' }}>
            👨‍💼 Información del Usuario
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>Nombre:</strong> {user?.nombre || 'No disponible'}</div>
            <div><strong>Email:</strong> {user?.email || 'No disponible'}</div>
            <div><strong>Rol:</strong> <span style={{ 
              background: '#667eea', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '6px',
              fontSize: '0.8rem'
            }}>
              {user?.rol?.toUpperCase() || 'ADMIN'}
            </span></div>
            <div><strong>ID:</strong> {user?.id || 'No disponible'}</div>
          </div>
        </div>

        {/* Funciones futuras */}
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '1rem' }}>
            🚧 Próximas Funcionalidades
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#856404',
            paddingLeft: '1.5rem',
            lineHeight: '1.8'
          }}>
            <li>Gestión de usuarios del sistema</li>
            <li>Reportes generales de la institución</li>
            <li>Configuración del sistema</li>
            <li>Estadísticas globales</li>
            <li>Respaldos de la base de datos</li>
          </ul>
        </div>

        {/* Botones */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          <button
            onClick={handleVolverInicio}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🏠 Volver al Inicio
          </button>

          <button
            onClick={handleCerrarSesion}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#c82333';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#dc3545';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          borderTop: '1px solid #eee',
          fontSize: '0.9rem',
          color: '#999'
        }}>
          <strong>MonteVerde</strong> - Sistema de Gestión Educativa v1.0
        </div>
      </div>
    </div>
  );
}

// ===================================================
// Componente para proteger rutas
// ===================================================
function PrivateRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    // Redirigir al dashboard correcto según el rol
    if (user.rol === 'admin') return <Navigate to="/admin" replace />;
    if (user.rol === 'docente') return <Navigate to="/docente" replace />;
    if (user.rol === 'familia') return <Navigate to="/familia" replace />;
  }
  
  return children;
}

// ===================================================
// Estructura principal de rutas
// ===================================================
function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* ======================================
          LOGIN
      ====================================== */}
      <Route path="/login" element={<Login />} />
      
      {/* ======================================
          DOCENTE
      ====================================== */}
      <Route 
        path="/docente" 
        element={
          <PrivateRoute allowedRoles={['docente']}>
            <DocenteLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DocenteHome />} />
        <Route path="calificaciones" element={<RegistroCalificaciones />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="observador" element={<ObservadorAlumno />} />
        <Route path="mensajes" element={<Mensajes />} />
      </Route>
      
      {/* ======================================
          ADMIN - MEJORADO
      ====================================== */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />
      
      {/* ======================================
          FAMILIA
      ====================================== */}
      <Route 
        path="/familia" 
        element={
          <PrivateRoute allowedRoles={['familia']}>
            <FamiliaLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<FamiliaHome />} />
        <Route path="home" element={<FamiliaHome />} />
        <Route path="mensajes" element={<FamiliaMensajes />} />
        <Route path="reporte" element={<ReporteAcademico />} />
      </Route>

      {/* ======================================
          RAÍZ / HOME
      ====================================== */}
      <Route path="/" element={
        isAuthenticated ? (
          user.rol === 'admin' ? <Navigate to="/admin" replace /> :
          user.rol === 'docente' ? <Navigate to="/docente" replace /> :
          user.rol === 'familia' ? <Navigate to="/familia" replace /> :
          <Navigate to="/login" replace />
        ) : (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center max-w-md w-full px-6">
              <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">🎓</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MonteVerde</h1>
              <p className="text-gray-500 mb-8">Sistema de Gestión Educativa</p>
              <a 
                href="/login" 
                className="block w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-medium transition-colors"
              >
                Iniciar Sesión
              </a>
            </div>
          </div>
        )
      } />
      
      {/* ======================================
          CATCH-ALL (404)
      ====================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
