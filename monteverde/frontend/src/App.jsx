import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Asistencia from './pages/docente/Asistencia';
import ObservadorAlumno from './pages/docente/ObservadorAlumno';

// Layouts
import DocenteLayout from './layouts/DocenteLayout';

// Pages
import DocenteHome from './pages/docente/Home';
import RegistroCalificaciones from './pages/docente/RegistroCalificaciones'; // ✅ Nuevo import

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
        {/* Rutas anidadas dentro del layout */}
        <Route index element={<DocenteHome />} />
        <Route path="calificaciones" element={<RegistroCalificaciones />} /> {/* ✅ Actualizado */}
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="observador" element={<ObservadorAlumno />} />
        <Route path="mensajes" element={<div>Mensajes (Por crear)</div>} />
      </Route>
      
      {/* ======================================
          ADMIN
      ====================================== */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h1>Dashboard Admin</h1>
              <p>Por crear AdminLayout + AdminHome</p>
            </div>
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
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h1>Dashboard Familia</h1>
              <p>Por crear FamiliaLayout + FamiliaHome</p>
            </div>
          </PrivateRoute>
        } 
      />

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
