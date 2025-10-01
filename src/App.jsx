// src/App.jsx (ya debería estar así)
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import DocenteLayout from './layouts/DocenteLayout.jsx';
import FamiliaLayout from './layouts/FamiliaLayout.jsx';
import DocenteHome from './pages/docente/Home.jsx';
import RegistroCalificaciones from './pages/docente/RegistroCalificaciones.jsx';
import Asistencia from './pages/docente/Asistencia.jsx';
import ObservadorAlumno from './pages/docente/ObservadorAlumno.jsx';
import MensajesDocente from './pages/docente/Mensajes.jsx';
import FamiliaHome from './pages/familia/Home.jsx';
import ReporteAcademico from './pages/familia/ReporteAcademico.jsx';
import MensajesFamilia from './pages/familia/Mensajes.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/docente"
        element={<ProtectedRoute requiredRole="docente" />}
      >
        <Route element={<DocenteLayout />}>
          <Route index element={<DocenteHome />} />
          <Route path="calificaciones" element={<RegistroCalificaciones />} />
          <Route path="asistencia" element={<Asistencia />} />
          <Route path="observador" element={<ObservadorAlumno />} />
          <Route path="mensajes" element={<MensajesDocente />} />
        </Route>
      </Route>

      <Route
        path="/familia"
        element={<ProtectedRoute requiredRole="familia" />}
      >
        <Route element={<FamiliaLayout />}>
          <Route index element={<FamiliaHome />} />
          <Route path="reporte" element={<ReporteAcademico />} />
          <Route path="mensajes" element={<MensajesFamilia />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}